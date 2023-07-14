import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import path = require("path");
import * as fs from "fs";

export class FileItemManager {
  createFileItem(uri: vscode.Uri | string): FileItem {
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

  isFileItemInArray(fileItem: FileItem, fileItemArray: FileItem[]): boolean {
    return fileItemArray.some(
      (item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath
    );
  }

  isChildof(childFileItem: FileItem, parentFileItem: FileItem): boolean {
    if (childFileItem.resourceUri && parentFileItem.resourceUri) {
      const childFileItemPath = childFileItem.resourceUri.fsPath;
      const parentFileItemPath = parentFileItem.resourceUri.fsPath;
      const relativePath = path.relative(parentFileItemPath, childFileItemPath);

      return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
    }

    return false;
  }

  isChildOfArray(
    childFileItem: FileItem,
    parentFileItems: FileItem[]
  ): boolean {
    return parentFileItems.some((item) => this.isChildof(childFileItem, item));
  }

  sortItems(items: FileItem[]) {
    return items.sort((a, b) => {
      const labelA = a.resourceUri?.fsPath;
      const labelB = b.resourceUri?.fsPath;

      if (labelA && labelB) {
        if (a.isFile && !b.isFile) {
          return 1;
        } else if (!a.isFile && b.isFile) {
          return -1;
        }
        return labelA.localeCompare(labelB);
      }

      return 0;
    });
  }
}
