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

  async ngOnInit() {
    await this.getUserMedia();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    if (this.stream) {
      const webCamVideo: HTMLVideoElement = this.webCamTag.nativeElement;
      webCamVideo.pause();
      webCamVideo.src = '';

      this.stream.removeTrack(this.stream.getTracks()[0]);
      this.stream.getTracks()[0].stop();
    }
  }

  async getUserMedia() {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        video: { aspectRatio: 1620 / 1080 },
        audio: true
      });
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
      this.stream.getTracks()[0].onended = (ev: MediaStreamTrackEvent) => {
        this.onWebCamEnded(ev);
      };
    } catch (e) {
      this.streamError.next(e);
      if (!this.intervalHandle) {
        this.intervalHandle = setInterval(async () => {
          await this.getUserMedia();
        }, 3000);
      }
    }
  }

  onWebCamEnded(e: MediaStreamTrackEvent) {
    this.streamError.next('Webcam disconnected please reload');
  }
}
