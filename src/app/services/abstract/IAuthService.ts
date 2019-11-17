import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';
import { JWT } from 'src/app/models/auth/JWT';

export abstract class IAuthService {
    public abstract getToken(): Promise<JWT>;
    public abstract getAuthHeader(): Promise<{ [name: string]: string }>;
    public abstract Login(code: string): Promise<void>;
    public abstract Logout(): void;
}