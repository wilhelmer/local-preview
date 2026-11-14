# Local Preview

Preview your static site locally, right within VS Code ✨

Run a static site generator like Docusaurus, Hugo, or Jekyll under the hood and see the
generated page in a live split pane while you browse and edit the source.

## Features

- Maps files in your workspace to local server URLs. For example, `docs/page.md` to `http://localhost:8888/page.html`.
- Opens it in a live split pane next to your editor, or in your external browser.
- Follow mode: switching editor tabs loads the active file in the open preview.
- Follow headings: moving the cursor onto a Markdown heading scrolls the preview to that heading.
- Optionally starts your server automatically when a preview opens, in a terminal or in the background.

| Command                             | Shortcut     |
| ----------------------------------- | ------------ |
| `Local Preview: Open in Split Pane` | `Ctrl+Alt+L` |
| `Local Preview: Open in Browser`    | `Ctrl+Alt+O` |
| `Local Preview: Add Mapping`        | –            |
| `Local Preview: Stop Server`        | –            |

Both open commands are also available in the editor title bar.

## Setup

1. If you want the extension to start your server automatically, set
   `localPreview.server.command` and `localPreview.server.port`. The extension starts the
   server whenever a preview opens and nothing listens on that port.
2. Run `Local Preview: Add Mapping` and enter a regex pattern and a URL. Or add
   `localPreview.mappings` to `settings.json` (see below).
3. Open a file and press `Ctrl+Alt+L`.

## Configuration

```json
"localPreview.mappings": [
  { "pattern": "^docs/(.*)\\.md$", "url": "http://localhost:8888/$1.html" }
]
```

| Setting                               | Default | Description                                                                                                                                                                                      |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `localPreview.mappings`               | `[]`    | List of `{ pattern, url }`. `pattern` is a regex tested against the workspace-relative path, then the absolute path (forward slashes). First match wins. `url` can use capture groups like `$1`. |
| `localPreview.followMode`             | `true`  | Load the active file in the open split preview when switching tabs.                                                                                                                              |
| `localPreview.followHeadings`         | `true`  | When the cursor is on a Markdown heading, scroll the open split preview to its anchor (`file.html#my-heading`).                                                                                  |
| `localPreview.previewWidth`           | `30`    | Split preview width in % of the editor area. `0` keeps VS Code's default split width.                                                                                                            |
| `localPreview.server.command`         | –       | Command that starts your server, for example `yarn run start`. Ignored in untrusted workspaces.                                                                                                  |
| `localPreview.server.port`            | `0`     | Port your server listens on. The command runs only if nothing listens there. `0` disables.                                                                                                       |
| `localPreview.server.runInBackground` | `false` | If `false`, the server runs in the terminal and is not stopped automatically. If `true`, it runs headless and stops when the preview closes.                                                     |

## Acknowledgements

This extension is loosely based on [Localhost Opener](https://github.com/nandoblanco/vscode-localhost-opener) by Fernando Blanco.
