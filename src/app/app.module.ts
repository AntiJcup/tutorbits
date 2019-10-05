import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MaterialModule} from './material/material-module';
import {FlexLayoutModule} from '@angular/flex-layout';
import { EditorModule } from './editor/editor.module';
import { VideoPlayerModule } from './video-player/video-player.module';
import { FileTreeModule } from './file-tree/file-tree.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    EditorModule,
    VideoPlayerModule,
    FileTreeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
