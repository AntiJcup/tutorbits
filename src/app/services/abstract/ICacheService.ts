import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';

export abstract class ICacheService {
    public abstract async GetFullUrlCached(url: string, requestHeaders?: { [headerName: string]: string }): Promise<Response>;
    public abstract async GetCached(path: string, requestHeaders?: { [headerName: string]: string }): Promise<Response>;
    public abstract ClearCache(): void;
    public abstract ClearCacheForKey(key: string): void;
    public abstract ClearCacheForPath(path: string): void;
    public abstract ClearCacheForUrl(url: string): void;
}
