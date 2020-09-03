import { Component, OnInit, Input } from '@angular/core';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { IResourceViewerService, ResourceType } from 'src/app/services/abstract/IResourceViewerService';

export interface ResourceData {
  fileName: string;
  resourceId: string;
  projectId: string;
  path: string;
}

@Component({
  selector: 'app-resource-viewer',
  templateUrl: './resource-viewer.component.html',
  styleUrls: ['./resource-viewer.component.sass']
})
export class ResourceViewerComponent implements OnInit {
  public get imageUrl(): string {
    if (this.resourceViewerService.urlType !== ResourceType.image) {
      return null;
    }
    return this.resourceViewerService.url;
  }

  public get resourceName(): string {
    if (!this.resourceViewerService.resource) {
      return null;
    }
    return this.resourceViewerService.resource.fileName;
  }

  constructor(private resourceViewerService: IResourceViewerService) { }

  ngOnInit() {
  }

}
