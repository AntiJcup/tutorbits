import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './abstract/IAuthService';
import { IAPIService } from './abstract/IAPIService';
import { JWT } from '../models/auth/JWT';
import { IDataService } from './abstract/IDataService';

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

  public async getToken(): Promise<JWT> {
    await this.RefreshToken();
    return this.token;
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
    this.token = responseToken;
    this.dataService.SetAuthToken(this.token);
  }

  public Logout(): void {

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
    this.token = responseToken;
    this.dataService.SetAuthToken(this.token);
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
