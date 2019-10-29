import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { TreeModule } from 'ng2-tree';

@NgModule({
  declarations: [],
  imports: [BrowserModule, TreeModule],
  exports: [BrowserModule, TreeModule],
})
export class FileTreeModule { }
