import { TraceTransaction, TraceProject, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable } from 'monaco-editor';
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';

export class MonacoRecorder extends TransactionTracker {
    private changeListener: IDisposable = null;
    private internalFileName = '_unassigned_';
    constructor(
        protected codeEditor: editor.ICodeEditor,
        project: TraceProject,
        transactionWriter: TransactionWriter,
        transactionLogs?: TraceTransactionLog[],
        partitionOffset?: number) {
        super(project, transactionWriter, transactionLogs, partitionOffset);
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
        this.changeListener = textEditorModel.onDidChangeContent((e: editor.IModelContentChangedEvent) => {
            for (const change of e.changes) {
                console.log(change);

                timeOffset = Date.now() - start;
                this.ModifyFile(timeOffset, this.internalFileName, change.rangeOffset,
                    change.rangeOffset + change.rangeLength, change.text);
                console.log(timeOffset);
                console.log(change.rangeOffset);
                console.log(change.rangeLength);
                console.log(change.text);
            }

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
}
