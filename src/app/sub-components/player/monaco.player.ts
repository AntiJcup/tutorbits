import { TransactionPlayer, TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor } from 'monaco-editor';
import { TransactionLoader } from 'shared/Tracer/lib/ts/TransactionLoader';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { NG2FileTreeComponent } from '../file-tree/ng2-file-tree.component';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

export class MonacoPlayer extends TransactionPlayer {
    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
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

        this.codeComponent.codeEditor.updateOptions(MonacoPlayer.readOnlyOptions);
    }

    private static editOptions: editor.IEditorOptions = {
        readOnly: false
    };
    private static readOnlyOptions: editor.IEditorOptions = {
        readOnly: true
    };

    protected HandleTransaction(transaction: TraceTransaction, undo?: boolean): void {
        try {
            const edits: editor.IIdentifiedSingleEditOperation[] = [];
            console.log(transaction.toObject());
            switch (transaction.getType()) {
                case TraceTransaction.TraceTransactionType.CREATEFILE:
                    const createNewPath = transaction.getCreateFile().getNewFilePath();
                    const createOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.addNodeByPath(createNewPath, transaction.getCreateFile().getIsFolder());
                    } else {

                    }
                    break;
                case TraceTransaction.TraceTransactionType.SELECTFILE:
                    const selectNewPath = transaction.getSelectFile().getNewFilePath();
                    const selectOldPath = transaction.getFilePath();
                    if (!undo) {
                        this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, selectNewPath);
                        this.codeComponent.currentFilePath = selectNewPath;
                    } else {

                    }
                    break;
                case TraceTransaction.TraceTransactionType.MODIFYFILE:
                    const editorModel = this.codeComponent.codeEditor.getModel() as editor.ITextModel;
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
                    console.log(`Edit: ${JSON.stringify(newEdit)} Undo: ${undo}`);
                    edits.push(newEdit);
                    break;
            }

            if (edits.length > 0) {
                this.codeComponent.codeEditor.updateOptions(MonacoPlayer.editOptions);
                if (this.codeComponent.codeEditor.hasTextFocus()) {
                    (document.activeElement as HTMLElement).blur();
                }
                this.codeComponent.codeEditor.executeEdits('teacher', edits);
                this.codeComponent.codeEditor.updateOptions(MonacoPlayer.readOnlyOptions);
            }
        } catch (e) {
            console.error(e);
        }
    }

}