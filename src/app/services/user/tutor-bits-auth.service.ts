import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from '../abstract/IAuthService';
import { IRequestService } from '../abstract/IRequestService';
import { JWT } from '../../models/auth/JWT';
import { IDataService } from '../abstract/IDataService';
import { BehaviorSubject } from 'rxjs';
import { ILogService } from '../abstract/ILogService';
import { IErrorService } from '../abstract/IErrorService';
import { Router } from '@angular/router';

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
    const oldRefreshToken = this.token ? this.token.refresh_token : null;
    this.token = token;
    if (this.token && !this.token.refresh_token && oldRefreshToken) { // Old refresh tokens work if there isnt a new one provided
      this.token.refresh_token = oldRefreshToken;
    }
    if (this.token && !this.token.expire_date) {
      this.token.expire_date = (new Date()).valueOf() + (this.token.expires_in * 1000);
    }
    this.dataService.SetAuthToken(this.token);
    this.tokenObs.next(this.token);

    const timeOut = Math.max(1, (this.token.expire_date - (new Date()).valueOf()) - this.refreshLookAheadMilliseconds);

    setTimeout(async () => {
      await this.RefreshToken();
    }, timeOut);
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
    protected requestService: IRequestService,
    protected dataService: IDataService,
    protected logServer: ILogService,
    protected errorServer: IErrorService,
    protected router: Router) {
    super();
    try {
      this.updateToken(this.dataService.GetAuthToken());
    } catch (err) {
      // Try to load if it isnt there it blows up
    }
  }

  public async AuthenticateToken(code: string): Promise<void> {
    try {
      this.logServer.LogToConsole('AuthService', `Logging in with ${code}`);
      const requestBody: JWTRequest = {
        grant_type: 'authorization_code',
        code,
        client_id: environment.loginClientId,
        redirect_uri: environment.loginRedirectUri
      };

      const response = await this.requestService.PostFormFullUrl(`${environment.loginTokenUrl}`,
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
      if (!this.token || this.IsTokenValid(this.token, true)) {
        return;
      }

      if (!this.token.refresh_token) {
        this.errorServer.HandleError('AuthService', `Missing refresh token`);
        this.updateToken(null);
        throw new Error('Missing refresh token');
      }

      if (!navigator.onLine) {
        return; // dont try this while offline
      }

      this.logServer.LogToConsole('AuthService', `Refreshing token`, this.token);

      const requestBody: JWTRefreshRequest = {
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token,
        client_id: environment.loginClientId
      };

      const response = await this.requestService.PostFormFullUrl(`${environment.loginTokenUrl}`,
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

    if (cachedToken) {
      await this.RefreshToken();
    }

    this.logServer.LogToConsole('AuthService', `Loaded cached token`, this.token);
  }

  private IsTokenValid(token: JWT, lookAhead: boolean): boolean {
    return token && token.expire_date >= ((new Date()).valueOf() + (lookAhead ? this.refreshLookAheadMilliseconds : 0));
  }

  public IsLoggedIn(): boolean {
    return this.IsTokenValid(this.token, false);
  }

  public RequestLogin(returnRoute: string = null): void {
    returnRoute = returnRoute || this.router.url;
    this.dataService.SetCurrentRoute(returnRoute);
    window.location.href = environment.loginUrl;
  }
}
