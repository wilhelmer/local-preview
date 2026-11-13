"use strict";

const vscode = require('vscode');
const net = require('net');
const { spawn } = require('child_process');

let serverProc = null;

function isSafeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

function fileToUrl(fsPath) {
  if (!fsPath || typeof fsPath !== 'string') return null;
  const roots = vscode.workspace.getConfiguration('localPreview').get('roots', []);
  if (!Array.isArray(roots)) return null;
  const norm = fsPath.replace(/\\/g, '/');
  // pattern is tried against the workspace-relative path, then the absolute path; first match wins
  const candidates = [vscode.workspace.asRelativePath(fsPath, false).replace(/\\/g, '/'), norm];
  for (const r of roots) {
    if (!r || typeof r.pattern !== 'string' || !isSafeHttpUrl(r.url)) continue;
    let re;
    try { re = new RegExp(r.pattern); } catch { continue; }
    for (const c of candidates) {
      if (!re.test(c)) continue;
      // replace() keeps the unmatched rest of the path; an unanchored pattern then yields "/abs/path/http://...", so skip it
      const out = c.replace(re, r.url.trim());
      if (isSafeHttpUrl(out)) return encodeURI(out);
    }
  }
  return null;
}

async function openUrl(url) {
  if (!isSafeHttpUrl(url)) return;
  const mode = vscode.workspace.getConfiguration('localPreview').get('browser', 'system');
  if (mode === 'simple') {
    await openSplit(url); // starts the server itself
    return;
  }
  await ensureServer();
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

// --- split-pane live preview ---

let lastSplitUrl = null;
let hasIntegratedBrowserCmd = null;

async function supportsIntegratedBrowser() {
  if (hasIntegratedBrowserCmd !== null) return hasIntegratedBrowserCmd;
  const cmds = await vscode.commands.getCommands(true);
  hasIntegratedBrowserCmd = cmds.includes('workbench.action.browser.open');
  return hasIntegratedBrowserCmd;
}

function isBrowserPreviewOpen() {
  if (!vscode.window.tabGroups || !vscode.window.tabGroups.all) return false;
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.input instanceof vscode.TabInputWebview) {
        const viewType = tab.input.viewType ? String(tab.input.viewType) : '';
        if (viewType.toLowerCase().includes('simplebrowser')) {
          return true;
        }
      }
      // shortcut: the integrated browser tab reports a null input and no public type, so any null-input tab counts as the preview
      if (!tab.input) return true;
    }
  }
  return false;
}

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: 'localhost' });
    sock.setTimeout(1000, () => { sock.destroy(); resolve(false); });
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => resolve(false));
  });
}

// starts the configured server in the background unless the port is already taken, then waits for it
let serverStarting = null;
// concurrent callers share one start, so a second call cannot spawn a second server
function ensureServer() {
  return serverStarting || (serverStarting = startServer().finally(() => { serverStarting = null; }));
}

async function startServer() {
  const cfg = vscode.workspace.getConfiguration('localPreview');
  const command = (cfg.get('server.command', '') || '').trim();
  const port = cfg.get('server.port', 0);
  if (!command || !Number.isInteger(port) || port < 1 || port > 65535) return;
  if (await portInUse(port)) return;
  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  // runs headless: no terminal, output discarded
  serverProc = spawn(command, { cwd: folder && folder.uri.fsPath, shell: true, stdio: 'ignore', detached: process.platform !== 'win32' });
  serverProc.on('error', () => { serverProc = null; });
  serverProc.on('exit', () => { serverProc = null; });
  // shortcut: fixed 30s wait, then the preview opens anyway; make configurable if slow servers need more
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Starting server on port ${port}...` },
    async () => {
      for (let i = 0; i < 60 && !(await portInUse(port)); i++) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  );
}

// sizes the new side group; only when exactly two groups exist so a custom layout is not clobbered
async function applyPreviewWidth() {
  const pct = vscode.workspace.getConfiguration('localPreview').get('previewWidth', 30);
  if (!(pct > 0 && pct < 100) || vscode.window.tabGroups.all.length !== 2) return;
  await vscode.commands.executeCommand('vscode.setEditorLayout', {
    orientation: 0,
    groups: [{ size: (100 - pct) / 100 }, { size: pct / 100 }]
  });
}

let splitQueue = Promise.resolve();
// runs one at a time so quick tab switches navigate the same tab instead of opening a second one
let opening = 0; // tab events during an open must not look like a closed preview
function openSplit(url) {
  opening++;
  splitQueue = splitQueue.then(() => doOpenSplit(url)).catch(() => {}).finally(() => { opening--; });
  return splitQueue;
}

// the split pane is gone: forget it and stop the server we started for it
function previewClosed() {
  lastSplitUrl = null;
  stopServer();
}

async function doOpenSplit(url) {
  if (!isSafeHttpUrl(url)) return;
  const isNew = !lastSplitUrl; // no preview open yet
  if (isNew) await ensureServer();
  const prevEditor = vscode.window.activeTextEditor;
  // the filter must match the tab that is already open (the previous URL), so it gets navigated instead of a new tab opening
  const prevUrl = lastSplitUrl || url;
  lastSplitUrl = url;
  if (await supportsIntegratedBrowser()) {
    // same URL on save: skip the navigation so hardReload keeps the scroll position
    if (isNew || url !== prevUrl) {
      await vscode.commands.executeCommand('workbench.action.browser.open', {
        url,
        openToSide: true,
        reuseUrlFilter: originOf(prevUrl)
      });
    }
    if (isNew) await applyPreviewWidth();
    // only the #anchor changed: the browser scrolls in place, so a reload would just be disruptive
    const hashOnly = !isNew && url !== prevUrl && url.split('#')[0] === prevUrl.split('#')[0];
    if (!hashOnly) await vscode.commands.executeCommand('workbench.action.browser.hardReload');
    if (prevEditor && !prevEditor.document.isClosed) {
      await vscode.window.showTextDocument(prevEditor.document, {
        viewColumn: prevEditor.viewColumn,
        preserveFocus: false,
        selection: prevEditor.selection
      });
    }
    return;
  }
  await vscode.commands.executeCommand('simpleBrowser.api.open', url, {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: true
  });
  if (isNew) await applyPreviewWidth();
}

// origin plus any path, so the open tab is reused even after in-page navigation changed its path.
// VS Code parses a bare origin to path "/" and glob-matches it against the tab's path, so "/**" is needed.
function originOf(url) {
  try { return `${new URL(url).origin}/**`; } catch { return url; }
}

function trackSave(context) {
  if (vscode.window.tabGroups && vscode.window.tabGroups.onDidChangeTabs) {
    vscode.window.tabGroups.onDidChangeTabs(() => {
      if (lastSplitUrl && !opening && !isBrowserPreviewOpen()) previewClosed();
    }, null, context.subscriptions);
  }

  // switching editor tabs loads that file's URL in the open preview
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!lastSplitUrl || !editor || editor.document.uri.scheme !== 'file') return;
    if (!vscode.workspace.getConfiguration('localPreview').get('followMode', true)) return;
    const url = fileToUrl(editor.document.uri.fsPath);
    // ignore the #anchor, else refocusing the same file navigates to the bare URL and reloads without the fragment
    if (url && url !== lastSplitUrl.split('#')[0]) openSplit(url);
  }, null, context.subscriptions);

  // moving the cursor onto a Markdown heading scrolls the preview to its anchor
  vscode.window.onDidChangeTextEditorSelection((e) => {
    const doc = e.textEditor.document;
    if (!lastSplitUrl || opening || doc.languageId !== 'markdown' || doc.uri.scheme !== 'file') return;
    if (!vscode.workspace.getConfiguration('localPreview').get('followHeadings', true)) return;
    const m = /^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(doc.lineAt(e.selections[0].active.line).text);
    if (!m) return;
    // shortcut: GitHub-style slug (no duplicate-heading "-1" suffixes); adjust if your renderer slugs differently
    const slug = m[1].toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-');
    const base = fileToUrl(doc.uri.fsPath);
    // only scroll the file being previewed; other files are left to followMode
    if (!slug || !base || base !== lastSplitUrl.split('#')[0]) return;
    const url = `${base}#${encodeURIComponent(slug)}`;
    if (url !== lastSplitUrl) openSplit(url);
  }, null, context.subscriptions);

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (!lastSplitUrl) return;
    if (doc.uri.scheme !== 'file') return;
    const savedUrl = fileToUrl(doc.uri.fsPath);
    if (!savedUrl) return;
    if (!opening && !isBrowserPreviewOpen()) {
      previewClosed();
      return;
    }
    // saving any mapped file reloads every open preview
    openSplit(lastSplitUrl);
  }, null, context.subscriptions);
}

async function promptAddRoot() {
  const pattern = await vscode.window.showInputBox({
    title: 'Root Pattern (1/2)',
    prompt: 'Regex tested against the workspace-relative path, then the absolute path (e.g. ^docs/(.*)\\.md$)',
    ignoreFocusOut: true,
    validateInput: (val) => {
      if (!val) return 'Pattern is required';
      try { new RegExp(val); } catch (e) { return `Invalid regex: ${e.message}`; }
      return null;
    }
  });
  if (!pattern) return;

  const rawUrl = await vscode.window.showInputBox({
    title: 'Root URL (2/2)',
    prompt: 'URL for matching files; use $1, $2, ... for capture groups (e.g. http://localhost:3000/docs/$1)',
    ignoreFocusOut: true,
    validateInput: (val) => isSafeHttpUrl(val) ? null : 'URL must start with http:// or https://'
  });
  if (!rawUrl || !isSafeHttpUrl(rawUrl)) return;
  const url = rawUrl.trim();

  const config = vscode.workspace.getConfiguration('localPreview');
  // a workspace array overrides the user one, so write where the effective value lives
  const info = config.inspect('roots');
  const inWorkspace = Array.isArray(info && info.workspaceValue);
  const existing = (inWorkspace ? info.workspaceValue : info && info.globalValue) || [];
  const safeExisting = Array.isArray(existing)
    ? existing.filter(r => r && typeof r.pattern === 'string' && typeof r.url === 'string')
    : [];
  // same pattern replaces its entry in place
  const updated = safeExisting.filter(r => r.pattern !== pattern);
  updated.push({ pattern, url });

  await config.update('roots', updated, inWorkspace ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Added localhost root: ${pattern} -> ${url}`);
}

async function warnNoRoot() {
  const choice = await vscode.window.showWarningMessage(
    'No preview rule matches this file.',
    'Add rule...'
  );
  if (choice === 'Add rule...') {
    await promptAddRoot();
  }
}


function activate(context) {
  trackSave(context);

  context.subscriptions.push(vscode.commands.registerCommand('localPreview.addRoot', async () => {
    await promptAddRoot();
  }));

  const openActiveFile = (open) => async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      vscode.window.showWarningMessage('No active file to open.');
      return;
    }
    const url = fileToUrl(editor.document.uri.fsPath);
    if (!url) {
      await warnNoRoot();
      return;
    }
    open(url);
  };
  context.subscriptions.push(
    vscode.commands.registerCommand('localPreview.open', openActiveFile(openUrl)),
    vscode.commands.registerCommand('localPreview.openSplit', openActiveFile(openSplit))
  );
}

function stopServer() {
  if (!serverProc) return;
  // shortcut: on Windows only the shell is killed, not its children; use taskkill /T if that leaks
  try { process.platform === 'win32' ? serverProc.kill() : process.kill(-serverProc.pid); } catch {}
  serverProc = null;
}

function deactivate() {
  stopServer();
}

module.exports = { activate, deactivate };
