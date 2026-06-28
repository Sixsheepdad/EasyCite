import fs from "node:fs/promises";
import path from "node:path";
import { ensureInside, type ZoteroPayloadItem } from "../shared/index.js";
import type { LoadedProject } from "../types.js";

export type CopyPdfResult = {
  pdf?: string;
  warning?: string;
};

export class PdfService {
  async copyPdf(project: LoadedProject, item: ZoteroPayloadItem, citekey: string): Promise<CopyPdfResult> {
    if (!project.config.copyPdf) return {};
    const attachment = item.attachments?.find((candidate) => {
      const filePath = candidate.path ?? "";
      return candidate.type === "pdf" || filePath.toLowerCase().endsWith(".pdf") || candidate.filename?.toLowerCase().endsWith(".pdf");
    });
    if (!attachment?.path) return {};

    const targetRelative = path.join(project.config.papersDir, `${citekey}.pdf`);
    const targetAbsolute = path.join(project.rootPath, targetRelative);
    if (!ensureInside(project.rootPath, targetAbsolute)) {
      return { warning: `Skipped PDF for ${citekey}: target path is outside the workspace.` };
    }

    try {
      await fs.access(targetAbsolute);
      return { pdf: targetRelative.replace(/\\/g, "/") };
    } catch {
      try {
        await fs.mkdir(path.dirname(targetAbsolute), { recursive: true });
        await fs.copyFile(attachment.path, targetAbsolute);
        return { pdf: targetRelative.replace(/\\/g, "/") };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return { warning: `Could not copy PDF for ${citekey}: ${detail}` };
      }
    }
  }
}
