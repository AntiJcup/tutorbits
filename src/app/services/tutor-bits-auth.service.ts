import { Injectable } from '@angular/core';
import { TutorBitsApiService } from './tutor-bits-api.service';
import { environment } from 'src/environments/environment';
import { TutorBitsStorageService } from './tutor-bits-storage.service';
import { IAuthService, JWT } from './interfaces/IAuthService';

interface JWTRequest {
  grant_type: string;
  code: string;
  client_id: string;
  redirect_uri: string;
}

@Injectable({
  providedIn: 'root'
})
export class TutorBitsAuthService implements IAuthService {
  private baseHeaders = {
    'Content-Type': 'application/json'
  };
  private token: JWT;

  public getToken() {
    return this.token;
  }

  public getAuthHeader(): { [name: string]: string } {
    return {
      Authorization: this.token.token_type + ' ' + this.token.access_token
    };
  }

  private getHeaders(): { [name: string]: string } {
    return { ...this.baseHeaders, ...this.getAuthHeader() };
  }

  constructor(protected apiService: TutorBitsApiService, protected storageService: TutorBitsStorageService) { }

  public async Login(code: string): Promise<void> {
    const requestBody: JWTRequest = {
      grant_type: 'authorization_code',
      code,
      client_id: environment.loginClientId,
      redirect_uri: environment.loginRedirectUri
    };

    const response = await this.apiService.generateRequest().Post(`${environment.loginTokenUrl}`,
      JSON.stringify(requestBody), this.getHeaders());

    if (!response.ok) {
      return;
    }

    const responseToken: JWT = await response.json();
    this.token = responseToken;
  }

  public Logout(): void {

  }

  public async RefreshToken(): Promise<void> {

  }

  public LoadCachedToken(): JWT {
    return null;
  }
}
