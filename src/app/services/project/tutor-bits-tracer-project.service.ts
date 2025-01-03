import { Injectable } from '@angular/core';
import { IRequestService } from '../abstract/IRequestService';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { IAuthService } from '../abstract/IAuthService';
import { ILogService } from '../abstract/ILogService';
import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { CreateProject } from 'src/app/models/project/create-project';
import { HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { ViewProject } from 'src/app/models/project/view-project';
import { ProjectType } from 'src/app/models/project/project-type';
import { ICacheService } from '../abstract/ICacheService';

@Injectable()
export class TutorBitsTracerProjectService extends ITracerProjectService {
  protected readonly basePath = `api/Project`;
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(
    protected requestService: IRequestService,
    protected auth: IAuthService,
    protected logging: ILogService,
    cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public async CreateProject(): Promise<string> {
    const res = await this.Create({} as CreateProject);

    return res?.data?.id;
  }

  public async ResetProject(id: string): Promise<boolean> {
    const resetResponse = await this.requestService
      .Post(`${this.basePath}/reset?projectId=${id}`, null, (await this.GetAuthHeaders(HandlerType.Delete)));

    if (!resetResponse.ok) {
      return false;
    }

    return true;
  }

  public async DownloadProject(id: string): Promise<boolean> {
    const getResponse = await this.requestService
      .Get(`${this.basePath}/download?projectId=${id}`);

    if (!getResponse.ok) {
      return false;
    }

    const downloadUrl = await getResponse.json();
    if (!downloadUrl) {
      return false;
    }

    window.location.href = downloadUrl;

    return true;
  }

  public async GetProjectJson(id: string): Promise<{ [key: string]: string }> {
    const getResponse = await this.requestService
      .Get(`${this.basePath}/json?projectId=${id}`);

    if (!getResponse.ok) {
      throw new Error(`Failed retrieving json url`);
    }

    const jsonUrl = await getResponse.json();
    if (!jsonUrl) {
      throw new Error(`Failed converting json url`);
    }

    const getJsonResponse = await this.requestService.GetFullUrl(jsonUrl);

    if (!getJsonResponse.ok) {
      throw new Error(`Failed downloading json`);
    }

    return await getJsonResponse.json();
  }

  public async UploadResource(id: string, resourceName: string, resourceData: Blob, authorize: boolean): Promise<string> {
    this.logging.LogToConsole('TutorBitsTracerProjectService', `Uploading resource ${resourceName}`);
    const response = await this.requestService
      .Post(`${this.basePath}/${authorize ? 'addResource' : 'addResourceAnon'}?projectId=${id}&resourceFileName=${resourceName}`,
        resourceData, authorize ? (await this.GetAuthHeaders(HandlerType.Create)) : null);

    if (!response.ok) {
      throw new Error(`Failed uploading resource ${response.status}`);
    }

    return await response.json();
  }

  public async GetResource(id: string, resourceId: string): Promise<string> {
    this.logging.LogToConsole('TutorBitsTracerProjectService', `Getting resource ${resourceId}`);
    const response = await this.requestService
      .Get(`${this.basePath}/resource?projectId=${id}&resourceId=${resourceId}`);

    if (!response.ok) {
      throw new Error(`Failed getting resource ${response.status}`);
    }

    return await response.json();
  }

  public async WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array, projectId: string): Promise<boolean> {
    this.logging.LogToConsole('TutorBitsTracerTransactionService', `Writing transactions ${JSON.stringify(transactionLog.toObject())}`);
    const response = await this.requestService.Post(`${this.basePath}/add?projectId=${projectId}`,
      new Blob([data]), (await this.GetAuthHeaders(HandlerType.Create)));

    return response.ok;
  }

  public async GetProject(id: string, cacheBuster?: string): Promise<TraceProject> {
    const response = await this.requestService.Get(`${this.basePath}/get?Id=${id}`,
      (await this.GetHeaders(HandlerType.Get)));

    if (!response.ok) {
      throw new Error('getting project');
    }

    const project = (await response.json()) as ViewProject;
    const projectDownloadUrl = project.url + (!cacheBuster ? '' : `?cb=${cacheBuster}`);
    const projectResponse = await this.requestService.GetFullUrl(projectDownloadUrl);

    if (!projectResponse.ok) {
      throw new Error('loading project');
    }

    return TraceProject.deserializeBinary(new Uint8Array(await projectResponse.arrayBuffer()));
  }

  public async GetPartitionsForRange(
    project: TraceProject,
    startTime: number,
    endTime: number,
    cacheBuster?: string): Promise<{ [partition: string]: string }> {

    const response = await this.requestService
      .Get(`${this.basePath}/transactions?projectId=${project.getId()}&offsetStart=${startTime}&offsetEnd=${endTime}${cacheBuster === null ?
        '' : `&cb=${cacheBuster}`}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async GetTransactionLog(project: TraceProject, partition: string, cacheBuster?: string): Promise<TraceTransactionLog> {
    const response = await this.requestService.GetFullUrl(`${partition}${cacheBuster === null ? '' : `?cb=${cacheBuster}`}`);

    if (!response.ok) {
      return null;
    }

    return TraceTransactionLog.deserializeBinary(new Uint8Array(await response.arrayBuffer()));
  }

  public async Publish(projectId: string): Promise<boolean> {
    const response = await this.requestService
      .Post(`${this.basePath}/Publish?projectId=${projectId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public ValidateProjectType(projectType: string): boolean {
    return ProjectType[projectType] !== undefined;
  }

  public async GetProjectTypes(): Promise<string[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetProjectTypes`, await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error(`Failed getting tutorial types: ${response.status}`);
    }

    return await response.json();
  }
}
