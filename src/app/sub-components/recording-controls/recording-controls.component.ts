import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, SimpleChanges, DoCheck, AfterContentInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-recording-controls',
  templateUrl: './recording-controls.component.html',
  styleUrls: ['./recording-controls.component.sass']
})
export class RecordingControlsComponent implements OnInit {
  public recording = false;
  @Input() saving = false;
  @Input() canFinish = false;
  @Input() canRecord = false;
  @Input() finishSaving = false;
  @Input() loadingRecording = false;

  @Output() recordingStateChanged = new EventEmitter<boolean>();
  @Output() finishClicked = new EventEmitter();

  constructor() { }

  ngOnInit() {

  }

  onRecordClicked(e: any) {
    this.recordingStateChanged.next(true);
    this.recording = true;
  }

  onStopRecordingClicked(e: any) {
    if (!confirm('Are you sure you want to stop recording?')) {
      return;
    }

    this.recordingStateChanged.next(false);
    this.recording = false;
  }

  onFinishClicked() {
    this.finishClicked.next();
  }
}
