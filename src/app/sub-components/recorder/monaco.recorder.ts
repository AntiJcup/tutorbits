import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { editor, IDisposable, IScrollEvent } from 'monaco-editor';
import { TransactionRecorder } from 'shared/Tracer/lib/ts/TransactionRecorder';
import { TransactionWriter } from 'shared/Tracer/lib/ts/TransactionWriter';
import { ProjectLoader } from 'shared/Tracer/lib/ts/ProjectLoader';
import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';
import { NodeSelectedEvent, NodeCreatedEvent, NodeRenamedEvent, NodeRemovedEvent, NodeMovedEvent, Tree } from 'ng2-tree';
import { Subscription } from 'rxjs';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { NG2FileTreeComponent, ResourceType, FileUploadData, TutorBitsTreeModel } from '../file-tree/ng2-file-tree.component';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ResourceViewerComponent, ResourceData } from '../resource-viewer/resource-viewer.component';
import { environment } from 'src/environments/environment';
import { PreviewComponent } from '../preview/preview.component';

export class MonacoRecorder extends TransactionRecorder {

    private fileChangeListener: IDisposable = null;
    private scrollChangeListener: IDisposable = null;

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
        projectLoader: ProjectLoader,
        projectWriter: ProjectWriter,
        transactionWriter: TransactionWriter,
        protected projectService: ITracerProjectService,
        protected trackNonFile: boolean,
        transactionLogs?: TraceTransactionLog[]) {
        super(projectId, projectLoader, projectWriter, transactionWriter, transactionLogs);

        this.nodeSelectedListener = this.fileTreeComponent.treeComponent.nodeSelected.subscribe((e: NodeSelectedEvent) => {
            this.OnNodeSelected(e);
        });
    }

    public StartRecording(): void {
        this.logging.LogToConsole('MonacoRecorder', `Started Recording`);
        this.recording = true;
        this.start = Date.now();
        this.timeOffset = Date.now() - this.start;
        const textEditorModel = this.codeComponent.codeEditor.getModel() as editor.ITextModel;
        this.codeComponent.UpdateCacheForCurrentFile();
        this.fileChangeListener = textEditorModel.onDidChangeContent((e: editor.IModelContentChangedEvent) => {
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

            this.scrollChangeListener = this.codeComponent.codeEditor.onDidScrollChange((e: IScrollEvent) => {
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

    protected OnFileModified(e: editor.IModelContentChangedEvent): void {
        this.logging.LogToConsole('MonacoRecorder', `OnFileModified ${JSON.stringify(e)}`);
        if (this.codeComponent.ignoreNextEvent) { // Handles expected edits that shouldnt be tracked
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified Ignoring ${e}`);
            return;
        }
        this.logging.LogToConsole('MonacoRecorder', `OnFileModified change count: ${e.changes.length}`);
        for (const change of e.changes) {
            this.logging.LogToConsole('MonacoRecorder', `OnFileModified change count: ${change}`);
            const previousData = change.rangeLength <= 0 ?
                undefined :
                this.codeComponent.GetCacheForCurrentFile().substring(change.rangeOffset, change.rangeOffset + change.rangeLength);
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
                    resourceId: model.resourceId
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
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(sanitizedNodeName);
        }
        let newFileName = this.fileTreeComponent.getPathForNode(e.node);

        const modifiedNewFileName = this.fileTreeComponent.AddModifiersToFilePath(newFileName, e.node);
        if (modifiedNewFileName !== nodeName) {
            e.node.value = modifiedNewFileName;
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(modifiedNewFileName);
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
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(sanitizedNodeName);
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
            this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).rename(modifiedNewFileName);
            newFileName = this.fileTreeComponent.getPathForNode(e.node);
        }

        if (e.node.isBranch()) {
            for (const child of e.node.children) {
                this.OnNodeChildRenamed(child, oldFileName);
            }
        }

        let oldFileData = null;
        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (!e.node.isBranch()) {
                    oldFileData = this.codeComponent.GetCacheForFileName(oldFileName);
                    this.codeComponent.ClearCacheForFile(oldFileName);
                    this.codeComponent.currentFilePath = '';
                    this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                break;
        }

        this.timeOffset = Date.now() - this.start;
        this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
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

        let oldFileData = null;

        switch (this.fileTreeComponent.GetNodeType(node)) {
            case ResourceType.code:
                if (!node.isBranch()) {
                    oldFileData = this.codeComponent.GetCacheForFileName(oldFileName);
                    this.codeComponent.ClearCacheForFile(oldFileName);
                    this.codeComponent.currentFilePath = '';
                    this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                break;
        }

        this.timeOffset = Date.now() - this.start;
        this.fileTreeComponent.treeComponent.getControllerByNodeId(node.id).select();
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
        this.DeleteFile(this.timeOffset, nodePath, this.codeComponent.GetCacheForFileName(nodePath), e.node.isBranch());

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (nodePath === this.codeComponent.currentFilePath) {
                    this.codeComponent.currentFilePath = '';
                }
                break;
            case ResourceType.asset:
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

        let oldFileData = null;

        switch (this.fileTreeComponent.GetNodeType(e.node)) {
            case ResourceType.code:
                if (!e.node.isBranch()) {
                    oldFileData = this.codeComponent.GetCacheForFileName(oldFileName);
                    this.codeComponent.ClearCacheForFile(oldFileName);
                    this.codeComponent.currentFilePath = '';
                    this.codeComponent.UpdateCacheForFile(newFileName, oldFileData);
                    this.codeComponent.currentFilePath = newFileName;
                }
                break;
            case ResourceType.asset:
                break;
        }

        this.timeOffset = Date.now() - this.start;
        this.fileTreeComponent.treeComponent.getControllerByNodeId(e.node.id).select();
        this.RenameFile(this.timeOffset, oldFileName, newFileName, oldFileData, e.node.isBranch());
        this.TriggerDelayedSave();
    }

    public onFileUploaded(e: FileUploadData) {
        this.logging.LogToConsole('MonacoRecorder', `onFileUploaded ${JSON.stringify(e.fileData)}`);

        this.projectService.UploadResource(this.id, e.fileData.name, e.fileData.data, this.resourceAuth).then((resourceId: string) => {
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
        }).catch((err) => {
            this.errorServer.HandleError(`UploadResourceError`, `${err}`);
        });
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

    public onScrolled(e: IScrollEvent) {
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
        this.delayTimer = setTimeout(() => {
            this.delayTimer = null;
            if (!this.recording) {
                return;
            }
            this.timeOffset = Date.now() - this.start;
            this.GetTransactionLogByTimeOffset(this.timeOffset); // call this trigger new partition before save maybe
            this.SaveTransactionLogs().then();
        }, this.project.getPartitionSize());
    }
}
