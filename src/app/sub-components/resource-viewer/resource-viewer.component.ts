import { Component, OnInit, Input } from '@angular/core';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

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
  private internalResource: ResourceData;
  imageUrl: string;
  resourceName: string;
  @Input()
  set Resource(resource: ResourceData) {
    this.internalResource = resource;
    this.evaluateResourceType().then();
  }

  get Resource(): ResourceData {
    return this.internalResource;
  }

  constructor(private projectService: ITracerProjectService, private errorServer: IErrorService) { }

  ngOnInit() {
  }

  public async evaluateResourceType() {
    this.resourceName = null;
    this.imageUrl = null;

    if (!this.internalResource) {
      return;
    }

    if (this.Resource.fileName.endsWith('.png') || this.Resource.fileName.endsWith('.jpg')) {
      try {
        const url = await this.projectService.GetResource(this.Resource.projectId, this.Resource.resourceId);
        if (!url) {
          this.errorServer.HandleError('ResourceViewerComponent', `Url was null`);
          return;
        }

        if (!this.internalResource) {
          return;
        }

        this.resourceName = this.Resource.fileName;
        this.imageUrl = url;
      } catch (e) {
        this.errorServer.HandleError('ResourceViewerComponent', `Failed retrieving resource`);
      }
    }
  }

}
