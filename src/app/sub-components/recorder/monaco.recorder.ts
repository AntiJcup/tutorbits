import { TraceTransaction, TraceProject, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable } from 'monaco-editor';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';
import { TreeComponent, NodeSelectedEvent } from 'ng2-tree';
import { stringify } from 'querystring';
import { Subscription } from 'rxjs';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';

export class MonacoRecorder extends TransactionRecorder {
    private fileChangeListener: IDisposable = null;
    private fileSelectedListener: Subscription = null;
    private fileCache: { [fileName: string]: string } = {};
    private timeOffset: number;
    private start: number;
    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTree: TreeComponent,
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

        this.fileSelectedListener = this.fileTree.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnFileSelected(e);
        });
    }

    public StopRecording(): void {
        if (this.fileChangeListener) {
            this.fileChangeListener.dispose();
        }

        if (this.fileSelectedListener) {
            this.fileSelectedListener.unsubscribe();
        }
    }

    protected OnFileModified(e: editor.IModelContentChangedEvent): void {
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

        // Try to delay saves by partition size to increase odds we save this partition
        setTimeout(() => {
            this.timeOffset = Date.now() - this.start;
            this.GetTransactionLogByTimeOffset(this.timeOffset); // call this trigger new partition before save maybe
            this.SaveTransactionLogs().then();
        }, this.project.getPartitionSize());
    }

    protected OnFileSelected(e: NodeSelectedEvent): void {
        console.log(e);
        if (e.node.isBranch()) {
            return;
        }

        const oldFileName = this.codeComponent.currentFilePath;
        const newFileName = e.node.value;
        this.codeComponent.currentFilePath = newFileName;
        this.timeOffset = Date.now() - this.start;
        this.SelectFile(this.timeOffset, oldFileName, newFileName);
        this.codeComponent.UpdateCacheForCurrentFile();
    }
}
