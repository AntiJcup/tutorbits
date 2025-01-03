import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { CreateAccount } from '../../models/user/create-account';
import { ViewAccount } from '../../models/user/view-account';
import { UpdateAccount } from '../../models/user/update-account';
import { ICacheService } from '../abstract/ICacheService';
import { environment } from 'src/environments/environment';

// Import this as your service so tests can override it
export abstract class TutorBitsAccountService extends TutorBitsBaseModelApiService<CreateAccount, UpdateAccount, ViewAccount> {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public abstract async Login(): Promise<ViewAccount>;
  public abstract async GetAccountInformation(): Promise<ViewAccount>;
  public abstract async GetAccountInformationCached(): Promise<ViewAccount>;
  public abstract async UpdateNickName(nickName: string, accountId: string): Promise<void>;
}

@Injectable()
export class TutorBitsConcreteAccountService extends TutorBitsAccountService {
  protected readonly basePath = `api/Account`;

  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public async Login(): Promise<ViewAccount> {
    const response = await this.requestService
      .Get(`api/Account/Login`, await this.GetAuthHeaders(HandlerType.Update));

    if (!response.ok) {
      throw new Error(`Failed logging in - ${response.statusText}`);
    }

    this.cache.ClearCache();

    return (await response.json()) as ViewAccount;
  }

  public async GetAccountInformation(): Promise<ViewAccount> {
    const accounts = await this.GetAllByOwner();
    if (accounts.length <= 0) {
      throw new Error(`Failed getting account information`);
    }

    return accounts[0];
  }

  public async GetAccountInformationCached(): Promise<ViewAccount> {
    return this.cache.CacheFuncOptions({ cacheDuration: environment.accountInfoCacheDurationMS }, this.GetAccountInformation, this);
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
