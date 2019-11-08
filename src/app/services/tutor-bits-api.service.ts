import { Injectable } from '@angular/core';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorBitsApiService {
  private baseRequestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  public get requestInfo(): ApiHttpRequestInfo {
    return this.baseRequestInfo;
  }

  constructor() { }

  public generateRequest(): ApiHttpRequest {
    return new ApiHttpRequest(this.baseRequestInfo);
  }
}
