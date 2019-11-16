import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { InjectionToken } from '@angular/core';

export interface JWT {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export abstract class IAuthService {
    public abstract getToken();
    public abstract getAuthHeader(): { [name: string]: string };
    public abstract Login(code: string): Promise<void>;
    public abstract Logout(): void;
}