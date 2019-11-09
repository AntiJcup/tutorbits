import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, SimpleChanges, DoCheck, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-recording-controls',
  templateUrl: './recording-controls.component.html',
  styleUrls: ['./recording-controls.component.sass']
})
export class RecordingControlsComponent implements OnInit {
  public recording = false;
  @Input() saving = false;

  @ViewChild('start', { static: false, read: ElementRef }) set startRecordingBtn(element: ElementRef) {
    if (element) {
      const startRecordingBtnHtmlEle = element.nativeElement as HTMLElement;
      startRecordingBtnHtmlEle.onclick = (e) => {
        this.recordingStateChanged.next(true);
        this.recording = true;
      };
    }
  }
  @ViewChild('stop', { static: false, read: ElementRef }) set stopRecordingBtn(element: ElementRef) {
    if (element) {
      const stopRecordingBtnHtmlEle = element.nativeElement as HTMLElement;
      stopRecordingBtnHtmlEle.onclick = (e) => {
        if (!confirm('Are you sure you want to stop recording?')) {
          return;
        }
        this.recordingStateChanged.next(false);
        this.recording = false;
      };
    }
  }

  @Output() recordingStateChanged = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {

  }
}
