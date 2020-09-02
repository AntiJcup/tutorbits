import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { ITransactionWriter } from 'shared/Tracer/lib/ts/ITransactionWriter';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { IProjectWriter } from 'shared/Tracer/lib/ts/IProjectWriter';
import { Subscription } from 'rxjs';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ResourceViewerComponent, ResourceData } from '../../resource-viewer/resource-viewer.component';
import { environment } from 'src/environments/environment';
import { PreviewComponent } from '../../preview/preview.component';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService, FileTreeEvents, PathType, ResourceType } from 'src/app/services/abstract/IFileTreeService';

export interface MonacoRecorderSettings {
  overrideSaveSpeed?: number;
  saveUnfinishedPartitions?: boolean;
}

export class MonacoRecorder extends TransactionRecorder {

  private fileChangeListener: monaco.IDisposable = null;
  private scrollChangeListener: monaco.IDisposable = null;

  private previewListener: Subscription = null;
  private previewCloseListener: Subscription = null;

  private mouseMoveCallbackWrapper: any = null;

  private timeOffset: number;
  private start: number;
  private recording: boolean;

  private delayTimer: any;
  private lastMouseTrackOffset: number;
  private lastScrollTrackOffset: number;

  private lastScrollHeight: number;

  protected log: (...args: any[]) => void;

  public get position(): number {
    return this.timeOffset;
  }

  constructor(
    protected fileTreeService: IFileTreeService,
    protected resourceViewerComponent: ResourceViewerComponent,
    protected previewComponent: PreviewComponent,
    protected logServer: ILogService,
    protected errorServer: IErrorService,
    protected codeService: ICodeService,
    protected resourceAuth: boolean,
    projectId: string,
    projectLoader: IProjectReader,
    projectWriter: IProjectWriter,
    transactionWriter: ITransactionWriter,
    protected projectService: ITracerProjectService,
    protected trackNonFile: boolean,
    transactionLogs?: TraceTransactionLog[],
    cacheBuster?: string,
    private settings?: MonacoRecorderSettings) {
    super(projectId, projectLoader, projectWriter, transactionWriter, cacheBuster, transactionLogs);

    this.log = this.logServer.LogToConsole.bind(this.logServer, 'MonacoRecorder');

    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.SelectedNode], (path: string) => {
      this.OnNodeSelected(path);
    });

    if (!this.settings) {
      this.settings = {} as MonacoRecorderSettings;
    }
  }

  public StartRecording(): void {
    this.log(`Started Recording`);
    this.recording = true;
    this.start = Date.now() - this.project.getDuration();
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

    if (this.trackNonFile) {
      this.mouseMoveCallbackWrapper = (e: MouseEvent) => {
        this.onMouseMoved(e);
      };
      window.addEventListener('mousemove', this.mouseMoveCallbackWrapper);

      this.scrollChangeListener = this.codeService.editor.onDidScrollChange((e: monaco.IScrollEvent) => {
        this.onScrolled(e);
      });

      // this.previewListener = this.fileTreeComponent.previewClicked.subscribe((file: string) => {
      //   this.onPreviewClicked(file);
      // });

      this.previewCloseListener = this.previewComponent.closeClicked.subscribe((e: any) => {
        this.onPreviewCloseClicked();
      });
    }
  }

  public async StopRecording(): Promise<boolean> {
    this.log(`Stopped Recording`);
    this.recording = false;
    if (this.fileChangeListener) {
      this.fileChangeListener.dispose();
    }

    if (this.mouseMoveCallbackWrapper) {
      window.removeEventListener('mousemove', this.mouseMoveCallbackWrapper);
    }

    if (this.scrollChangeListener) {
      this.scrollChangeListener.dispose();
    }

    if (this.previewListener) {
      this.previewListener.unsubscribe();
    }

    if (this.previewCloseListener) {
      this.previewCloseListener.unsubscribe();
    }

    return await this.SaveTransactionLogs(true);
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

  protected OnNodeSelected(path: string): void {
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
        this.resourceViewerComponent.Resource = null;
        break;
      case ResourceType.asset:
        this.codeService.currentFilePath = '';
        this.codeService.UpdateCacheForCurrentFile();
        const model = this.fileTreeService.GetNodeForPath(path);
        this.resourceViewerComponent.Resource = {
          projectId: model.overrideProjectId || this.id,
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

  protected OnNodeCreated(path: string) {
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

  protected OnNodeRename(sourcePath: string, destinationPath: string) {
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
        if (sourcePath === (this.resourceViewerComponent.Resource ? this.resourceViewerComponent.Resource.path : null)) {
          this.resourceViewerComponent.Resource.path = destinationPath;
          this.resourceViewerComponent.Resource.fileName = destinationPath.split('/').pop();
          this.resourceViewerComponent.Resource = this.resourceViewerComponent.Resource;
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

  protected OnNodeDeleted(path: string, isFolder: boolean, type: ResourceType) {
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
        if (path === (this.resourceViewerComponent.Resource ? this.resourceViewerComponent.Resource.path : null)) {
          this.resourceViewerComponent.Resource = null;
        }
        break;
    }

    this.TriggerDelayedSave();
  }

  protected OnNodeMoved(sourcePath: string, destinationPath: string) {
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
}
