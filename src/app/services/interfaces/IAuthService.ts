import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export interface JWT {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface IAuthService {
    getToken();
    getAuthHeader(): { [name: string]: string };
    Login(code: string): Promise<void>;
    Logout(): void;
}
