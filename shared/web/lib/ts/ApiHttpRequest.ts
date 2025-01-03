export interface ApiHttpRequestInfo {
    host: string;
    credentials: string;
    headers: { [headerName: string]: string };
}

export class ApiHttpRequest {
    constructor(public requestInfo: ApiHttpRequestInfo) {

    }
    public async GetFullUrl(url: string, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
        return await fetch(url, this.generateRequestInfo('GET', null, requestHeaders));
    }

    public async Get(path: string, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
        return await fetch(`${this.requestInfo.host}/${path}`, this.generateRequestInfo('GET', null, requestHeaders));
    }

    public async Post(path: string, body?: any, requestHeaders?: { [headerName: string]: string }): Promise<Response> {
        return await fetch(`${this.requestInfo.host}/${path}`, this.generateRequestInfo('POST', body, requestHeaders));
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
            credentials: this.requestInfo.credentials,
            headers: { ...this.requestInfo.headers, ...requestHeaders }, // merge the dictionaries
            body: requestBody
        };
    }
}
