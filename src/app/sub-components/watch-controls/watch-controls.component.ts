import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-watch-controls',
  templateUrl: './watch-controls.component.html',
  styleUrls: ['./watch-controls.component.sass']
})
export class WatchControlsComponent implements OnInit {
  @Output() previewClicked = new EventEmitter();

  @ViewChild('preview', { static: false, read: ElementRef }) set startRecordingBtn(element: ElementRef) {
    if (element) {
      const startRecordingBtnHtmlEle = element.nativeElement as HTMLElement;
      startRecordingBtnHtmlEle.onclick = (e) => {
        this.previewClicked.next();
      };
    }
  }

  constructor() { }

  ngOnInit() {

  }
}
