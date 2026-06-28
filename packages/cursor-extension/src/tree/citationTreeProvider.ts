import * as vscode from "vscode";
import { CitationTreeItem } from "./citationTreeItem.js";
import { ProjectService } from "../services/projectService.js";

export class CitationTreeProvider implements vscode.TreeDataProvider<CitationTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CitationTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly project: ProjectService) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: CitationTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<CitationTreeItem[]> {
    const loaded = await this.project.load();
    if (!loaded) return [];
    return loaded.index.items
      .slice()
      .sort((left, right) => left.citekey.localeCompare(right.citekey))
      .map((item) => new CitationTreeItem(item));
  }
}
