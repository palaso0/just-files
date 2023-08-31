import * as vscode from 'vscode';
import { FileItem } from './fileItem';
import { JustFilesViewProvider } from './justFilesViewProvider';
import { FileItemManager } from './fileItemManager';

export class JustFilesDragAndDropController implements vscode.TreeDragAndDropController<FileItem>, vscode.Disposable {
    private justFilesViewProvider?: JustFilesViewProvider;
    private fileItemManager?: FileItemManager;
    dragMimeTypes = [];
    dropMimeTypes = ['text/uri-list'];

    dispose() {
        this.justFilesViewProvider = void 0;
        this.fileItemManager = void 0;
    }

    init(fileItemManager: FileItemManager, justFilesViewProvider: JustFilesViewProvider) {
        this.fileItemManager = fileItemManager;
        this.justFilesViewProvider = justFilesViewProvider;
    }

    handleDrop(target: FileItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        let transferItem = dataTransfer.get('text/uri-list');
        if(!transferItem || !transferItem.value) {return;}
        let fileItem = this.fileItemManager?.createFileItem(vscode.Uri.parse(transferItem.value));
        if(!fileItem) {return;}
        this.justFilesViewProvider?.addFileItem(fileItem);
        this.justFilesViewProvider?.refresh();
    }
}