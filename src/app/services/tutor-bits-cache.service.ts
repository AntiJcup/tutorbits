import { Injectable } from '@angular/core';
import { IRequestService } from './abstract/IRequestService';
import { ICacheService } from './abstract/ICacheService';
import { Observable, defer, from } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface CacheOptions {
  cacheDuration: number;
  overrideCacheKey?: string;
}

@Injectable()
export class TutorBitsCacheService extends ICacheService {
  private defaultCacheOptions: CacheOptions = {
    cacheDuration: environment.defaultCacheDurationMS
  };

  private cache: Map<string, Observable<Response>> = new Map<string, Observable<Response>>();

  constructor(private requestService: IRequestService) { super(); }

  public async GetFullUrlCached(
    url: string,
    requestHeaders?: { [headerName: string]: string },
    options: CacheOptions = this.defaultCacheOptions): Promise<Response> {
    return this.GetCreateCacheEntry(url, () => defer(() => from(this.requestService.GetFullUrl(url, requestHeaders))), options);
  }

  public async GetCached(
    path: string,
    requestHeaders?: { [headerName: string]: string },
    options: CacheOptions = this.defaultCacheOptions): Promise<Response> {
    return this.GetCreateCacheEntry(path, () => defer(() => from(this.requestService.Get(path, requestHeaders))), options);
  }

  public ClearCache(): void {
    this.cache.clear();
  }

  public ClearCacheForKey(key: string): void {
    this.cache.delete(key);
  }

  public ClearCacheForPath(path: string): void {
    this.ClearCacheForKey(path);
  }

  public ClearCacheForUrl(url: string): void {
    this.ClearCacheForKey(url);
  }

  private GetCreateCacheEntry(key: string, createCallback: () => Observable<Response>, options: CacheOptions): Promise<Response> {
    if (!this.cache.has(key)) {
      this.cache.set(key, createCallback().pipe(shareReplay(1, options.cacheDuration)));
    }

    const cacheEntry: Observable<Response> = this.cache.get(key);
    return cacheEntry.toPromise();
  }
}
