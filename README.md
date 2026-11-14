# Local Preview

✨ Preview your static site locally, right within VS Code. ✨

Run a static site generator like Docusaurus, Hugo, or Jekyll under the hood and see the
generated page in a live split pane while you browse and edit the source.

## Features

- Maps files in your workspace to local server URLs. For example, `docs/page.md` to
  `http://localhost:3000/docs/page.html`.
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

1. Open the VS Code settings and search for `localpreview`.
2. To start your server automatically, set **Server: Command** and **Server: Port**. The
   extension starts the server whenever a preview opens and nothing listens on that port.
3. In **Mappings**, add at least one mapping for your files. See below for an example.
4. Open any file that matches your mapping and click the **Open in Split Pane** button in
   the editor title bar.

### Example

Let's assume you are using [Docusaurus](https://docusaurus.io/). The command to start the
local dev server is `yarn start`. Docusaurus also has a `--no-open` flag to prevent it from
automatically opening the browser, which is useful when using this extension.

So your server command is `yarn start --no-open`, which serves your site at
`http://localhost:3000`.

Your Markdown files are in the `docs` folder. Configure the extension as shown below:

```json
{
  "localPreview.server.command": "yarn start --no-open",
  "localPreview.server.port": 3000,
  "localPreview.mappings": [
    { "pattern": "^docs/(.*)\\.md$", "url": "http://localhost:3000/docs/$1.html" }
  ]
}
```

## Configuration

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
