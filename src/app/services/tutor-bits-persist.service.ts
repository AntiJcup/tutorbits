import { Injectable } from '@angular/core';
import { IStorageService } from './abstract/IStorageService';
import { IDataService } from './abstract/IDataService';
import { JWT } from '../models/auth/JWT';

@Injectable()
export class TutorBitsDataService extends IDataService {
  private readonly AuthTokenKey = 'auth';
  private readonly CurrentRouteKey = 'currentRoute';
  constructor(private storage: IStorageService) { super(); }

  public GetAuthToken(): JWT {
    return this.storage.GetItem(this.AuthTokenKey) as JWT;
  }

  public SetAuthToken(token: JWT): void {
    this.storage.SetItem(this.AuthTokenKey, token);
  }

  public GetCurrentRoute(): string {
    const currentRoute = this.storage.GetItem(this.CurrentRouteKey);
    if (!currentRoute) {
      return null;
    }
    return decodeURIComponent(currentRoute as string);
  }

  public SetCurrentRoute(route: string): void {
    this.storage.SetItem(this.CurrentRouteKey, route);
  }
}
