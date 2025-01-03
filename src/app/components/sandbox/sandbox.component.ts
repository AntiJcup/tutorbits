import { Component, OnInit, ViewChild, NgZone, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordingEditorComponent } from 'src/app/sub-components/recording/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording/recording-file-tree/recording-file-tree.component';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { Observable, Subscription } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewProject } from 'src/app/models/project/view-project';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsExampleCommentService } from 'src/app/services/example/tutor-bits-example-comment.service';
import { TutorBitsExampleRatingService } from 'src/app/services/example/tutor-bits-example-rating.service';
import { Meta } from '@angular/platform-browser';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { CodeEvents } from 'src/app/services/abstract/ICodeService';
import { IWorkspacePluginService } from 'src/app/services/abstract/IWorkspacePluginService';
import { IFileTreeService, PropogateTreeOptions, FileTreeEvents } from 'src/app/services/abstract/IFileTreeService';
import { IRecorderService, RecorderSettings } from 'src/app/services/abstract/IRecorderService';
import { ICurrentTracerProjectService } from 'src/app/services/abstract/ICurrentTracerProjectService';
import { IPlayerService, PlayerEvents, PlayerSettings } from 'src/app/services/abstract/IPlayerService';
import { Guid } from 'guid-typescript';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit, ComponentCanDeactivate, OnDestroy {
  public projectId: string;
  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;

  loadBaseProjectId: string;
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
    private fileTreeService: IFileTreeService,
    private workspacePluginService: IWorkspacePluginService,
    private recorderService: IRecorderService,
    private currentProjectService: ICurrentTracerProjectService,
    private playerService: IPlayerService,
    private metaService: Meta,
    public commentService: TutorBitsExampleCommentService, // Dont remove these components use them
    public ratingService: TutorBitsExampleRatingService) {
    this.projectType = this.route.snapshot.paramMap.get('projectType');
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.currentProjectService.ClearCurrentProject();
    this.currentProjectService.baseProjectId = this.loadBaseProjectId = this.route.snapshot.paramMap.get('baseProjectId');

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

    this.codeService.once(CodeEvents[CodeEvents.InitializedSession], () => { this.onCodeInitialized(); });
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');

    if (this.selectFileSub) {
      this.selectFileSub.unsubscribe();
    }

    this.currentProjectService.baseProjectId = null;
    this.currentProjectService.ClearCurrentProject();
    this.playerService.ClearLoadedSession();
  }

  // Starting point as monaco will call this when loaded
  async onCodeInitialized() {
    if (!this.projectType || !this.projectService.ValidateProjectType(this.projectType)) {
      this.errorServer.HandleError('SandboxComponent', `invalid project type ${this.projectType}`);
      return;
    }

    if (this.loadBaseProjectId) {
      try {
        await this.LoadBaseProject();
        await this.LoadProject();
      } catch (err) {
        this.errorServer.HandleError('SandboxComponent', `${err}`);
      }
      this.loadingProject = false;
    } else {
      this.fileTreeService.editable = true;
      await this.LoadProject();
    }
  }

  async startEditing(loadedTransactionLogs: TraceTransactionLog[]) {
    try {
      this.codeService.AllowEdits(true);
      this.fileTreeService.editable = true;
      this.fileTreeService.selectedPath = '/project';

      // Starts recording using the current assigned project
      await this.recorderService.StartRecording({
        trackNonFileEvents: false,
        overrideSaveSpeed: 5000,
        saveUnfinishedPartitions: true,
        startingTransactionLogs: loadedTransactionLogs
      } as RecorderSettings);
      this.logServer.LogToConsole('Sandbox', 'Ready to edit');

      if (!this.loadBaseProjectId && loadedTransactionLogs.length === 0) {
        await this.workspacePluginService.setupNewWorkspace(this.projectType);
      }
      this.zone.runTask(() => {
        this.loading = false;
      });
    } catch (e) {
      this.errorServer.HandleError('Sandbox', `${e}`);
    }
  }

  public async LoadBaseProject(): Promise<void> {
    this.loadingProject = true;
    const projectJson = await this.projectService.GetProjectJson(this.loadBaseProjectId);
    if (!projectJson) {
      throw new Error('Project Json Load Failed');
    }

    this.zone.runTask(() => {
      this.codeService.PropogateEditor(projectJson);
      this.fileTreeService.PropogateTreeJson(projectJson, {
        overrideProjectId: this.loadBaseProjectId
      } as PropogateTreeOptions);
    });
  }

  public async LoadProject(): Promise<void> {
    this.loadingProject = true;

    const cacheBuster = this.isLoggedIn ? Guid.create().toString() : 'sandbox';
    this.isLoggedIn ?
      await this.currentProjectService.LoadProject(true /*Online*/, this.projectId, cacheBuster) :
      await this.currentProjectService.NewProject(false /*Offline since not logged in*/);

    try {
      await this.playerService.Load({
        cacheBuster,
        speedMultiplier: 1,
        lookAheadSize: 1000 * 15,
        loadChunkSize: 1000 * 30,
        updateInterval: 10,
        loadInterval: 1000 * 1,
        customIncrementer: true,
        onlyFileBasedPlaybacks: true
      } as PlayerSettings);
      if (this.playerService.duration === 0) {
        await this.startEditing([]);
        return;
      }

      let loadingReferences = 0;
      const loadStartSub = this.playerService.sub(PlayerEvents[PlayerEvents.loadStart], (event) => {
        loadingReferences++;
      });

      const loadCompleteSub = this.playerService.sub(PlayerEvents[PlayerEvents.loadComplete], async (event) => {
        if (--loadingReferences > 0 || this.playerService.isBuffering) {
          return;
        }

        this.playerService.positionPct = 1;
        if (this.playerService.isCaughtUp) {
          await this.startEditing(this.playerService.logs);
          loadStartSub.Dispose();
          loadCompleteSub.Dispose();
        } else {
          const waitInterval = setInterval(() => {
            this.playerService.positionPct = 1;
          }, 1000);

          this.playerService.on(PlayerEvents[PlayerEvents.caughtUp], async () => {
            await this.startEditing(this.playerService.logs);
            loadStartSub.Dispose();
            loadCompleteSub.Dispose();
            clearInterval(waitInterval);
          });
        }
      });

      this.playerService.Play();
      this.playerService.positionPct = 1;
    } catch (e) {
      this.errorServer.HandleError(`CodeError`, e);
    }

    this.codeService.AllowEdits(true);
  }

  public async onDownloadClicked(e: any) {
    this.eventService.TriggerButtonClick('Preview', `Download - ${this.projectId}`);
    this.downloading = true;
    const previewPos = Math.round(this.recorderService.position);
    try {
      await this.previewService.DownloadPreview(this.projectId, previewPos, this.recorderService.logs, this.loadBaseProjectId);
    } catch (err) {
      this.errorServer.HandleError(`DownloadError`, err);
    }
    this.downloading = false;
  }

  public async onPublish(e: any) {
    this.eventService.TriggerButtonClick('Preview', `PublishProject - ${this.projectId}`);
    this.publishing = true;

    try {
      await this.recorderService.Save();
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
    return !(this.recorderService && this.recorderService.hasChanged);
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
