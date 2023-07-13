import * as vscode from "vscode";
import { JustFilesViewProvider } from "./classes/justFilesViewProvider";
import { FoldersViewProvider } from "./classes/foldersViewProvider";
import { FileItem } from "./classes/fileItem";
import { FileItemFactory } from "./classes/fileItemFactoy";

export function activate(context: vscode.ExtensionContext) {
  doAll(context);
}

export function deactivate() {}

function doAll(context: vscode.ExtensionContext) {
  let justFilesSelectedItems: readonly FileItem[] = [];
  let filesSelectedItems: readonly FileItem[] = [];

  const justFilesViewProvider = new JustFilesViewProvider();
  const justFilesTreeView = vscode.window.createTreeView("justFilesView", {
    treeDataProvider: justFilesViewProvider,
    canSelectMany: true,
  });
  justFilesTreeView.onDidChangeSelection((event) => {
    justFilesSelectedItems = event.selection;
  });

  const disposableShow = vscode.commands.registerCommand(
    "just-files.show",
    async (fileItem) => {
      const isFileItemInfilesSelectedItems = filesSelectedItems.some(
        (item) => item.resourceUri?.path === fileItem.resourceUri.path
      );
      if (filesSelectedItems.length > 0 && isFileItemInfilesSelectedItems) {
        filesSelectedItems.map(async (item) => {
          await justFilesViewProvider.addFileItem(item);
          justFilesViewProvider.refresh();
        });
        return;
      }

      await justFilesViewProvider.addFileItem(fileItem);
      justFilesViewProvider.refresh();
    }
  );

  const disposableHide = vscode.commands.registerCommand(
    "just-files.hide",
    (fileItem) => {
      const isFileItemInjustFilesSelectedItems = justFilesSelectedItems.some(
        (item) => item.resourceUri?.path === fileItem.resourceUri.path
      );
      if (
        justFilesSelectedItems.length > 0 &&
        isFileItemInjustFilesSelectedItems
      ) {
        justFilesSelectedItems.map((item) => {
          justFilesViewProvider.addHideFileItem(item);
          justFilesViewProvider.refresh();
        });
        return;
      }

      justFilesViewProvider.addHideFileItem(fileItem);
      justFilesViewProvider.refresh();
    }
  );

  context.subscriptions.push(disposableShow);
  context.subscriptions.push(disposableHide);

  const foldersViewProvider = new FoldersViewProvider();
  const filesTreeView = vscode.window.createTreeView("filesView", {
    treeDataProvider: foldersViewProvider,
    canSelectMany: true,
  });
  filesTreeView.onDidChangeSelection((event) => {
    filesSelectedItems = event.selection;
  });

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    foldersViewProvider.refresh();
    justFilesViewProvider.refresh();
  });

  vscode.workspace.onDidRenameFiles(() => {
    foldersViewProvider.refresh();
    justFilesViewProvider.refresh();
  });

  vscode.workspace.onDidChangeTextDocument(() => {
    foldersViewProvider.refresh();
    justFilesViewProvider.refresh();
  });

  vscode.workspace.onDidCreateFiles(() => {
    foldersViewProvider.refresh();
    justFilesViewProvider.refresh();
  });

  vscode.workspace.onDidDeleteFiles(() => {
    foldersViewProvider.refresh();
    justFilesViewProvider.refresh();
  });

  const addFromTabDisponsable = vscode.commands.registerCommand(
    "just-files.addItemFromTabMenu",
    async (fileItem) => {
      const factory = new FileItemFactory();
      const item = factory.createFromUri(fileItem.path);
      await justFilesViewProvider.addFileItem(item);
      justFilesViewProvider.refresh();
    }
  );
  context.subscriptions.push(addFromTabDisponsable);

  const removeFromTabDisponsable = vscode.commands.registerCommand(
    "just-files.removeItemFromTabMenu",
    async (fileItem) => {
      const factory = new FileItemFactory();
      const item = factory.createFromUri(fileItem.path);
      await justFilesViewProvider.removeFileItem(item);
      justFilesViewProvider.refresh();
    }
  );
  context.subscriptions.push(removeFromTabDisponsable);

  const addFromCommand = vscode.commands.registerCommand("just-files.addTabFromCommand", async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const itemUri = activeEditor.document.uri;
      const factory = new FileItemFactory();
      const item = factory.createFromUri(itemUri);
      await justFilesViewProvider.addFileItem(item);
      justFilesViewProvider.refresh();
    }
  });
  context.subscriptions.push(addFromCommand);

  const removeFromCommand = vscode.commands.registerCommand("just-files.removeTabFromCommand", async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const itemUri = activeEditor.document.uri;
      const factory = new FileItemFactory();
      const item = factory.createFromUri(itemUri);
      justFilesViewProvider.removeFileItem(item);
      justFilesViewProvider.refresh();
    }
  });
  context.subscriptions.push(removeFromCommand);
}
