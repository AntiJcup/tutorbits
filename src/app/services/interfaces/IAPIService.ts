import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export interface IAPIService {
    getRequestInfo(): ApiHttpRequestInfo;
    generateRequest(): ApiHttpRequest;
}
