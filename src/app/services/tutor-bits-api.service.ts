import { Injectable } from '@angular/core';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { environment } from 'src/environments/environment';
import { IAPIService } from './abstract/IAPIService';

@Injectable()
export class TutorBitsApiService extends IAPIService {
  private baseRequestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  public getRequestInfo(): ApiHttpRequestInfo {
    return this.baseRequestInfo;
  }

  constructor() { super(); }

  public generateRequest(): ApiHttpRequest {
    return new ApiHttpRequest(this.baseRequestInfo);
  }
}
