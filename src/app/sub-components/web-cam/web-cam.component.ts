import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-web-cam',
  templateUrl: './web-cam.component.html',
  styleUrls: ['./web-cam.component.sass']
})

export class WebCamComponent implements OnInit {
  @ViewChild('webcamoutput', { static: true }) webCamTag: ElementRef;
  @Input() width: number;
  @Input() height: number;

  public videoOptions: MediaTrackConstraints = {

  };
  constructor() { }

  ngOnInit(): void {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((stream: MediaStream) => {
      console.log(stream);
      const webCamVideo: HTMLVideoElement = this.webCamTag.nativeElement;
      webCamVideo.srcObject = stream;
      webCamVideo.onloadedmetadata = (e) => {
        webCamVideo.play();
        webCamVideo.muted = true;
      };
    });
  }
}
