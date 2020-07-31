import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { ITransactionWriter } from 'shared/Tracer/lib/ts/ITransactionWriter';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { IProjectWriter } from 'shared/Tracer/lib/ts/IProjectWriter';
import { NodeSelectedEvent, NodeCreatedEvent, NodeRenamedEvent, NodeRemovedEvent, NodeMovedEvent, Tree } from 'shared/Ng2-Tree';
import { Subscription } from 'rxjs';
import { MonacoEditorComponent } from '../../editors/editor/monaco-editor.component';
import { NG2FileTreeComponent, ResourceType, FileUploadData, TutorBitsTreeModel } from '../../file-tree/ng2-file-tree.component';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ResourceViewerComponent, ResourceData } from '../../resource-viewer/resource-viewer.component';
import { environment } from 'src/environments/environment';
import { PreviewComponent } from '../../preview/preview.component';

export interface MonacoRecorderSettings {
    overrideSaveSpeed?: number;
    saveUnfinishedPartitions?: boolean;
}

export class MonacoRecorder extends TransactionRecorder {

    private fileChangeListener: monaco.IDisposable = null;
    private scrollChangeListener: monaco.IDisposable = null;

    private nodeSelectedListener: Subscription = null;
    private nodeCreatedListener: Subscription = null;
    private nodeRenameListener: Subscription = null;
    private nodeDeletedListener: Subscription = null;
    private nodeMovedListener: Subscription = null;
    private fileUploadedListener: Subscription = null;
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

    public get position(): number {
        return this.timeOffset;
    }

    constructor(
        protected codeComponent: MonacoEditorComponent,
        protected fileTreeComponent: NG2FileTreeComponent,
        protected resourceViewerComponent: ResourceViewerComponent,
        protected previewComponent: PreviewComponent,
        protected logging: ILogService,
        protected errorServer: IErrorService,
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

        this.nodeSelectedListener = this.fileTreeComponent.treeComponent.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnNodeSelected(e);
        });

        if (!this.settings) {
            this.settings = {} as MonacoRecorderSettings;
        }
    }

    public StartRecording(): void {
        this.logging.LogToConsole('MonacoRecorder', `Started Recording`);
        this.recording = true;
        this.start = Date.now() - this.project.getDuration();
        this.timeOffset = Date.now() - this.start;
        this.fileChangeListener = this.codeComponent.codeEditor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent) => {
            this.OnFileModified(e);
        });

        this.nodeCreatedListener = this.fileTreeComponent.treeComponent.nodeCreated.subscribe((e: NodeCreatedEvent) => {
            this.OnNodeCreated(e);
        });

        this.nodeRenameListener = this.fileTreeComponent.treeComponent.nodeRenamed.subscribe((e: NodeRenamedEvent) => {
            this.OnNodeRename(e);
        });

        this.nodeDeletedListener = this.fileTreeComponent.treeComponent.nodeRemoved.subscribe((e: NodeRemovedEvent) => {
            this.OnNodeDeleted(e);
        });

        this.nodeMovedListener = this.fileTreeComponent.treeComponent.nodeMoved.subscribe((e: NodeMovedEvent) => {
            this.OnNodeMoved(e);
        });

        this.fileUploadedListener = this.fileTreeComponent.fileUploaded.subscribe((e: FileUploadData) => {
            this.onFileUploaded(e);
        });

        if (this.trackNonFile) {
            this.mouseMoveCallbackWrapper = (e: MouseEvent) => {
                this.onMouseMoved(e);
            };
            window.addEventListener('mousemove', this.mouseMoveCallbackWrapper);

            this.scrollChangeListener = this.codeComponent.codeEditor.onDidScrollChange((e: monaco.IScrollEvent) => {
                this.onScrolled(e);
            });

            this.previewListener = this.fileTreeComponent.previewClicked.subscribe((file: string) => {
                this.onPreviewClicked(file);
            });

            this.previewCloseListener = this.previewComponent.closeClicked.subscribe((e: any) => {
                this.onPreviewCloseClicked();
            });
        }
    }

    public async StopRecording(): Promise<boolean> {
        this.logging.LogToConsole('MonacoRecorder', `Stopped Recording`);
        this.recording = false;
        if (this.fileChangeListener) {
            this.fileChangeListener.dispose();
        }

        if (this.nodeCreatedListener) {
            this.nodeCreatedListener.unsubscribe();
        }

        if (this.nodeRenameListener) {
            this.nodeRenameListener.unsubscribe();
        }

        if (this.nodeDeletedListener) {
            this.nodeDeletedListener.unsubscribe();
        }

        if (this.nodeMovedListener) {
            this.nodeMovedListener.unsubscribe();
        }

        if (this.fileUploadedListener) {
            this.fileUploadedListener.unsubscribe();
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
        this.logging.LogToConsole('MonacoRecorder', `OnFileModified ${JSON.stringify(e)}`);
        if (this.codeComponent.ignoreNextEvent) { // Handles expected edits that shouldnt be tracked
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified Ignoring ${e}`);
            return;
        }
        this.logging.LogToConsole('MonacoRecorder', `OnFileModified change count: ${e.changes.length}`);
        for (const change of e.changes) {
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified change count: ${change}`);
            const previousCache = this.codeComponent.GetCacheForCurrentFile();
            const previousData = change.rangeLength <= 0 || !previousCache ?
                undefined :
                previousCache
                    .getValue()
                    .substring(change.rangeOffset, change.rangeOffset + change.rangeLength);
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified Previous File Data: ${previousData}`);
            this.timeOffset = Date.now() - this.start;
            const transaction = this.ModifyFile(this.timeOffset, this.codeComponent.currentFilePath, change.rangeOffset,
                change.rangeOffset + change.rangeLength, change.text, previousData);
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified File Modified: ${JSON.stringify(transaction.toObject())}`);
        }
        this.codeComponent.UpdateCacheForCurrentFile();

        this.TriggerDelayedSave();
    }

    protected OnNodeSelected(e: NodeSelectedEvent): void {
        this.logging.LogToConsole('MonacoRecorder', `OnNodeSelected ${JSON.stringify(e.node.node)}`);
        if (e.node.isBranch()) {
            return;
        }

        const oldFileName = this.codeComponent.currentFilePath;
        const newFileName = this.fileTreeComponent.getPathForNode(e.node);

        this.logging.LogToConsole('MonacoRecorder', `OnNodeSelected from: ${oldFileName} to: ${newFileName}`);

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                this.codeComponent.currentFilePath = newFileName;
                this.codeComponent.UpdateCacheForCurrentFile();
                this.resourceViewerComponent.Resource = null;
                break;
            case ResourceType.asset:
                this.codeComponent.currentFilePath = '';
                this.codeComponent.UpdateCacheForCurrentFile();
                const model = e.node.node as TutorBitsTreeModel;
                this.resourceViewerComponent.Resource = {
                    projectId: model.overrideProjectId || this.id,
                    fileName: model.value,
                    resourceId: model.resourceId,
                    path: newFileName
                } as ResourceData;
                break;
        }

        if (this.recording) {
            this.timeOffset = Date.now() - this.start;
            this.SelectFile(this.timeOffset, oldFileName, newFileName);
            this.TriggerDelayedSave();
        }
    }

    protected OnNodeCreated(e: NodeCreatedEvent) {
        this.logging.LogToConsole('MonacoRecorder', `OnNodeCreated ${JSON.stringify(e.node.node)}`);
        const oldFileName = this.codeComponent.currentFilePath;
        const nodeName = e.node.value;
        const sanitizedNodeName = this.fileTreeComponent.SantizeFileName(nodeName);
        if (nodeName !== sanitizedNodeName) {
            try {
                this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(sanitizedNodeName);
            } catch (e) { }
        }
        let newFileName = this.fileTreeComponent.getPathForNode(e.node);

        const modifiedNewFileName = this.fileTreeComponent.AddModifiersToFilePath(newFileName, e.node);
        if (modifiedNewFileName !== nodeName) {
            e.node.value = modifiedNewFileName;
            try {
                this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(modifiedNewFileName);
            } catch (e) { }
            newFileName = this.fileTreeComponent.getPathForNode(e.node);
        }

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (!e.node.isBranch()) {
                    this.codeComponent.currentFilePath = newFileName;
                    this.codeComponent.codeEditor.focus();
                }
                break;
            case ResourceType.asset:
                return;
                break;
        }

        this.timeOffset = Date.now() - this.start;
        this.CreateItem(this.timeOffset, oldFileName, newFileName, e.node.isBranch());
        setTimeout(() => {
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        }, 1);
        this.TriggerDelayedSave();
    }

    protected OnNodeRename(e: NodeRenamedEvent) {
        this.logging.LogToConsole('MonacoRecorder', `OnNodeRename ${JSON.stringify(e.node.node)}`);

        const nodeName = e.node.value;
        const sanitizedNodeName = this.fileTreeComponent.SantizeFileName(nodeName);
        if (nodeName !== sanitizedNodeName) {
            try {
                this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(sanitizedNodeName);
            } catch (e) { }
        }
        const oldNodeName = e.oldValue as string;
        const sanitizedOldNodeName = this.fileTreeComponent.SantizeFileName(oldNodeName);
        if (sanitizedOldNodeName === sanitizedNodeName) {
            return;
        }
        let newFileName = this.fileTreeComponent.getPathForNode(e.node);
        const newFileNameSplit = newFileName.split('/');
        const oldParentPath = newFileNameSplit.slice(0, newFileNameSplit.length - 1).join('/');
        const oldFileName = oldParentPath + '/' + e.oldValue;

        const modifiedNewFileName = this.fileTreeComponent.AddModifiersToFilePath(newFileName, e.node);
        if (modifiedNewFileName !== nodeName) {
            e.node.value = modifiedNewFileName;
            try {
                this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(modifiedNewFileName);
            } catch (e) { }
            newFileName = this.fileTreeComponent.getPathForNode(e.node);
        }

        if (e.node.isBranch()) {
            for (const child of e.node.children) {
                this.OnNodeChildRenamed(child, oldFileName);
            }
        }

        let oldFileData: string = null;
        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (!e.node.isBranch()) {
                    oldFileData = this.codeComponent.GetCacheForFileName(oldFileName).getValue();
                    this.codeComponent.ClearCacheForFile(oldFileName);
                    this.codeComponent.currentFilePath = '';
                    this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                if (oldFileName === (this.resourceViewerComponent.Resource ? this.resourceViewerComponent.Resource.path : null)) {
                    this.resourceViewerComponent.Resource.path = newFileName;
                    this.resourceViewerComponent.Resource.fileName = sanitizedNodeName;
                    this.resourceViewerComponent.Resource = this.resourceViewerComponent.Resource;
                }
                break;
        }

        this.timeOffset = Date.now() - this.start;
        try {
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        } catch (e) { }
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, e.node.isBranch());

        this.TriggerDelayedSave();
    }

    protected OnNodeChildRenamed(node: Tree, oldParentName: string) {
        const newFileName = this.fileTreeComponent.getPathForNode(node);
        const oldFileName = oldParentName + '/' + node.value;

        if (node.isBranch()) {
            for (const child of node.children) {
                this.OnNodeChildRenamed(child, oldFileName);
            }
        }

        let oldFileData: string = null;

        switch (this.fileTreeComponent.GetNodeType(node)) {
            case ResourceType.code:
                if (!node.isBranch()) {
                    oldFileData = this.codeComponent.GetCacheForFileName(oldFileName).getValue();
                    this.codeComponent.ClearCacheForFile(oldFileName);
                    this.codeComponent.currentFilePath = '';
                    this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                if (oldFileName === (this.resourceViewerComponent.Resource ? this.resourceViewerComponent.Resource.path : null)) {
                    this.resourceViewerComponent.Resource.fileName = newFileName;
                }
                break;
        }

        this.timeOffset = Date.now() - this.start;
        try {
            this.fileTreeComponent.treeComponent.getControllerByNodeId(node.id).select();
        } catch (e) { }
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, node.isBranch());
        this.TriggerDelayedSave();
    }

    protected OnNodeDeleted(e: NodeRemovedEvent) {
        this.logging.LogToConsole('MonacoRecorder', `OnNodeDeleted ${JSON.stringify(e.node.node)}`);

        if (e.node.isBranch()) {
            for (const child of e.node.children) {
                this.OnNodeDeleted(new NodeRemovedEvent(child, 0));
            }
        }

        const nodePath = this.fileTreeComponent.getPathForNode(e.node);
        this.timeOffset = Date.now() - this.start;
        const oldCache = this.codeComponent.GetCacheForFileName(nodePath);
        const oldData = oldCache ? oldCache.getValue() : '';
        this.DeleteFile(this.timeOffset, nodePath, oldData, e.node.isBranch());

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (nodePath === this.codeComponent.currentFilePath) {
                    this.codeComponent.currentFilePath = '';
                }
                break;
            case ResourceType.asset:
                if (nodePath === (this.resourceViewerComponent.Resource ? this.resourceViewerComponent.Resource.path : null)) {
                    this.resourceViewerComponent.Resource = null;
                }
                break;
        }

        this.TriggerDelayedSave();
    }

    protected OnNodeMoved(e: NodeMovedEvent) {
        this.logging.LogToConsole('MonacoRecorder', `OnNodeMoved ${JSON.stringify(e.node.node)}`);
        const nodeName = e.node.value;
        let newFileName = this.fileTreeComponent.getPathForNode(e.node);
        const oldParentPath = this.fileTreeComponent.getPathForNode(e.previousParent);
        const oldFileName = oldParentPath + '/' + e.node.value;

        this.logging.LogToConsole('MonacoRecorder', `OnNodeMoved from: ${oldFileName} to: ${newFileName}`);

        const modifiedNewFileName = this.fileTreeComponent.AddModifiersToFilePath(newFileName, e.node);
        if (modifiedNewFileName !== nodeName) {
            e.node.value = modifiedNewFileName;
            newFileName = this.fileTreeComponent.getPathForNode(e.node);
        }

        if (e.node.isBranch()) {
            for (const child of e.node.children) {
                this.OnNodeChildRenamed(child, oldFileName);
            }
        }

        let oldFileData: string = null;

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (!e.node.isBranch()) {
                    const oldCache = this.codeComponent.GetCacheForFileName(oldFileName);
                    if (oldCache) {
                        oldFileData = oldCache.getValue();
                        this.codeComponent.ClearCacheForFile(oldFileName);
                        this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    }
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                break;
        }

        this.timeOffset = Date.now() - this.start;
        try {
            this.fileTreeComponent.selectNodeByPath(this.fileTreeComponent.treeComponent.tree, newFileName);
        } catch (e) {
            this.logging.LogErrorToConsole('MonacoRecorder', `on move select ${JSON.stringify(newFileName)}`);
        }
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, e.node.isBranch());
        this.TriggerDelayedSave();
    }

    public async onFileUploaded(e: FileUploadData) {
        this.logging.LogToConsole('MonacoRecorder', `onFileUploaded ${JSON.stringify(e.fileData)}`);

        try {
            const resourceId: string =
                await this.projectService.UploadResource(this.id, e.fileData.name, e.fileData.data, this.resourceAuth);
            if (!resourceId) {
                this.errorServer.HandleError(`UploadResourceError`, `resourceId is null`);
                return;
            }

            const targetBranchPath = this.fileTreeComponent.getPathForNode(e.target);
            const newFilePath = `${targetBranchPath}/${e.fileData.name}`;
            this.fileTreeComponent.addResourceNode(targetBranchPath, resourceId, e.fileData.name);
            this.timeOffset = Date.now() - this.start;
            this.UploadFile(this.timeOffset, this.fileTreeComponent.fileSelected, newFilePath, resourceId);
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
        this.ScrollFile(this.timeOffset, this.codeComponent.currentFilePath, this.lastScrollHeight,
            this.codeComponent.codeEditor.getScrollTop());
        this.TriggerDelayedSave();
        this.lastScrollHeight = this.codeComponent.codeEditor.getScrollTop();
    }

    public onPreviewClicked(file: string) {
        this.timeOffset = Date.now() - this.start;
        this.PreviewAction(this.timeOffset, file, this.codeComponent.currentFilePath);
        this.TriggerDelayedSave();
    }

    public onPreviewCloseClicked() {
        this.timeOffset = Date.now() - this.start;
        this.PreviewCloseAction(this.timeOffset, this.codeComponent.currentFilePath);
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