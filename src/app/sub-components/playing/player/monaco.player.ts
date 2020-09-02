import { TransactionPlayer, TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { NG2FileTreeComponent } from '../../file-tree/ng2-file-tree.component';
import { NodeSelectedEvent } from 'shared/Ng2-Tree';
import { Subscription } from 'rxjs';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResourceViewerComponent, ResourceData } from '../../resource-viewer/resource-viewer.component';
import { EventEmitter } from '@angular/core';
import { PlaybackMouseComponent } from '../playback-mouse/playback-mouse.component';
import { PreviewComponent } from '../../preview/preview.component';
import { ITransactionReader } from 'shared/Tracer/lib/ts/ITransactionReader';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService, FileTreeEvents, ResourceType, TutorBitsTreeModel, PathType } from 'src/app/services/abstract/IFileTreeService';

export interface LoadStartEvent {
  playPosition: number;
  loadPosition: number;
}

export interface LoadCompleteEvent {
  playPosition: number;
  loadPosition: number;
}

// tslint:disable-next-line: no-empty-interface
export interface OnCaughtUpEvent {

}

export class MonacoPlayer extends TransactionPlayer {
  public loadStart: EventEmitter<LoadStartEvent> = new EventEmitter<LoadStartEvent>();
  public loadComplete: EventEmitter<LoadCompleteEvent> = new EventEmitter<LoadCompleteEvent>();
  public caughtUp: EventEmitter<OnCaughtUpEvent> = new EventEmitter<OnCaughtUpEvent>();

  protected log: (...args: any[]) => void;

  constructor(
    protected fileTreeService: IFileTreeService,
    protected resourceViewerComponent: ResourceViewerComponent,
    protected playbackMouseComponent: PlaybackMouseComponent,
    protected previewComponent: PreviewComponent,
    protected logServer: ILogService,
    protected codeService: ICodeService,
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

    this.log = this.logServer.LogToConsole.bind(this.logServer, 'MonacoPlayer');
    this.codeService.AllowEdits(false);

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.SelectedNode], (path: string) => {
      this.OnNodeSelected(path);
    });
  }

  public Dispose() {

  }

  protected OnNodeSelected(path: string): void {
    this.log(`OnNodeSelected: ${path}`);
    const isFolder = this.fileTreeService.GetPathTypeForPath(path) === PathType.folder;
    if (isFolder) {
      return;
    }

    switch (this.fileTreeService.GetNodeTypeByPath(path)) {
      case ResourceType.code:
        this.codeService.currentFilePath = path;
        this.resourceViewerComponent.Resource = null;
        break;
      case ResourceType.asset:
        this.codeService.currentFilePath = '';
        this.codeService.UpdateCacheForCurrentFile();
        const model = this.fileTreeService.GetNodeForPath(path);
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
      this.log(JSON.stringify(transaction.toObject()));
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
              this.log(`Unidentified action: ${customData.getAction()}`);
              break;
          }
          break;
        case TraceTransaction.TraceTransactionType.SCROLLFILE:
          const scrollData = transaction.getScrollFile();
          if (!undo) {
            this.codeService.editor.setScrollTop(scrollData.getScrollEnd());
          } else {
            this.codeService.editor.setScrollTop(scrollData.getScrollStart());
          }
          break;
        case TraceTransaction.TraceTransactionType.MOUSEMOVE:
          const mouseMoveData = transaction.getMouseMove();
          if (!this.playbackMouseComponent) { break; }
          this.playbackMouseComponent.Move(mouseMoveData.getX(), mouseMoveData.getY());
          break;
        case TraceTransaction.TraceTransactionType.UPLOADFILE:
          const uploadResourceId = transaction.getUploadFile().getResourceId();
          const uploadNewPath = transaction.getUploadFile().getNewFilePath();
          const uploadOldPath = transaction.getFilePath();
          if (!undo) {
            this.fileTreeService.AddResourceNode(uploadNewPath, uploadResourceId);
          } else {
            this.fileTreeService.DeleteNode(uploadNewPath, false);
            this.fileTreeService.selectedPath = uploadOldPath;
            if (uploadOldPath === '') { // Select node on empty path will always fail but we still need to unselect paths in the editor
              this.codeService.currentFilePath = '';
            }
          }
          break;
        case TraceTransaction.TraceTransactionType.CREATEFILE:
          const createNewPath = transaction.getCreateFile().getNewFilePath();
          const createOldPath = transaction.getFilePath();
          if (!undo) {
            this.fileTreeService.AddNode(createNewPath, transaction.getCreateFile().getIsFolder());
            this.fileTreeService.selectedPath = createNewPath;
            this.codeService.currentFilePath = createNewPath;
          } else {
            this.fileTreeService.DeleteNode(createNewPath, transaction.getCreateFile().getIsFolder());
            this.fileTreeService.selectedPath = createOldPath;
            this.codeService.currentFilePath = createOldPath;
          }
          break;
        case TraceTransaction.TraceTransactionType.SELECTFILE:
          const selectNewPath = transaction.getSelectFile().getNewFilePath();
          const selectOldPath = transaction.getFilePath();
          if (!undo) {
            this.fileTreeService.selectedPath = selectNewPath;
            this.codeService.currentFilePath = selectNewPath;
          } else {
            this.fileTreeService.selectedPath = selectOldPath;
            this.codeService.currentFilePath = selectOldPath;
          }
          break;
        case TraceTransaction.TraceTransactionType.DELETEFILE:
          const deletePreviousData = transaction.getDeleteFile().getPreviousData();
          const deletePath = transaction.getFilePath();
          const deleteIsFolder = transaction.getDeleteFile().getIsFolder();
          if (!undo) {
            this.fileTreeService.DeleteNode(deletePath, deleteIsFolder);
            this.codeService.currentFilePath = '';
            this.codeService.ClearCacheForFile(deletePath);
          } else {
            this.fileTreeService.AddNode(deletePath, deleteIsFolder);
            this.codeService.UpdateCacheForFile(deletePath, deletePreviousData);
            this.codeService.currentFilePath = deletePath;
          }
          break;
        case TraceTransaction.TraceTransactionType.RENAMEFILE:
          const renamePreviousData = transaction.getRenameFile().getPreviousData();
          const renameNewPath = transaction.getRenameFile().getNewFilePath();
          const renameOldPath = transaction.getFilePath();
          if (!undo) {
            this.fileTreeService.RenameNode(renameOldPath, renameNewPath, transaction.getRenameFile().getIsFolder());

            this.codeService.ClearCacheForFile(renameOldPath);
            this.codeService.UpdateCacheForFile(renameNewPath, renamePreviousData);
            this.fileTreeService.selectedPath = renameNewPath;
          } else {
            this.fileTreeService.RenameNode(renameNewPath, renameOldPath, transaction.getRenameFile().getIsFolder());

            this.codeService.ClearCacheForFile(renameNewPath);
            this.codeService.UpdateCacheForFile(renameOldPath, renamePreviousData);
            this.fileTreeService.selectedPath = renameOldPath;
          }
          break;
        case TraceTransaction.TraceTransactionType.MODIFYFILE:
          this.codeService.currentFilePath = transaction.getFilePath();
          const editorModel = this.codeService.editor.getModel() as monaco.editor.ITextModel;
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
        if (this.codeService.editor.hasTextFocus()) {
          (document.activeElement as HTMLElement).blur();
        }
        this.codeService.AllowEdits(true);
        this.codeService.editor.executeEdits('teacher', edits);
        this.codeService.AllowEdits(false);
        this.codeService.UpdateCacheForCurrentFile();
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

  protected onCaughtUp(): void {
    this.caughtUp.emit({});
  }
}
