import path from "node:path";
import * as vscode from "vscode";
import { BibService } from "./services/bibService.js";
import { CitationDropProvider } from "./services/citationDropProvider.js";
import { ImportService } from "./services/importService.js";
import { InboxService } from "./services/inboxService.js";
import { LatexService } from "./services/latexService.js";
import { ProjectService } from "./services/projectService.js";
import { RegistryService } from "./services/registryService.js";
import { CitationDragAndDropController } from "./tree/citationDragAndDropController.js";
import { CitationTreeItem } from "./tree/citationTreeItem.js";
import { CitationTreeProvider } from "./tree/citationTreeProvider.js";
import type { Services } from "./types.js";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const registry = new RegistryService();
  const project = new ProjectService(registry);
  const bib = new BibService();
  const importer = new ImportService(bib);
  const latex = new LatexService();

  let treeProvider: CitationTreeProvider;
  const services = {} as Services;
  Object.assign(services, {
    context,
    project,
    registry,
    bib,
    importer,
    latex,
    refreshTree: () => treeProvider.refresh()
  });
  const inbox = new InboxService(services);
  services.inbox = inbox;
  latex.projectLoader = () => project.load();
  const updateActiveContext = async () => {
    const loaded = await project.load();
    const active = loaded ? await registry.isActive(loaded.config.projectId) : false;
    await vscode.commands.executeCommand("setContext", "citebridge.projectActive", active);
  };

  treeProvider = new CitationTreeProvider(project);
  const treeView = vscode.window.createTreeView("citebridge.libraryView", {
    treeDataProvider: treeProvider,
    dragAndDropController: new CitationDragAndDropController(project, latex),
    canSelectMany: true
  });

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand("citebridge.initializeProject", async () => {
      await project.initialize();
      await inbox.watch();
      await updateActiveContext();
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand("citebridge.refreshLibrary", () => treeProvider.refresh()),
    vscode.commands.registerCommand("citebridge.importFromInbox", () => inbox.importAll()),
    vscode.commands.registerCommand("citebridge.activateProject", async () => {
      const loaded = await project.load();
      if (!loaded) {
        vscode.window.showErrorMessage("Initialize this LaTeX project with CiteBridge before activating it.");
        return;
      }
      await registry.activate(loaded.rootPath, loaded.config);
      await updateActiveContext();
      vscode.window.showInformationMessage(`CiteBridge activated ${loaded.config.projectName}.`);
    }),
    vscode.commands.registerCommand("citebridge.deactivateProject", async () => {
      const loaded = await project.load();
      if (!loaded) return;
      await registry.deactivate(loaded.config.projectId);
      await updateActiveContext();
      vscode.window.showInformationMessage(`CiteBridge deactivated ${loaded.config.projectName}.`);
    }),
    vscode.commands.registerCommand("citebridge.insertCitation", async (item?: CitationTreeItem) => {
      if (item) await latex.insertCitation([item.paper.citekey]);
    }),
    vscode.commands.registerCommand("citebridge.openPaperPdf", async (item?: CitationTreeItem) => {
      const loaded = await project.load();
      if (!loaded || !item?.paper.pdf) return;
      await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(path.join(loaded.rootPath, item.paper.pdf)));
    }),
    vscode.window.registerUriHandler({ handleUri: (uri) => inbox.handleUri(uri) }),
    vscode.languages.registerDocumentDropEditProvider(
      [{ language: "latex" }, { pattern: "**/*.tex" }],
      new CitationDropProvider(services),
      { dropMimeTypes: ["application/vnd.citebridge.item+json", "text/plain"] }
    )
  );

  await project.autoDetectAndRegister();
  await updateActiveContext();
  await inbox.watch();
}

export async function deactivate(): Promise<void> {
  const registry = new RegistryService();
  const project = new ProjectService(registry);
  const loaded = await project.load();
  if (loaded) {
    await registry.deactivate(loaded.config.projectId);
  }
}
