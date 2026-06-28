import * as vscode from "vscode";
import type { CiteBridgeIndexItem } from "../shared/index.js";

export class CitationTreeItem extends vscode.TreeItem {
  constructor(public readonly paper: CiteBridgeIndexItem) {
    super(paper.citekey, vscode.TreeItemCollapsibleState.None);
    this.description = [paper.year, paper.doi].filter(Boolean).join(" | ");
    this.tooltip = [paper.title, paper.authors.join("; "), paper.doi].filter(Boolean).join("\n");
    this.contextValue = "citebridge.paper";
    this.command = {
      command: "citebridge.insertCitation",
      title: "Insert Citation",
      arguments: [this]
    };
  }
}
