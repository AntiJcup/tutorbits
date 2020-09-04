import { Component, OnInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaybackEditorComponent } from 'src/app/sub-components/playing/playback-editor/playback-editor.component';
import { PlaybackFileTreeComponent } from 'src/app/sub-components/playing/playback-file-tree/playback-file-tree.component';
import { ApiHttpRequestInfo } from 'shared/web/lib/ts/ApiHttpRequest';
import { VidPlayer } from 'src/app/sub-components/playing/player/vid.player';
import { TransactionPlayerState } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { Guid } from 'guid-typescript';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { Subscription } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PlaybackMouseComponent } from 'src/app/sub-components/playing/playback-mouse/playback-mouse.component';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { MatDialog } from '@angular/material/dialog';
import { WatchGuideComponent } from 'src/app/sub-components/watch-guide/watch-guide.component';
import { IDataService } from 'src/app/services/abstract/IDataService';
import { Meta } from '@angular/platform-browser';
import { TutorBitsTutorialCommentService } from 'src/app/services/tutorial/tutor-bits-tutorial-comment.service';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsTutorialRatingService } from 'src/app/services/tutorial/tutor-bits-tutorial-rating.service';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { CodeEvents } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService, FileTreeEvents } from 'src/app/services/abstract/IFileTreeService';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { IPlayerService, PlayerEvents, PlayerState } from 'src/app/services/abstract/IPlayerService';
import { EventSub } from 'shared/web/lib/ts/EasyEventEmitter';
import { ICurrentTracerProjectService } from 'src/app/services/abstract/ICurrentTracerProjectService';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})

export class WatchComponent implements OnInit, OnDestroy {
  public tutorialId: string;
  tutorial: ViewTutorial;
  public title: string;
  public started = false;
  codeInitialized = false;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  @ViewChild(PlaybackFileTreeComponent, { static: true }) playbackTreeComponent: PlaybackFileTreeComponent;
  @ViewChild(PlaybackEditorComponent, { static: true }) playbackEditor: PlaybackEditorComponent;
  @ViewChild('video', { static: true }) playbackVideo: ElementRef;

  videoPlayer: VidPlayer;

  paceKeeperInterval: any;
  paceKeperPosition = 0;
  paceKeeperCheckSpeedMS = 100;
  paceKeeperMaxDifferenceMS = 200;

  pausedVideo = false;
  lastVideoTime = 0;

  publishing = false;
  publishMode = false;

  downloading = false;

  loadingReferences = 0;

  loadingComments = false;
  comments: ViewComment[];
  showCommentSection = false;

  commentsBtnText = 'Comments';

  private onLoadStartSub: EventSub;
  private onLoadCompleteSub: EventSub;
  private selectFileSub: EventSub;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private tutorialService: TutorBitsTutorialService,
    private projectService: ITracerProjectService,
    private videoService: IVideoService,
    private errorServer: IErrorService,
    private logService: ILogService,
    private eventService: IEventService,
    private titleService: ITitleService,
    private codeService: ICodeService,
    private fileTreeService: IFileTreeService,
    private previewService: IPreviewService,
    private playerService: IPlayerService,
    private currentProjectService: ICurrentTracerProjectService,
    public dialog: MatDialog,
    private dataService: IDataService,
    private metaService: Meta,
    public commentService: TutorBitsTutorialCommentService, // Dont remove these components use them
    public ratingService: TutorBitsTutorialRatingService) {
    this.tutorialId = this.route.snapshot.paramMap.get('tutorialId');
    this.title = this.route.snapshot.paramMap.get('title');
    this.publishMode = this.route.snapshot.queryParamMap.get('publish') === 'true';

    if (this.title) {
      this.titleService.SetTitle(`${this.title} - TutorBits Tutorial`);
    }

    this.currentProjectService.ClearCurrentProject();
    this.currentProjectService.baseProjectId = null;
  }

  async ngOnInit() {
    this.selectFileSub = this.fileTreeService.sub(FileTreeEvents[FileTreeEvents.SelectedNode], async () => {
      this.eventService.TriggerButtonClick('Record', `PreviewClose - ${this.tutorialId}`);
      await this.previewService.HidePreview();
    });

    this.codeService.once(CodeEvents[CodeEvents.InitializedSession], () => { this.onCodeInitialized(); });

    if (!this.dataService.GetShownWatchHelp()) {
      this.dialog.open(WatchGuideComponent);
      this.dataService.SetShownWatchHelp(true);
    }

    try {
      const tutorial = await this.tutorialService.GetCached(this.tutorialId);
      this.titleService.SetTitle(`${tutorial.title} - ${tutorial.topic} Tutorial - TutorBits`);
      this.metaService.updateTag({ name: 'description', content: `TutotorBits Tutorial - ${tutorial.title}: ${tutorial.description}` },
        'name=\'description\'');
      this.tutorial = tutorial;

      if (this.codeInitialized) {
        this.onReady();
      }

      this.videoPlayer = new VidPlayer(
        this.videoService,
        this.playbackVideo.nativeElement,
        this.tutorial.videoId,
        this.publishMode ? Guid.create().toString() : 'play');
      try {
        await this.videoPlayer.Load();
      } catch (e) {
        this.errorServer.HandleError(`VideoError`, e);
      }
    } catch (e) {
      this.errorServer.HandleError(`Watch`, e);
    }
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
    clearInterval(this.paceKeeperInterval);

    if (this.selectFileSub) {
      this.selectFileSub.Dispose();
    }

    if (this.onLoadStartSub) {
      this.onLoadStartSub.Dispose();
    }

    if (this.onLoadCompleteSub) {
      this.onLoadCompleteSub.Dispose();
    }

    this.currentProjectService.ClearCurrentProject();
    this.currentProjectService.baseProjectId = null;
    this.playerService.ClearLoadedSession();
  }

  async onReady() {
    // If publish mode make sure not to cache!
    this.currentProjectService.LoadProject(true, this.tutorial.projectId, this.publishMode ? Guid.create().toString() : 'play');

    this.onLoadStartSub = this.playerService.sub(PlayerEvents[PlayerEvents.loadStart], (event) => {
      this.loadingReferences++;
    });

    this.onLoadStartSub = this.playerService.sub(PlayerEvents[PlayerEvents.loadComplete], (event) => {
      this.loadingReferences--;
    });

    try {
      await this.playerService.Load();
      this.playerService.Play();
      this.playbackVideo.nativeElement.volume = environment.defaultVideoVolume;
      this.paceKeeperInterval = setInterval(() => {
        this.paceKeeperLoop();
      }, this.paceKeeperCheckSpeedMS);
    } catch (e) {
      this.errorServer.HandleError(`CodeError`, e);
    }
  }

  // Starting point as monaco will call this when loaded
  async onCodeInitialized() {
    this.codeInitialized = true;
    if (this.tutorial) {
      await this.onReady();
    }
  }

  paceKeeperLoop() {
    const currentVideoTime = this.videoPlayer.player.currentTime * 1000;
    if (currentVideoTime === 0) {
      this.playerService.positionPct = 1;
      return;
    }

    if (!this.started) {
      this.started = true;
    }

    if (this.videoPlayer.IsBuffering() && !this.pausedVideo) {
      this.paceKeperPosition = this.playerService.position = currentVideoTime;
      return;
    }

    if (this.playerService.state === PlayerState.Paused || this.playerService.isBuffering) {
      if (!this.videoPlayer.player.paused) {
        this.videoPlayer.player.pause();
        this.pausedVideo = true;
      }
      return;
    }

    if (this.pausedVideo) {
      this.videoPlayer.player.play();
      this.pausedVideo = false;
    }

    if (Math.abs(currentVideoTime - this.lastVideoTime) > this.paceKeeperMaxDifferenceMS) {
      this.paceKeperPosition = currentVideoTime;
    } else {
      this.paceKeperPosition += this.paceKeeperCheckSpeedMS;
    }

    this.playerService.position = this.paceKeperPosition;
    this.lastVideoTime = currentVideoTime;
  }

  public onCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `CommentsClose - ${this.tutorialId}`);
    this.showCommentSection = false;
  }

  public async onPublishClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Publish - ${this.tutorialId}`);
    this.publishing = true;
    try {
      const res = await this.videoService.Publish(this.tutorial.videoId);
      if (!res) {
        this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
      } else {
        const projectStatusUpdateRes = await this.projectService.Publish(this.tutorial.projectId);
        if (!projectStatusUpdateRes) {
          this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
        }
        const publishRes = await this.tutorialService.Publish(this.tutorialId);
        if (!publishRes) {
          this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
        }
        this.zone.runTask(() => {
          this.publishMode = false;
          this.router.navigate([`watch/${this.tutorialId}`]);
        });
      }
    } catch (err) {
      this.errorServer.HandleError('FinishError', err);
    }

    this.publishing = false;
  }

  public onBackClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Back - ${this.tutorialId}`);
    if (!confirm('Are you sure you want to start over?')) {
      return;
    }

    this.router.navigate([`record/${this.tutorialId}`], { queryParams: { back: 'true' } });
  }

  public async onDownloadClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Download - ${this.tutorialId}`);
    this.downloading = true;
    try {
      const res = await this.currentProjectService.DownloadProject();
      if (!res) {
        this.errorServer.HandleError('DownloadProject', `Error downloading project`);
        return;
      }
    } catch (err) {
      this.errorServer.HandleError('DownloadProject', `${err}`);
    }
    this.downloading = false;
  }

  public onCopyToSandboxClicked(e: any, newWindow: boolean) {
    this.eventService.TriggerButtonClick('Watch', `Sandbox - ${this.tutorialId}`);
    if (newWindow) {
      window.open(`create/sandbox/${this.tutorial.projectId}`, 'Sandbox', 'height=720,width=1080');
    } else {
      window.open(`create/sandbox/${this.tutorial.projectId}`);
    }
  }

  public onShowHelp() {
    this.dialog.open(WatchGuideComponent);
  }

  public onCommentsClicked(e: any) {
    if (this.showCommentSection) {
      return;
    }
    this.eventService.TriggerButtonClick('Watch', `Comments - ${this.tutorialId}`);
    this.showCommentSection = true;
  }
}
