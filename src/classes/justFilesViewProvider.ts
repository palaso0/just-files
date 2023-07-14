import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { sortItems } from "../helpers";
import { FileItemManager } from "./fileItemManager";

export class JustFilesViewProvider
  implements vscode.TreeDataProvider<FileItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> =
    new vscode.EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> =
    this._onDidChangeTreeData.event;

  private displayedFileItems: FileItem[] = [];
  private hiddenFileItems: FileItem[] = [];
  private fileItemManager = new FileItemManager();

  addHideFileItem(fileItem: FileItem): void {
    if (
      this.fileItemManager.isFileItemInArray(fileItem, this.displayedFileItems)
    ) {
      this.removeFileItem(fileItem);
      return;
    }

    if (
      !this.fileItemManager.isFileItemInArray(fileItem, this.hiddenFileItems)
    ) {
      this.hiddenFileItems.push(fileItem);
    }
  }

  removeHideFileItem(fileItem: FileItem): void {
    const index = this.hiddenFileItems.findIndex(
      (item) => item.label === fileItem.label
    );

    if (index > -1) {
      this.hiddenFileItems.splice(index, 1);
    }
  }

  async addFileItem(fileItem: FileItem): Promise<void> {
    const fileItemChildren: FileItem[] = await this.getAllChildren(fileItem);
    fileItemChildren.map((item) => {
      if (this.fileItemManager.isFileItemInArray(item, this.hiddenFileItems)) {
        this.removeHideFileItem(item);
      }

      if (
        this.fileItemManager.isFileItemInArray(item, this.displayedFileItems)
      ) {
        this.removeFileItem(item);
      }
    });

    if (
      this.fileItemManager.isFileItemInArray(fileItem, this.hiddenFileItems)
    ) {
      this.removeHideFileItem(fileItem);
    }

    this.hiddenFileItems.map((item) => {
      if (this.fileItemManager.isChildof(fileItem, item)) {
        this.removeHideFileItem(item);
      }
    });

    const isChildOfDisplayedItems = this.fileItemManager.isChildOfArray(
      fileItem,
      this.displayedFileItems
    );

    if (
      !this.fileItemManager.isFileItemInArray(
        fileItem,
        this.displayedFileItems
      ) &&
      !isChildOfDisplayedItems
    ) {
      this.displayedFileItems.push(fileItem);
    }
  }

  removeFileItem(fileItem: FileItem): void {
    const index = this.displayedFileItems.findIndex(
      (item) => item.resourceUri?.path === fileItem.resourceUri?.path
    );

    if (index > -1) {
      this.displayedFileItems.splice(index, 1);
    }
  }

  refresh(element?: FileItem): void {
    this._onDidChangeTreeData.fire(element);
  }

  clean(): void {
    this.displayedFileItems = [];
    this.hiddenFileItems = [];
  }

  getTreeItem(element: FileItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: FileItem): Promise<FileItem[]> {
    if (!element) {
      this.displayedFileItems = sortItems(this.displayedFileItems);
      return this.displayedFileItems;
    }

    const files = await vscode.workspace.fs.readDirectory(element.resourceUri!);
    let items: FileItem[] = [];

    for (const [name] of files) {
      const itemPath = vscode.Uri.joinPath(element.resourceUri!, name);
      const item = this.fileItemManager.createFileItem(itemPath);

      if (!this.fileItemManager.isFileItemInArray(item, this.hiddenFileItems)) {
        items.push(item);
      }
    }
    items = sortItems(items);

    return items;
  }

  private getAllChildren = async (fileItem: FileItem): Promise<FileItem[]> => {
    if (fileItem.isFile) {
      return [];
    }

    let children: FileItem[] = [];
    const files = await vscode.workspace.fs.readDirectory(
      fileItem.resourceUri!
    );

    for (const [name] of files) {
      const itemPath = vscode.Uri.joinPath(fileItem.resourceUri!, name);
      const item = this.fileItemManager.createFileItem(itemPath);
      let itemsArray = [item];
      if (!item.isFile) {
        itemsArray = [...itemsArray, ...(await this.getAllChildren(item))];
      }
      children = [...children, ...itemsArray];
    }

    return children;
  };
}
