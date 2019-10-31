import { TraceTransaction, TraceProject, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable } from 'monaco-editor';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';
import { TreeComponent, NodeSelectedEvent, NodeCreatedEvent, NodeRenamedEvent, NodeRemovedEvent, NodeMovedEvent } from 'ng2-tree';
import { stringify } from 'querystring';
import { Subscription } from 'rxjs';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { NG2FileTreeComponent } from '../file-tree/ng2-file-tree.component';

export class MonacoRecorder extends TransactionRecorder {

    private fileChangeListener: IDisposable = null;

    private nodeSelectedListener: Subscription = null;
    private nodeCreatedListener: Subscription = null;
    private nodeRenameListener: Subscription = null;
    private nodeDeletedListener: Subscription = null;
    private nodeMovedListener: Subscription = null;

    private timeOffset: number;
    private start: number;

    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
        projectId: string,
        projectLoader: ProjectLoader,
        projectWriter: ProjectWriter,
        transactionWriter: TransactionWriter,
        transactionLogs?: TraceTransactionLog[]) {
        super(projectId, projectLoader, projectWriter, transactionWriter, transactionLogs);
    }

    public StartRecording(): void {
        this.start = Date.now();
        this.timeOffset = Date.now() - this.start;
        const textEditorModel = this.codeComponent.codeEditor.getModel() as editor.ITextModel;
        this.codeComponent.UpdateCacheForCurrentFile();
        this.fileChangeListener = textEditorModel.onDidChangeContent((e: editor.IModelContentChangedEvent) => {
            this.OnFileModified(e);
        });

        this.nodeSelectedListener = this.fileTreeComponent.treeComponent.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnNodeSelected(e);
        });

        this.nodeCreatedListener = this.fileTreeComponent.treeComponent.nodeCreated.subscribe((e: NodeCreatedEvent) => {
            this.OnNodeCreated(e);
        });

        this.nodeRenameListener = this.fileTreeComponent.treeComponent.nodeRenamed.subscribe((e: NodeRenamedEvent) => {
            this.OnNodeRename(e);
        });

        this.nodeDeletedListener = this.fileTreeComponent.treeComponent.nodeRemoved.subscribe((e: NodeRemovedEvent) => {
            this.OnNodeDeleted(e);
        });

        this.nodeMovedListener = this.fileTreeComponent.treeComponent.nodeMoved.subscribe((e: NodeMovedEvent) => {
            this.OnNodeMoved(e);
        });
    }

    public StopRecording(): void {
        if (this.fileChangeListener) {
            this.fileChangeListener.dispose();
        }

        if (this.nodeSelectedListener) {
            this.nodeSelectedListener.unsubscribe();
        }

        if (this.nodeCreatedListener) {
            this.nodeCreatedListener.unsubscribe();
        }

        if (this.nodeRenameListener) {
            this.nodeRenameListener.unsubscribe();
        }

        if (this.nodeDeletedListener) {
            this.nodeDeletedListener.unsubscribe();
        }
    }

    protected OnFileModified(e: editor.IModelContentChangedEvent): void {
        if (this.codeComponent.ignoreNextEvent) { // Handles expected edits that shouldnt be tracked
            console.log(`Ignoring edit ${JSON.stringify(e)}`);
            return;
        }
        console.log(`Change count: `, e.changes.length);
        for (const change of e.changes) {
            console.log(change);
            const previousData = change.rangeLength <= 0 ?
                undefined :
                this.codeComponent.GetCacheForCurrentFile().substring(change.rangeOffset, change.rangeOffset + change.rangeLength);
            console.log(`Previous File Data : ${previousData}`);
            this.timeOffset = Date.now() - this.start;
            const transaction = this.ModifyFile(this.timeOffset, this.codeComponent.currentFilePath, change.rangeOffset,
                change.rangeOffset + change.rangeLength, change.text, previousData);
            console.log(`File Modified: ${JSON.stringify(transaction.toObject())}`);
            console.log(change.rangeOffset);
            console.log(change.rangeLength);
            console.log(change.text);
        }
        this.codeComponent.UpdateCacheForCurrentFile();

        this.TriggerDelayedSave();
    }

    protected OnNodeSelected(e: NodeSelectedEvent): void {
        console.log(e);
        if (e.node.isBranch()) {
            return;
        }
        const oldFileName = this.codeComponent.currentFilePath;
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        this.codeComponent.currentFilePath = newFileName;
        this.timeOffset = Date.now() - this.start;
        this.SelectFile(this.timeOffset, oldFileName, newFileName);
        this.codeComponent.UpdateCacheForCurrentFile();

        this.TriggerDelayedSave();
    }

    protected OnNodeCreated(e: NodeCreatedEvent) {
        console.log(e);
        const oldFileName = this.codeComponent.currentFilePath;
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        this.timeOffset = Date.now() - this.start;
        this.CreateItem(this.timeOffset, oldFileName, newFileName, e.node.isBranch());
        setTimeout(() => {
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        }, 1);

        this.TriggerDelayedSave();
    }

    protected OnNodeRename(e: NodeRenamedEvent) {
        console.log(e);
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        const newFileNameSplit = newFileName.split('/');
        const parentPath = newFileNameSplit.slice(0, newFileNameSplit.length - 1).join('/');
        const oldFileName = parentPath + '/' + e.oldValue;

        const oldFileData = this.codeComponent.GetCacheForFileName(oldFileName);
        this.codeComponent.currentFilePath = newFileName;
        this.timeOffset = Date.now() - this.start;
        this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, e.node.isBranch());
        this.codeComponent.ClearCacheForFile(oldFileName);
        this.codeComponent.currentFilePath = '';
        this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
        this.codeComponent.currentFilePath = newFileName;
        // TODO handle children if a folder

        this.TriggerDelayedSave();
    }

    protected OnNodeDeleted(e: NodeRemovedEvent) {
        console.log(e);

        // TODO handle children if a folder (Delete children first)

        const nodePath = this.fileTreeComponent.getPathForNode(e.node);
        this.timeOffset = Date.now() - this.start;
        this.DeleteFile(this.timeOffset, nodePath, this.codeComponent.GetCacheForFileName(nodePath), e.node.isBranch());

        // TODO select nothing for code editor

        this.TriggerDelayedSave();
    }

    protected OnNodeMoved(e: NodeMovedEvent) {
        console.log(e);
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);
        const oldParentPath = this.fileTreeComponent.getPathForNode(e.previousParent);
        const oldFileName = oldParentPath + '/' + e.node.value;

        const oldFileData = this.codeComponent.GetCacheForFileName(oldFileName);
        this.codeComponent.currentFilePath = newFileName;
        this.timeOffset = Date.now() - this.start;
        this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, e.node.isBranch());
        this.codeComponent.ClearCacheForFile(oldFileName);
        this.codeComponent.currentFilePath = '';
        this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
        this.codeComponent.currentFilePath = newFileName;
        // TODO handle children if a folder

        this.TriggerDelayedSave();
    }

    private TriggerDelayedSave(): void {
        // Try to delay saves by partition size to increase odds we save this partition
        setTimeout(() => {
            this.timeOffset = Date.now() - this.start;
            this.GetTransactionLogByTimeOffset(this.timeOffset); // call this trigger new partition before save maybe
            this.SaveTransactionLogs().then();
        }, this.project.getPartitionSize());
    }
}
