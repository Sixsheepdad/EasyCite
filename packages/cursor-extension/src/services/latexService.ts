import * as vscode from "vscode";
import type { LoadedProject } from "../types.js";

export class LatexService {
  citation(project: LoadedProject, citekeys: string[]): string {
    return `\\${project.config.citeCommand}{${citekeys.join(", ")}}`;
  }

  async insertCitation(citekeys: string[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("Open a .tex editor before inserting a citation.");
      return;
    }
    const project = await this.projectLoader();
    if (!project) return;
    const text = this.citation(project, citekeys);
    await editor.edit((edit) => {
      for (const selection of editor.selections) {
        edit.replace(selection, text);
      }
    });
  }

  projectLoader: () => Promise<LoadedProject | undefined> = async () => undefined;
}
