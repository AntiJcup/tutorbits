import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './sub-components/material/material-module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { EditorModule } from './sub-components/editors/editor/editor.module';
import { VideoPlayerModule } from './sub-components/playing/video-player/video-player.module';
import { FileTreeModule } from './sub-components/file-tree/file-tree.module';
import { HttpClientModule } from '@angular/common/http';
import { WatchComponent } from './components/tutorials/watch/watch.component';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RecordComponent } from './components/tutorials/record/record.component';
import { PlaybackEditorComponent } from './sub-components/playing/playback-editor/playback-editor.component';
import { RecordingEditorComponent } from './sub-components/recording/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from './sub-components/recording/recording-file-tree/recording-file-tree.component';
import { PlaybackFileTreeComponent } from './sub-components/playing/playback-file-tree/playback-file-tree.component';
import { WebcamModule } from 'ngx-webcam';
import { RecordingWebCamComponent } from './sub-components/recording/recording-web-cam/recording-web-cam.component';
import { RecordingControlsComponent } from './sub-components/recording/recording-controls/recording-controls.component';
import { PreviewComponent } from './sub-components/preview/preview.component';
import { SandboxComponent } from './components/sandbox/sandbox.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { CreateTutorialComponent } from './components/tutorials/create-tutorial/create-tutorial.component';
import { SubmitButtonComponent } from './sub-components/buttons/submit-button/submit-button.component';
import { ViewTutorialsComponent } from './components/tutorials/view-tutorials/view-tutorials.component';
import { TutorialCardComponent } from './sub-components/tutorials/tutorial-card/tutorial-card.component';
import { SavingButtonComponent } from './sub-components/buttons/saving-button/saving-button.component';
import { EditorPlaceHolderComponent } from './sub-components/editors/editor-place-holder/editor-place-holder.component';
import { LoginComponent } from './components/login/login.component';
import { IRequestService } from './services/abstract/IRequestService';
import { TutorBitsRequestService } from './services/tutor-bits-request.service';
import { IAuthService } from './services/abstract/IAuthService';
import { TutorBitsAuthService } from './services/user/tutor-bits-auth.service';
import { ILogService } from './services/abstract/ILogService';
import { TutorBitsLoggingService } from './services/logging/tutor-bits-logging.service';
import { TutorBitsTutorialService, TutorBitsConcreteTutorialService } from './services/tutorial/tutor-bits-tutorial.service';
import { IStorageService } from './services/abstract/IStorageService';
import { TutorBitsStorageService } from './services/storage/tutor-bits-storage.service';
import { TutorBitsErrorService } from './services/logging/tutor-bits-error.service';
import { IErrorService } from './services/abstract/IErrorService';
import { TutorBitsCodeService } from './services/editor/tutor-bits-code.service';
import { ICodeService } from './services/abstract/ICodeService';
import { IFileTreeService } from './services/abstract/IFileTreeService';
import { TutorBitsFileTreeService } from './services/editor/tutor-bits-file-tree.service';
import { IPlaybackMouseService } from './services/abstract/IPlaybackMouseService';
import { TutorBitsPlaybackMouseService } from './services/mouse/tutor-bits-playback-mouse.service';
import { TutorBitsWorkspacePluginService } from './services/editor/tutor-bits-workspace-plugin.service';
import { IWorkspacePluginService } from './services/abstract/IWorkspacePluginService';
import { IDataService } from './services/abstract/IDataService';
import { TutorBitsDataService } from './services/storage/tutor-bits-persist.service';
import { LogoutComponent } from './components/logout/logout.component';
import { TutorBitsTracerProjectService } from './services/project/tutor-bits-tracer-project.service';
import { ITracerProjectService } from './services/abstract/ITracerProjectService';
import { TutorBitsCurrentTracerProjectService } from './services/project/tutor-bits-current-tracer-project.service';
import { ICurrentTracerProjectService } from './services/abstract/ICurrentTracerProjectService';
import { IVideoService } from './services/abstract/IVideoService';
import { TimerComponent } from './sub-components/timer/timer.component';
import { FormlyFieldFileComponent } from './sub-components/formly/formly-field-file/formly-field-file.component';
import { FileValueAccessorDirective } from './sub-components/formly/file-value-accessor.directive';
import { TutorBitsAuthGuardService } from './services/guards/tutor-bits-auth-guard.service';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { ResourceViewerComponent } from './sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from './services/abstract/IPreviewService';
import { TutorBitsPreviewService } from './services/preview/tutor-bits-preview.service';
import { MyTutorialsComponent } from './components/tutorials/my-tutorials/my-tutorials.component';
import { EditTutorialCardComponent } from './sub-components/tutorials/edit-tutorial-card/edit-tutorial-card.component';
import { MyAccountComponent } from './components/account/my-account/my-account.component';
import { IUserApiService } from './services/abstract/IUserApiService';
import { TutorBitsUserApiService } from './services/user/tutor-bits-user-api.service';
import { TutorBitsConcreteAccountService, TutorBitsAccountService } from './services/user/tutor-bits-account.service';
import { AccountUpdateUserNameComponent } from './components/account/account-update-user-name/account-update-user-name.component';
import { BlogCardComponent } from './sub-components/blog-card/blog-card.component';
import { ContactComponent } from './components/contact/contact.component';
import { TutorBitsPendingChangesGuardService } from './services/guards/tutor-bits-pending-changes-guard.service';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { TutorBitsMobileGuardService } from './services/guards/tutor-bits-mobile-guard.service';
import { MobileNotSupportedComponent } from './components/mobile-not-supported/mobile-not-supported.component';
import { IEventService } from './services/abstract/IEventService';
import { TutorBitsGAEventService } from './services/logging/tutor-bits-ga-event.service';
import { PlaybackMouseComponent } from './sub-components/playing/playback-mouse/playback-mouse.component';
import { ITitleService } from './services/abstract/ITitleService';
import { TutorBitsTitleService } from './services/tutor-bits-title.service';
import { IRecorderService } from './services/abstract/IRecorderService';
import { TutorBitsRecorderService } from './services/project/tutor-bits-recorder.service';
import { IPlayerService } from './services/abstract/IPlayerService';
import { TutorBitsPlayerService } from './services/project/tutor-bits-player.service';
import { IResourceViewerService } from './services/abstract/IResourceViewerService';
import { TutorBitsResourceViewerService } from './services/project/tutor-bits-resource-viewer.service';
import { WatchGuideComponent } from './sub-components/watch-guide/watch-guide.component';
import { PlayButtonHintComponent } from './sub-components/playing/play-button-hint/play-button-hint.component';
import { IEditorPluginService } from './services/abstract/IEditorPluginService';
import { TutorBitsEditorPluginService } from './services/editor/tutor-bits-editor-plugin.service';
import { TutorBitsTutorialCommentService, TutorBitsConcreteTutorialCommentService } from './services/tutorial/tutor-bits-tutorial-comment.service';
import { TutorBitsConcreteQuestionCommentService, TutorBitsQuestionCommentService } from './services/question/tutor-bits-question-comment.service';
import { TutorBitsAnswerService, TutorBitsConcreteAnswerService } from './services/question/tutor-bits-answer.service';
// tslint:disable-next-line: max-line-length
import { TutorBitsAnswerCommentService, TutorBitsConcreteAnswerCommentService } from './services/question/tutor-bits-answer-comment.service';
import { TutorBitsTutorialRatingService, TutorBitsConcreteTutorialRatingService } from './services/tutorial/tutor-bits-tutorial-rating.service';
import { TutorBitsTutorialCommentRatingService, TutorBitsConcreteTutorialCommentRatingService } from './services/tutorial/tutor-bits-tutorial-comment-rating.service';
import { TutorBitsQuestionRatingService, TutorBitsConcreteQuestionRatingService } from './services/question/tutor-bits-question-rating.service';
import { TutorBitsQuestionCommentRatingService, TutorBitsConcreteQuestionCommentRatingService } from './services/question/tutor-bits-question-comment-rating.service';
import { TutorBitsAnswerRatingService, TutorBitsConcreteAnswerRatingService } from './services/question/tutor-bits-answer-rating.service';
import { TutorBitsAnswerCommentRatingService, TutorBitsConcreteAnswerCommentRatingService } from './services/question/tutor-bits-answer-comment-rating.service';
import { CommentSectionComponent } from './sub-components/comments/comment-section/comment-section.component';
import { CommentComponent } from './sub-components/comments/comment/comment.component';
import { CreateCommentComponent } from './sub-components/comments/create-comment/create-comment.component';
import { CommentButtonComponent } from './sub-components/comments/comments-button/comments-button.component';
import { RatingComponent } from './sub-components/rating/rating.component';
import { TutorBitsConcreteThumbnailService, TutorBitsThumbnailService } from './services/thumbnail/tutor-bits-thumbnail.service';
import { TutorBitsVideoService } from './services/video/tutor-bits-video.service';
import { CreateSandboxComponent } from './components/create-sandbox/create-sandbox.component';
import { TutorBitsExampleService, TutorBitsConcreteExampleService } from './services/example/tutor-bits-example.service';
import { TutorBitsExampleCommentService, TutorBitsConcreteExampleCommentService } from './services/example/tutor-bits-example-comment.service';
import { TutorBitsExampleRatingService, TutorBitsConcreteExampleRatingService } from './services/example/tutor-bits-example-rating.service';
import { TutorBitsExampleCommentRatingService, TutorBitsConcreteExampleCommentRatingService } from './services/example/tutor-bits-example-comment-rating.service';
import { MyExamplesComponent } from './components/examples/my-examples/my-examples.component';
import { EditExampleCardComponent } from './sub-components/examples/edit-example-card/edit-example-card.component';
import { ViewExamplesComponent } from './components/examples/view-examples/view-examples.component';
import { ExampleCardComponent } from './sub-components/examples/example-card/example-card.component';
import { CreateExampleComponent } from './components/examples/create-example/create-example.component';
import { ViewQuestionComponent } from './components/questions/view-question/view-question.component';
import { TutorBitsQuestionService, TutorBitsConcreteQuestionService } from './services/question/tutor-bits-question.service';
import { ViewQuestionsComponent } from './components/questions/view-questions/view-questions.component';
import { MyQuestionsComponent } from './components/questions/my-questions/my-questions.component';
import { QuestionCardComponent } from './sub-components/questions/question-card/question-card.component';
import { EditQuestionCardComponent } from './sub-components/questions/edit-question-card/edit-question-card.component';
import { CreateQuestionComponent } from './components/questions/create-question/create-question.component';
import { AnswerComponent } from './sub-components/questions/answer/answer.component';
import { CreateAnswerComponent } from './sub-components/questions/create-answer/create-answer.component';
import { EditCommentComponent } from './sub-components/comments/edit-comment/edit-comment.component';
import { ICacheService } from './services/abstract/ICacheService';
import { TutorBitsCacheService } from './services/tutor-bits-cache.service';
import { EditAnswerComponent } from './sub-components/questions/edit-answer/edit-answer.component';
import { EditQuestionBodyComponent } from './sub-components/questions/edit-question-body/edit-question-body.component';

const appRoutes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Home' }
  },
  {
    path: 'mobilenotsupported',
    component: MobileNotSupportedComponent,
    data: { title: 'Sorry' }
  },
  {
    path: 'create/tutorial',
    component: CreateTutorialComponent,
    data: { title: 'Create Tutorial' },
    canActivate: [TutorBitsAuthGuardService, TutorBitsMobileGuardService]
  },
  {
    path: 'tutorials',
    component: ViewTutorialsComponent,
    data: { title: 'Tutorials' },
    canActivate: []
  },
  {
    path: 'mytutorials',
    component: MyTutorialsComponent,
    data: { title: 'My Tutorials' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: 'watch/:tutorialId',
    component: WatchComponent,
    data: { title: 'Watch' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'watch/:tutorialId/:title',
    component: WatchComponent,
    data: { title: 'Watch' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'record/:tutorialId',
    component: RecordComponent,
    data: { title: 'Record' },
    canActivate: [TutorBitsAuthGuardService, TutorBitsMobileGuardService],
    canDeactivate: [TutorBitsPendingChangesGuardService]
  },
  {
    path: 'create/question',
    component: CreateQuestionComponent,
    data: { title: 'Create Question' },
    canActivate: [TutorBitsAuthGuardService, TutorBitsMobileGuardService]
  },
  {
    path: 'question/:questionId',
    component: ViewQuestionComponent,
    data: { title: 'Question' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'question/:questionId/:questionTitle/:questionTopic',
    component: ViewQuestionComponent,
    data: { title: 'Question' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'questions',
    component: ViewQuestionsComponent,
    data: { title: 'Questions' },
    canActivate: []
  },
  {
    path: 'myquestions',
    component: MyQuestionsComponent,
    data: { title: 'My Questions' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: 'create/example/:projectId',
    component: CreateExampleComponent,
    data: { title: 'Create Example' },
    canActivate: [TutorBitsAuthGuardService, TutorBitsMobileGuardService]
  },
  {
    path: 'examples',
    component: ViewExamplesComponent,
    data: { title: 'Examples' },
    canActivate: []
  },
  {
    path: 'myexamples',
    component: MyExamplesComponent,
    data: { title: 'My Examples' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: 'create/sandbox',
    component: CreateSandboxComponent,
    data: { title: 'Create Sandbox' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'create/sandbox/:baseProjectId',
    component: CreateSandboxComponent,
    data: { title: 'Create Sandbox' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'create/sandbox/:baseProjectId/:exampleId/:title',
    component: CreateSandboxComponent,
    data: { title: 'Create Sandbox' },
    canActivate: [TutorBitsMobileGuardService]
  },
  {
    path: 'sandbox/:projectType/:projectId',
    component: SandboxComponent,
    data: { title: 'New Sandbox' },
    canActivate: [TutorBitsMobileGuardService],
    canDeactivate: [TutorBitsPendingChangesGuardService]
  },
  {
    path: 'sandbox/:projectType/:projectId/:baseProjectId',
    component: SandboxComponent,
    data: { title: 'Sandbox' },
    canActivate: [TutorBitsMobileGuardService],
    canDeactivate: [TutorBitsPendingChangesGuardService]
  },
  {
    path: 'sandbox/:projectType/:projectId/:baseProjectId/:exampleId/:title',
    component: SandboxComponent,
    data: { title: 'Sandbox' },
    canActivate: [TutorBitsMobileGuardService],
    canDeactivate: [TutorBitsPendingChangesGuardService]
  },
  {
    path: 'myaccount',
    component: MyAccountComponent,
    data: { title: 'My Account' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: 'updateaccountusername/:currentUserName/:accountId',
    component: AccountUpdateUserNameComponent,
    data: { title: 'Update Account User Name' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'LoggedIn' },
    canActivate: []
  },
  {
    path: 'logout',
    component: LogoutComponent,
    data: { title: 'LoggedOut' },
    canActivate: [TutorBitsAuthGuardService]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  {
    path: 'contact',
    component: ContactComponent,
    data: { title: 'Contact' },
  },
  { path: '**', component: HomeComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    WatchComponent,
    HomeComponent,
    RecordComponent,
    SandboxComponent,
    PlaybackEditorComponent,
    RecordingEditorComponent,
    RecordingFileTreeComponent,
    PlaybackFileTreeComponent,
    RecordingWebCamComponent,
    RecordingControlsComponent,
    PreviewComponent,
    CreateTutorialComponent,
    ViewTutorialsComponent,
    TutorialCardComponent,
    MyTutorialsComponent,
    EditTutorialCardComponent,
    SubmitButtonComponent,
    SavingButtonComponent,
    EditorPlaceHolderComponent,
    LoginComponent,
    LogoutComponent,
    TimerComponent,
    FormlyFieldFileComponent,
    FileValueAccessorDirective,
    PrivacyComponent,
    TermsComponent,
    ResourceViewerComponent,
    MyAccountComponent,
    AccountUpdateUserNameComponent,
    BlogCardComponent,
    ContactComponent,
    MobileNotSupportedComponent,
    PlaybackMouseComponent,
    WatchGuideComponent,
    PlayButtonHintComponent,
    CommentSectionComponent,
    CommentComponent,
    CreateCommentComponent,
    CommentButtonComponent,
    RatingComponent,
    CreateSandboxComponent,
    MyExamplesComponent,
    EditExampleCardComponent,
    ViewExamplesComponent,
    ExampleCardComponent,
    CreateExampleComponent,
    CreateQuestionComponent,
    ViewQuestionsComponent,
    MyQuestionsComponent,
    ViewQuestionComponent,
    QuestionCardComponent,
    EditQuestionCardComponent,
    AnswerComponent,
    CreateAnswerComponent,
    EditCommentComponent,
    EditAnswerComponent,
    EditQuestionBodyComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    EditorModule,
    VideoPlayerModule,
    FileTreeModule,
    HttpClientModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true }
    ),
    WebcamModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({
      types: [
        { name: 'file', component: FormlyFieldFileComponent, wrappers: ['form-field'] },
      ],
    }),
    FormlyMaterialModule,
    DeviceDetectorModule.forRoot()
  ],
  providers: [
    { provide: IRequestService, useClass: TutorBitsRequestService },
    { provide: ICacheService, useClass: TutorBitsCacheService },
    { provide: IStorageService, useClass: TutorBitsStorageService },
    { provide: IDataService, useClass: TutorBitsDataService },
    { provide: IAuthService, useClass: TutorBitsAuthService },
    { provide: ILogService, useClass: TutorBitsLoggingService },
    { provide: IErrorService, useClass: TutorBitsErrorService },
    { provide: TutorBitsTutorialService, useClass: TutorBitsConcreteTutorialService },
    { provide: TutorBitsAccountService, useClass: TutorBitsConcreteAccountService },
    { provide: ITracerProjectService, useClass: TutorBitsTracerProjectService },
    { provide: IVideoService, useClass: TutorBitsVideoService },
    { provide: IPreviewService, useClass: TutorBitsPreviewService },
    { provide: IUserApiService, useClass: TutorBitsUserApiService },
    { provide: ITitleService, useClass: TutorBitsTitleService },
    { provide: IEventService, useClass: TutorBitsGAEventService },
    { provide: TutorBitsTutorialCommentService, useClass: TutorBitsConcreteTutorialCommentService },
    { provide: TutorBitsQuestionCommentService, useClass: TutorBitsConcreteQuestionCommentService },
    { provide: TutorBitsAnswerService, useClass: TutorBitsConcreteAnswerService },
    { provide: TutorBitsAnswerCommentService, useClass: TutorBitsConcreteAnswerCommentService },
    { provide: TutorBitsTutorialRatingService, useClass: TutorBitsConcreteTutorialRatingService },
    { provide: TutorBitsTutorialCommentRatingService, useClass: TutorBitsConcreteTutorialCommentRatingService },
    { provide: TutorBitsQuestionService, useClass: TutorBitsConcreteQuestionService },
    { provide: TutorBitsQuestionRatingService, useClass: TutorBitsConcreteQuestionRatingService },
    { provide: TutorBitsQuestionCommentRatingService, useClass: TutorBitsConcreteQuestionCommentRatingService },
    { provide: TutorBitsAnswerRatingService, useClass: TutorBitsConcreteAnswerRatingService },
    { provide: TutorBitsAnswerCommentRatingService, useClass: TutorBitsConcreteAnswerCommentRatingService },
    { provide: TutorBitsThumbnailService, useClass: TutorBitsConcreteThumbnailService },
    { provide: TutorBitsExampleService, useClass: TutorBitsConcreteExampleService },
    { provide: TutorBitsExampleCommentService, useClass: TutorBitsConcreteExampleCommentService },
    { provide: TutorBitsExampleRatingService, useClass: TutorBitsConcreteExampleRatingService },
    { provide: TutorBitsExampleCommentRatingService, useClass: TutorBitsConcreteExampleCommentRatingService },
    { provide: IEditorPluginService, useClass: TutorBitsEditorPluginService },
    { provide: ICodeService, useClass: TutorBitsCodeService },
    { provide: IFileTreeService, useClass: TutorBitsFileTreeService },
    { provide: IWorkspacePluginService, useClass: TutorBitsWorkspacePluginService },
    { provide: ICurrentTracerProjectService, useClass: TutorBitsCurrentTracerProjectService },
    { provide: IRecorderService, useClass: TutorBitsRecorderService },
    { provide: IResourceViewerService, useClass: TutorBitsResourceViewerService },
    { provide: IPlayerService, useClass: TutorBitsPlayerService },
    { provide: IPlaybackMouseService, useClass: TutorBitsPlaybackMouseService }
  ],
  bootstrap: [AppComponent],
  entryComponents: [WatchGuideComponent]
})
export class AppModule { }
