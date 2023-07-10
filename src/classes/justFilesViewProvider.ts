import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { FileItem } from './fileItem';
import { sortItems } from "../helpers";

export class JustFilesViewProvider implements vscode.TreeDataProvider<FileItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;

	private fileItems: FileItem[] = [];
	private hiddenFileItems: FileItem[] = [];

	addHideFileItem(fileItem: FileItem): void {
		if (this.existsItemInFileItems(fileItem)) {
			this.removeFileItem(fileItem)
			return
		}

		if (!this.existItemInHiddenItems(fileItem)) {
			this.hiddenFileItems.push(fileItem);
		}
	}

	removeHideFileItem(fileItem: FileItem): void {
		const index = this.hiddenFileItems.findIndex((item) => item.label === fileItem.label);
		if (index > -1) {
			this.hiddenFileItems.splice(index, 1);
		}
	}

	async addFileItem(fileItem: FileItem): Promise<void> {
		const fileItemChildren = await this.getAllChildren(fileItem);
		fileItemChildren.map((item) => {
			if(this.existItemInHiddenItems(item)){
				this.removeHideFileItem(item);
			}
		})

		if (this.existItemInHiddenItems(fileItem)) {
			this.removeHideFileItem(fileItem);
		}

		const isFileItemSonOfArray = this.fileItems.some(item => this.isFileItemWithinParent(fileItem, item));
		if (!this.existsItemInFileItems(fileItem) && !isFileItemSonOfArray) {
			this.fileItems.push(fileItem);
		}
	}

	removeFileItem(fileItem: FileItem): void {
		const index = this.fileItems.findIndex((item) => item.label === fileItem.label);
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

			if (!this.existItemInHiddenItems(item)) {
				items.push(item);
			}
		}
		items = sortItems(items);

		return items;
	}

	private existItemInHiddenItems = (fileItem: FileItem): boolean => {
		return this.hiddenFileItems.some((item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath);
	}

	private existsItemInFileItems = (fileItem: FileItem): boolean => {
		return this.fileItems.some((item) => item.resourceUri?.fsPath === fileItem.resourceUri?.fsPath);
	}

	private isFileItemWithinParent = (fileItem: FileItem, parentItem: FileItem): boolean => {
		if (fileItem.resourceUri && parentItem.resourceUri) {
			const fileItemPath = fileItem.resourceUri.fsPath;
			const parentItemPath = parentItem.resourceUri.fsPath;

			const relativePath = path.relative(parentItemPath, fileItemPath);

			if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
				return true;
			}
		}

		return false;
	}

	private getAllChildren = async (fileItem: FileItem): Promise<FileItem[]> => {
		if (fileItem.isFile) {
			return []
		}

		let children: FileItem[] = [];
		const files = await vscode.workspace.fs.readDirectory(fileItem.resourceUri!);

		for (const [name, type] of files) {
			const itemPath = vscode.Uri.joinPath(fileItem.resourceUri!, name);
			const isItemFile = fs.statSync(itemPath.fsPath);
			const item = new FileItem(
				name,
				type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
				isItemFile.isFile(),
				itemPath
			);
			let itemsArray = [item];
			if (!item.isFile) {
				itemsArray = [...itemsArray, ... await this.getAllChildren(item)]
			}
			children = [...children, ...itemsArray];
		}

		return children;
	}
}