import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './abstract/IAuthService';
import { IAPIService } from './abstract/IAPIService';
import { JWT } from '../models/auth/JWT';
import { IDataService } from './abstract/IDataService';
import { BehaviorSubject } from 'rxjs';
import { ILogService } from './abstract/ILogService';
import { IErrorService } from './abstract/IErrorService';

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
  private refreshLookAheadMilliseconds = 1000 * 60 * 5;

  public async getToken(): Promise<JWT> {
    await this.RefreshToken();
    return this.token;
  }

  private updateToken(token: JWT): void {
    this.token = token;
    if (this.token && !this.token.expire_date) {
      this.token.expire_date = (new Date()).valueOf() + (this.token.expires_in * 1000);
    }
    this.dataService.SetAuthToken(this.token);
    this.tokenObs.next(this.token);
  }

  public getTokenObserver(): BehaviorSubject<JWT> {
    this.getToken().then();
    return this.tokenObs;
  }

  public async getAuthHeader(): Promise<{ [name: string]: string }> {
    await this.getToken();
    if (!this.token) {
      throw new Error('Not logged in');
    }
    return {
      Authorization: this.token.token_type + ' ' + this.token.access_token
    };
  }

  private getHeaders(): { [name: string]: string } {
    return { ...this.baseHeaders };
  }

  constructor(
    protected apiService: IAPIService,
    protected dataService: IDataService,
    protected logServer: ILogService,
    protected errorServer: IErrorService) {
    super();
    try {
      this.updateToken(this.dataService.GetAuthToken());
    } catch (err) {
      // Try to load if it isnt there it blows up
    }
  }

  public async Login(code: string): Promise<void> {
    try {
      this.logServer.LogToConsole('AuthService', `Logging in with ${code}`);
      const requestBody: JWTRequest = {
        grant_type: 'authorization_code',
        code,
        client_id: environment.loginClientId,
        redirect_uri: environment.loginRedirectUri
      };

      const response = await this.apiService.generateRequest().PostFormFullUrl(`${environment.loginTokenUrl}`,
        requestBody, this.getHeaders());

      if (!response.ok) {
        this.errorServer.HandleError('AuthService', `Login Error: ${response.status}: ${response.statusText}`);
        return;
      }

      const responseToken: JWT = await response.json();
      this.updateToken(responseToken);
    } catch (err) {
      this.errorServer.HandleError('AuthService', `Login Exception: ${err}`);
    }
  }

  public Logout(): void {
    this.logServer.LogToConsole('AuthService', `Logging out`);
    this.token = null;
    this.updateToken(this.token);
  }

  public async RefreshToken(): Promise<void> {
    try {
      if (!this.token || this.IsTokenValid(this.token)) {
        return;
      }
      this.logServer.LogToConsole('AuthService', `Refreshing token`, this.token);

      const requestBody: JWTRefreshRequest = {
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token,
        client_id: environment.loginClientId
      };

      const response = await this.apiService.generateRequest().PostFormFullUrl(`${environment.loginTokenUrl}`,
        requestBody, this.getHeaders());

      if (!response.ok) {
        this.errorServer.HandleError('AuthService', `Refresh Token Error: ${response.status}: ${response.statusText}`);
        return;
      }

      const responseToken: JWT = await response.json();
      this.updateToken(responseToken);
    } catch (err) {
      this.errorServer.HandleError('AuthService', `Refresh Token Exception: ${err}`);
    }
  }

  public async LoadCachedToken(): Promise<void> {
    this.logServer.LogToConsole('AuthService', `Loading cached token`);
    const cachedToken = this.dataService.GetAuthToken();
    if (!cachedToken) {
      return;
    }

    if (cachedToken && !this.IsTokenValid(cachedToken)) {
      await this.RefreshToken();
    }

    this.logServer.LogToConsole('AuthService', `Loaded cached token`, this.token);
  }

  private IsTokenValid(token: JWT): boolean {
    return token && token.expire_date >= ((new Date()).valueOf() + this.refreshLookAheadMilliseconds);
  }
}
