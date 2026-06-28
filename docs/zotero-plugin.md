# Zotero Plugin Notes

The Zotero plugin does not modify `.tex` or `.bib` files. It only serializes selected Zotero items and writes payload JSON files into the target Cursor project inbox.

The MVP project selection strategy is simple:

1. Use `lastActiveProjectId` from `~/.citebridge/projects.json` when available.
2. Otherwise use the first registered project.

Later versions can add a submenu or project picker.
