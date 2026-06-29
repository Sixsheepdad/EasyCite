# CiteBridge

CiteBridge connects Zotero references to Cursor LaTeX projects. Zotero sends selected items into the active Cursor project, and the Cursor extension imports metadata, copies PDFs, maintains `refs.bib`, shows papers in a sidebar, and lets you drag citations into `.tex` files.

## Packages

- `packages/shared`: protocol types, citekey generation, BibTeX helpers, and path helpers.
- `packages/cursor-extension`: Cursor/VS Code extension.
- `packages/zotero-plugin`: Zotero plugin that writes import payloads to Cursor project inboxes.

## Install Dependencies

```bash
pnpm install
```

## Build

```bash
pnpm build
```

Package both installable artifacts:

```bash
pnpm package
```

The Cursor package is created from `packages/cursor-extension`; the Zotero package is written as `citebridge-zotero-0.1.5.xpi`.

## Cursor Extension

1. Build or package the extension.
2. In Cursor, open Extensions.
3. Choose `Install from VSIX...`.
4. Install the generated `citebridge-cursor-0.1.4.vsix`.

Open a LaTeX project folder in Cursor and run:

```text
CiteBridge: Initialize LaTeX Project
```

This creates:

```text
papers/
refs.bib
.citebridge/config.json
.citebridge/index.json
.citebridge/inbox/
.citebridge/items/
```

It also registers the project in:

```text
~/.citebridge/projects.json
```

Running the initialize command again for an already initialized project is safe. It refreshes registration and restores missing folders, but it does not clear `.citebridge/index.json`.

## Zotero Plugin

1. Package the plugin with `pnpm package:zotero`.
2. In Zotero, open Tools -> Add-ons.
3. Choose Install Add-on From File.
4. Install `citebridge-zotero-0.1.5.xpi`.

In Zotero, select one or more regular items, right-click, and choose:

```text
Send to Cursor Project
```

The plugin sends to the currently activated CiteBridge project. Use the Activate Project button in the Cursor CiteBridge panel to choose the target project. If no project is activated, Zotero falls back to the most recently active project.

## Import Flow

1. Zotero writes a JSON payload to `.citebridge/inbox/`.
2. Cursor imports the payload from the inbox file watcher.
3. If the file watcher does not pick it up, you can import manually.
4. Cursor writes or updates `.citebridge/index.json`.
5. Cursor copies the first PDF attachment into `papers/{citekey}.pdf` when available.
6. Cursor appends a BibTeX entry to `refs.bib` unless the citekey or DOI already exists.

You can also manually run:

```text
CiteBridge: Import from Inbox
```

## Insert Citations

Open a `.tex` file and drag a paper from the CiteBridge sidebar into the editor. The extension inserts:

```latex
\citep{Wang2025UDFNet}
```

Change the default command in Cursor settings:

```text
citebridge.defaultCiteCommand
```

Supported values are `citep`, `citet`, `cite`, `parencite`, and `textcite`.

## Troubleshooting

If Zotero cannot see a Cursor project, initialize or activate the project in Cursor and check `~/.citebridge/projects.json`.

If Cursor does not receive items, run `CiteBridge: Import from Inbox` and check whether JSON files are present in `.citebridge/inbox/`.

If `refs.bib` is not updated, check whether the same DOI or citekey already exists. CiteBridge avoids duplicate BibTeX entries.

If a PDF is not copied, confirm the Zotero attachment is a local PDF and that Zotero can access its file path.

If citekeys collide, CiteBridge appends suffixes such as `A`, `B`, or numeric suffixes.

If Zotero sends to the wrong project, open the intended LaTeX project in Cursor and click the CiteBridge panel's Activate Project button. Click Deactivate Project when you no longer want that project to be the explicit target.
