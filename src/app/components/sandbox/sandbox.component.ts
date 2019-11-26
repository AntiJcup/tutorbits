import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { OnlinePreviewGenerator } from 'shared/Tracer/lib/ts/OnlinePreviewGenerator';
import { LocalTransactionWriter, LocalProjectWriter, LocalProjectLoader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { Guid } from 'guid-typescript';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { FileUploadData } from 'src/app/sub-components/file-tree/ng2-file-tree.component';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit {
  public projectId: string = Guid.create().toString();

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;

  codeRecorder: MonacoRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);
  previewPath: string = null;
  previewBaseUrl: string = null;
  loadingPreview = false;
  loadProjectId: string;
  loadingProject = false;
  downloading = false;
  loading = true;

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private logServer: ILogService,
    private projectService: ITracerProjectService,
    private errorServer: IErrorService) {
    this.loadProjectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    if (this.loadProjectId) {
      this.Load().then(() => {
        this.startEditing();
      }).catch((err) => {
        this.errorServer.HandleError('SandboxComponent', `${err}`);
      }).finally(() => {
        this.loadingProject = false;
      });
    } else {
      this.recordingTreeComponent.allowEdit(true);
      this.startEditing();
    }
  }

  startEditing(): void {
    this.recordingEditor.AllowEdits(true);

    this.codeRecorder = new MonacoRecorder(
      this.recordingEditor,
      this.recordingTreeComponent,
      this.logServer,
      this.projectId,
      new LocalProjectLoader(),
      new LocalProjectWriter(),
      new LocalTransactionWriter());

    this.codeRecorder.DeleteProject(this.projectId).then(() => {
      this.codeRecorder.New().then(() => {
        this.codeRecorder.StartRecording();
        this.logServer.LogToConsole('SandboxComponent', 'Ready to edit');
        this.zone.runTask(() => {
          this.loading = false;
        });
      });
    });
  }

  public onCloseClicked(e: any) {
    this.previewPath = null;
    this.loadingPreview = false;
  }

  public onPreviewClicked(e: string) {
    this.loadingPreview = true;
    const previewGenerator = new OnlinePreviewGenerator(this.requestObj);
    const previewPos = Math.round(this.codeRecorder.position);
    previewGenerator.GeneratePreview(this.projectId, previewPos, this.codeRecorder.logs, this.loadProjectId).then((url) => {
      if (!url) {
        this.errorServer.HandleError(`PreviewError`, 'failed to be retrieved');
        return;
      }
      this.zone.runTask(() => {
        this.previewBaseUrl = url;
        this.previewPath = e;
      });
    }).catch((err) => {
      this.errorServer.HandleError(`PreviewError`, err);
    }).finally(() => {
      this.loadingPreview = false;
    });
  }

  public async Load(): Promise<void> {
    this.loadingProject = true;
    const projectJson = await this.projectService.GetProjectJson(this.loadProjectId);
    if (!projectJson) {
      throw new Error('Project Json Load Failed');
    }

    this.zone.runTask(() => {
      const paths = Object.keys(projectJson);
      this.recordingEditor.PropogateEditor(projectJson);
      this.recordingTreeComponent.PropogateTree(paths);
    });
  }

  public onDownloadClicked(e: any) {
    this.downloading = true;
    const previewGenerator = new OnlinePreviewGenerator(this.requestObj);
    const previewPos = Math.round(this.codeRecorder.position);
    previewGenerator.DownloadPreview(this.projectId, previewPos, this.codeRecorder.logs, this.loadProjectId).then()
      .catch((err) => {
        this.errorServer.HandleError(`DownloadError`, err);
      }).finally(() => {
        this.downloading = false;
      });
  }

  public onPublishToExampleClicked(e: any) {
    // this.router.navigate([`sandbox/${this.projectId}`]);
  }

  public onFileUploaded(e: FileUploadData) {
    this.logServer.LogToConsole('SandboxComponent', 'onFileUploaded');

    this.projectService.UploadResource(this.projectId, e.fileData.name, e.fileData.data).then((resourceId: string) => {
      if (!resourceId) {
        this.errorServer.HandleError(`UploadResourceError`, `resourceId is null`);
        return;
      }

      this.recordingTreeComponent.addResourceNode(this.recordingTreeComponent.getPathForNode(e.target), resourceId, e.fileData.name);
    }).catch((err) => {
      this.errorServer.HandleError(`UploadResourceError`, `${err}`);
    });
  }
}
