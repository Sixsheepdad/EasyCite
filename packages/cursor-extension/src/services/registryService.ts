import fs from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";
import { projectRegistryPath, type CiteBridgeConfig, type ProjectRegistry } from "../shared/index.js";
import { readJson, writeJson } from "./json.js";

export class RegistryService {
  async register(rootPath: string, config: CiteBridgeConfig): Promise<void> {
    const registryPath = projectRegistryPath();
    const registry = await readJson<ProjectRegistry>(registryPath, { version: 1, projects: [] });
    const now = new Date().toISOString();
    const inboxDir = path.join(rootPath, ".citebridge", "inbox");
    const cursorUri = `${vscode.env.uriScheme}://citebridge.citebridge-cursor/import`;
    const entry = {
      projectId: config.projectId,
      projectName: config.projectName,
      rootPath,
      bibFile: config.bibFile,
      papersDir: config.papersDir,
      inboxDir,
      projectToken: config.security.projectToken,
      active: registry.activeProjectId === config.projectId,
      lastActiveAt: now,
      cursorUri
    };

    registry.projects = (await this.onlyExisting(registry.projects)).filter((project) => project.projectId !== config.projectId);
    registry.projects.push(entry);
    registry.lastActiveProjectId = config.projectId;
    await writeJson(registryPath, registry);
  }

  async activate(rootPath: string, config: CiteBridgeConfig): Promise<void> {
    await this.register(rootPath, config);
    const registryPath = projectRegistryPath();
    const registry = await readJson<ProjectRegistry>(registryPath, { version: 1, projects: [] });
    const now = new Date().toISOString();

    registry.activeProjectId = config.projectId;
    registry.lastActiveProjectId = config.projectId;
    registry.projects = (await this.onlyExisting(registry.projects)).map((project) => ({
      ...project,
      active: project.projectId === config.projectId,
      lastActiveAt: project.projectId === config.projectId ? now : project.lastActiveAt
    }));
    await writeJson(registryPath, registry);
  }

  async deactivate(projectId: string): Promise<void> {
    const registryPath = projectRegistryPath();
    const registry = await readJson<ProjectRegistry>(registryPath, { version: 1, projects: [] });
    if (registry.activeProjectId !== projectId && !registry.projects.some((project) => project.projectId === projectId && project.active)) {
      return;
    }

    if (registry.activeProjectId === projectId) {
      delete registry.activeProjectId;
    }
    registry.projects = (await this.onlyExisting(registry.projects)).map((project) => ({
      ...project,
      active: project.projectId === projectId ? false : project.active
    }));
    await writeJson(registryPath, registry);
  }

  async isActive(projectId: string): Promise<boolean> {
    const registry = await readJson<ProjectRegistry>(projectRegistryPath(), { version: 1, projects: [] });
    return registry.activeProjectId === projectId || registry.projects.some((project) => project.projectId === projectId && project.active);
  }

  private async onlyExisting(projects: ProjectRegistry["projects"]): Promise<ProjectRegistry["projects"]> {
    const kept = [];
    for (const project of projects) {
      try {
        await fs.access(project.rootPath);
        kept.push(project);
      } catch {
        // Drop projects whose workspace folder no longer exists.
      }
    }
    return kept;
  }
}
