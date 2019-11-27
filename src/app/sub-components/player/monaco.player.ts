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
import { ResourceViewerComponent, ResourceData } from '../resource-viewer/resource-viewer.component';

export class MonacoPlayer extends TransactionPlayer {
    private nodeSelectedListener: Subscription = null;

    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
        protected resourceViewerComponent: ResourceViewerComponent,
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
        this.logServer.LogToConsole('MonacoPlayer', `OnNodeSelected: ${JSON.stringify(e.node.node)}`);
        if (e.node.isBranch()) {
            return;
        }
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                this.codeComponent.currentFilePath = newFileName;
                this.resourceViewerComponent.Resource = null;
                break;
            case ResourceType.asset:
                this.codeComponent.currentFilePath = '';
                this.codeComponent.UpdateCacheForCurrentFile();
                const model = e.node.node as TutorBitsTreeModel;
                this.resourceViewerComponent.Resource = {
                    projectId: model.overrideProjectId || this.projectId,
                    fileName: model.value,
                    resourceId: model.resourceId
                } as ResourceData;
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
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, uploadOldPath);
                    }
                    break;
                case TraceTransaction.TraceTransactionType.CREATEFILE:
                    const createNewPath = transaction.getCreateFile().getNewFilePath();
                    const createOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.addNodeByPath(createNewPath, transaction.getCreateFile().getIsFolder());
                    } else {
                        this.fileTreeComponent.deleteNodeByPath(createNewPath);
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, createOldPath);
                    }
                    break;
                case TraceTransaction.TraceTransactionType.SELECTFILE:
                    const selectNewPath = transaction.getSelectFile().getNewFilePath();
                    const selectOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, selectNewPath);
                    } else {
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, selectOldPath);
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
                        this.fileTreeComponent.renameNodeByPath(renameOldPath, renameNewPath, transaction.getRenameFile().getIsFolder());

                        this.codeComponent.ClearCacheForFile(renameOldPath);
                        this.codeComponent.UpdateCacheForFile(renameNewPath, renamePreviousData);
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, renameNewPath);
                    } else {
                        this.fileTreeComponent.renameNodeByPath(renameNewPath, renameOldPath, transaction.getRenameFile().getIsFolder());

                        this.codeComponent.ClearCacheForFile(renameNewPath);
                        this.codeComponent.UpdateCacheForFile(renameOldPath, renamePreviousData);
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, renameOldPath);
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