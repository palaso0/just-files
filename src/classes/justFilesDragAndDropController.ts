import * as vscode from "vscode";
import { FileItem } from "./fileItem";
import { JustFilesViewProvider } from "./justFilesViewProvider";
import { FileItemManager } from "./fileItemManager";

export class JustFilesDragAndDropController
  implements vscode.TreeDragAndDropController<FileItem>
{
  dropMimeTypes = ["text/uri-list"];
  dragMimeTypes = [];

  private viewProvider: JustFilesViewProvider;
  private fileItemManager: FileItemManager;

  constructor(viewProvider: JustFilesViewProvider) {
    this.viewProvider = viewProvider;
    this.fileItemManager = new FileItemManager();
  }

  public async handleDrop(
    target: FileItem | undefined,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (target && this.viewProvider.isDropPlaceholder(target)) {
      target = undefined;
    }

    const transferItem = dataTransfer.get("text/uri-list");
    if (!transferItem) {
      return;
    }

    const uriList = await transferItem.asString();
    if (!uriList) {
      return;
    }

    const lines = uriList.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      if (line.startsWith("#")) {
        continue;
      }

      try {
        const uri = vscode.Uri.parse(line);
        const fileItem = this.fileItemManager.createFileItem(uri);
        this.viewProvider.addFileItem(fileItem);
      } catch (error) {
        console.error(`Error adding file from drop: ${line}`, error);
      }
    }
    this.viewProvider.refresh();
  }
}
