import { Injectable } from '@angular/core';
import { IResourceViewerService, ResourceData, ResourceViewerEvent } from '../abstract/IResourceViewerService';

@Injectable()
export class TutorBitsResourceViewerService extends IResourceViewerService {
  private internalResource: ResourceData;

  public get resource(): ResourceData {
    return this.internalResource;
  }
  public set resource(r: ResourceData) {
    this.internalResource = r;

    this.emit(ResourceViewerEvent[ResourceViewerEvent.changed], this.internalResource);
  }

}
