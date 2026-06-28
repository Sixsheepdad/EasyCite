# Cursor Extension Notes

The Cursor extension owns all writes to `.tex` and `.bib` files.

Implemented MVP commands:

- `CiteBridge: Initialize LaTeX Project`
- `CiteBridge: Refresh Library`
- `CiteBridge: Import from Inbox`
- `CiteBridge: Insert Citation`
- `CiteBridge: Open Paper PDF`

The extension registers a tree view at `citebridge.libraryView` and a document drop provider for LaTeX files. Dragged tree items use the MIME type:

```text
application/vnd.citebridge.item+json
```
