import { Injectable } from '@angular/core';
import { CacheOptions, ICacheService } from './abstract/ICacheService';
import { Observable, defer, from } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ILogService } from './abstract/ILogService';

@Injectable()
export class TutorBitsCacheService extends ICacheService {
  private defaultCacheOptions: CacheOptions = {
    cacheDuration: environment.defaultCacheDurationMS
  };

  private cache: Map<string, Observable<any>> = new Map<string, Observable<any>>();

  constructor(private logger: ILogService) { super(); }

  public async CachePromiseKey(
    key: string,
    createCallback: () => Promise<any>,
    options: CacheOptions = this.defaultCacheOptions): Promise<any> {
    return this.GetCreateCacheEntry(key, () => defer(() => from(createCallback())), options);
  }

  // For best caching key results make sure to implement toString() functions for objects
  // Do not call this on for functions that are shared on many instances of the same class
  // Use CachFuncKey and define your own key to distinguish between them
  public async CacheFunc(
    func: (...args: any[]) => Promise<any>,
    target: any,
    ...args: any[]): Promise<any> {
    return this.GetCreateCacheEntry(
      this.GenerateKeyFromFunction(func, target, args), () => defer(() => from(func.apply(target, args))), this.defaultCacheOptions);
  }

  public async CacheFuncOptions(
    options: CacheOptions,
    func: (...args: any[]) => Promise<any>,
    target: any,
    ...args: any[]): Promise<any> {
    return this.GetCreateCacheEntry(
      this.GenerateKeyFromFunction(func, target, args),
      () => defer(() => from(func.apply(target, args))),
      options || this.defaultCacheOptions);
  }

  public async CacheFuncKey(
    key: string,
    func: (...args: any[]) => Promise<any>,
    target: any,
    ...args: any[]): Promise<any> {
    return this.GetCreateCacheEntry(
      key, () => defer(() => from(func.apply(target, args))), this.defaultCacheOptions);
  }

  public async CacheFuncKeyOptions(
    key: string,
    options: CacheOptions,
    func: (...args: any[]) => Promise<any>,
    target: any,
    ...args: any[]): Promise<any> {
    return this.GetCreateCacheEntry(
      key, () => defer(() => from(func.apply(target, args))), options || this.defaultCacheOptions);
  }

  public ClearCache(): void {
    this.logger.LogToConsole('Caching', `clearing cache`);
    this.cache.clear();
  }

  public ClearCacheForKey(key: string): void {
    this.logger.LogToConsole('Caching', `clearing cache for key: ${key}`);
    this.cache.delete(key);
  }

  public ClearCacheForFunc(
    func: (...args: any[]) => Promise<any>,
    target: any,
    ...args: any[]) {
    this.ClearCacheForKey(this.GenerateKeyFromFunction(func, target, [args]));
  }

  private GetCreateCacheEntry(key: string, createCallback: () => Observable<any>, options: CacheOptions): Promise<any> {
    if (!this.cache.has(key)) {
      this.logger.LogToConsole('Caching', `caching new key: ${key} for: ${options.cacheDuration}`);
      const newCacheEntry = createCallback().pipe(
        shareReplay(1));
      this.cache.set(key, newCacheEntry);
      setTimeout(() => {
        this.ClearCacheForKey(key);
      }, options.cacheDuration);
    } else {
      this.logger.LogToConsole('Caching', `found cache for key: ${key}`);
    }

    const cacheEntry: Observable<Response> = this.cache.get(key);
    return cacheEntry.toPromise();
  }

  private GenerateKeyFromFunction(func: () => Promise<any>, target: any, args: any[]) {
    return `${typeof (target)}::${target.constructor.name}::${func.name}(${args.map((value: any, index: number, array: any[]) => `${typeof (value)}::${(value != null && typeof (value) !== 'undefined') ? value.constructor.name : "null"}::${value}`).join(',')})`;
  }
}
