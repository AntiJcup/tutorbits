import { Injectable } from '@angular/core';
import { CacheOptions, ICacheService } from './abstract/ICacheService';
import { Observable, defer, from } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable()
export class TutorBitsCacheService extends ICacheService {
  private defaultCacheOptions: CacheOptions = {
    cacheDuration: environment.defaultCacheDurationMS
  };

  private cache: Map<string, Observable<any>> = new Map<string, Observable<any>>();

  constructor() { super(); }

  public async CachePromise(
    key: string,
    createCallback: () => Promise<any>,
    options: CacheOptions = this.defaultCacheOptions): Promise<any> {
    return this.GetCreateCacheEntry(key, () => defer(() => from(createCallback())), options);
  }

  public async CacheFunc(
    func: () => Promise<any>,
    options: CacheOptions = this.defaultCacheOptions): Promise<any> {
    return this.GetCreateCacheEntry(this.GenerateKeyFromFunction(func), () => defer(() => from(func())), options);
  }

  public ClearCache(): void {
    this.cache.clear();
  }

  public ClearCacheForKey(key: string): void {
    this.cache.delete(key);
  }

  private GetCreateCacheEntry(key: string, createCallback: () => Observable<any>, options: CacheOptions): Promise<any> {
    if (!this.cache.has(key)) {
      const newCacheEntry = createCallback().pipe(
        shareReplay(1));
      this.cache.set(key, newCacheEntry);
      setTimeout(() => {
        this.ClearCacheForKey(key);
      }, options.cacheDuration);
    }

    const cacheEntry: Observable<Response> = this.cache.get(key);
    return cacheEntry.toPromise();
  }

  private GenerateKeyFromFunction(func: () => Promise<any>) {
    return func.name;
  }
}
