import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export abstract class IRequestService {
    public abstract getRequestInfo(): ApiHttpRequestInfo;
    public abstract generateRequest(): ApiHttpRequest;

    public abstract async GetFullUrl(url: string, requestHeaders?: { [headerName: string]: string }): Promise<Response>;
    public abstract async Get(path: string, requestHeaders?: { [headerName: string]: string }): Promise<Response>;
    public abstract async Post(path: string, body?: any, requestHeaders?: { [headerName: string]: string }): Promise<Response>;

    public abstract async PostFormFullUrl(
        url: string,
        body: { [key: string]: any },
        requestHeaders?: { [headerName: string]: string }): Promise<Response>;
}
