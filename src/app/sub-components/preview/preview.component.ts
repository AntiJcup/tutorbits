import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.sass']
})

export class PreviewComponent implements OnInit {
  @Output() closeClicked = new EventEmitter();

  internalPreviewBaseUrl: string;
  internalPreviewPath: string;
  internalPreviewUrl: SafeUrl;
  get previewUrl(): SafeUrl {
    return this.internalPreviewUrl;
  }

  @Input()
  set previewBaseUrl(baseUrl: string) {
    this.internalPreviewBaseUrl = baseUrl;
  }

  @Input()
  set previewPath(path: string) {
    this.internalPreviewPath = path;
    this.internalPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.internalPreviewBaseUrl}${path}`);
  }

  get previewPath(): string {
    return this.internalPreviewPath;
  }

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
  }

  navigate(path: string) {
    this.previewPath = path;
  }

  onCloseClicked() {
    this.closeClicked.next();
  }
}
