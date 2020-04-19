import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';

export interface CacheOptions {
    cacheDuration: number;
    overrideCacheKey?: string;
}

export abstract class ICacheService {
    public abstract async CachePromiseKey(
        key: string,
        createCallback: () => Promise<any>,
        options?: CacheOptions): Promise<any>;
    public abstract async CacheFuncKey(
        key: string,
        func: (...args: any[]) => Promise<any>,
        ...args: any[]): Promise<any>;
    public abstract async CacheFunc(
        func: (...args: any[]) => Promise<any>,
        ...args: any[]): Promise<any>;
    public abstract ClearCache(): void;
    public abstract ClearCacheForKey(key: string): void;
    public abstract ClearCacheForFunc(
        func: (...args: any[]) => Promise<any>,
        target: any,
        ...args: any[]);
}
