import { EasyEventEmitter } from 'shared/web/lib/ts/EasyEventEmitter';

export interface ResourceData {
  fileName: string;
  resourceId: string;
  projectId: string;
  path: string;
}

export enum ResourceType {
  unknown,
  image,
}

export enum ResourceViewerEvent {
  changed
}

export abstract class IResourceViewerService extends EasyEventEmitter {
  public abstract get resource(): ResourceData;
  public abstract set resource(r: ResourceData);

  public abstract get url(): string;
  public abstract get urlType(): ResourceType;
}
