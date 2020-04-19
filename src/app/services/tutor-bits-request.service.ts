import { Injectable } from '@angular/core';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { environment } from 'src/environments/environment';
import { IRequestService } from './abstract/IRequestService';

@Injectable()
export class TutorBitsRequestService extends IRequestService {
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

  public async GetFullUrl(url: string, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
    return await fetch(url, this.generateRequestInfo('GET', null, requestHeaders));
  }

  public async Get(path: string, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
    return await fetch(`${this.baseRequestInfo.host}/${path}`, this.generateRequestInfo('GET', null, requestHeaders));
  }

  public async Post(path: string, body?: any, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
    return await fetch(`${this.baseRequestInfo.host}/${path}`, this.generateRequestInfo('POST', body, requestHeaders));
  }

  public async PostFormFullUrl(
    url: string,
    body: { [key: string]: any },
    requestHeaders?: { [headerName: string]: string }): Promise<Response> {

    const searchParams = Object.keys(body).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
    }).join('&');

    return await fetch(`${url}`, this.generateRequestInfo('POST', searchParams, requestHeaders));
  }

  protected generateRequestInfo(requestMethod: string, requestBody?: any, requestHeaders?: { [headerName: string]: string }): any {
    return {
      method: requestMethod,
      credentials: this.baseRequestInfo.credentials,
      headers: { ...this.baseRequestInfo.headers, ...requestHeaders }, // merge the dictionaries
      body: requestBody
    };
  }
}
