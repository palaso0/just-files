import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { FileItemManager } from "./fileItemManager";

export class FoldersViewProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> =
    new vscode.EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> =
    this._onDidChangeTreeData.event;

  private fileItemManager = new FileItemManager();
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

      if (workspaceFolders.length === 1) {
        const files = await vscode.workspace.fs.readDirectory(
          workspaceFolders[0].uri
        );

        for (const [name] of files) {
          const itemUri = vscode.Uri.joinPath(workspaceFolders[0].uri, name);
          const item = this.fileItemManager.createFileItem(itemUri);
          items.push(item);
        }
        return this.fileItemManager.sortItems(items);
      }

      for (const folder of workspaceFolders) {
        const itemUri = folder.uri;
        const item = this.fileItemManager.createFileItem(itemUri);
        items.push(item);
      }

      return this.fileItemManager.sortItems(items);
    }

    const files = await vscode.workspace.fs.readDirectory(element.resourceUri!);

    for (const [name] of files) {
      const itemUri = vscode.Uri.joinPath(element.resourceUri!, name);
      const item = this.fileItemManager.createFileItem(itemUri);

      items.push(item);
    }

    return this.fileItemManager.sortItems(items);
  }
}
