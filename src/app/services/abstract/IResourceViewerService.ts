import { EventEmitter } from 'events';

export interface ResourceData {
  fileName: string;
  resourceId: string;
  projectId: string;
  path: string;
}

export enum ResourceViewerEvent {
  changed
}

export abstract class IResourceViewerService extends EventEmitter {
  public abstract get resource(): ResourceData;
  public abstract set resource(r: ResourceData);
}
