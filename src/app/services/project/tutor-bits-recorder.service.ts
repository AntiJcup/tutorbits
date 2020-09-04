import { IRecorderService, RecorderSettings } from '../abstract/IRecorderService';
import { IFileTreeService, FileTreeEvents, ResourceType, PathType } from '../abstract/IFileTreeService';
import { IPreviewService, PreviewEvents } from '../abstract/IPreviewService';
import { ILogService } from '../abstract/ILogService';
import { IErrorService } from '../abstract/IErrorService';
import { ICodeService } from '../abstract/ICodeService';
import { IAuthService } from '../abstract/IAuthService';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { ICurrentTracerProjectService } from '../abstract/ICurrentTracerProjectService';
import { IResourceViewerService, ResourceData } from '../abstract/IResourceViewerService';
import { environment } from 'src/environments/environment';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { IProjectWriter } from 'shared/Tracer/lib/ts/IProjectWriter';
import { ITransactionWriter } from 'shared/Tracer/lib/ts/ITransactionWriter';
import { LocalProjectLoader, LocalProjectWriter, LocalTransactionWriter } from 'shared/Tracer/lib/ts/LocalTransaction';
// tslint:disable-next-line: max-line-length
import { TraceTransactionLog, TraceTransaction, CustomActionData, TraceProject, CreateItemData, DeleteItemData, ModifyFileData, SelectFileData, CursorChangeFileData, RenameItemData, UploadFileData, ScrollFileData, MouseMoveData } from 'shared/Tracer/models/ts/Tracer_pb';
import { PartitionFromOffsetBottom } from 'shared/Tracer/lib/ts/Common';
import { Injectable } from '@angular/core';

@Injectable()
export class TutorBitsRecorderService extends IRecorderService {
  private fileChangeListener: monaco.IDisposable = null;
  private scrollChangeListener: monaco.IDisposable = null;

  private mouseMoveCallbackWrapper: any = null;

  private timeOffset: number;
  private start: number;
  private internalRecording = false;

  private delayTimer: any;
  private lastMouseTrackOffset: number;
  private lastScrollTrackOffset: number;

  private lastScrollHeight: number;

  private settings: RecorderSettings;

  private internalTransactionLogs: TraceTransactionLog[] = [];

  protected changed = false;

  private lastPreviewPath: string;
  protected savedTransactionLogPartions: number[] = [];

  protected log: (...args: any[]) => void;
  protected previewShowCallback: (path: string) => void;
  protected previewHideCallback: () => void;

  public get recording(): boolean {
    return this.internalRecording;
  }

  public get position(): number {
    return this.timeOffset;
  }

  protected get cacheBuster(): string {
    return this.settings.cacheBuster;
  }

  protected get projectId(): string {
    return this.currentProjectService.projectId;
  }

  protected get project(): TraceProject {
    return this.currentProjectService.project;
  }

  protected get transactionLogs(): TraceTransactionLog[] {
    return this.internalTransactionLogs;
  }

  public get logs(): TraceTransactionLog[] {
    return this.transactionLogs;
  }

  public get hasChanged(): boolean {
    return this.changed;
  }

  constructor(
    protected fileTreeService: IFileTreeService,
    protected previewService: IPreviewService,
    protected logServer: ILogService,
    protected errorServer: IErrorService,
    protected codeService: ICodeService,
    protected authService: IAuthService,
    protected projectService: ITracerProjectService,
    protected currentProjectService: ICurrentTracerProjectService,
    protected resourceViewerService: IResourceViewerService) {
    super();

    this.log = this.logServer.LogToConsole.bind(this.logServer, 'RecorderService');
  }

  public async StartRecording(settings: RecorderSettings): Promise<void> {
    this.log(`Started Recording`);
    this.settings = settings;
    this.internalTransactionLogs = this.settings.startingTransactionLogs || [];

    this.internalRecording = true;
    this.start = Date.now() - this.currentProjectService.project.getDuration();
    this.timeOffset = Date.now() - this.start;

    this.fileChangeListener = this.codeService.editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent) => {
      this.OnFileModified(e);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.AddedNode], (path: string) => {
      this.OnNodeCreated(path);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.RenamedNode], (sourcePath: string, destinationPath: string) => {
      this.OnNodeRename(sourcePath, destinationPath);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.DeletedNode], (path: string, isFolder: boolean, type: ResourceType) => {
      this.OnNodeDeleted(path, isFolder, type);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.MovedNode], (sourcePath: string, destinationPath: string) => {
      this.OnNodeMoved(sourcePath, destinationPath);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.AddedResource], (path: string, resourceId: string, resourceName: string) => {
      this.onFileUploaded(path, resourceId, resourceName);
    });

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.SelectedNode], (path: string) => {
      this.OnNodeSelected(path);
    });

    if (settings.trackNonFileEvents) {
      this.mouseMoveCallbackWrapper = (e: MouseEvent) => {
        this.onMouseMoved(e);
      };
      window.addEventListener('mousemove', this.mouseMoveCallbackWrapper);

      this.scrollChangeListener = this.codeService.editor.onDidScrollChange((e: monaco.IScrollEvent) => {
        this.onScrolled(e);
      });

      this.previewShowCallback = (path: string) => {
        this.onPreviewClicked(path);
      };

      this.previewService.on(PreviewEvents[PreviewEvents.RequestShow], this.previewShowCallback);

      this.previewHideCallback = () => {
        this.onPreviewCloseClicked();
      };
      this.previewService.on(PreviewEvents[PreviewEvents.RequestHide], this.previewHideCallback);
    }
  }

  public async StopRecording(): Promise<boolean> {
    this.log(`Stopped Recording`);
    this.internalRecording = false;


    if (this.fileChangeListener) {
      this.fileChangeListener.dispose();
    }

    if (this.mouseMoveCallbackWrapper) {
      window.removeEventListener('mousemove', this.mouseMoveCallbackWrapper);
    }

    if (this.scrollChangeListener) {
      this.scrollChangeListener.dispose();
    }

    if (this.previewShowCallback) {
      this.previewService.removeListener(PreviewEvents[PreviewEvents.RequestShow], this.previewShowCallback);
    }

    if (this.previewHideCallback) {
      this.previewService.removeListener(PreviewEvents[PreviewEvents.RequestHide], this.previewHideCallback);
    }

    const res = await this.SaveTransactionLogs(true);
    this.internalTransactionLogs = [];
    this.settings = null;
    this.savedTransactionLogPartions = [];
    return res;
  }

  protected OnFileModified(e: monaco.editor.IModelContentChangedEvent): void {
    this.log(`OnFileModified ${JSON.stringify(e)}`);
    if (this.codeService.ignoreNextEvent) { // Handles expected edits that shouldnt be tracked
      this.log(`OnFileModified Ignoring ${e}`);
      return;
    }
    this.log(`OnFileModified change count: ${e.changes.length}`);
    for (const change of e.changes) {
      this.log(`OnFileModified change count: ${change}`);
      const previousCache = this.codeService.GetCacheForCurrentFile();
      const previousData = change.rangeLength <= 0 || !previousCache ?
        undefined :
        previousCache
          .getValue()
          .substring(change.rangeOffset, change.rangeOffset + change.rangeLength);
      this.log(`OnFileModified Previous File Data: ${previousData}`);
      this.timeOffset = Date.now() - this.start;
      const transaction = this.ModifyFile(this.timeOffset, this.codeService.currentFilePath, change.rangeOffset,
        change.rangeOffset + change.rangeLength, change.text, previousData);
      this.log(`OnFileModified File Modified: ${JSON.stringify(transaction.toObject())}`);
    }
    this.codeService.UpdateCacheForCurrentFile();

    this.TriggerDelayedSave();
  }

  public OnNodeSelected(path: string): void {
    this.log(`OnNodeSelected ${path}`);
    if (this.fileTreeService.GetPathTypeForPath(path) === PathType.folder) {
      return;
    }

    const oldPath = this.codeService.currentFilePath;
    const newPath = path;

    this.log(`OnNodeSelected from: ${oldPath} to: ${newPath}`);

    switch (this.fileTreeService.GetNodeTypeByPath(path)) {
      case ResourceType.code:
        this.codeService.currentFilePath = newPath;
        this.codeService.UpdateCacheForCurrentFile();
        this.resourceViewerService.resource = null;
        break;
      case ResourceType.asset:
        this.codeService.currentFilePath = '';
        this.codeService.UpdateCacheForCurrentFile();
        const model = this.fileTreeService.GetNodeForPath(path);
        this.resourceViewerService.resource = {
          projectId: model.overrideProjectId || this.projectId,
          fileName: model.value,
          resourceId: model.resourceId,
          path: newPath
        } as ResourceData;
        break;
    }

    if (this.recording) {
      this.timeOffset = Date.now() - this.start;
      this.SelectFile(this.timeOffset, oldPath, newPath);
      this.TriggerDelayedSave();
    }
  }

  public OnNodeCreated(path: string) {
    this.log(`OnNodeCreated ${path}`);
    const oldPath = this.codeService.currentFilePath;
    const newPath = path;

    const isFolder = this.fileTreeService.GetPathTypeForPath(newPath) === PathType.folder;
    switch (this.fileTreeService.GetNodeTypeByPath(newPath)) {
      case ResourceType.code:
        if (!isFolder) {
          this.codeService.currentFilePath = newPath;
          this.codeService.editor.focus();
        }
        break;
      case ResourceType.asset:
        return;
    }

    this.timeOffset = Date.now() - this.start;
    this.CreateItem(this.timeOffset, oldPath, newPath, isFolder);
    this.fileTreeService.selectedPath = newPath;
    this.TriggerDelayedSave();
  }

  public OnNodeRename(sourcePath: string, destinationPath: string) {
    this.log(`OnNodeRename ${sourcePath} to ${destinationPath}`);

    let oldFileData: string = null;
    const isFolder = this.fileTreeService.GetPathTypeForPath(destinationPath) === PathType.folder;
    switch (this.fileTreeService.GetNodeTypeByPath(destinationPath)) {
      case ResourceType.code:
        if (!isFolder) {
          oldFileData = this.codeService.GetCacheForFileName(sourcePath).getValue();
          this.codeService.ClearCacheForFile(sourcePath);
          this.codeService.currentFilePath = '';
          this.codeService.UpdateCacheForFile(destinationPath, oldFileData);
          this.codeService.currentFilePath = destinationPath;
        }
        break;
      case ResourceType.asset:
        if (sourcePath === (this.resourceViewerService.resource ? this.resourceViewerService.resource.path : null)) {
          this.resourceViewerService.resource.path = destinationPath;
          this.resourceViewerService.resource.fileName = destinationPath.split('/').pop();
          this.resourceViewerService.resource = this.resourceViewerService.resource;
        }
        break;
    }

    this.timeOffset = Date.now() - this.start;
    try {
      this.fileTreeService.selectedPath = destinationPath;
    } catch (e) { }
    this.RenameFile(this.timeOffset, sourcePath, destinationPath, oldFileData, isFolder);

    this.TriggerDelayedSave();
  }

  public OnNodeDeleted(path: string, isFolder: boolean, type: ResourceType) {
    this.log(`OnNodeDeleted ${path}`);

    this.timeOffset = Date.now() - this.start;
    const oldCache = this.codeService.GetCacheForFileName(path);
    const oldData = oldCache ? oldCache.getValue() : '';

    this.DeleteFile(this.timeOffset, path, oldData, isFolder);

    switch (type) {
      case ResourceType.code:
        if (path === this.codeService.currentFilePath) {
          this.codeService.currentFilePath = '';
        }
        break;
      case ResourceType.asset:
        if (path === (this.resourceViewerService.resource ? this.resourceViewerService.resource.path : null)) {
          this.resourceViewerService.resource = null;
        }
        break;
    }

    this.TriggerDelayedSave();
  }

  public OnNodeMoved(sourcePath: string, destinationPath: string) {
    this.log(`OnNodeMoved ${sourcePath} to ${destinationPath}`);

    let oldFileData: string = null;

    const isFolder = this.fileTreeService.GetPathTypeForPath(destinationPath) === PathType.folder;
    switch (this.fileTreeService.GetNodeTypeByPath(destinationPath)) {
      case ResourceType.code:
        if (!isFolder) {
          const oldCache = this.codeService.GetCacheForFileName(sourcePath);
          if (oldCache) {
            oldFileData = oldCache.getValue();
            this.codeService.ClearCacheForFile(sourcePath);
            this.codeService.UpdateCacheForFile(destinationPath, oldFileData);
          }
          this.codeService.currentFilePath = destinationPath;
        }
        break;
      case ResourceType.asset:
        break;
    }

    this.timeOffset = Date.now() - this.start;
    try {
      this.fileTreeService.selectedPath = destinationPath;
    } catch (e) {
      this.log(`on move select ${destinationPath}`);
    }
    this.RenameFile(this.timeOffset, sourcePath, destinationPath, oldFileData, isFolder);
    this.TriggerDelayedSave();
  }

  public async onFileUploaded(path: string, resourceId: string, resourceName: string) {
    this.log(`onFileUploaded ${path}`);

    try {
      const newFilePath = path;
      this.timeOffset = Date.now() - this.start;
      this.UploadFile(this.timeOffset, path, newFilePath, resourceId);
      this.TriggerDelayedSave();
    } catch (err) {
      this.errorServer.HandleError(`UploadResourceError`, `${err}`);
    }
  }

  public onMouseMoved(e: MouseEvent) {
    this.timeOffset = Date.now() - this.start;
    if (this.timeOffset - this.lastMouseTrackOffset < environment.mouseAccurracyMS) {
      return;
    }

    this.lastMouseTrackOffset = this.timeOffset;
    this.MouseMove(this.timeOffset, e.x, e.y);
    this.TriggerDelayedSave();
  }

  public onScrolled(e: monaco.IScrollEvent) {
    this.timeOffset = Date.now() - this.start;
    if (this.timeOffset - this.lastScrollTrackOffset < environment.scrollAccurracyMS) {
      return;
    }

    this.lastScrollTrackOffset = this.timeOffset;
    this.ScrollFile(this.timeOffset, this.codeService.currentFilePath, this.lastScrollHeight,
      this.codeService.editor.getScrollTop());
    this.TriggerDelayedSave();
    this.lastScrollHeight = this.codeService.editor.getScrollTop();
  }

  public onPreviewClicked(file: string) {
    this.timeOffset = Date.now() - this.start;
    this.PreviewAction(this.timeOffset, file, this.codeService.currentFilePath);
    this.TriggerDelayedSave();
  }

  public onPreviewCloseClicked() {
    this.timeOffset = Date.now() - this.start;
    this.PreviewCloseAction(this.timeOffset, this.codeService.currentFilePath);
    this.TriggerDelayedSave();
  }

  private TriggerDelayedSave(): void {
    // Try to delay saves by partition size to increase odds we save this partition
    if (this.delayTimer) {
      return;
    }
    this.delayTimer = setTimeout(async () => {
      this.delayTimer = null;
      if (!this.recording) {
        return;
      }

      await this.Save();
    }, !!this.settings.overrideSaveSpeed ? this.settings.overrideSaveSpeed : this.project.getPartitionSize());
  }

  public async Save() {
    this.timeOffset = Date.now() - this.start;
    this.GetTransactionLogByTimeOffset(this.timeOffset); // call this trigger new partition before save maybe
    await this.SaveTransactionLogs(!!this.settings.saveUnfinishedPartitions);
  }

  public async Initialize(): Promise<void> {
    const presavedTransactions = this.transactionLogs.sort((a, b) => {
      return a.getPartition() > b.getPartition() ? 1 : -1;
    }).map((transactionLog: TraceTransactionLog) => {
      return transactionLog.getPartition();
    });
    // console.log(`loaded transaction logs: ${presavedTransactions}`);
    presavedTransactions.pop();
    this.savedTransactionLogPartions = this.savedTransactionLogPartions.concat(presavedTransactions);
    // console.log(`presaved transaction logs: ${this.savedTransactionLogPartions}`);
  }

  public GetTransactionLogByTimeOffset(timeOffset: number): TraceTransactionLog {
    this.ThrowIfNotLoaded();
    let transactionLog: TraceTransactionLog = null;
    const partition = PartitionFromOffsetBottom(this.project, timeOffset);
    while (this.transactionLogs.length === 0 || partition !== (this.transactionLogs[this.transactionLogs.length - 1].getPartition())) {
      transactionLog = new TraceTransactionLog();
      transactionLog.setPartition(this.transactionLogs.length);
      if (transactionLog.getPartition() > partition) {
        break;
      }
      this.transactionLogs.push(transactionLog);
      // console.log(`Created transaction log ${JSON.stringify(transactionLog.toObject())}`);
    }

    if (transactionLog == null) {
      transactionLog = this.transactionLogs[partition];
    }

    return transactionLog;
  }

  protected AddTransaction(transaction: TraceTransaction): TraceTransaction {
    this.changed = true;
    this.ThrowIfNotLoaded();
    const transactionLog = this.GetTransactionLogByTimeOffset(transaction.getTimeOffsetMs());
    transactionLog.addTransactions(transaction);
    this.project.setDuration(this.project.getDuration() + transaction.getTimeOffsetMs());

    // console.log(`Adding transaction ${JSON.stringify(transaction.toObject())}`);
    return transaction;
  }

  public CreateItem(timeOffset: number, oldFilePath: string, newFilePath: string, isFolder: boolean): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.CREATEFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(oldFilePath);
    const data = new CreateItemData();
    data.setIsFolder(isFolder);
    data.setNewFilePath(newFilePath);
    transaction.setCreateFile(data);

    return this.AddTransaction(transaction);
  }

  public DeleteFile(timeOffset: number, filePath: string, previousData: string, isFolder: boolean): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.DELETEFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(filePath);
    const data = new DeleteItemData();
    data.setPreviousData(previousData);
    data.setIsFolder(isFolder);
    transaction.setDeleteFile(data);

    return this.AddTransaction(transaction);
  }

  public ModifyFile(
    timeOffset: number,
    filePath: string,
    offsetStart: number,
    offsetEnd: number,
    insertData: string,
    previousData?: string): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.MODIFYFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(filePath);
    const data = new ModifyFileData();
    data.setOffsetStart(offsetStart);
    data.setOffsetEnd(offsetEnd);
    data.setData(insertData);
    data.setPreviousData(previousData);
    transaction.setModifyFile(data);

    return this.AddTransaction(transaction);
  }

  public SelectFile(timeOffset: number, oldFilePath: string, newFilePath: string): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.SELECTFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(oldFilePath);
    const data = new SelectFileData();
    data.setNewFilePath(newFilePath);
    transaction.setSelectFile(data);

    return this.AddTransaction(transaction);
  }

  public CursorFocusChangeFile(timeOffset: number, filePath: string, offsetStart: number, offsetEnd: number): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.CURSORFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(filePath);
    const data = new CursorChangeFileData();
    data.setOffsetStart(offsetStart);
    data.setOffsetEnd(offsetEnd);
    transaction.setCursorFile(data);

    return this.AddTransaction(transaction);
  }

  public RenameFile(timeOffset: number, filePath: string, newFilePath: string, previousData: string, isFolder: boolean): TraceTransaction {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.RENAMEFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(filePath);
    const data = new RenameItemData();
    data.setNewFilePath(newFilePath);
    data.setPreviousData(previousData);
    data.setIsFolder(isFolder);
    transaction.setRenameFile(data);

    return this.AddTransaction(transaction);
  }

  public UploadFile(timeOffset: number, oldFilePath: string, newFilePath: string, resourceId: string) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.UPLOADFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(oldFilePath);
    const data = new UploadFileData();
    data.setNewFilePath(newFilePath);
    data.setResourceId(resourceId);
    transaction.setUploadFile(data);

    return this.AddTransaction(transaction);
  }

  public SelectText(timeOffset: number, file: string, offsetStart: number, offsetEnd: number) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.CURSORFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(file);
    const data = new CursorChangeFileData();
    data.setOffsetStart(offsetStart);
    data.setOffsetEnd(offsetEnd);
    transaction.setCursorFile(data);

    return this.AddTransaction(transaction);
  }

  public ScrollFile(timeOffset: number, file: string, scrollStart: number, scrollEnd: number) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.SCROLLFILE);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(file);
    const data = new ScrollFileData();
    data.setScrollStart(scrollStart);
    data.setScrollEnd(scrollEnd);
    transaction.setScrollFile(data);

    return this.AddTransaction(transaction);
  }

  public MouseMove(timeOffset: number, x: number, y: number) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.MOUSEMOVE);
    transaction.setTimeOffsetMs(timeOffset);
    const data = new MouseMoveData();
    data.setX(x);
    data.setY(y);
    transaction.setMouseMove(data);

    return this.AddTransaction(transaction);
  }

  public PreviewAction(timeOffset: number, previewFile: string, currentFile: string) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.CUSTOMACTION);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(currentFile);
    const data = new CustomActionData();
    data.setAction('previewFile');
    data.setData(previewFile);
    transaction.setCustomAction(data);

    this.lastPreviewPath = previewFile;

    return this.AddTransaction(transaction);
  }

  public PreviewCloseAction(timeOffset: number, currentFile: string) {
    const transaction = new TraceTransaction();
    transaction.setType(TraceTransaction.TraceTransactionType.CUSTOMACTION);
    transaction.setTimeOffsetMs(timeOffset);
    transaction.setFilePath(currentFile);
    const data = new CustomActionData();
    data.setAction('previewFileclose');
    data.setData(this.lastPreviewPath);
    transaction.setCustomAction(data);

    return this.AddTransaction(transaction);
  }

  protected GetSaveableTransactionLogs(force: boolean): TraceTransactionLog[] {
    if (this.transactionLogs.length <= 1 && !force) {
      return null;
    }
    const saveableTransactions = this.transactionLogs.slice(0, force ? this.transactionLogs.length : this.transactionLogs.length - 1);
    return saveableTransactions;
  }

  public async SaveTransactionLogs(force: boolean = false): Promise<boolean> {
    const transactions = this.GetSaveableTransactionLogs(force);
    if (transactions == null) {
      return;
    }
    const result = await this.WriteTransactionLogs(transactions, this.project.getId());
    return result;
  }

  public async WriteTransactionLogs(transactionLogs: TraceTransactionLog[], projectId: string): Promise<boolean> {
    let success = true;
    const savedParts: number[] = [];
    for (const transactionLog of transactionLogs) {
      if (this.savedTransactionLogPartions.indexOf(transactionLog.getPartition(), 0) !== -1) {
        console.log(`Not saving ${transactionLog.getPartition()}`);
        continue;
      }
      const saveResult = await this.SaveTransactionLog(transactionLog, projectId);
      if (saveResult) {
        savedParts.push(transactionLog.getPartition());
      }

      success = success && saveResult;
    }

    const lastTransactionList = transactionLogs[transactionLogs.length - 1].getTransactionsList();
    let lastFinishedPartition = 0;
    if (lastTransactionList.length <= 0) {
      lastFinishedPartition = (transactionLogs[transactionLogs.length - 1].getPartition() / this.project.getPartitionSize()) - 1;
    } else {
      lastFinishedPartition = Math.floor(
        lastTransactionList[lastTransactionList.length - 1].getTimeOffsetMs() / this.project.getPartitionSize()) - 1;
    }

    for (const savedPart of savedParts) {
      if (savedPart > lastFinishedPartition || lastFinishedPartition === -1) {
        continue;
      }

      console.log(`Finished saving ${savedPart} lastFinishedPartition: ${lastFinishedPartition}`);
      this.savedTransactionLogPartions.push(savedPart);
    }

    return success;
  }

  public async SaveTransactionLog(transactionLog: TraceTransactionLog, projectId: string): Promise<boolean> {
    const buffer = transactionLog.serializeBinary();
    // console.log(`saving ${JSON.stringify(transactionLog.toObject())}`);
    return await this.currentProjectService.WriteTransactionLog(transactionLog, buffer);
  }

  protected GetWriterArgs(): any[] {
    return [this.project];
  }

  protected ThrowIfNotLoaded(): void {
    if (this.project == null) {
      throw new Error('project not loaded');
    }
  }

  public Reset(): void {
    this.savedTransactionLogPartions = [];
  }
}
