import { TraceTransaction, TraceProject, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable } from 'monaco-editor';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';

export class MonacoRecorder extends TransactionRecorder {
    private changeListener: IDisposable = null;
    private internalFileName = '_unassigned_';
    private fileCache: { [fileName: string]: string } = {};
    constructor(
        protected codeEditor: editor.ICodeEditor,
        projectId: string,
        projectLoader: ProjectLoader,
        projectWriter: ProjectWriter,
        transactionWriter: TransactionWriter,
        transactionLogs?: TraceTransactionLog[]) {
        super(projectId, projectLoader, projectWriter, transactionWriter, transactionLogs);
    }

    public get CurrentFileName(): string {
        return this.internalFileName;
    }

    public set CurrentFileName(name: string) {
        this.internalFileName = name;
    }

    public StartRecording(): void {
        const start = Date.now();
        let timeOffset = Date.now() - start;
        const textEditorModel = this.codeEditor.getModel() as editor.ITextModel;
        this.UpdateCacheForCurrentFile();
        this.changeListener = textEditorModel.onDidChangeContent((e: editor.IModelContentChangedEvent) => {
            console.log(`Change count: `, e.changes.length);
            for (const change of e.changes) {
                console.log(change);
                const previousData = change.rangeLength <= 0 ?
                    undefined :
                    this.GetCacheForCurrentFile().substring(change.rangeOffset, change.rangeOffset + change.rangeLength);
                console.log(`Previous: ${previousData}`);
                timeOffset = Date.now() - start;
                this.ModifyFile(timeOffset, this.internalFileName, change.rangeOffset,
                    change.rangeOffset + change.rangeLength, change.text, previousData);
                console.log(timeOffset);
                console.log(change.rangeOffset);
                console.log(change.rangeLength);
                console.log(change.text);
            }
            this.UpdateCacheForCurrentFile();

            // Try to delay saves by partition size to increase odds we save this partition
            setTimeout(() => {
                timeOffset = Date.now() - start;
                this.GetTransactionLogByTimeOffset(timeOffset); // call this trigger new partition before save maybe
                this.SaveTransactionLogs().then();
            }, this.project.getPartitionSize());
        });

    }

    public StopRecording(): void {
        if (this.changeListener) {
            this.changeListener.dispose();
        }
    }

    private UpdateCacheForCurrentFile(): void {
        const textModel = this.codeEditor.getModel() as editor.ITextModel;
        const clone = textModel.getValue();
        this.fileCache[this.internalFileName] = clone;
    }

    protected GetCacheForCurrentFile(): string {
        console.log(`CacheVersion: ${this.fileCache[this.internalFileName]}`);
        return this.fileCache[this.internalFileName];
    }
}
