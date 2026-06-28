import os from "node:os";
import path from "node:path";

export function userCiteBridgeDir(): string {
  return path.join(os.homedir(), ".citebridge");
}

export function projectRegistryPath(): string {
  return path.join(userCiteBridgeDir(), "projects.json");
}

export function citeBridgeDir(rootPath: string): string {
  return path.join(rootPath, ".citebridge");
}

export function configPath(rootPath: string): string {
  return path.join(citeBridgeDir(rootPath), "config.json");
}

export function indexPath(rootPath: string): string {
  return path.join(citeBridgeDir(rootPath), "index.json");
}

export function inboxDir(rootPath: string): string {
  return path.join(citeBridgeDir(rootPath), "inbox");
}

export function itemsDir(rootPath: string): string {
  return path.join(citeBridgeDir(rootPath), "items");
}

export function ensureInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
