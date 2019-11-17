import { InjectionToken } from '@angular/core';
import { JWT } from 'src/app/models/auth/JWT';

export abstract class IDataService {
    public abstract GetAuthToken(): JWT;
    public abstract SetAuthToken(token: JWT): void;
}