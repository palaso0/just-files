import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { JustFilesViewProvider } from "./justFilesViewProvider";
import { FoldersViewProvider } from "./foldersViewProvider";
import { FileItemManager } from "./fileItemManager";

export class JustFiles {
  private context: vscode.ExtensionContext;

  justFilesSelectedItems: readonly FileItem[] = [];
  filesSelectedItems: readonly FileItem[] = [];

  justFilesViewProvider: JustFilesViewProvider;
  foldersViewProvider: FoldersViewProvider;

  justFilesTreeView: vscode.TreeView<FileItem>;
  filesTreeView: vscode.TreeView<FileItem>;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.justFilesViewProvider = new JustFilesViewProvider(context);
    this.foldersViewProvider = new FoldersViewProvider();

    this.justFilesTreeView = vscode.window.createTreeView("justFilesView", {
      treeDataProvider: this.justFilesViewProvider,
      canSelectMany: true,
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
    this.subscribeCleanJustView();
    this.subscribeChanges();
  }

  subscribeShow() {
    const disposableShow = vscode.commands.registerCommand("just-files.show", async (fileItem) => {
      const isFileItemInfilesSelectedItems = this.filesSelectedItems.some(
        (item) => item.resourceUri?.path === fileItem.resourceUri.path
      );
      if (this.filesSelectedItems.length > 0 && isFileItemInfilesSelectedItems) {
        this.filesSelectedItems.map(async (item) => {
          await this.justFilesViewProvider.addFileItem(item);
          this.justFilesViewProvider.refresh();
        });
        return;
      }

      await this.justFilesViewProvider.addFileItem(fileItem);
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
        this.justFilesSelectedItems.map((item) => {
          this.justFilesViewProvider.addHideFileItem(item);
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
        await this.justFilesViewProvider.removeFileItem(item);
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
          this.justFilesViewProvider.removeFileItem(item);
          this.justFilesViewProvider.refresh();
        }
      }
    );
    this.context.subscriptions.push(removeFromCommand);
  }

  subscribeCleanJustView() {
    const cleanJustView = vscode.commands.registerCommand("just-files.removeAll", () => {
      this.justFilesViewProvider.clean();
      this.justFilesViewProvider.refresh();
    });
    this.context.subscriptions.push(cleanJustView);
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

    vscode.workspace.onDidDeleteFiles(() => {
      this.foldersViewProvider.refresh();
      this.justFilesViewProvider.refresh();
    });
  }
}
