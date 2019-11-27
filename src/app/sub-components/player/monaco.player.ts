import { TransactionPlayer, TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor } from 'monaco-editor';
import { TransactionLoader } from 'shared/Tracer/lib/ts/TransactionLoader';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { NG2FileTreeComponent, ResourceType, TutorBitsTreeModel } from '../file-tree/ng2-file-tree.component';
import { NodeSelectedEvent } from 'ng2-tree';
import { Subscription } from 'rxjs';
import { ILogService } from 'src/app/services/abstract/ILogService';

export class MonacoPlayer extends TransactionPlayer {
    private nodeSelectedListener: Subscription = null;

    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
        protected logServer: ILogService,
        projectLoader: ProjectLoader,
        transactionLoader: TransactionLoader,
        projectId: string,
        settings?: TransactionPlayerSettings) {
        super(settings ?
            settings :
            {
                speedMultiplier: 1,
                lookAheadSize: 1000 * 15,
                loadChunkSize: 1000 * 30,
                updateInterval: 10,
                loadInterval: 1000 * 1,
                customIncrementer: true
            } as TransactionPlayerSettings,
            projectLoader,
            transactionLoader,
            projectId);

        this.codeComponent.AllowEdits(false);

        this.nodeSelectedListener = this.fileTreeComponent.treeComponent.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnNodeSelected(e);
        });
    }

    protected OnNodeSelected(e: NodeSelectedEvent): void {
        this.logServer.LogToConsole('MonacoPlayer', e);
        if (e.node.isBranch()) {
            return;
        }
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                this.codeComponent.currentFilePath = newFileName;
                break;
            case ResourceType.asset:
                break;
        }
    }

    protected HandleTransaction(transaction: TraceTransaction, undo?: boolean): void {
        try {
            const edits: editor.IIdentifiedSingleEditOperation[] = [];
            this.logServer.LogToConsole('MonacoPlayer', JSON.stringify(transaction.toObject()));
            switch (transaction.getType()) {
                case TraceTransaction.TraceTransactionType.UPLOADFILE:
                    const uploadResourceId = transaction.getUploadFile().getResourceId();
                    const uploadNewPath = transaction.getUploadFile().getNewFilePath();
                    const uploadOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.addNodeByPath(uploadNewPath, false, {
                            resourceId: uploadResourceId,
                            type: ResourceType.asset
                        } as TutorBitsTreeModel);
                    } else {
                        this.fileTreeComponent.deleteNodeByPath(uploadNewPath);
                        this.codeComponent.currentFilePath = uploadOldPath;
                    }
                    break;
                case TraceTransaction.TraceTransactionType.CREATEFILE:
                    const createNewPath = transaction.getCreateFile().getNewFilePath();
                    const createOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.addNodeByPath(createNewPath, transaction.getCreateFile().getIsFolder());
                    } else {
                        this.fileTreeComponent.deleteNodeByPath(createNewPath);
                        this.codeComponent.currentFilePath = createOldPath;
                    }
                    break;
                case TraceTransaction.TraceTransactionType.SELECTFILE:
                    const selectNewPath = transaction.getSelectFile().getNewFilePath();
                    const selectOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, selectNewPath);
                        this.codeComponent.currentFilePath = selectNewPath;
                    } else {
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, selectOldPath);
                        this.codeComponent.currentFilePath = selectOldPath;
                    }
                    break;
                case TraceTransaction.TraceTransactionType.DELETEFILE:
                    const deletePreviousData = transaction.getDeleteFile().getPreviousData();
                    const deletePath = transaction.getFilePath();
                    const deleteIsFolder = transaction.getDeleteFile().getIsFolder();
                    if (!undo) {
                        this.fileTreeComponent.deleteNodeByPath(deletePath);
                        this.codeComponent.currentFilePath = '';
                        this.codeComponent.ClearCacheForFile(deletePath);
                    } else {
                        this.fileTreeComponent.addNodeByPath(deletePath, deleteIsFolder);
                        this.codeComponent.UpdateCacheForFile(deletePath, deletePreviousData);
                    }
                    break;
                case TraceTransaction.TraceTransactionType.RENAMEFILE:
                    const renamePreviousData = transaction.getRenameFile().getPreviousData();
                    const renameNewPath = transaction.getRenameFile().getNewFilePath();
                    const renameOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.deleteNodeByPath(renameOldPath);
                        this.fileTreeComponent.addNodeByPath(renameNewPath, transaction.getRenameFile().getIsFolder());

                        this.codeComponent.ClearCacheForFile(renameOldPath);
                        this.codeComponent.UpdateCacheForFile(renameNewPath, renamePreviousData);
                        this.codeComponent.currentFilePath = renameNewPath;
                    } else {
                        this.fileTreeComponent.deleteNodeByPath(renameNewPath);
                        this.fileTreeComponent.addNodeByPath(renameOldPath, transaction.getRenameFile().getIsFolder());

                        this.codeComponent.ClearCacheForFile(renameNewPath);
                        this.codeComponent.UpdateCacheForFile(renameOldPath, renamePreviousData);
                        this.codeComponent.currentFilePath = renameOldPath;
                    }
                    break;
                case TraceTransaction.TraceTransactionType.MODIFYFILE:
                    const editorModel = this.codeComponent.codeEditor.getModel() as editor.ITextModel;
                    const startPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetStart());
                    const endPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetEnd());
                    const data = transaction.getModifyFile().getData();
                    this.codeComponent.currentFilePath = transaction.getFilePath();

                    let newEdit: editor.IIdentifiedSingleEditOperation = null;
                    if (!undo) {
                        newEdit = {
                            range: new monaco.Range(
                                startPos.lineNumber,
                                startPos.column,
                                endPos.lineNumber,
                                endPos.column),
                            text: data,
                            forceMoveMarkers: true
                        };
                    } else {
                        const previousData = transaction.getModifyFile().getPreviousData();
                        const offset = data.length - previousData.length;
                        const undoEndPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetEnd() + offset);
                        newEdit = {
                            range: new monaco.Range(
                                startPos.lineNumber,
                                startPos.column,
                                undoEndPos.lineNumber,
                                undoEndPos.column),
                            text: previousData,
                            forceMoveMarkers: true
                        };
                    }
                    this.logServer.LogToConsole('MonacoPlayer', `Edit: ${JSON.stringify(newEdit)} Undo: ${undo}`);
                    edits.push(newEdit);
                    break;
            }

            if (edits.length > 0) {
                if (this.codeComponent.codeEditor.hasTextFocus()) {
                    (document.activeElement as HTMLElement).blur();
                }
                this.codeComponent.AllowEdits(true);
                this.codeComponent.codeEditor.executeEdits('teacher', edits);
                this.codeComponent.AllowEdits(false);
                this.codeComponent.UpdateCacheForCurrentFile();
            }
        } catch (e) {
            this.logServer.LogErrorToConsole('MonacoPlayer', e);
        }
    }

}