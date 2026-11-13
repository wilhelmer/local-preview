# Changelog

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
- Fixed rules that matched only part of a path and gave a broken URL.
- The split preview now keeps one tab after you click a link inside it, instead of opening a second tab.
- Fixed double server starts and duplicate preview tabs on fast repeated actions.
- `Local Preview: Add Document Root` now saves to the workspace settings when the workspace defines `roots`.
- Untrusted workspaces can no longer set `localPreview.roots`.

## 0.1.0

- Initial release.
