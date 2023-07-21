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

  fileItemsFromPaths(paths: string[]): FileItem[] {
    return paths.map((path) => this.createFileItem(path));
  }

  getPathArray(fileItems: FileItem[]): string[] {
    const paths: string[] = fileItems
      .map((fileItem) => fileItem.resourceUri?.fsPath)
      .filter((fsPath): fsPath is string => fsPath !== undefined);

    return paths;
  }

  getSiblings(fileItem: FileItem): FileItem[] {
    const directoryPath = this.getParentUri(fileItem);
    if (!directoryPath) {
      return [];
    }
    const items: string[] = fs
      .readdirSync(directoryPath, { withFileTypes: true })
      .map((entry: fs.Dirent) => path.join(directoryPath, entry.name));

    const indexFileItem = items.findIndex((item) => item === fileItem.resourceUri?.fsPath);
    if (indexFileItem > -1) {
      items.splice(indexFileItem, 1);
    }

    return items.map((path) => this.createFileItem(path));
  }

  getParentInArray(fileItem: FileItem, parentFileItems: FileItem[]): FileItem | undefined {
    const resp = parentFileItems.filter((item) => this.isChildOf(fileItem, item));
    if (resp && resp.length > 0) {
      return resp[0];
    }
    return undefined;
  }

  getParentRoute(childFileItem: FileItem, parentFileItem: FileItem) {
    const isChild = childFileItem.resourceUri?.fsPath.includes(
      parentFileItem.resourceUri?.fsPath || ""
    );
    let routes: string[] = [];
    if (isChild) {
      const parentUri = this.getParentUri(childFileItem) || "";
      routes.push(parentUri);
      if (parentUri && parentUri !== parentFileItem.resourceUri?.fsPath) {
        routes = [
          ...routes,
          ...this.getParentRoute(this.createFileItem(parentUri), parentFileItem),
        ];
      }
    }
    return routes;
  }

  getDirectoriesUntilParent(childPath: string, parentPath: string): string[] {
    const relativePath = path.relative(parentPath, childPath);
    const segments = relativePath.split(path.sep);

    const directories: string[] = [];
    let currentPath = parentPath;
    for (const segment of segments) {
      currentPath = path.join(currentPath, segment);
      directories.push(currentPath);
    }

    return directories;
  }

  isFileItemInArray(fileItem: FileItem, fileItemArray: FileItem[]): boolean {
    return fileItemArray.some((item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath);
  }

  isChildOf(childFileItem: FileItem, parentFileItem: FileItem): boolean {
    const childFileItemPath = childFileItem.resourceUri?.fsPath || "";
    const parentFileItemPath = parentFileItem.resourceUri?.fsPath || "";

    if (childFileItemPath === parentFileItemPath) {
      return false;
    }

    const relativePath = path.relative(parentFileItemPath, childFileItemPath);

    return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
  }

  isChildOfArray(childFileItem: FileItem, parentFileItems: FileItem[]): boolean {
    return parentFileItems.some((item) => this.isChildOf(childFileItem, item));
  }

  isParentOfArray(parentFileItem: FileItem, childrenFileItems: FileItem[]): boolean {
    return childrenFileItems.some((item) => this.isChildOf(item, parentFileItem));
  }

  sortItems(items: FileItem[]) {
    return items.sort((a, b) => {
      const labelA = a.resourceUri?.fsPath.toLocaleLowerCase();
      const labelB = b.resourceUri?.fsPath.toLocaleLowerCase();

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

  private getParentUri(fileItem: FileItem): string | undefined {
    if (fileItem.resourceUri) {
      const filePath = fileItem.resourceUri.fsPath;
      const parentPath = path.dirname(filePath);
      return parentPath;
    }

    return undefined;
  }
}
