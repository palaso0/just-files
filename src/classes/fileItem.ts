import * as vscode from 'vscode';

export class FileItem extends vscode.TreeItem {
	public isFile: boolean;

	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		isFile: boolean = false,
		resourceUri: vscode.Uri | undefined = undefined
	) {
		super(label, collapsibleState);
		this.isFile = isFile;
		this.resourceUri = resourceUri;
		
		if (this.isFile && this.resourceUri) {
			this.command = {
				command: "vscode.open",
				title: "Open File",
				arguments: [this.resourceUri],
			};
		}
	}
}