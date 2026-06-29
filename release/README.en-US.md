# CiteBridge Installation and Usage

CiteBridge connects Zotero with Cursor / VS Code LaTeX projects. It consists of two installable plugins:

- `citebridge-cursor-0.1.4.vsix`: install this in Cursor or VS Code. It initializes LaTeX projects, receives Zotero items, maintains `refs.bib`, shows the CiteBridge paper panel, and lets you drag citations into `.tex` files.
- `citebridge-zotero-0.1.5.xpi`: install this in Zotero. It adds `Send to Cursor Project` to the item context menu and sends selected references to the currently activated LaTeX project.

## Files

```text
citebridge-cursor-0.1.4.vsix
citebridge-zotero-0.1.5.xpi
README.zh-CN.md
README.en-US.md
```

## Install the Cursor / VS Code Extension

1. Open Cursor or VS Code.
2. Open the Extensions panel.
3. Choose `Install from VSIX...`.
4. Select `citebridge-cursor-0.1.4.vsix`.
5. Restart the editor after installation.

## Install the Zotero Plugin

1. Open Zotero.
2. Go to `Tools -> Add-ons`.
3. Click the gear icon in the Add-ons Manager.
4. Choose `Install Add-on From File...`.
5. Select `citebridge-zotero-0.1.5.xpi`.
6. Restart Zotero after installation.

## Initialize a LaTeX Project

Open your LaTeX project folder in Cursor or VS Code, press `Ctrl + Shift + P`, and run:

```text
CiteBridge: Initialize LaTeX Project
```

This creates:

```text
refs.bib
papers/
.citebridge/
```

If the project is already initialized, running this command again only restores missing files and refreshes project registration. It does not clear the imported paper index.

## Activate the Target Project

If you have multiple LaTeX projects, activate the one that should receive references from Zotero.

1. Open the target LaTeX project in Cursor or VS Code.
2. Open the CiteBridge panel.
3. Click `Activate Project` in the panel title area.
4. Once active, the button changes to `Deactivate Project`.

Zotero sends references to the currently activated project first. If no project is active, it falls back to the most recently active or used project.

## Send References from Zotero

1. Select one or more regular items in Zotero.
2. Right-click the selected item.
3. Choose `Send to Cursor Project`.

After a successful send, Zotero shows:

```text
Sent 1 item(s) to ...
```

The payload is written to `.citebridge/inbox/` in the target LaTeX project. Cursor / VS Code should import it automatically. If it does not appear, run this command in the command palette:

```text
CiteBridge: Import from Inbox
```

## Insert Citations in LaTeX

1. Open a `.tex` file in Cursor or VS Code.
2. Find the paper in the CiteBridge panel.
3. Drag the paper into the body of the `.tex` file.

By default, CiteBridge inserts:

```latex
\citep{Author2025Title}
```

CiteBridge also maintains `refs.bib` and avoids duplicate entries when possible.

## Suggested LaTeX Setup

The default citation command is `\citep{...}`, which works well with `natbib`:

```latex
\usepackage{natbib}
```

Add this near the end of the document:

```latex
\bibliographystyle{plainnat}
\bibliography{refs}
```

## Troubleshooting

If `Send to Cursor Project` does not appear in Zotero:

- Make sure `citebridge-zotero-0.1.5.xpi` is installed
- Restart Zotero
- Right-click a regular Zotero item, not a collection, attachment, or note

If the paper does not appear in the CiteBridge panel:

- Make sure the target project has been initialized
- Make sure the target project is activated in the CiteBridge panel
- Run `CiteBridge: Import from Inbox` in Cursor

If drag-and-drop does not insert a citation:

- Make sure `citebridge-cursor-0.1.4.vsix` is installed
- Restart Cursor or VS Code
- Drag into the body area of a `.tex` editor

If Zotero sends to the wrong project:

- Open the correct project in Cursor or VS Code
- Click `Activate Project` in the CiteBridge panel
- Click `Deactivate Project` when you no longer want that project to be the explicit target

## Generated Files and Locations

CiteBridge generates or updates files in two main locations.

### LaTeX Project Directory

Assume your LaTeX project directory is `MyPaper/`. After initialization and importing references, the project may contain:

```text
MyPaper/
  refs.bib
  papers/
    Author2025Title.pdf
  .citebridge/
    config.json
    index.json
    inbox/
      import-20250628-120000.json
    items/
      Author2025Title.json
```

These files are used as follows:

- `refs.bib`: the project's BibTeX database. CiteBridge writes or updates reference entries here.
- `papers/*.pdf`: PDF copies imported from Zotero attachments into the current LaTeX project. If an item has no local PDF, or if copying fails, this file is not created.
- `.citebridge/config.json`: CiteBridge configuration for the current LaTeX project, including the project ID, BibTeX file name, and PDF directory.
- `.citebridge/index.json`: the imported paper index for the current project. The CiteBridge panel uses it to display papers and avoid duplicate imports.
- `.citebridge/inbox/*.json`: import requests written by Zotero. Cursor / VS Code reads these files and imports the references.
- `.citebridge/items/*.json`: metadata cache for each imported reference. These files do not persist Zotero attachment absolute paths.

### User Directory

CiteBridge also maintains one global project registry file in the user directory:

```text
C:\Users\YourName\.citebridge\projects.json
```

On macOS or Linux, this is usually:

```text
~/.citebridge/projects.json
```

This file records initialized LaTeX projects, the currently active project, the most recently used project, and the project token needed for sending items. The Zotero plugin uses it to decide which LaTeX project should receive references.

Other than these files, CiteBridge normally does not create project data elsewhere. Zotero or the editor may still maintain their own logs, caches, and extension installation files as part of normal application behavior.
