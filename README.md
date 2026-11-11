# Local Preview

Preview local web files in VS Code, without manually typing the local server URL into a browser.

## Features

- Maps a file in your workspace to its local server URL (XAMPP, MAMP, Apache, Nginx, dev servers).
- Opens it in a live split pane next to your editor, or in your browser.
- Follow mode: switching editor tabs loads the active file in the open preview.
- Optionally starts your dev server automatically when a preview opens.

| Command                                     | Shortcut     |
| ------------------------------------------- | ------------ |
| `Local Preview: Open in Split Pane`         | `Ctrl+Alt+L` |
| `Local Preview: Open Active File` (browser) | `Ctrl+Alt+O` |
| `Local Preview: Add Document Root`          | –            |

Both open commands are also in the editor title bar and the editor right-click menu.

## Setup

1. Start your local web server.
2. Run `Local Preview: Add Document Root` and enter a regex pattern and a URL. Or add `localPreview.roots` to `settings.json` (see below).
3. Open a file and press `Ctrl+Alt+L`.

## Configuration

```json
"localPreview.roots": [
  { "pattern": "^htdocs/(.*)$", "url": "http://localhost:8888/$1" }
]
```

| Setting                       | Default  | Description                                                                                                                                                                                      |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `localPreview.roots`          | `[]`     | List of `{ pattern, url }`. `pattern` is a regex tested against the workspace-relative path, then the absolute path (forward slashes). First match wins. `url` can use capture groups like `$1`. |
| `localPreview.browser`        | `system` | `system` opens your default browser, `simple` uses the VS Code Simple Browser.                                                                                                                   |
| `localPreview.followMode`     | `true`   | Load the active file in the open split preview when switching tabs.                                                                                                                              |
| `localPreview.previewWidth`   | `30`     | Split preview width in % of the editor area. `0` disables.                                                                                                                                       |
| `localPreview.server.command` | –        | Command that starts your dev server, for example `yarn run start`. User settings only.                                                                                                           |
| `localPreview.server.port`    | `0`      | Port your dev server listens on. The command runs only if nothing listens there. `0` disables.                                                                                                   |

## Acknowledgements

This extension is loosely based on [Localhost Opener](https://github.com/nandoblanco/vscode-localhost-opener) by Fernando Blanco.
