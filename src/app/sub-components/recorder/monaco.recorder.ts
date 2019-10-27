import { TraceTransaction, TraceProject, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable } from 'monaco-editor';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';

export class MonacoRecorder extends TransactionRecorder {
    private changeListener: IDisposable = null;
    private internalFileName = '_unassigned_';
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
