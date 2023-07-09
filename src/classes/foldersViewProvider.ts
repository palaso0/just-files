import * as vscode from "vscode";
import * as fs from 'fs';
import { FileItem } from './fileItem';
import { sortItems } from "../helpers";

export class FoldersViewProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;

  refresh(element?: FileItem): void {
    this._onDidChangeTreeData.fire(element);
  }

  getTreeItem(element: FileItem): FileItem | Thenable<FileItem> {
    return element;
  }

  async getChildren(element?: FileItem): Promise<FileItem[]> {
    let items: FileItem[] = [];
    if (!element) {
      const workspaceFolders = vscode.workspace.workspaceFolders || [];

      if (workspaceFolders.length == 1) {
        const files = await vscode.workspace.fs.readDirectory(workspaceFolders[0].uri);

        for (const [name, type] of files) {
          const itemPath = vscode.Uri.joinPath(workspaceFolders[0].uri, name)
          const isItemFile = fs.statSync(itemPath.fsPath);
          const item = new FileItem(
            name,
            type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            isItemFile.isFile(),
            vscode.Uri.joinPath(workspaceFolders[0].uri!, name)
          );
          items.push(item);
        }
        items = sortItems(items);

        return items;
      }
      for (const folder of workspaceFolders) {
        const itemPath = folder.uri
        const isItemFile = fs.statSync(itemPath.fsPath);
        const folderItem = new FileItem(
          folder.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          isItemFile.isFile(),
          folder.uri
        );

        items.push(folderItem);
      }

      items = sortItems(items);
      return items;
    }

    const files = await vscode.workspace.fs.readDirectory(element.resourceUri!);

    for (const [name, type] of files) {
      const itemPath = vscode.Uri.joinPath(element.resourceUri!, name)
      const isItemFile = fs.statSync(itemPath.fsPath);
      const item = new FileItem(
        name,
        type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        isItemFile.isFile(),
        itemPath
      );

      items.push(item);
    }

    items = sortItems(items);

    return items;
  }
}
