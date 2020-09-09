import { Injectable } from '@angular/core';
import { IResourceViewerService, ResourceData, ResourceViewerEvent, ResourceType } from '../abstract/IResourceViewerService';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { IErrorService } from '../abstract/IErrorService';

@Injectable()
export class TutorBitsResourceViewerService extends IResourceViewerService {
  // tslint:disable-next-line: variable-name
  private resource_: ResourceData;
  // tslint:disable-next-line: variable-name
  private url_: string;
  // tslint:disable-next-line: variable-name
  private urlType_: ResourceType;

  public get resource(): ResourceData {
    return this.resource_;
  }
  public set resource(r: ResourceData) {
    this.resource_ = r;
    this.evaluateResourceType().then(() => {
      this.emit(ResourceViewerEvent[ResourceViewerEvent.changed], this.resource_);
    });
  }

  public get url(): string {
    return this.url_;
  }

  public get urlType(): ResourceType {
    return this.urlType_;
  }

  constructor(
    protected projectService: ITracerProjectService,
    protected errorService: IErrorService) {
    super();
  }

  protected async evaluateResourceType() {
    this.urlType_ = null;
    this.url_ = null;

    if (!this.resource_) {
      return;
    }

    if (this.resource.fileName.endsWith('.png') || this.resource.fileName.endsWith('.jpg')) {
      try {
        const url = await this.projectService.GetResource(this.resource.projectId, this.resource.resourceId);
        if (!url) {
          this.errorService.HandleError('ResourceViewerComponent', `Url was null`);
          return;
        }

        if (!this.resource_) {
          return;
        }

        this.url_ = url;
        this.urlType_ = ResourceType.image;
        this.emit(ResourceViewerEvent[ResourceViewerEvent.changed], this.url, this.urlType);
      } catch (e) {
        this.errorService.HandleError('ResourceViewerComponent', `Failed retrieving resource`);
      }
    }
  }

}
