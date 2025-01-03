import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { IResourceViewerService, ResourceType, ResourceViewerEvent } from 'src/app/services/abstract/IResourceViewerService';
import { IFileTreeService, FileTreeEvents, PathType, ResourceNodeType } from 'src/app/services/abstract/IFileTreeService';
import { EventSub } from 'shared/web/lib/ts/EasyEventEmitter';
import { ICurrentTracerProjectService } from 'src/app/services/abstract/ICurrentTracerProjectService';

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
export class ResourceViewerComponent implements OnInit, OnDestroy {
  private selectSub: EventSub;

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

  constructor(
    private resourceViewerService: IResourceViewerService,
    private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.resourceViewerService.on(ResourceViewerEvent[ResourceViewerEvent.changed], async () => {
      this.changeDetector.markForCheck();
    });
  }

  ngOnDestroy() {
    if (this.selectSub) {
      this.selectSub.Dispose();
    }
  }

}
