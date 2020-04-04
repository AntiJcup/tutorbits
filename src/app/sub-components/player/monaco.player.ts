import { TransactionPlayer, TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { NG2FileTreeComponent, ResourceType, TutorBitsTreeModel } from '../file-tree/ng2-file-tree.component';
import { NodeSelectedEvent } from 'ng2-tree';
import { Subscription } from 'rxjs';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResourceViewerComponent, ResourceData } from '../resource-viewer/resource-viewer.component';
import { EventEmitter } from '@angular/core';
import { PlaybackMouseComponent } from '../playback-mouse/playback-mouse.component';
import { PreviewComponent } from '../preview/preview.component';
import { ITransactionReader } from 'shared/Tracer/lib/ts/ITransactionReader';

export interface LoadStartEvent {
    playPosition: number;
    loadPosition: number;
}

export interface LoadCompleteEvent {
    playPosition: number;
    loadPosition: number;
}

export class MonacoPlayer extends TransactionPlayer {
    private nodeSelectedListener: Subscription = null;
    public loadStart: EventEmitter<LoadStartEvent> = new EventEmitter<LoadStartEvent>();
    public loadComplete: EventEmitter<LoadCompleteEvent> = new EventEmitter<LoadCompleteEvent>();

    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
        protected resourceViewerComponent: ResourceViewerComponent,
        protected playbackMouseComponent: PlaybackMouseComponent,
        protected previewComponent: PreviewComponent,
        protected logServer: ILogService,
        projectLoader: IProjectReader,
        transactionReader: ITransactionReader,
        projectId: string,
        settings?: TransactionPlayerSettings,
        cacheBuster?: string) {
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
            transactionReader,
            projectId,
            cacheBuster);

        this.codeComponent.AllowEdits(false);

        this.nodeSelectedListener = this.fileTreeComponent.treeComponent.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnNodeSelected(e);
        });
    }

    public Dispose() {
        if (this.nodeSelectedListener) {
            this.nodeSelectedListener.unsubscribe();
        }
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
            const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
            this.logServer.LogToConsole('MonacoPlayer', JSON.stringify(transaction.toObject()));
            switch (transaction.getType()) {
                case TraceTransaction.TraceTransactionType.CUSTOMACTION:
                    const customData = transaction.getCustomAction();
                    switch (customData.getAction()) {
                        case 'previewFile':
                            if (!undo) {
                                this.previewComponent.LoadPreview(this.projectId, transaction.getTimeOffsetMs(), customData.getData());
                            } else {
                                this.previewComponent.ClosePreview();
                            }
                            break;
                        case 'previewFileclose':
                            if (undo) {
                                this.previewComponent.LoadPreview(this.projectId, transaction.getTimeOffsetMs(), customData.getData());
                            } else {
                                this.previewComponent.ClosePreview();
                            }
                            break;
                        default:
                            this.logServer.LogToConsole('MonacoPlayer', `Unidentified action: ${customData.getAction()}`);
                            break;
                    }
                    break;
                case TraceTransaction.TraceTransactionType.SCROLLFILE:
                    const scrollData = transaction.getScrollFile();
                    if (!undo) {
                        this.codeComponent.codeEditor.setScrollTop(scrollData.getScrollEnd());
                    } else {
                        this.codeComponent.codeEditor.setScrollTop(scrollData.getScrollStart());
                    }
                    break;
                case TraceTransaction.TraceTransactionType.MOSUEMOVE:
                    const mouseMoveData = transaction.getMouseMove();
                    if (!this.playbackMouseComponent) { break; }
                    this.playbackMouseComponent.Move(mouseMoveData.getX(), mouseMoveData.getY());
                    break;
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
                        this.fileTreeComponent.deleteNodeByPath(uploadNewPath, false);
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, uploadOldPath);
                    }
                    break;
                case TraceTransaction.TraceTransactionType.CREATEFILE:
                    const createNewPath = transaction.getCreateFile().getNewFilePath();
                    const createOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.addNodeByPath(createNewPath, transaction.getCreateFile().getIsFolder());
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, createNewPath);
                    } else {
                        this.fileTreeComponent.deleteNodeByPath(createNewPath, transaction.getCreateFile().getIsFolder());
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
                        this.fileTreeComponent.deleteNodeByPath(deletePath, deleteIsFolder);
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
                    this.codeComponent.currentFilePath = transaction.getFilePath();
                    const editorModel = this.codeComponent.codeEditor.getModel() as monaco.editor.ITextModel;
                    const startPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetStart());
                    const endPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetEnd());
                    const data = transaction.getModifyFile().getData();

                    let newEdit: monaco.editor.IIdentifiedSingleEditOperation = null;
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
                        const undoOffset = transaction.getModifyFile().getOffsetEnd() + offset;
                        const undoEndPos = editorModel.getPositionAt(undoOffset);
                        newEdit = {
                            range: new monaco.Range(
                                startPos.lineNumber,
                                startPos.column,
                                undoEndPos.lineNumber,
                                undoEndPos.column),
                            text: previousData,
                            forceMoveMarkers: true
                        };
                        this.logServer.LogToConsole('MonacoPlayer', `Undo Details: ${previousData} offset: ${offset} undoOffset: ${undoOffset} undoEndPos: ${undoEndPos} endPos: ${endPos} editorLength: ${editorModel.getFullModelRange()} endoffset: ${transaction.getModifyFile().getOffsetEnd()} startOffset: ${transaction.getModifyFile().getOffsetStart()}`);
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

    protected onLoadStart(): void {
        this.loadStart.emit({ playPosition: this.position, loadPosition: this.loadPosition });
    }

    protected onLoadComplete(): void {
        this.loadComplete.emit({ playPosition: this.position, loadPosition: this.loadPosition });
    }
}