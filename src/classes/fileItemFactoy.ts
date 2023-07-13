import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import path = require("path");
import * as fs from "fs";

export class FileItemFactory {
  createFromUri(uri: vscode.Uri | string): FileItem {
    if (typeof uri === "string") {
      uri = vscode.Uri.parse(uri);
    }
    const label = path.basename(uri.fsPath);
    const isFile = fs.statSync(uri.fsPath).isFile();
    const collapsibleState = fs.statSync(uri.fsPath).isDirectory()
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
    return new FileItem(label, collapsibleState, isFile, uri);
  }
}
