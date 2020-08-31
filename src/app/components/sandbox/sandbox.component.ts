import { Component, OnInit, ViewChild, NgZone, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MonacoRecorder, MonacoRecorderSettings } from 'src/app/sub-components/recording/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording/recording-file-tree/recording-file-tree.component';
import { LocalTransactionWriter, LocalProjectWriter, LocalProjectLoader, LocalTransactionReader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { Guid } from 'guid-typescript';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { PropogateTreeOptions } from 'src/app/sub-components/file-tree/ng2-file-tree.component';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { Observable, Subscription } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewProject } from 'src/app/models/project/view-project';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { MonacoPlayer } from 'src/app/sub-components/playing/player/monaco.player';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsExampleCommentService } from 'src/app/services/example/tutor-bits-example-comment.service';
import { TutorBitsExampleRatingService } from 'src/app/services/example/tutor-bits-example-rating.service';
import { Meta } from '@angular/platform-browser';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { CodeEvents, GoToDefinitionEvent } from 'src/app/services/abstract/ICodeService';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { IWorkspacePluginService } from 'src/app/services/abstract/IWorkspacePluginService';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit, ComponentCanDeactivate, OnDestroy {
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
  isLoggedIn = false;
  publishing = false;

  savedProject: ViewProject;

  exampleId: string;
  title: string;

  loadingComments = false;
  comments: ViewComment[];
  showCommentSection = false;

  selectFileSub: Subscription;

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private logServer: ILogService,
    private projectService: ITracerProjectService,
    private errorServer: IErrorService,
    private eventService: IEventService,
    private previewService: IPreviewService,
    private titleService: ITitleService,
    private authService: IAuthService,
    private codeService: ICodeService,
    private workspacePluginService: IWorkspacePluginService,
    private metaService: Meta,
    public commentService: TutorBitsExampleCommentService, // Dont remove these components use them
    public ratingService: TutorBitsExampleRatingService) {
    this.projectType = this.route.snapshot.paramMap.get('projectType');
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.loadProjectId = this.route.snapshot.paramMap.get('baseProjectId');

    this.exampleId = this.route.snapshot.paramMap.get('exampleId');
    this.title = this.route.snapshot.paramMap.get('title');

    this.isLoggedIn = this.authService.IsLoggedIn();

    if (this.title === null) {
      this.titleService.SetTitle(`Sandbox`);
    } else {
      this.titleService.SetTitle(this.title + ' - Example');
    }
  }

  ngOnInit(): void {
    this.metaService.updateTag({ name: 'description', content: `TutotorBits Sandbox` },
      'name=\'description\'');

    this.selectFileSub = this.recordingTreeComponent.treeComponent.nodeSelected.subscribe(() => {
      this.eventService.TriggerButtonClick('Preview', `PreviewClose - ${this.projectId}`);
      this.previewComponent.ClosePreview();
    });

    this.codeService.once(CodeEvents[CodeEvents.InitializedSession], () => { this.onCodeInitialized(); });
    this.codeService.on(CodeEvents[CodeEvents.GotoDefinition], (e) => {
      this.onGoToDefinition(e);
    });
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');

    if (this.selectFileSub) {
      this.selectFileSub.unsubscribe();
    }
  }

  // Starting point as monaco will call this when loaded
  async onCodeInitialized() {
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
      await this.workspacePluginService.setupNewWorkspace(this.projectType);
    }
  }

  onGoToDefinition(event: GoToDefinitionEvent) {
    this.logServer.LogToConsole(JSON.stringify(event));

    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, event.path);
    this.zone.runTask(() => {
      this.codeService.editor.focus();
      this.codeService.editor.setPosition(event.offset);
    });
  }

  async startEditing(loadedTransactionLogs: TraceTransactionLog[]) {
    try {
      this.codeService.AllowEdits(true);
      this.recordingTreeComponent.allowEdit(true);

      this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');

      this.codeRecorder = new MonacoRecorder(
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        this.previewComponent,
        this.logServer,
        this.errorServer,
        this.codeService,
        false, /* resourceAuth */
        this.projectId,
        this.isLoggedIn ? this.projectService : new LocalProjectLoader(), // Only save project updates if logged in
        this.isLoggedIn ? this.projectService : new LocalProjectWriter(), // Only save project updates if logged in
        this.isLoggedIn ? this.projectService : new LocalTransactionWriter(), // Only save project updates if logged in
        this.projectService,
        false, /* ignore non file operations */
        loadedTransactionLogs,
        Guid.create().toString(),
        {
          overrideSaveSpeed: 5000,
          saveUnfinishedPartitions: true
        } as MonacoRecorderSettings);

      // Load if logged in since it is already created on the server
      this.isLoggedIn ? await this.codeRecorder.Load() : await this.codeRecorder.New();
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
      this.codeService.PropogateEditor(projectJson);
      this.recordingTreeComponent.PropogateTreeJson(projectJson, {
        overrideProjectId: this.loadProjectId
      } as PropogateTreeOptions);
    });
  }

  public async LoadProject(): Promise<void> {
    this.loadingProject = true;

    const codePlayer = new MonacoPlayer(
      this.recordingTreeComponent,
      this.resourceViewerComponent,
      null, // mouse component
      this.previewComponent,
      this.logServer,
      this.codeService,
      this.isLoggedIn ? this.projectService : new LocalProjectLoader(), // Only save project updates if logged in
      this.isLoggedIn ? this.projectService : new LocalTransactionReader(), // Only save project updates if logged in
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

        codePlayer.SetPositionPct(1);
        if (codePlayer.isCaughtUp) {
          await this.startEditing(codePlayer.GetLoadedTransactionLogs());
          finishedLoadingSub.unsubscribe();
          startedLoadingSub.unsubscribe();
        } else {
          const waitInterval = setInterval(() => {
            codePlayer.SetPositionPct(1);
          }, 1000);
          codePlayer.caughtUp.subscribe(async () => {
            await this.startEditing(codePlayer.GetLoadedTransactionLogs());
            finishedLoadingSub.unsubscribe();
            startedLoadingSub.unsubscribe();
            clearInterval(waitInterval);
          });
        }
      });

      codePlayer.Play();
      codePlayer.SetPositionPct(1);
    } catch (e) {
      this.errorServer.HandleError(`CodeError`, e);
    }

    codePlayer.Dispose();
    this.codeService.AllowEdits(true);

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

  public async onPublish(e: any) {
    this.eventService.TriggerButtonClick('Preview', `PublishProject - ${this.projectId}`);
    this.publishing = true;

    try {
      await this.codeRecorder.Save();
      this.router.navigate([`create/example/${this.projectId}`]);
    } catch (e) {
      this.errorServer.HandleError(`Sandbox`, e);
    }

    this.publishing = false;
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !(this.codeRecorder && this.codeRecorder.hasChanged);
  }

  public onCommentsClicked(e: any) {
    if (this.showCommentSection) {
      return;
    }
    this.eventService.TriggerButtonClick('Watch', `Comments - ${this.exampleId}`);
    this.showCommentSection = true;
  }

  public onCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `CommentsClose - ${this.exampleId}`);
    this.showCommentSection = false;
  }
}
