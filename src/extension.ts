import * as vscode from "vscode";
import { JustFiles } from "./classes/justFiles";

export function activate(context: vscode.ExtensionContext) {
  const justFiles = new JustFiles(context);
  justFiles.subscribe();
}

export function deactivate(context: vscode.ExtensionContext) {
  context.workspaceState.update("displayed", undefined);
  context.workspaceState.update("hidden", undefined);
  context.workspaceState.update("subDisplayed", undefined);
  context.workspaceState.update("subHidden", undefined);
}
