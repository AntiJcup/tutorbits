import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-recording-controls',
  templateUrl: './recording-controls.component.html',
  styleUrls: ['./recording-controls.component.sass']
})
export class RecordingControlsComponent implements OnInit {
  @Input() recording = false;
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
  }

  onStopRecordingClicked(e: any) {
    if (!confirm('Are you sure you want to stop recording?')) {
      return;
    }

    this.recordingStateChanged.next(false);
  }

  onFinishClicked() {
    this.finishClicked.next();
  }
}
