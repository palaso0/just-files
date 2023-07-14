import * as vscode from "vscode";
import { FileItem } from "./classes/fileItem";

export function sortItems(items: FileItem[]) {
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
