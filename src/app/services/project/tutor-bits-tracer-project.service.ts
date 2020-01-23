import { Injectable } from '@angular/core';
import { IAPIService } from '../abstract/IAPIService';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { IAuthService } from '../abstract/IAuthService';
import { ILogService } from '../abstract/ILogService';
import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { CreateProject } from 'src/app/models/project/create-project';
import { HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { ViewProject } from 'src/app/models/project/view-project';

@Injectable()
export class TutorBitsTracerProjectService extends ITracerProjectService {
  protected readonly basePath = `api/Project`;
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService, protected logging: ILogService) {
    super(apiService, auth);
  }

  public async CreateProject(id: string): Promise<boolean> {
    const res = await this.Create({} as CreateProject);

    return !res.error;
  }

  public async ResetProject(id: string): Promise<boolean> {
    const deleteResponse = await this.apiService.generateRequest()
      .Post(`${this.basePath}/reset?projectId=${id}`, null, (await this.GetAuthHeaders(HandlerType.Delete)));

    if (!deleteResponse.ok) {
      return false;
    }

    return true;
  }

  public async DownloadProject(id: string): Promise<boolean> {
    const getResponse = await this.apiService.generateRequest()
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
    const getResponse = await this.apiService.generateRequest()
      .Get(`${this.basePath}/json?projectId=${id}`);

    if (!getResponse.ok) {
      throw new Error(`Failed retrieving json url`);
    }

    const jsonUrl = await getResponse.json();
    if (!jsonUrl) {
      throw new Error(`Failed converting json url`);
    }

    const getJsonResponse = await this.apiService.generateRequest().GetFullUrl(jsonUrl);

    if (!getJsonResponse.ok) {
      throw new Error(`Failed downloading json`);
    }

    return await getJsonResponse.json();
  }

  public async UploadResource(id: string, resourceName: string, resourceData: Blob, authorize: boolean): Promise<string> {
    this.logging.LogToConsole('TutorBitsTracerProjectService', `Uploading resource ${resourceName}`);
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/${authorize ? 'addResource' : 'addResourceAnon'}?projectId=${id}&resourceFileName=${resourceName}`,
        resourceData, authorize ? (await this.GetAuthHeaders(HandlerType.Create)) : null);

    if (!response.ok) {
      throw new Error(`Failed uploading resource ${response.status}`);
    }

    return await response.json();
  }

  public async GetResource(id: string, resourceId: string): Promise<string> {
    this.logging.LogToConsole('TutorBitsTracerProjectService', `Getting resource ${resourceId}`);
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/resource?projectId=${id}&resourceId=${resourceId}`);

    if (!response.ok) {
      throw new Error(`Failed getting resource ${response.status}`);
    }

    return await response.json();
  }

  public async WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array, projectId: string): Promise<boolean> {
    this.logging.LogToConsole('TutorBitsTracerTransactionService', `Writing transactions ${JSON.stringify(transactionLog.toObject())}`);
    const response = await this.apiService.generateRequest().Post(`${this.basePath}/add?projectId=${projectId}`,
      new Blob([data]), (await this.GetAuthHeaders(HandlerType.Create)));

    return response.ok;
  }

  public async GetProject(id: string, cacheBuster?: string): Promise<TraceProject> {
    const response = await this.apiService.generateRequest().Get(`${this.basePath}/get?Id=${id}`,
      (await this.GetHeaders(HandlerType.Get)));

    if (!response.ok) {
      throw new Error('getting project');
    }

    const project = (await response.json()) as ViewProject;
    const projectDownloadUrl = project.url + (!cacheBuster ? '' : `?cb=${cacheBuster}`);
    const projectResponse = await this.apiService.generateRequest().GetFullUrl(projectDownloadUrl);

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

    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/transactions?projectId=${project.getId()}&offsetStart=${startTime}&offsetEnd=${endTime}${cacheBuster === null ?
        '' : `&cb=${cacheBuster}`}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async GetTransactionLog(project: TraceProject, partition: string, cacheBuster?: string): Promise<TraceTransactionLog> {
    const response = await this.apiService.generateRequest().GetFullUrl(`${partition}${cacheBuster === null ? '' : `?cb=${cacheBuster}`}`);

    if (!response.ok) {
      return null;
    }

    return TraceTransactionLog.deserializeBinary(new Uint8Array(await response.arrayBuffer()));
  }

  public async Publish(projectId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Publish?projectId=${projectId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }
}
