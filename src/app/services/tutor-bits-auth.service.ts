import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './abstract/IAuthService';
import { IAPIService } from './abstract/IAPIService';
import { JWT } from '../models/auth/JWT';
import { IDataService } from './abstract/IDataService';
import { BehaviorSubject } from 'rxjs';

interface JWTRequest {
  grant_type: string;
  code: string;
  client_id: string;
  redirect_uri: string;
}

interface JWTRefreshRequest {
  grant_type: string;
  client_id: string;
  refresh_token: string;
}

@Injectable()
export class TutorBitsAuthService extends IAuthService {
  private baseHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  private token: JWT;
  private tokenObs: BehaviorSubject<JWT> = new BehaviorSubject(this.token);

  public async getToken(): Promise<JWT> {
    await this.RefreshToken();
    return this.token;
  }

  private updateToken(token: JWT): void {
    this.token = token;
    this.dataService.SetAuthToken(this.token);
    this.tokenObs.next(this.token);
  }

  public getTokenObserver(): BehaviorSubject<JWT> {
    return this.tokenObs;
  }

  public async getAuthHeader(): Promise<{ [name: string]: string }> {
    await this.getToken();
    return {
      Authorization: this.token.token_type + ' ' + this.token.access_token
    };
  }

  private getHeaders(): { [name: string]: string } {
    return { ...this.baseHeaders };
  }

  constructor(protected apiService: IAPIService, protected dataService: IDataService) { super(); }

  public async Login(code: string): Promise<void> {
    const requestBody: JWTRequest = {
      grant_type: 'authorization_code',
      code,
      client_id: environment.loginClientId,
      redirect_uri: environment.loginRedirectUri
    };

    const response = await this.apiService.generateRequest().PostFormFullUrl(`${environment.loginTokenUrl}`,
      requestBody, this.getHeaders());

    if (!response.ok) {
      return;
    }

    const responseToken: JWT = await response.json();
    this.updateToken(responseToken);
  }

  public Logout(): void {
    this.token = null;
    this.dataService.SetAuthToken(this.token);
  }

  public async RefreshToken(): Promise<void> {
    if (this.IsTokenValid(this.token)) {
      return;
    }

    const requestBody: JWTRefreshRequest = {
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token,
      client_id: environment.loginClientId
    };

    const response = await this.apiService.generateRequest().PostFormFullUrl(`${environment.loginTokenUrl}`,
      requestBody, this.getHeaders());

    if (!response.ok) {
      return;
    }

    const responseToken: JWT = await response.json();
    this.updateToken(responseToken);
  }

  public async LoadCachedToken(): Promise<void> {
    const cachedToken = this.dataService.GetAuthToken();
    if (!cachedToken) {
      return;
    }

    if (cachedToken.expire_date <= (new Date()).valueOf()) {
      await this.RefreshToken();
    }
  }

  private IsTokenValid(token: JWT): boolean {
    return token.expire_date <= (new Date()).valueOf();
  }
}
