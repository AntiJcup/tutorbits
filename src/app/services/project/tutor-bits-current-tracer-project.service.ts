import { Injectable } from '@angular/core';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { ILogService } from '../abstract/ILogService';
import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { ICurrentTracerProjectService } from '../abstract/ICurrentTracerProjectService';

@Injectable()
export class TutorBitsCurrentTracerProjectService extends ICurrentTracerProjectService {
  protected internalProject: TraceProject;

  public get project(): TraceProject {
    return this.internalProject;
  }

  public get projectId(): string {
    if (!this.internalProject) {
      throw new Error('No project assigned');
    }

    return this.internalProject.getId();
  }

  constructor(
    protected projectService: ITracerProjectService,
    protected logging: ILogService) {
    super();
  }

  public async ClearCurrentProject() {
    this.internalProject = null;
  }

  public async NewProject(): Promise<boolean> {
    return await this.projectService.CreateProject();
  }

  public async LoadProject(projectId: string, cacheBuster?: string) {
    return await this.projectService.GetProject(projectId, cacheBuster);
  }

  public async ResetProject(): Promise<boolean> {
    return await this.projectService.ResetProject(this.projectId);
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
