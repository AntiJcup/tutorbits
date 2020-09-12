import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TreeModule } from 'shared/Ng2-Tree';

@NgModule({
  declarations: [],
  imports: [BrowserModule, TreeModule],
  exports: [BrowserModule, TreeModule],
})
export class FileTreeModule { }
