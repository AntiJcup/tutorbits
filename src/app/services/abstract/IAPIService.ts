import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';

export abstract class IAPIService {
    public abstract getRequestInfo(): ApiHttpRequestInfo;
    public abstract generateRequest(): ApiHttpRequest;
}
