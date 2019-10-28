import { TransactionPlayer, TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor } from 'monaco-editor';
import { TransactionLoader } from 'shared/Tracer/lib/ts/TransactionLoader';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';

export class MonacoPlayer extends TransactionPlayer {
    constructor(
        protected codeEditor: editor.ICodeEditor,
        projectLoader: ProjectLoader,
        transactionLoader: TransactionLoader,
        projectId: string,
        settings?: TransactionPlayerSettings) {
        super(settings ?
            settings :
            {
                speedMultiplier: 1,
                lookAheadSize: 1000 * 5,
                loadChunkSize: 1000 * 10,
                updateInterval: 10,
                loadInterval: 1000 * 3
            } as TransactionPlayerSettings,
            projectLoader,
            transactionLoader,
            projectId);

        this.codeEditor.updateOptions(MonacoPlayer.readOnlyOptions);
    }

    private static editOptions: editor.IEditorOptions = {
        readOnly: false
    };
    private static readOnlyOptions: editor.IEditorOptions = {
        readOnly: true
    };

    protected HandleTransaction(transaction: TraceTransaction, undo?: boolean): void {
        const edits: editor.IIdentifiedSingleEditOperation[] = [];
        switch (transaction.getType()) {
            case TraceTransaction.TraceTransactionType.MODIFYFILE:
                console.log(transaction.toObject());

                const editorModel = this.codeEditor.getModel() as editor.ITextModel;
                const startPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetStart());
                const endPos = editorModel.getPositionAt(transaction.getModifyFile().getOffsetEnd());

                let newEdit: editor.IIdentifiedSingleEditOperation = null;
                if (!undo) {
                    newEdit = {
                        range: new monaco.Range(
                            startPos.lineNumber,
                            startPos.column,
                            endPos.lineNumber,
                            endPos.column),
                        text: transaction.getModifyFile().getData(),
                        forceMoveMarkers: true
                    };
                } else {
                    const previousData = transaction.getModifyFile().getPreviousData();
                    const offset = transaction.getModifyFile().getData().length;
                    const undoEndPos = previousData.length > 0 ? endPos : editorModel.getPositionAt(transaction.getModifyFile().getOffsetEnd() + offset);
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
                console.log(`Edit: ${JSON.stringify(newEdit)}`);
                edits.push(newEdit);
                break;
        }

        if (edits.length > 0) {
            this.codeEditor.updateOptions(MonacoPlayer.editOptions);
            if (this.codeEditor.hasTextFocus()) {
                (document.activeElement as HTMLElement).blur();
            }
            this.codeEditor.executeEdits('teacher', edits);
            this.codeEditor.updateOptions(MonacoPlayer.readOnlyOptions);
        }
    }

}