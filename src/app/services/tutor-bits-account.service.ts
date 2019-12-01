import { TutorBitsApiService } from './tutor-bits-api.service';
import { ViewTutorial } from '../models/tutorial/view-tutorial';
import { CreateTutorial } from '../models/tutorial/create-tutorial';
import { TutorBitsBaseModelApiService } from './abstract/tutor-bits-base-model-api.service';
import { IAPIService } from './abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from './abstract/IAuthService';
import { ResponseWrapper } from './abstract/IModelApiService';
import { FileUtils } from 'shared/web/lib/ts/FileUtils';
import { CreateAccount } from '../models/tutorial/create-account';
import { ViewAccount } from '../models/user/view-account';

// Import this as your service so tests can override it
export abstract class TutorBitsAccountService extends TutorBitsBaseModelApiService<CreateAccount, ViewAccount> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public abstract async Login(): Promise<ViewAccount>;
  public abstract async GetAccountInformation(): Promise<ViewAccount>;
  public abstract async UpdateNickName(nickName: string): Promise<void>;
}

@Injectable()
export class TutorBitsConcreteAccountService extends TutorBitsAccountService {
  protected readonly basePath = `api/Account`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async Login(): Promise<ViewAccount> {
    const response = await this.apiService.generateRequest()
      .Get(`api/Account/Login`, await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error(`Failed logging in - ${response.statusText}`);
    }

    return (await response.json()) as ViewAccount;
  }

  public async GetAccountInformation(): Promise<ViewAccount> {
    const accounts = await this.GetAllByOwner();
    if (accounts.length <= 0) {
      throw new Error(`Failed getting account information`);
    }

    return accounts[0];
  }

  public async UpdateNickName(nickName: string): Promise<void> {
    const response = await this.apiService.generateRequest()
      .Post(`api/Account/UpdateNickName?nickName=${nickName}`, null, await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error(`Failed updating userName: - ${await response.text()}`);
    }


  }
}
