import { IPlayerService, PlayerState, PlayerSettings, PlayerEvents } from '../abstract/IPlayerService';
import { ILogService } from '../abstract/ILogService';
import { TraceProject, TraceTransactionLog, TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { ICodeService } from '../abstract/ICodeService';
import { IFileTreeService } from '../abstract/IFileTreeService';
import { IPreviewService } from '../abstract/IPreviewService';
import { ICurrentTracerProjectService } from '../abstract/ICurrentTracerProjectService';
import { IPlaybackMouseService, Position } from '../abstract/IPlaybackMouseService';
import { Injectable } from '@angular/core';

@Injectable()
export class TutorBitsPlayerService extends IPlayerService {

  private loadingChunk = false;
  // tslint:disable-next-line: variable-name
  private loadPosition_ = 0;
  // tslint:disable-next-line: variable-name
  private position_ = 0;
  private previousPosition = -1;
  // tslint:disable-next-line: variable-name
  private state_: PlayerState = PlayerState.Paused;
  // tslint:disable-next-line: variable-name
  private updateInterval_: any = null;
  // tslint:disable-next-line: variable-name
  private loadInterval_: any = null;
  private transactionLogs: TraceTransactionLog[] = [];
  private transactionLogIndex = 0;
  private settings: PlayerSettings;
  private caughtUpState = false;
  protected transactionLogCache: { [projectId: string]: { [partition: string]: TraceTransactionLog } } = {};

  protected log: (...args: any[]) => void;

  public get position(): number {
    return this.position_;
  }

  public set position(offset: number) {
    this.ThrowIfNotLoaded();
    this.position_ = offset;
    if (this.settings.customIncrementer) {
      this.UpdateLoop();
    }
  }

  public get positionPct(): number {
    this.ThrowIfNotLoaded();
    return this.position / this.project.getDuration();
  }

  public set positionPct(pct: number) {
    this.ThrowIfNotLoaded();
    if (pct > 1 || pct < 0) {
      throw new Error('Invalid pct');
    }

    this.position = this.project.getDuration() * pct;
  }

  public get logs(): any[] {
    this.ThrowIfNotLoaded();
    return this.transactionLogs;
  }

  public get loadPosition() {
    this.ThrowIfNotLoaded();
    return this.loadPosition_;
  }

  public get duration(): number {
    this.ThrowIfNotLoaded();

    return this.project.getDuration();
  }

  public get state(): PlayerState {
    return this.state_;
  }

  public get isBuffering(): boolean {
    return this.position_ >= this.loadPosition_ && this.duration > this.loadPosition_;
  }

  public get isCaughtUp(): boolean {
    return this.position_ === this.previousPosition;
  }

  public get projectId(): string {
    return this.currentProjectService.projectId;
  }

  public get project(): TraceProject {
    return this.currentProjectService.project;
  }

  constructor(
    protected logService: ILogService,
    protected codeService: ICodeService,
    protected fileTreeService: IFileTreeService,
    protected previewService: IPreviewService,
    protected currentProjectService: ICurrentTracerProjectService,
    protected playbackMouseService: IPlaybackMouseService) {
    super();

    this.log = this.logService.LogToConsole.bind(this.logService, 'PlayerService');
  }

  public async Load(settings?: PlayerSettings): Promise<void> {
    this.settings = settings || {
      speedMultiplier: 1,
      lookAheadSize: 1000 * 15,
      loadChunkSize: 1000 * 30,
      updateInterval: 10,
      loadInterval: 1000 * 1,
      customIncrementer: true
    } as PlayerSettings;

    if (this.settings.loadChunkSize <= this.settings.lookAheadSize) {
      throw new Error('loadChunkSize needs to be greater than lookAheadSize');
    }

    // console.log(`Project Loaded: ${JSON.stringify(this.project.toObject())}`);
    if (!this.settings.customIncrementer) {
      this.updateInterval_ = setInterval(() => this.UpdateLoop(), this.settings.updateInterval);
    }
    this.loadInterval_ = setInterval(() => this.LoadLoop(), this.settings.loadInterval);
    this.LoadLoop();
  }

  public ClearLoadedSession(): void {
    clearInterval(this.updateInterval_);
    clearInterval(this.loadInterval_);
    this.transactionLogCache = {};
    this.transactionLogs = [];
    this.settings = null;
    this.transactionLogIndex = 0;
    this.previousPosition = -1;
    this.caughtUpState = false;
    this.loadPosition_ = 0;
  }

  public Play(): void {
    this.ThrowIfNotLoaded();
    this.emit(PlayerEvents[PlayerEvents.play]);
    this.state_ = PlayerState.Playing;
  }

  public Pause(): void {
    this.ThrowIfNotLoaded();

    this.emit(PlayerEvents[PlayerEvents.pause]);
    this.state_ = PlayerState.Paused;
    this.position_ = this.previousPosition; // Snap to where we actually are
  }

  public GetLoadedTransactionLogs(): TraceTransactionLog[] {
    return this.transactionLogs;
  }

  protected ThrowIfNotLoaded(): void {
    if (this.project == null) {
      throw new Error('project not loaded');
    }
  }

  protected onLoadStart(): void {
    this.emit(PlayerEvents[PlayerEvents.loadStart], { playPosition: this.position, loadPosition: this.loadPosition });
  }

  protected onLoadComplete(): void {
    this.emit(PlayerEvents[PlayerEvents.loadComplete], { playPosition: this.position, loadPosition: this.loadPosition });
  }

  protected onCaughtUp(): void {
    this.emit(PlayerEvents[PlayerEvents.caughtUp], { playPosition: this.position, loadPosition: this.loadPosition });
  }

  protected LoadLoop(): void {
    if (this.loadingChunk || this.project == null) {
      return;
    }

    if (this.loadPosition_ > this.position_ + this.settings.lookAheadSize) {
      return;
    }

    if (this.loadPosition_ >= this.project.getDuration()) {
      return;
    }

    this.loadingChunk = true;

    const start = this.loadPosition_;
    const end = Math.max(start, Math.round(this.position)) + (this.settings.loadChunkSize);
    this.onLoadStart();
    this.GetTransactionLogs(start, end)
      .then((transactionLogs: TraceTransactionLog[]) => {
        this.transactionLogs = this.transactionLogs.concat(transactionLogs);
        this.transactionLogs = this.transactionLogs.filter((item, index, array) => {
          return !array.find((findItem, findIndex) => {
            return findItem.getPartition() === item.getPartition() && findIndex > index;
          });
        }).sort((a, b) => {
          return a.getPartition() > b.getPartition() ? 1 : -1;
        });
        this.loadPosition_ = end;
      }).finally(() => {
        this.loadingChunk = false;
        this.onLoadComplete();
      });
  }

  protected UpdateLoop(): void {
    if (this.previousPosition === this.position_ && this.state === PlayerState.Paused) {
      return;
    }

    if (this.isBuffering) {
      return;
    }

    if (!this.caughtUpState && this.isCaughtUp) {
      this.caughtUpState = true;
      this.onCaughtUp();
      return;
    }

    this.caughtUpState = false;

    // Handle rewind
    let lastTransactionOffset = 0;
    let lastActedTransactionOffset = this.previousPosition;
    if (this.position_ < this.previousPosition) {
      // console.log(`Starting rewind with previous position ${this.previousPosition}`);
      while (this.position_ < this.previousPosition && this.transactionLogIndex >= 0) {
        const currentTransactionLog = this.transactionLogs[this.transactionLogIndex--];
        if (currentTransactionLog == null) {
          continue;
        }
        for (const transaction of currentTransactionLog.getTransactionsList().slice().reverse()) {
          lastTransactionOffset = transaction.getTimeOffsetMs();
          if (lastTransactionOffset <= this.previousPosition && lastTransactionOffset > this.position_) {
            this.HandleTransaction(transaction, true);
            lastActedTransactionOffset = lastTransactionOffset;
          }
        }
        this.previousPosition = lastActedTransactionOffset - 1; // Subtract 1 to prevent duplicates
        // Rewind should play the last previous position before rewind but not during rewind
      }
      this.previousPosition = this.position_;
    }

    const currentTransaction = this.FindCurrentPlayTransaction();
    const passedLoader = this.position_ >= this.loadPosition_;
    if (!currentTransaction) {
      if (!passedLoader && this.position_ <= this.project.getDuration()) {
        this.position_ += this.settings.updateInterval;
      }
      return;
    }

    lastTransactionOffset = 0;
    lastActedTransactionOffset = 0;
    for (const transaction of currentTransaction.getTransactionsList()) {
      lastTransactionOffset = transaction.getTimeOffsetMs();
      // console.log(`Playing this.previousPosition ${this.previousPosition} and this.position_: ${this.position_}`);
      if (lastTransactionOffset > this.previousPosition && lastTransactionOffset <= this.position_) {
        this.HandleTransaction(transaction);
        lastActedTransactionOffset = lastTransactionOffset;
      }
    }
    if (this.previousPosition < lastActedTransactionOffset) {
      this.previousPosition = lastActedTransactionOffset;
    }

    if (!this.settings.customIncrementer) {
      this.position_ += this.settings.updateInterval;
    }
  }

  protected FindCurrentPlayTransaction(): TraceTransactionLog {
    if (this.transactionLogIndex < 0) {
      this.transactionLogIndex = 0;
    }

    const currentTransactionLog = this.transactionLogs[this.transactionLogIndex];
    if (!currentTransactionLog) {
      if (this.transactionLogs.length > 0 && this.transactionLogs[this.transactionLogIndex - 1].getPartition() >=
        (this.project.getDuration() / this.project.getPartitionSize())) {
        // this.Pause();
      }
      return null;
    }

    const transactionList = currentTransactionLog.getTransactionsList();
    if (transactionList.length === 0 || transactionList[transactionList.length - 1].getTimeOffsetMs() <= this.previousPosition) {
      ++this.transactionLogIndex;
      return this.FindCurrentPlayTransaction();
    }

    return currentTransactionLog;
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
                this.previewService.ShowPreview(this.projectId, transaction.getTimeOffsetMs(), customData.getData()).then();
              } else {
                this.previewService.HidePreview().then();
              }
              break;
            case 'previewFileclose':
              if (undo) {
                this.previewService.ShowPreview(this.projectId, transaction.getTimeOffsetMs(), customData.getData());
              } else {
                this.previewService.HidePreview();
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
          this.playbackMouseService.position = { x: mouseMoveData.getX(), y: mouseMoveData.getY() } as Position;
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
            this.log(`Undo Details: ${previousData} offset: ${offset} undoOffset: ${undoOffset} \
                      undoEndPos: ${undoEndPos} endPos: ${endPos} editorLength: ${editorModel.getFullModelRange()} \
                      endoffset: ${transaction.getModifyFile().getOffsetEnd()} startOffset: \
                      ${transaction.getModifyFile().getOffsetStart()}`);
          }
          this.log(`Edit: ${JSON.stringify(newEdit)} Undo: ${undo}`);
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
      this.logService.LogErrorToConsole('MonacoPlayer', e);
    }
  }

  public async LoadTraceTransactionLog(project: TraceProject, partition: string): Promise<TraceTransactionLog> {
    let projectCache = this.transactionLogCache[project.getId()];
    if (projectCache && projectCache[partition]) {
      return projectCache[partition];
    }

    const traceTransactionLog: TraceTransactionLog =
      await this.currentProjectService.GetTransactionLog(partition, this.settings.cacheBuster);
    // console.log(`Loaded Transaction Log: ${JSON.stringify(traceTransactionLog.toObject())}`);

    if (!projectCache) {
      projectCache = {};
      this.transactionLogCache[project.getId()] = projectCache;
    }
    projectCache[partition] = traceTransactionLog;

    return traceTransactionLog;
  }

  public async GetTransactionLog(
    partition: string): Promise<TraceTransactionLog> {
    const transactionLog = await this.LoadTraceTransactionLog(this.project, partition);
    if (transactionLog == null) { return; }
    this.transactionLogs.push(transactionLog);
    return transactionLog;
  }

  protected async GetTransactionLogs(
    startTime: number,
    endTime: number): Promise<TraceTransactionLog[]> {
    const transactionLogs: TraceTransactionLog[] = new Array<TraceTransactionLog>();
    const partitions = await this.currentProjectService.GetPartitionsForRange(startTime, endTime, this.settings.cacheBuster);

    const tasks = [];
    for (const partitionKey in partitions) {
      if (!partitions.hasOwnProperty(partitionKey)) {
        continue;
      }

      const partition = partitions[partitionKey];
      tasks.push(this.GetTransactionLog(partition));
    }
    await Promise.all(tasks);

    return transactionLogs;
  }
}
