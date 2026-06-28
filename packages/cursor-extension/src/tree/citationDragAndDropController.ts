import * as vscode from "vscode";
import { CitationTreeItem } from "./citationTreeItem.js";
import { LatexService } from "../services/latexService.js";
import { ProjectService } from "../services/projectService.js";

export class CitationDragAndDropController implements vscode.TreeDragAndDropController<CitationTreeItem> {
  readonly dragMimeTypes = ["application/vnd.citebridge.item+json", "text/plain"];
  readonly dropMimeTypes: string[] = [];

  constructor(
    private readonly project: ProjectService,
    private readonly latex: LatexService
  ) {}

  async handleDrag(source: CitationTreeItem[], dataTransfer: vscode.DataTransfer): Promise<void> {
    const citekeys = source.map((item) => item.paper.citekey);
    const project = await this.project.load();
    const citation = project ? this.latex.citation(project, citekeys) : `\\citep{${citekeys.join(", ")}}`;
    dataTransfer.set(
      "application/vnd.citebridge.item+json",
      new vscode.DataTransferItem(JSON.stringify({ citekeys }))
    );
    dataTransfer.set("text/plain", new vscode.DataTransferItem(citation));
  }
}
