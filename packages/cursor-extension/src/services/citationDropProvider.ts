import * as vscode from "vscode";
import type { Services } from "../types.js";

export class CitationDropProvider implements vscode.DocumentDropEditProvider {
  constructor(private readonly services: Services) {}

  async provideDocumentDropEdits(
    _document: vscode.TextDocument,
    _position: vscode.Position,
    dataTransfer: vscode.DataTransfer
  ): Promise<vscode.DocumentDropEdit | undefined> {
    const item = dataTransfer.get("application/vnd.citebridge.item+json");
    const project = await this.services.project.load();
    if (item && project) {
      const raw = await item.asString();
      const citekeys = JSON.parse(raw).citekeys as string[];
      if (citekeys.length) {
        return new vscode.DocumentDropEdit(this.services.latex.citation(project, citekeys));
      }
    }

    const text = dataTransfer.get("text/plain");
    if (!text) return undefined;
    const citation = await text.asString();
    if (!citation.startsWith("\\")) return undefined;
    return new vscode.DocumentDropEdit(citation);
  }
}
