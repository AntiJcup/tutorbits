import { Injectable } from '@angular/core';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { environment } from 'src/environments/environment';
import { IAPIService } from './interfaces/IAPIService';

export class TutorBitsApiService implements IAPIService {
  private baseRequestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  public getRequestInfo(): ApiHttpRequestInfo {
    return this.baseRequestInfo;
  }

  constructor() { }

  public generateRequest(): ApiHttpRequest {
    return new ApiHttpRequest(this.baseRequestInfo);
  }
}
