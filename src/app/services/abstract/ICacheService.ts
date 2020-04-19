import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';

export interface CacheOptions {
    cacheDuration: number;
    overrideCacheKey?: string;
}

export abstract class ICacheService {
    public abstract async CachePromise(
        key: string,
        createCallback: () => Promise<any>,
        options?: CacheOptions): Promise<any>;
        public abstract async CacheFunc(
            func: () => Promise<any>,
            options?: CacheOptions): Promise<any>;
    public abstract ClearCache(): void;
    public abstract ClearCacheForKey(key: string): void;
}
