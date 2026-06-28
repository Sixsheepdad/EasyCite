import fs from "node:fs/promises";
import path from "node:path";
import {
  bibtexHasDoi,
  createMinimalBibtex,
  parseBibtexKeys,
  withBibtexKey,
  type ZoteroPayloadItem
} from "../shared/index.js";
import type { LoadedProject } from "../types.js";

export class BibService {
  async ensureBibtex(project: LoadedProject, item: ZoteroPayloadItem, citekey: string): Promise<{ added: boolean; bibtex: string }> {
    const bibPath = path.join(project.rootPath, project.config.bibFile);
    const existing = await this.readBibFile(bibPath);
    const keys = parseBibtexKeys(existing);
    if (keys.has(citekey) || bibtexHasDoi(existing, item.doi)) {
      return { added: false, bibtex: item.bibtex ? withBibtexKey(item.bibtex, citekey) : createMinimalBibtex(item, citekey) };
    }

    const fetched = await this.fetchZoteroBibtex(project, item);
    const bibtex = withBibtexKey(item.bibtex || fetched || createMinimalBibtex(item, citekey), citekey);
    const separator = existing.trim().length > 0 ? "\n\n" : "";
    await fs.writeFile(bibPath, `${existing.trimEnd()}${separator}${bibtex}\n`, "utf8");
    return { added: true, bibtex };
  }

  private async readBibFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      return "";
    }
  }

  private async fetchZoteroBibtex(project: LoadedProject, item: ZoteroPayloadItem): Promise<string | undefined> {
    if (!project.config.zoteroLocalApi.enabled) return undefined;
    const baseUrl = project.config.zoteroLocalApi.baseUrl.replace(/\/$/, "");
    const librarySegment = item.libraryType === "group" ? `groups/${item.libraryId}` : `users/${item.libraryId || "0"}`;
    try {
      const response = await fetch(`${baseUrl}/${librarySegment}/items/${item.itemKey}?format=bibtex`);
      if (!response.ok) return undefined;
      const text = await response.text();
      return text.trim() || undefined;
    } catch {
      return undefined;
    }
  }
}
