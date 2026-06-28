import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";
import {
  configPath,
  indexPath,
  inboxDir,
  itemsDir,
  type CiteBridgeConfig,
  type CiteBridgeIndex
} from "../shared/index.js";
import type { LoadedProject } from "../types.js";
import { readJson, writeJson } from "./json.js";
import { RegistryService } from "./registryService.js";

export class ProjectService {
  constructor(private readonly registry: RegistryService) {}

  workspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  async initialize(): Promise<LoadedProject | undefined> {
    const rootPath = this.workspaceRoot();
    if (!rootPath) {
      vscode.window.showErrorMessage("CiteBridge needs an open LaTeX workspace folder.");
      return undefined;
    }

    const existing = await this.load();
    if (existing) {
      await this.ensureProjectScaffold(existing.rootPath, existing.config);
      await this.registry.register(existing.rootPath, existing.config);
      vscode.window.showInformationMessage("CiteBridge project already initialized. Existing papers were preserved.");
      return existing;
    }

    const settings = vscode.workspace.getConfiguration("citebridge");
    const bibFile = settings.get<string>("defaultBibFile", "refs.bib");
    const papersDir = settings.get<string>("defaultPapersDir", "papers");
    const citeCommand = settings.get<CiteBridgeConfig["citeCommand"]>("defaultCiteCommand", "citep");
    const copyPdf = settings.get<boolean>("copyPdf", true);
    const apiBaseUrl = settings.get<string>("zoteroLocalApiBaseUrl", "http://localhost:23119/api");
    const projectName = path.basename(rootPath);
    const projectId = `${projectName}-${crypto.randomBytes(4).toString("hex")}`;

    const config: CiteBridgeConfig = {
      version: 1,
      projectId,
      projectName,
      bibFile,
      papersDir,
      citeCommand,
      keyPattern: "AuthorYearTitle",
      copyPdf,
      zoteroLocalApi: {
        enabled: true,
        baseUrl: apiBaseUrl
      },
      security: {
        projectToken: crypto.randomBytes(32).toString("hex")
      }
    };
    const index: CiteBridgeIndex = { version: 1, processedRequests: [], items: [] };

    await this.ensureProjectScaffold(rootPath, config);
    await writeJson(configPath(rootPath), config);
    await this.ensureIndex(rootPath, index);
    await this.registry.register(rootPath, config);
    vscode.window.showInformationMessage("CiteBridge project initialized.");
    return { rootPath, config, index };
  }

  async load(): Promise<LoadedProject | undefined> {
    const rootPath = this.workspaceRoot();
    if (!rootPath) return undefined;
    try {
      const config = await readJson<CiteBridgeConfig>(configPath(rootPath), undefined as unknown as CiteBridgeConfig);
      const index = await readJson<CiteBridgeIndex>(indexPath(rootPath), { version: 1, processedRequests: [], items: [] });
      return { rootPath, config, index };
    } catch {
      return undefined;
    }
  }

  async saveIndex(project: LoadedProject): Promise<void> {
    await writeJson(indexPath(project.rootPath), project.index);
  }

  async autoDetectAndRegister(): Promise<void> {
    const project = await this.load();
    if (project) await this.registry.register(project.rootPath, project.config);
  }

  private async ensureFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    }
  }

  private async ensureProjectScaffold(rootPath: string, config: CiteBridgeConfig): Promise<void> {
    await fs.mkdir(path.join(rootPath, config.papersDir), { recursive: true });
    await fs.mkdir(inboxDir(rootPath), { recursive: true });
    await fs.mkdir(itemsDir(rootPath), { recursive: true });
    await this.ensureFile(path.join(rootPath, config.bibFile), "");
    await this.ensureIndex(rootPath, { version: 1, processedRequests: [], items: [] });
  }

  private async ensureIndex(rootPath: string, fallback: CiteBridgeIndex): Promise<void> {
    try {
      await fs.access(indexPath(rootPath));
    } catch {
      await writeJson(indexPath(rootPath), fallback);
    }
  }
}
