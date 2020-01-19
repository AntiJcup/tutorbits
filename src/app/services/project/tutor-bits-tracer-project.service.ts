import { Injectable } from '@angular/core';
import { IAPIService } from '../abstract/IAPIService';
import { ITracerProjectService } from '../abstract/ITracerProjectService';
import { IAuthService } from '../abstract/IAuthService';
import { ILogService } from '../abstract/ILogService';

@Injectable()
export class TutorBitsTracerProjectService extends ITracerProjectService {
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService, protected logging: ILogService) {
    super();
  }

  protected async GetAuthHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders, ...(await this.auth.getAuthHeader()) };
  }

  public async CreateProject(id: string): Promise<boolean> {
    const createResponse = await this.apiService.generateRequest()
      .Post(`api/project/recording/create?tutorialId=${id}`, null, (await this.GetAuthHeaders()));

    if (!createResponse.ok) {
      return false;
    }

    return true;
  }

  public async DeleteProject(id: string): Promise<boolean> {
    const deleteResponse = await this.apiService.generateRequest()
      .Post(`api/project/recording/delete?tutorialId=${id}`, null, (await this.GetAuthHeaders()));

    if (!deleteResponse.ok) {
      return false;
    }

    return true;
  }

  public async DownloadProject(id: string): Promise<boolean> {
    const getResponse = await this.apiService.generateRequest()
      .Get(`api/project/streaming/download?projectId=${id}`);

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
      .Get(`api/project/streaming/json?projectId=${id}`);

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
      .Post(`api/project/recording/${authorize ? 'addResource' : 'addResourceAnon'}?projectId=${id}&resourceFileName=${resourceName}`,
        resourceData, authorize ? (await this.GetAuthHeaders()) : null);

    if (!response.ok) {
      throw new Error(`Failed uploading resource ${response.status}`);
    }

    return await response.json();
  }

  public async GetResource(id: string, resourceId: string): Promise<string> {
    this.logging.LogToConsole('TutorBitsTracerProjectService', `Getting resource ${resourceId}`);
    const response = await this.apiService.generateRequest()
      .Get(`api/project/streaming/resource?projectId=${id}&resourceId=${resourceId}`);

    if (!response.ok) {
      throw new Error(`Failed getting resource ${response.status}`);
    }

    return await response.json();
  }
}