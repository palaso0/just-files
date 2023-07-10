import * as vscode from 'vscode';
import { FileItem } from './classes/fileItem';

export function sortItems(items: FileItem[]) {
	return items.sort((a, b) => {
		if (a instanceof vscode.TreeItem && b instanceof vscode.TreeItem) {
			if (a.label && b.label) {
				const labelA = a.label.toString().toLocaleLowerCase();
				const labelB = b.label.toString().toLocaleLowerCase();
				if (a.isFile && !b.isFile) {
					return 1;
				} else if (!a.isFile && b.isFile) {
					return -1;
				} else {
					return labelA.localeCompare(labelB);
				}
			}
		}
		return 0;
	});
}
