import { Component, OnInit, Input, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-web-cam',
  templateUrl: './recording-web-cam.component.html',
  styleUrls: ['./recording-web-cam.component.sass']
})

export class RecordingWebCamComponent implements OnInit {
  @ViewChild('webcamoutput', { static: true }) webCamTag: ElementRef;
  @Input() width: number;
  @Input() height: number;

  @Output() streamInitialized = new EventEmitter<RecordingWebCamComponent>();

  public stream: MediaStream;

  public videoOptions: MediaTrackConstraints = {

  };
  constructor() { }

  ngOnInit(): void {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((stream: MediaStream) => {
      this.stream = stream;
      const webCamVideo: HTMLVideoElement = this.webCamTag.nativeElement;
      webCamVideo.srcObject = stream;
      webCamVideo.onloadedmetadata = (e) => {
        webCamVideo.play();
        webCamVideo.muted = true;
        this.streamInitialized.next(this);
      };
    });
  }
}
