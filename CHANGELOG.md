# Changelog

## 0.7.0

- Replaced `Open in Browser` with `Open in Window`, which opens the preview in a separate floating window.
- Removed external browser support, including `localPreview.followModeInExternalBrowser`.

## 0.6.2

- Fixed an issue where the active editor scrolled when following headings.
- Fixed an issue where an empty editor group was created when the preview was already open in a detached window.

## 0.6.1

- Updated documentation.

## 0.6.0

- New setting `localPreview.followModeInExternalBrowser` (macOS + Chrome only). Follow mode and
  follow headings now also work after `Open in Browser`, by navigating Chrome's front tab instead of
  opening a new one.

## 0.5.1

- Updated documentation.

## 0.5.0

- New command `Local Preview: Stop Server` to manually stop the server the extension started.
- New setting `localPreview.server.runInBackground` (default off). When off, the server runs in the
  active terminal and is not stopped automatically. When on, it runs headless and stops with the preview.

## 0.4.0

- Renamed `Add Document Root` to `Add Mapping` and the `localPreview.roots` setting to
  `localPreview.mappings`. There is no migration; move your entries by hand.
- Renamed `Open Active File` to `Open in Browser`. It now always opens your default browser.

## 0.3.0

- New setting `localPreview.followHeadings` (default on): moving the cursor onto a
  Markdown heading scrolls the split preview to that heading's anchor.
- Anchor-only changes no longer reload the preview.
- Refocusing the same file no longer reloads the preview and drops the `#anchor`.

## 0.2.0

- The server now stops when you close the split pane.
- Fixed patterns that matched only part of a path and gave a broken URL.
- The split preview now keeps one tab after you click a link inside it, instead of opening a second tab.
- Fixed double server starts and duplicate preview tabs on fast repeated actions.
- `Local Preview: Add Document Root` now saves to the workspace settings when the workspace defines `roots`.
- Untrusted workspaces can no longer set `localPreview.roots`.

## 0.1.0

- Initial release.
