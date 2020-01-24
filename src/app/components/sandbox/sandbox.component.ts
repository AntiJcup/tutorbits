import { Component, OnInit, ViewChild, NgZone, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { LocalTransactionWriter, LocalProjectWriter, LocalProjectLoader, LocalTransactionReader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { Guid } from 'guid-typescript';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { PropogateTreeOptions } from 'src/app/sub-components/file-tree/ng2-file-tree.component';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { Observable } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { TransactionLoader } from 'shared/Tracer/lib/ts/TransactionLoader';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit, ComponentCanDeactivate {
  public projectId: string = Guid.create().toString();

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;
  @ViewChild(PreviewComponent, { static: true }) previewComponent: PreviewComponent;

  codeRecorder: MonacoRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);
  loadProjectId: string;
  loadingProject = false;
  downloading = false;
  loading = true;

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private logServer: ILogService,
    private tracerProjectService: ITracerProjectService,
    private errorServer: IErrorService,
    private eventService: IEventService,
    private previewService: IPreviewService,
    private titleService: ITitleService) {
    this.loadProjectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
    this.titleService.SetTitle(`Sandbox`);
  }

  async onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    if (this.loadProjectId) {
      try {
        await this.Load();
        this.startEditing();
      } catch (err) {
        this.errorServer.HandleError('SandboxComponent', `${err}`);
      }
      this.loadingProject = false;
    } else {
      this.recordingTreeComponent.allowEdit(true);
      await this.startEditing();
    }
  }

  async startEditing() {
    try {
      this.recordingEditor.AllowEdits(true);
      this.recordingTreeComponent.allowEdit(true);

      this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');

      this.codeRecorder = new MonacoRecorder(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        this.previewComponent,
        this.logServer,
        this.errorServer,
        false, /* resourceAuth */
        this.projectId,
        new LocalProjectLoader(),
        new LocalProjectWriter(),
        new LocalTransactionWriter(),
        this.tracerProjectService,
        false /* ignore non file operations */);

      await this.codeRecorder.ResetProject(this.projectId);
      await this.codeRecorder.New();
      this.codeRecorder.StartRecording();
      this.logServer.LogToConsole('Sandbox', 'Ready to edit');
      this.zone.runTask(() => {
        this.loading = false;
      });
    } catch (e) {
      this.errorServer.HandleError('Sandbox', `${e}`);
    }
  }

  public onCloseClicked(e: any) {
    this.eventService.TriggerButtonClick('Preview', `PreviewClose - ${this.projectId}`);
    this.previewComponent.ClosePreview();
  }

  public async onPreviewClicked(e: string) {
    this.eventService.TriggerButtonClick('Sandbox', `Preview - ${this.projectId} - ${e}`);
    const previewPos = Math.round(this.codeRecorder.position);
    try {
      await this.previewComponent.GeneratePreview(this.projectId, previewPos, e, this.codeRecorder.logs, this.loadProjectId);
    } catch (err) {
      this.errorServer.HandleError('PreviewError', err);
    }
  }

  public async Load(): Promise<void> {
    this.loadingProject = true;
    const projectJson = await this.tracerProjectService.GetProjectJson(this.loadProjectId);
    if (!projectJson) {
      throw new Error('Project Json Load Failed');
    }

    this.zone.runTask(() => {
      this.recordingEditor.PropogateEditor(projectJson);
      this.recordingTreeComponent.PropogateTreeJson(projectJson, {
        overrideProjectId: this.loadProjectId
      } as PropogateTreeOptions);
    });
  }

  public async onDownloadClicked(e: any) {
    this.eventService.TriggerButtonClick('Preview', `Download - ${this.projectId}`);
    this.downloading = true;
    const previewPos = Math.round(this.codeRecorder.position);
    try {
      await this.previewService.DownloadPreview(this.projectId, previewPos, this.codeRecorder.logs, this.loadProjectId);
    } catch (err) {
      this.errorServer.HandleError(`DownloadError`, err);
    }
    this.downloading = false;
  }

  public async onSaveClicked(e: any) {
    this.eventService.TriggerButtonClick('Preview', `SaveProject - ${this.projectId}`);

    const transactionLoader = new TransactionLoader(new LocalTransactionReader());
    const currentPos = Math.round(this.codeRecorder.position);
    const projectLoader = new LocalProjectLoader();
    const project = await projectLoader.GetProject(this.projectId);
    transactionLoader.GetTransactionLogs(project, 0, currentPos);
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !(this.codeRecorder && this.codeRecorder.hasChanged);
  }
}
