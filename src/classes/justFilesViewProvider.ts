import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { FileItemManager } from "./fileItemManager";

export class JustFilesViewProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<
    FileItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> =
    this._onDidChangeTreeData.event;

  private displayedFileItems: FileItem[] = [];
  private hiddenFileItems: FileItem[] = [];
  private subDisplayedFileItems: FileItem[] = [];
  private subHiddenFileItems: FileItem[] = [];
  private fileItemManager = new FileItemManager();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const displayedPathsConfig: string[] = this.getPathConfiguration("displayed");
    const hiddenPathsConfig: string[] = this.getPathConfiguration("hidden");
    const subDisplayedPathsConfig: string[] = this.getPathConfiguration("subDisplayed");
    const subHiddenPathsConfig: string[] = this.getPathConfiguration("subDisplayed");

    this.displayedFileItems = this.fileItemManager.fileItemsFromPaths(displayedPathsConfig);
    this.hiddenFileItems = this.fileItemManager.fileItemsFromPaths(hiddenPathsConfig);
    this.subDisplayedFileItems = this.fileItemManager.fileItemsFromPaths(subDisplayedPathsConfig);
    this.subHiddenFileItems = this.fileItemManager.fileItemsFromPaths(subHiddenPathsConfig);
  }

  private getPathConfiguration(key: string): string[] {
    const pathConfig: string = this.context.workspaceState.get(key) || "[]";
    return JSON.parse(pathConfig);
  }

  private addDisplayFileItem(fileItem: FileItem): void {
    if (!this.fileItemManager.isFileItemInArray(fileItem, this.displayedFileItems)) {
      this.displayedFileItems.push(fileItem);
    }
  }

  private addMainNode(fileItem: FileItem): void {
    if (this.fileItemManager.isParentOfArray(fileItem, this.displayedFileItems)) {
      const childreItems = this.displayedFileItems.filter((item) =>
        this.fileItemManager.isChildOf(item, fileItem)
      );

      childreItems.map((item) => {
        this.removeFileItem(item);
        this.addSubDisplayedItem(item);
      });
    }

    this.removeHideFileItem(fileItem);
    this.removeSubFileItem(fileItem);
    this.cleanFileItemChildren(fileItem);
    this.addDisplayFileItem(fileItem);
  }

  addFileItem(fileItem: FileItem): void {
    const isChildFile = this.fileItemManager.isChildOfArray(fileItem, this.displayedFileItems);
    if (!isChildFile) {
      this.addMainNode(fileItem);
      return;
    }

    this.addSubNode(fileItem);
  }

  private addSubNode(fileItem: FileItem): void {
    if (this.isSubItemAlreadyDisplayed(fileItem)) {
      this.cleanFileItemChildren(fileItem);

      return;
    }

    this.addSubDisplayedItem(fileItem);
    this.removeHideFileItem(fileItem);
    this.removeSubHiddenFileItem(fileItem);
    this.cleanFileItemChildren(fileItem);

    const parent = this.fileItemManager.getParentInArray(fileItem, this.displayedFileItems);
    if (parent) {
      const route = this.fileItemManager.getDirectoriesUntilParent(
        fileItem.resourceUri?.fsPath || "",
        parent.resourceUri?.fsPath || ""
      );
      route.map((path) => {
        const parentItem = this.fileItemManager.createFileItem(path);
        let siblings: FileItem[] = this.fileItemManager.getSiblings(parentItem);

        siblings = siblings.filter(
          (item) =>
            !this.fileItemManager.isFileItemInArray(item, this.subDisplayedFileItems) &&
            !this.fileItemManager.isParentOfArray(item, this.subDisplayedFileItems)
        );

        siblings.map((item) => {
          const isDisplayed = this.isSubItemAlreadyDisplayed(item);
          if (!isDisplayed) {
            this.addSubHiddenFileItem(item);
          }
        });

        if (this.fileItemManager.isFileItemInArray(parentItem, this.hiddenFileItems)) {
          this.removeHideFileItem(parentItem);
        }
        this.addSubDisplayedItem(parentItem);
      });
    }
  }

  addHideFileItem(fileItem: FileItem): void {
    if (this.fileItemManager.isFileItemInArray(fileItem, this.displayedFileItems)) {
      this.removeFileItem(fileItem);
      this.cleanFileItemChildren(fileItem);

      return;
    }

    if (
      !this.fileItemManager.isFileItemInArray(fileItem, this.hiddenFileItems) &&
      !this.fileItemManager.isFileItemInArray(fileItem, this.subHiddenFileItems)
    ) {
      this.hiddenFileItems.push(fileItem);
      this.cleanFileItemChildren(fileItem);
    }
  }

  private addSubDisplayedItem(fileItem: FileItem): void {
    this.removeSubHiddenFileItem(fileItem);
    if (!this.fileItemManager.isFileItemInArray(fileItem, this.subDisplayedFileItems)) {
      this.subDisplayedFileItems.push(fileItem);
    }
  }

  private addSubHiddenFileItem(fileItem: FileItem): void {
    if (this.fileItemManager.isFileItemInArray(fileItem, this.subDisplayedFileItems)) {
      this.removeSubFileItem(fileItem);
      this.cleanFileItemChildren(fileItem);

      return;
    }

    if (
      !this.fileItemManager.isFileItemInArray(fileItem, this.subHiddenFileItems) &&
      !this.fileItemManager.isFileItemInArray(fileItem, this.hiddenFileItems)
    ) {
      this.subHiddenFileItems.push(fileItem);
    }
  }

  private cleanFileItemChildren(fileItem: FileItem): void {
    const hiddenFileItems = [...this.hiddenFileItems];
    hiddenFileItems.map((hiddenItem) => {
      if (this.fileItemManager.isChildOf(hiddenItem, fileItem)) {
        this.removeHideFileItem(hiddenItem);
      }
    });
    const subHiddenFileItems = [...this.subHiddenFileItems];
    subHiddenFileItems.map((subHiddenItem) => {
      if (this.fileItemManager.isChildOf(subHiddenItem, fileItem)) {
        this.removeSubHiddenFileItem(subHiddenItem);
      }
    });
    const subDisplayedFileItems = [...this.subDisplayedFileItems];
    subDisplayedFileItems.map((subItem) => {
      if (this.fileItemManager.isChildOf(subItem, fileItem)) {
        this.removeSubFileItem(subItem);
      }
    });
  }

  private isSubItemAlreadyDisplayed(fileItem: FileItem): boolean {
    const isInHiddenItems: boolean = this.fileItemManager.isFileItemInArray(
      fileItem,
      this.hiddenFileItems
    );

    const isInSubHiddenItems: boolean = this.fileItemManager.isFileItemInArray(
      fileItem,
      this.subHiddenFileItems
    );

    const isChildOfHiddenItems: boolean = this.fileItemManager.isChildOfArray(
      fileItem,
      this.hiddenFileItems
    );

    const isChildOfSubHiddenItems: boolean = this.fileItemManager.isChildOfArray(
      fileItem,
      this.subHiddenFileItems
    );

    return !(
      isInHiddenItems ||
      isInSubHiddenItems ||
      isChildOfHiddenItems ||
      isChildOfSubHiddenItems
    );
  }

  private removeHideFileItem(fileItem: FileItem): void {
    const index = this.hiddenFileItems.findIndex(
      (item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath
    );

    if (index > -1) {
      this.hiddenFileItems.splice(index, 1);
    }
  }

  private removeSubHiddenFileItem(fileItem: FileItem): void {
    const index = this.subHiddenFileItems.findIndex(
      (item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath
    );

    if (index > -1) {
      this.subHiddenFileItems.splice(index, 1);
    }
  }

  private removeSubFileItem(fileItem: FileItem): void {
    const index = this.subDisplayedFileItems.findIndex(
      (item) => item.resourceUri?.path === fileItem.resourceUri?.path
    );

    if (index > -1) {
      this.subDisplayedFileItems.splice(index, 1);
    }
  }

  private removeFileItem(fileItem: FileItem): void {
    const index = this.displayedFileItems.findIndex(
      (item) => item.resourceUri?.path === fileItem.resourceUri?.path
    );

    if (index > -1) {
      this.displayedFileItems.splice(index, 1);
    }
  }

  refresh(element?: FileItem): void {
    this._onDidChangeTreeData.fire(element);
    const displayedFileItemsPaths = this.fileItemManager.getPathArray(this.displayedFileItems);
    const hiddenFileItemsPaths = this.fileItemManager.getPathArray(this.hiddenFileItems);
    const subDisplayedFileItemsPaths = this.fileItemManager.getPathArray(
      this.subDisplayedFileItems
    );
    const subHiddenFileItemsPaths = this.fileItemManager.getPathArray(this.subHiddenFileItems);

    this.context.workspaceState.update("displayed", JSON.stringify(displayedFileItemsPaths));
    this.context.workspaceState.update("hidden", JSON.stringify(hiddenFileItemsPaths));
    this.context.workspaceState.update("subDisplayed", JSON.stringify(subDisplayedFileItemsPaths));
    this.context.workspaceState.update("subHidden", JSON.stringify(subHiddenFileItemsPaths));
  }

  clean(): void {
    this.displayedFileItems = [];
    this.hiddenFileItems = [];
    this.subDisplayedFileItems = [];
    this.subHiddenFileItems = [];
  }

  getTreeItem(element: FileItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: FileItem): Promise<FileItem[]> {
    if (!element) {
      return this.fileItemManager.sortItems(this.displayedFileItems);
    }

    const files = await vscode.workspace.fs.readDirectory(element.resourceUri!);
    let items: FileItem[] = [];

    for (const [name] of files) {
      const itemPath = vscode.Uri.joinPath(element.resourceUri!, name);
      const item = this.fileItemManager.createFileItem(itemPath);

      if (
        !this.fileItemManager.isFileItemInArray(item, this.hiddenFileItems) &&
        !this.fileItemManager.isFileItemInArray(item, this.subHiddenFileItems)
      ) {
        items.push(item);
      }
    }

    return this.fileItemManager.sortItems(items);
  }
}
