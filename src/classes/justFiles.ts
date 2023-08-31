import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { JustFilesViewProvider } from "./justFilesViewProvider";
import { FoldersViewProvider } from "./foldersViewProvider";
import { FileItemManager } from "./fileItemManager";
import { JustFilesDragAndDropController } from './justFilesDragAndDropController';

export class JustFiles {
  private context: vscode.ExtensionContext;

  justFilesSelectedItems: readonly FileItem[] = [];
  filesSelectedItems: readonly FileItem[] = [];

  justFilesViewProvider: JustFilesViewProvider;
  foldersViewProvider: FoldersViewProvider;

  justFilesTreeView: vscode.TreeView<FileItem>;
  filesTreeView: vscode.TreeView<FileItem>;
  dndController: JustFilesDragAndDropController;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.justFilesViewProvider = new JustFilesViewProvider(context);
    this.foldersViewProvider = new FoldersViewProvider();
    this.dndController = new JustFilesDragAndDropController();

    this.justFilesTreeView = vscode.window.createTreeView("justFilesView", {
      treeDataProvider: this.justFilesViewProvider,
      canSelectMany: true,
      dragAndDropController: this.dndController,
    });
    this.filesTreeView = vscode.window.createTreeView("filesView", {
      treeDataProvider: this.foldersViewProvider,
      canSelectMany: true,
    });
  }

  subscribe() {
    this.subscribeShow();
    this.subscribeHide();
    this.subscribeAddFromTab();
    this.subscribeRemoveFromTab();
    this.subscribeAddFromCommand();
    this.subscribeRemoveFromCommand();
    this.subscribeAddFromExplorer();
    this.subscribeAddFromDrop();
    this.subscribeCleanJustView();
    this.subscribeChanges();
    this.subscribeRefreshFilesView();
    this.subscribeRefreshJustFilesView();
  }

  subscribeShow() {
    const disposableShow = vscode.commands.registerCommand("just-files.show", (fileItem) => {
      const isFileItemInfilesSelectedItems = this.filesSelectedItems.some(
        (item) => item.resourceUri?.path === fileItem.resourceUri.path
      );
      if (this.filesSelectedItems.length > 0 && isFileItemInfilesSelectedItems) {
        this.filesSelectedItems.map((item) => {
          this.justFilesViewProvider.addFileItem(item);
          this.justFilesViewProvider.refresh();
        });

        return;
      }

      this.justFilesViewProvider.addFileItem(fileItem);
      this.justFilesViewProvider.refresh();
    });

    this.context.subscriptions.push(disposableShow);
  }

  subscribeHide() {
    const disposableHide = vscode.commands.registerCommand("just-files.hide", (fileItem) => {
      const isFileItemInjustFilesSelectedItems = this.justFilesSelectedItems.some(
        (item) => item.resourceUri?.path === fileItem.resourceUri.path
      );
      if (this.justFilesSelectedItems.length > 0 && isFileItemInjustFilesSelectedItems) {
        this.justFilesSelectedItems.map(async (item) => {
          await this.justFilesViewProvider.addHideFileItem(item);
          this.justFilesViewProvider.refresh();
        });

        return;
      }
      this.justFilesViewProvider.addHideFileItem(fileItem);
      this.justFilesViewProvider.refresh();
    });
    this.context.subscriptions.push(disposableHide);
  }

  subscribeAddFromTab() {
    const addFromTabDisponsable = vscode.commands.registerCommand(
      "just-files.addItemFromTabMenu",
      async (fileItem) => {
        const factory = new FileItemManager();
        const item = factory.createFileItem(fileItem.path);
        await this.justFilesViewProvider.addFileItem(item);
        this.justFilesViewProvider.refresh();
      }
    );
    this.context.subscriptions.push(addFromTabDisponsable);
  }

  subscribeRemoveFromTab() {
    const removeFromTabDisponsable = vscode.commands.registerCommand(
      "just-files.removeItemFromTabMenu",
      async (fileItem) => {
        const factory = new FileItemManager();
        const item = factory.createFileItem(fileItem.path);
        this.justFilesViewProvider.addHideFileItem(item);
        this.justFilesViewProvider.refresh();
      }
    );
    this.context.subscriptions.push(removeFromTabDisponsable);
  }

  subscribeAddFromCommand() {
    const addFromCommand = vscode.commands.registerCommand(
      "just-files.addTabFromCommand",
      async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          const itemUri = activeEditor.document.uri;
          const factory = new FileItemManager();
          const item = factory.createFileItem(itemUri);
          await this.justFilesViewProvider.addFileItem(item);
          this.justFilesViewProvider.refresh();
        }
      }
    );
    this.context.subscriptions.push(addFromCommand);
  }

  subscribeRemoveFromCommand() {
    const removeFromCommand = vscode.commands.registerCommand(
      "just-files.removeTabFromCommand",
      async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          const itemUri = activeEditor.document.uri;
          const factory = new FileItemManager();
          const item = factory.createFileItem(itemUri);
          this.justFilesViewProvider.addHideFileItem(item);
          this.justFilesViewProvider.refresh();
        }
      }
    );
    this.context.subscriptions.push(removeFromCommand);
  }

  subscribeAddFromExplorer() {
    const disposableAddFromExplorer = vscode.commands.registerCommand(
      "just-files.addItemFromExplorer",
      (fileItem) => {
        const factory = new FileItemManager();
        const item = factory.createFileItem(fileItem.path);
        this.justFilesViewProvider.addFileItem(item);
        this.justFilesViewProvider.refresh();
      }
    );
    this.context.subscriptions.push(disposableAddFromExplorer);
  }

  subscribeCleanJustView() {
    const cleanJustView = vscode.commands.registerCommand("just-files.removeAll", () => {
      this.justFilesViewProvider.clean();
      this.justFilesViewProvider.refresh();
    });
    this.context.subscriptions.push(cleanJustView);
  }

  subscribeRefreshFilesView() {
    const refreshFilesView = vscode.commands.registerCommand("just-files.refreshFiles", () => {
      this.foldersViewProvider.refresh();
    });
    this.context.subscriptions.push(refreshFilesView);
  }

  subscribeRefreshJustFilesView() {
    const refreshJustFilesView = vscode.commands.registerCommand(
      "just-files.refreshJustFiles",
      () => {
        this.justFilesViewProvider.removeNotFiles();
        this.justFilesViewProvider.refresh();
      }
    );
    this.context.subscriptions.push(refreshJustFilesView);
  }

  subscribeAddFromDrop() {
    const factory = new FileItemManager();
    this.dndController.init(factory, this.justFilesViewProvider);
    this.context.subscriptions.push(this.dndController);
  }

  subscribeChanges() {
    this.justFilesTreeView.onDidChangeSelection((event) => {
      this.justFilesSelectedItems = event.selection;
    });

    this.filesTreeView.onDidChangeSelection((event) => {
      this.filesSelectedItems = event.selection;
    });

    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });

    vscode.workspace.onDidRenameFiles(() => {
      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });

    vscode.workspace.onDidChangeTextDocument(() => {
      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });

    vscode.workspace.onDidCreateFiles(() => {
      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });

    vscode.workspace.onDidDeleteFiles((item) => {
      const factory = new FileItemManager();
      item.files.map((file) => {
        const removedItem = factory.createFileItem(file.path);
        this.justFilesViewProvider.removeItemFromJustFiles(removedItem);
      });

      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });
  }
}
