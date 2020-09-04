import { Injectable } from '@angular/core';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { ILogService } from '../abstract/ILogService';
import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { ICurrentTracerProjectService } from '../abstract/ICurrentTracerProjectService';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { IProjectWriter } from 'shared/Tracer/lib/ts/IProjectWriter';
import { ITransactionWriter } from 'shared/Tracer/lib/ts/ITransactionWriter';
import { LocalProjectLoader, LocalProjectWriter, LocalTransactionWriter, LocalTransactionReader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { ITransactionReader } from 'shared/Tracer/lib/ts/ITransactionReader';

@Injectable()
export class TutorBitsCurrentTracerProjectService extends ICurrentTracerProjectService {
  // tslint:disable-next-line: variable-name
  protected project_: TraceProject;
  // tslint:disable-next-line: variable-name
  protected online_: boolean;

  // tslint:disable-next-line: variable-name
  protected baseProjectId_: string;

  // tslint:disable-next-line: variable-name
  private projectLoader_: IProjectReader;
  // tslint:disable-next-line: variable-name
  private projectWriter_: IProjectWriter;
  // tslint:disable-next-line: variable-name
  private transactionWriter_: ITransactionWriter;
  // tslint:disable-next-line: variable-name
  private transactionReader_: ITransactionReader;

  public get project(): TraceProject {
    return this.project_;
  }

  public get projectId(): string {
    if (!this.project_) {
      throw new Error('No project assigned');
    }

    return this.project_.getId();
  }

  public get baseProjectId(): string {
    return this.baseProjectId_;
  }

  public set baseProjectId(i: string) {
    this.baseProjectId_ = i;
  }

  public get online(): boolean {
    return this.online_;
  }

  protected get projectLoader(): IProjectReader {
    if (!this.projectLoader_) {
      this.projectLoader_ = this.online_ ? new LocalProjectLoader() : this.projectService;
    }

    return this.projectLoader_;
  }

  protected get projectWriter(): IProjectWriter {
    if (!this.projectWriter_) {
      this.projectWriter_ = this.online_ ? new LocalProjectWriter() : this.projectService;
    }

    return this.projectWriter_;
  }

  protected get transactionWriter(): ITransactionWriter {
    if (!this.transactionWriter_) {
      this.transactionWriter_ = this.online_ ? new LocalTransactionWriter() : this.projectService;
    }

    return this.transactionWriter_;
  }

  protected get transactionReader(): ITransactionReader {
    if (!this.transactionWriter_) {
      this.transactionReader_ = this.online_ ? new LocalTransactionReader() : this.projectService;
    }

    return this.transactionReader_;
  }

  constructor(
    protected projectService: ITracerProjectService,
    protected logging: ILogService) {
    super();
  }

  public async ClearCurrentProject() {
    this.project_ = null;
  }

  public async NewProject(online: boolean): Promise<TraceProject> {
    this.online_ = online;

    const projectId = await this.projectService.CreateProject();
    if (!projectId) {
      return null;
    }

    return await this.LoadProject(this.online_, projectId);
  }

  public async LoadProject(online: boolean, projectId: string, cacheBuster?: string): Promise<TraceProject> {
    this.online_ = online;

    this.project_ = await this.projectService.GetProject(projectId, cacheBuster);
    return this.project_;
  }

  public async ResetProject(): Promise<boolean> {
    await this.projectService.ResetProject(this.projectId);

    return !!(await this.LoadProject(this.online_, this.projectId));
  }

  public async DownloadProject(): Promise<boolean> {
    return await this.projectService.DownloadProject(this.projectId);
  }

  public async GetProjectJson(): Promise<{ [key: string]: string; }> {
    return await this.projectService.GetProjectJson(this.projectId);
  }

  public async UploadResource(resourceName: string, resourceData: Blob, authorize: boolean): Promise<string> {
    return await this.projectService.UploadResource(this.projectId, resourceName, resourceData, authorize);
  }

  public async GetResource(resourceId: string): Promise<string> {
    return await this.projectService.GetResource(this.projectId, resourceId);
  }

  public async WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array): Promise<boolean> {
    return await this.projectService.WriteTransactionLog(transactionLog, data, this.projectId);
  }

  public async GetProjectFromServer(cacheBuster: string): Promise<TraceProject> {
    return await this.projectService.GetProject(this.projectId, cacheBuster);
  }

  public async GetPartitionsForRange(startTime: number, endTime: number, cacheBuster: string): Promise<{ [partition: string]: string; }> {
    return await this.projectService.GetPartitionsForRange(this.project, startTime, endTime, cacheBuster);
  }

  public async GetTransactionLog(partition: string, cacheBuster: string): Promise<TraceTransactionLog> {
    return await this.projectService.GetTransactionLog(this.project, partition, cacheBuster);
  }

  public async Publish(): Promise<boolean> {
    return await this.projectService.Publish(this.projectId);
  }
}
