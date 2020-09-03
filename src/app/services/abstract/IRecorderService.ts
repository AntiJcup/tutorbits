import { ResourceType } from 'src/app/services/abstract/IFileTreeService';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import 'ngx-monaco-editor';
import { EventEmitter } from 'events';

export interface RecorderSettings {
  overrideSaveSpeed?: number;
  saveUnfinishedPartitions?: boolean;
  local?: boolean;
  startingTransactionLogs?: TraceTransactionLog[];
  cacheBuster?: string;
  trackNonFileEvents?: boolean;
  load?: boolean;
  useCachedProject?: boolean;
}

export enum RecorderEvents {
  start,
  end,
  update,
  save
}

export abstract class IRecorderService extends EventEmitter {
  public abstract get position(): number;
  public abstract get hasChanged(): boolean;
  public abstract get logs(): TraceTransactionLog[];
  public abstract get recording(): boolean;

  public abstract async StartRecording(settings: RecorderSettings): Promise<void>;
  public abstract async StopRecording(): Promise<boolean>;
  public abstract async Save(): Promise<void>;

  public abstract OnNodeSelected(path: string): void;
  public abstract OnNodeCreated(path: string): void;
  public abstract OnNodeRename(sourcePath: string, destinationPath: string): void;
  public abstract OnNodeDeleted(path: string, isFolder: boolean, type: ResourceType): void;
  public abstract OnNodeMoved(sourcePath: string, destinationPath: string): void;
  public abstract onFileUploaded(path: string, resourceId: string, resourceName: string): void;
  public abstract onMouseMoved(e: MouseEvent): void;
  public abstract onScrolled(e: monaco.IScrollEvent): void;
  public abstract onPreviewClicked(file: string): void;
  public abstract onPreviewCloseClicked(): void;
}
