import * as vscode from "vscode";
import * as fs from 'fs';
import { FileItem } from './fileItem';
import { sortItems } from "../helpers";

export class JustFilesViewProvider implements vscode.TreeDataProvider<FileItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;

	private fileItems: FileItem[] = [];

	addFileItem(item: FileItem): void {
		const exists = this.fileItems.some((fileItem) => fileItem.label === item.label);
		if (!exists) {
			this.fileItems.push(item);
		}
	}

	removeFileItem(item: FileItem): void {
		const index = this.fileItems.findIndex((fileItem) => fileItem.label === item.label);
		if (index > -1) {
			this.fileItems.splice(index, 1);
		}
	}

	refresh(element?: FileItem): void {
		this._onDidChangeTreeData.fire(element);
	}

	getTreeItem(element: FileItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	async getChildren(element?: FileItem): Promise<FileItem[]> {
		if (!element) {
			this.fileItems = sortItems(this.fileItems);
			return this.fileItems;
		}

		const files = await vscode.workspace.fs.readDirectory(element.resourceUri!);
		let items: FileItem[] = [];

		for (const [name, type] of files) {
			const itemPath = vscode.Uri.joinPath(element.resourceUri!, name);
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