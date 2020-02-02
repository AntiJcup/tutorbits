import { Component, OnInit, ViewChild, NgZone, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MonacoRecorder, MonacoRecorderSettings } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';
import { LocalTransactionWriter, LocalProjectWriter, LocalProjectLoader, LocalTransactionReader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { Guid } from 'guid-typescript';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { PropogateTreeOptions } from 'src/app/sub-components/file-tree/ng2-file-tree.component';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { Observable } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { TransactionLoader } from 'shared/Tracer/lib/ts/TransactionLoader';
import { ViewProject } from 'src/app/models/project/view-project';
import { CreateProject } from 'src/app/models/project/create-project';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { MonacoPlayer } from 'src/app/sub-components/player/monaco.player';
import { TransactionPlayerSettings } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { TraceTransactionLogs, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit, ComponentCanDeactivate {
  public projectId: string;
  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;
  @ViewChild(PreviewComponent, { static: true }) previewComponent: PreviewComponent;

  codeRecorder: MonacoRecorder;

  loadProjectId: string;
  projectType: string;

  loadingProject = false;
  downloading = false;
  loading = true;

  savedProject: ViewProject;

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private logServer: ILogService,
    private projectService: ITracerProjectService,
    private errorServer: IErrorService,
    private eventService: IEventService,
    private previewService: IPreviewService,
    private titleService: ITitleService,
    private authService: IAuthService) {
    this.projectType = this.route.snapshot.paramMap.get('projectType');
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.loadProjectId = this.route.snapshot.paramMap.get('baseProjectId');
  }

  ngOnInit(): void {
    this.titleService.SetTitle(`Sandbox`);
  }

  async onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    if (!this.projectType || !this.projectService.ValidateProjectType(this.projectType)) {
      this.errorServer.HandleError('SandboxComponent', `invalid project type ${this.projectType}`);
      return;
    }

    if (this.loadProjectId) {
      try {
        await this.LoadBaseProject();
        await this.LoadProject();
      } catch (err) {
        this.errorServer.HandleError('SandboxComponent', `${err}`);
      }
      this.loadingProject = false;
    } else {
      this.recordingTreeComponent.allowEdit(true);
      await this.LoadProject();
    }
  }

  async startEditing(loadedTransactionLogs: TraceTransactionLog[]) {
    try {
      this.recordingEditor.AllowEdits(true);
      this.recordingTreeComponent.allowEdit(true);

      this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');

      const isLoggedIn = this.authService.IsLoggedIn();

      this.codeRecorder = new MonacoRecorder(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        this.previewComponent,
        this.logServer,
        this.errorServer,
        false, /* resourceAuth */
        this.projectId,
        isLoggedIn ? this.projectService : new LocalProjectLoader(), // Only save project updates if logged in
        isLoggedIn ? this.projectService : new LocalProjectWriter(), // Only save project updates if logged in
        isLoggedIn ? this.projectService : new LocalTransactionWriter(), // Only save project updates if logged in
        this.projectService,
        false, /* ignore non file operations */
        loadedTransactionLogs,
        null,
        {
          overrideSaveSpeed: 5000,
          saveUnfinishedPartitions: true
        } as MonacoRecorderSettings);

      //await this.codeRecorder.ResetProject(this.projectId);
      // Load if logged in since it is already created on the server
      isLoggedIn ? await this.codeRecorder.Load() : await this.codeRecorder.New();
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

  public async LoadBaseProject(): Promise<void> {
    this.loadingProject = true;
    const projectJson = await this.projectService.GetProjectJson(this.loadProjectId);
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

  public async LoadProject(): Promise<void> {
    this.loadingProject = true;
    const isLoggedIn = this.authService.IsLoggedIn();

    if (isLoggedIn) {
      const codePlayer = new MonacoPlayer(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        null, // mouse component
        this.previewComponent,
        this.logServer,
        this.projectService,
        this.projectService,
        this.projectId,
        null, // Use default settings
        Guid.create().toString());

      try {
        await codePlayer.Load();
        if (codePlayer.duration === 0) {
          await this.startEditing([]);
          return;
        }
        let loadingReferences = 0;
        const startedLoadingSub = codePlayer.loadStart.subscribe((event) => {
          loadingReferences++;
        });

        const finishedLoadingSub = codePlayer.loadComplete.subscribe(async () => {
          if (--loadingReferences > 0 || codePlayer.isBuffering) {
            return;
          }
          while (!codePlayer.isCaughtUp) {
            codePlayer.SetPostionPct(1);
          }
          await this.startEditing(codePlayer.GetLoadedTransactionLogs());
          finishedLoadingSub.unsubscribe();
          startedLoadingSub.unsubscribe();
        });

        codePlayer.Play();
        codePlayer.SetPostionPct(1);
      } catch (e) {
        this.errorServer.HandleError(`CodeError`, e);
      }

      codePlayer.Dispose();
      this.recordingEditor.AllowEdits(true);
    } else {
      await this.startEditing([]);
    }
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


    try {
      await this.codeRecorder.Save();
      const project = await projectLoader.GetProject(this.projectId);
      const transactionLogs = await transactionLoader.GetTransactionLogs(project, 0, currentPos);

      if (transactionLogs.length <= 0) {
        this.errorServer.HandleError(`SaveError`, 'Nothing to save');
        return;
      }

      if (this.savedProject == null) {
        const res = await this.projectService.Create({
          projectType: this.projectType
        } as CreateProject);
        if (res.error) {
          this.errorServer.HandleError(`SaveError`, res.error);
          return;
        }
        this.savedProject = res.data;
      }

      for (const log of transactionLogs) {
        const buffer = log.serializeBinary();
        const logRes = await this.projectService.WriteTransactionLog(log, buffer, this.savedProject.id);
        if (logRes) {
          this.errorServer.HandleError(`SaveError`, 'Failed saving project');
        }
      }
    } catch (e) {
      this.errorServer.HandleError(`SaveError`, e);
    }
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !(this.codeRecorder && this.codeRecorder.hasChanged);
  }
}
