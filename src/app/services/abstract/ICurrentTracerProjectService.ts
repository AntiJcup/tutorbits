import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';

export abstract class ICurrentTracerProjectService {
  public abstract get project(): TraceProject;
  public abstract get projectId(): string;

  public async abstract ClearCurrentProject();

  public async abstract NewProject(online: boolean): Promise<TraceProject>;

  public async abstract LoadProject(online: boolean, projectId: string, cacheBuster?: string);

  public async abstract ResetProject(): Promise<boolean>;

  public async abstract DownloadProject(): Promise<boolean>;

  public async abstract GetProjectJson(): Promise<{ [key: string]: string }>;

  public async abstract UploadResource(resourceName: string, resourceData: Blob, authorize: boolean): Promise<string>;

  public async abstract GetResource(resourceId: string): Promise<string>;

  public async abstract WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array): Promise<boolean>;

  public async abstract GetProjectFromServer(cacheBuster?: string): Promise<TraceProject>;

  // tslint:disable-next-line: max-line-length
  public async abstract GetPartitionsForRange(startTime: number, endTime: number, cacheBuster: string): Promise<{ [partition: string]: string; }>;

  public async abstract GetTransactionLog(partition: string, cacheBuster: string): Promise<TraceTransactionLog>;

  public async abstract Publish(): Promise<boolean>;
}
