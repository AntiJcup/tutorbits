import { Component, OnInit, Input, ElementRef, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-web-cam',
  templateUrl: './recording-web-cam.component.html',
  styleUrls: ['./recording-web-cam.component.sass']
})

export class RecordingWebCamComponent implements OnInit, OnDestroy {
  @ViewChild('webcamoutput', { static: true }) webCamTag: ElementRef;
  @Input() width: number;
  @Input() height: number;

  @Output() streamInitialized = new EventEmitter<RecordingWebCamComponent>();
  @Output() streamError = new EventEmitter<any>();

  public stream: MediaStream;
  private intervalHandle: any;

  public videoOptions: MediaTrackConstraints = {

  };
  constructor() { }

  ngOnInit(): void {
    this.getUserMedia();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  getUserMedia() {
    navigator.mediaDevices.getUserMedia({
      video: { aspectRatio: 1620 / 1080 },
      audio: true
    }).then((stream: MediaStream) => {
      if (this.intervalHandle) {
        clearInterval(this.intervalHandle);
        this.intervalHandle = null;
      }
      this.stream = stream;
      const webCamVideo: HTMLVideoElement = this.webCamTag.nativeElement;
      webCamVideo.srcObject = stream;
      webCamVideo.onloadedmetadata = (e) => {
        webCamVideo.play();
        webCamVideo.muted = true;
        this.streamInitialized.next(this);
      };
    }).catch((e) => {
      this.streamError.next(e);
      if (!this.intervalHandle) {
        this.intervalHandle = setInterval(() => {
          this.getUserMedia();
        }, 3000);
      }
    });
  }
}
