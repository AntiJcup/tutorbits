import { TutorBitsBaseModelApiService } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { CreateAccount } from '../../models/user/create-account';
import { ViewAccount } from '../../models/user/view-account';
import { UpdateAccount } from '../../models/user/update-account';

// Import this as your service so tests can override it
export abstract class TutorBitsAccountService extends TutorBitsBaseModelApiService<CreateAccount, UpdateAccount, ViewAccount> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public abstract async Login(): Promise<ViewAccount>;
  public abstract async GetAccountInformation(): Promise<ViewAccount>;
  public abstract async UpdateNickName(nickName: string, accountId: string): Promise<void>;
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

  public async UpdateNickName(nickName: string, accountId: string): Promise<void> {
    const updatedModel = {
      Id: accountId,
      NickName: nickName
    } as UpdateAccount;

    const response = await this.Update(updatedModel);
    if (response.data === null) {
      throw new Error(response.error);
    }
  }
}