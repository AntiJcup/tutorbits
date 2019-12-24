import { InjectionToken } from '@angular/core';
import { JWT } from 'src/app/models/auth/JWT';

export abstract class IDataService {
    public abstract GetAuthToken(): JWT;
    public abstract SetAuthToken(token: JWT): void;

    public abstract GetCurrentRoute(): string;
    public abstract SetCurrentRoute(route: string): void;

    public abstract GetShownWatchHelp(): boolean;
    public abstract SetShownWatchHelp(shown: boolean): void;
}
