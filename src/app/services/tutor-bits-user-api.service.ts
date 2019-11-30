import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IUserApiService } from './abstract/IUserApiService';
import { ViewUser } from '../models/user/view-user';
import { IAPIService } from './abstract/IAPIService';
import { IAuthService } from './abstract/IAuthService';

@Injectable()
export class TutorBitsUserApiService extends IUserApiService {
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService) { super(); }

  protected async GetHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders };
  }

  protected async GetAuthHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders, ...(await this.auth.getAuthHeader()) };
  }

  public async GetUserInfo(): Promise<ViewUser> {
    const response = await this.apiService.generateRequest()
      .Get(`api/User/GetCurrentUser`, await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error(`Failed retrieving user information - ${response.statusText}`);
    }

    return (await response.json()) as ViewUser;
  }
}
