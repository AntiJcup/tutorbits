import { Injectable } from '@angular/core';
import { IAPIService } from './abstract/IAPIService';
import { ITracerProjectService } from './abstract/ITracerProjectService';
import { IAuthService } from './abstract/IAuthService';

@Injectable()
export class TutorBitsTracerProjectService extends ITracerProjectService {
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService) {
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
}
