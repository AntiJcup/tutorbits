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
import { WatchComponent } from './components/watch/watch.component';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RecordComponent } from './components/record/record.component';
import { PlaybackEditorComponent } from './sub-components/playback-editor/playback-editor.component';
import { RecordingEditorComponent } from './sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from './sub-components/recording-file-tree/recording-file-tree.component';
import { PlaybackFileTreeComponent } from './sub-components/playback-file-tree/playback-file-tree.component';
import {WebcamModule} from 'ngx-webcam';
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

const appRoutes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: { title: 'Home' }
  },
  {
    path: 'watch/:projectId',
    component: WatchComponent,
    data: { title: 'Watch' }
  },
  {
    path: 'record/:projectId',
    component: RecordComponent,
    data: { title: 'Record' }
  },
  {
    path: 'sandbox',
    component: SandboxComponent,
    data: { title: 'Sandbox' }
  },
  {
    path: 'create/tutorial',
    component: CreateTutorialComponent,
    data: { title: 'Create Tutorial' }
  },
  {
    path: 'tutorials',
    component: ViewTutorialsComponent,
    data: { title: 'Tutorials' }
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
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
    ViewTutorialsComponent
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
    FormlyModule.forRoot(),
    FormlyMaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
