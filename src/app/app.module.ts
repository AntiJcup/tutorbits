import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NgZone } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './sub-components/material/material-module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { EditorModule } from './sub-components/editor/editor.module';
import { VideoPlayerModule } from './sub-components/video-player/video-player.module';
import { FileTreeModule } from './sub-components/file-tree/file-tree.module';
import { HttpClientModule } from '@angular/common/http';
import { WatchComponent } from './components/tutorials/watch/watch.component';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RecordComponent } from './components/tutorials/record/record.component';
import { PlaybackEditorComponent } from './sub-components/playback-editor/playback-editor.component';
import { RecordingEditorComponent } from './sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from './sub-components/recording-file-tree/recording-file-tree.component';
import { PlaybackFileTreeComponent } from './sub-components/playback-file-tree/playback-file-tree.component';
import { WebcamModule } from 'ngx-webcam';
import { RecordingWebCamComponent } from './sub-components/recording-web-cam/recording-web-cam.component';
import { RecordingControlsComponent } from './sub-components/recording-controls/recording-controls.component';
import { PreviewComponent } from './sub-components/preview/preview.component';
import { SandboxComponent } from './components/sandbox/sandbox.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { CreateTutorialComponent } from './components/tutorials/create-tutorial/create-tutorial.component';
import { SubmitButtonComponent } from './sub-components/submit-button/submit-button.component';
import { ViewTutorialsComponent } from './components/tutorials/view-tutorials/view-tutorials.component';
import { TutorialCardComponent } from './sub-components/tutorial-card/tutorial-card.component';
import { SavingButtonComponent } from './sub-components/saving-button/saving-button.component';
import { EditorPlaceHolderComponent } from './sub-components/editor-place-holder/editor-place-holder.component';
import { LoginComponent } from './components/login/login.component';
import { IAPIService } from './services/abstract/IAPIService';
import { TutorBitsApiService } from './services/tutor-bits-api.service';
import { IAuthService } from './services/abstract/IAuthService';
import { TutorBitsAuthService } from './services/user/tutor-bits-auth.service';
import { ILogService } from './services/abstract/ILogService';
import { TutorBitsLoggingService } from './services/logging/tutor-bits-logging.service';
import { TutorBitsTutorialService, TutorBitsConcreteTutorialService } from './services/tutorial/tutor-bits-tutorial.service';
import { IStorageService } from './services/abstract/IStorageService';
import { TutorBitsStorageService } from './services/storage/tutor-bits-storage.service';
import { TutorBitsErrorService } from './services/logging/tutor-bits-error.service';
import { IErrorService } from './services/abstract/IErrorService';
import { IDataService } from './services/abstract/IDataService';
import { TutorBitsDataService } from './services/storage/tutor-bits-persist.service';
import { LogoutComponent } from './components/logout/logout.component';
import { TutorBitsTracerProjectService } from './services/project/tutor-bits-tracer-project.service';
import { ITracerProjectService } from './services/abstract/ITracerProjectService';
import { IVideoService } from './services/abstract/IVideoService';
import { TimerComponent } from './sub-components/timer/timer.component';
import { FormlyFieldFileComponent } from './sub-components/formly/formly-field-file/formly-field-file.component';
import { FileValueAccessorDirective } from './sub-components/formly/file-value-accessor.directive';
import { TutorBitsAuthGuardService } from './services/guards/tutor-bits-auth-guard.service';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { ResourceViewerComponent } from './sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from './services/abstract/IPreviewService';
import { TutorBitsPreviewService } from './services/project/tutor-bits-preview.service';
import { MyTutorialsComponent } from './components/tutorials/my-tutorials/my-tutorials.component';
import { EditTutorialCardComponent } from './sub-components/edit-tutorial-card/edit-tutorial-card.component';
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
import { PlaybackMouseComponent } from './sub-components/playback-mouse/playback-mouse.component';
import { ITitleService } from './services/abstract/ITitleService';
import { TutorBitsTitleService } from './services/tutor-bits-title.service';
import { WatchGuideComponent } from './sub-components/watch-guide/watch-guide.component';
import { PlayButtonHintComponent } from './sub-components/play-button-hint/play-button-hint.component';
import { TutorBitsTutorialCommentService, TutorBitsConcreteTutorialCommentService } from './services/tutorial/tutor-bits-tutorial-comment.service';
import { TutorBitsConcreteQuestionCommentService, TutorBitsQuestionCommentService } from './services/question/tutor-bits-question-comment.service';
import { TutorBitsAnswerService, TutorBitsConcreteAnswerService } from './services/question/tutor-bits-answer.service';
import { TutorBitsAnswerCommentService, TutorBitsConcreteAnswerCommentService } from './services/question/tutor-bits-answer-comment.service';
import { TutorBitsTutorialRatingService, TutorBitsConcreteTutorialRatingService } from './services/tutorial/tutor-bits-tutorial-rating.service';
import { TutorBitsTutorialCommentRatingService, TutorBitsConcreteTutorialCommentRatingService } from './services/tutorial/tutor-bits-tutorial-comment-rating.service';
import { TutorBitsQuestionRatingService, TutorBitsConcreteQuestionRatingService } from './services/question/tutor-bits-question-rating.service';
import { TutorBitsQuestionCommentRatingService, TutorBitsConcreteQuestionCommentRatingService } from './services/question/tutor-bits-question-comment-rating.service';
import { TutorBitsAnswerRatingService, TutorBitsConcreteAnswerRatingService } from './services/question/tutor-bits-answer-rating.service';
import { TutorBitsAnswerCommentRatingService, TutorBitsConcreteAnswerCommentRatingService } from './services/question/tutor-bits-answer-comment-rating.service';
import { CommentSectionComponent } from './sub-components/comment-section/comment-section.component';
import { CommentComponent } from './sub-components/comment/comment.component';
import { CreateCommentComponent } from './sub-components/create-comment/create-comment.component';
import { CommentButtonComponent } from './sub-components/comments-button/comments-button.component';
import { RatingComponent } from './sub-components/rating/rating.component';
import { TutorBitsConcreteThumbnailService, TutorBitsThumbnailService } from './services/thumbnail/tutor-bits-thumbnail.service';
import { TutorBitsVideoService } from './services/video/tutor-bits-video.service';
import { CreateSandboxComponent } from './components/create-sandbox/create-sandbox.component';
import { TutorBitsExampleService, TutorBitsConcreteExampleService } from './services/example/tutor-bits-example.service';
import { TutorBitsExampleCommentService, TutorBitsConcreteExampleCommentService } from './services/example/tutor-bits-example-comment.service';
import { TutorBitsExampleRatingService, TutorBitsConcreteExampleRatingService } from './services/example/tutor-bits-example-rating.service';
import { TutorBitsExampleCommentRatingService, TutorBitsConcreteExampleCommentRatingService } from './services/example/tutor-bits-example-comment-rating.service';
import { MyExamplesComponent } from './components/examples/my-examples/my-examples.component';
import { EditExampleCardComponent } from './sub-components/edit-example-card/edit-example-card.component';
import { ViewExamplesComponent } from './components/examples/view-examples/view-examples.component';
import { ExampleCardComponent } from './sub-components/example-card/example-card.component';
import { CreateExampleComponent } from './components/examples/create-example/create-example.component';

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
    path: 'create/sandbox',
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
    path: 'create/example/:projectId',
    component: CreateExampleComponent,
    data: { title: 'Create Example' },
    canActivate: [TutorBitsAuthGuardService, TutorBitsMobileGuardService]
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
    SubmitButtonComponent,
    ViewTutorialsComponent,
    TutorialCardComponent,
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
    MyTutorialsComponent,
    EditTutorialCardComponent,
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
    { provide: IAPIService, useClass: TutorBitsApiService },
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
    { provide: TutorBitsQuestionRatingService, useClass: TutorBitsConcreteQuestionRatingService },
    { provide: TutorBitsQuestionCommentRatingService, useClass: TutorBitsConcreteQuestionCommentRatingService },
    { provide: TutorBitsAnswerRatingService, useClass: TutorBitsConcreteAnswerRatingService },
    { provide: TutorBitsAnswerCommentRatingService, useClass: TutorBitsConcreteAnswerCommentRatingService },
    { provide: TutorBitsThumbnailService, useClass: TutorBitsConcreteThumbnailService },
    { provide: TutorBitsExampleService, useClass: TutorBitsConcreteExampleService },
    { provide: TutorBitsExampleCommentService, useClass: TutorBitsConcreteExampleCommentService },
    { provide: TutorBitsExampleRatingService, useClass: TutorBitsConcreteExampleRatingService },
    { provide: TutorBitsExampleCommentRatingService, useClass: TutorBitsConcreteExampleCommentRatingService },
  ],
  bootstrap: [AppComponent],
  entryComponents: [WatchGuideComponent]
})
export class AppModule { }
