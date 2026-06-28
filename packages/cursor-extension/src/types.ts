import type * as vscode from "vscode";
import type { CiteBridgeConfig, CiteBridgeIndex } from "./shared/index.js";
import type { BibService } from "./services/bibService.js";
import type { ImportService } from "./services/importService.js";
import type { InboxService } from "./services/inboxService.js";
import type { LatexService } from "./services/latexService.js";
import type { ProjectService } from "./services/projectService.js";
import type { RegistryService } from "./services/registryService.js";

export type Services = {
  context: vscode.ExtensionContext;
  project: ProjectService;
  registry: RegistryService;
  inbox: InboxService;
  importer: ImportService;
  bib: BibService;
  latex: LatexService;
  refreshTree: () => void;
};

export type LoadedProject = {
  rootPath: string;
  config: CiteBridgeConfig;
  index: CiteBridgeIndex;
};
