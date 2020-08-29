import { JWT } from 'src/app/models/auth/JWT';
import { BehaviorSubject } from 'rxjs';

export abstract class IAuthService {
    public abstract getToken(): Promise<JWT>;
    public abstract getTokenObserver(): BehaviorSubject<JWT>;
    public abstract getAuthHeader(): Promise<{ [name: string]: string }>;
    public abstract AuthenticateToken(code: string): Promise<void>;
    public abstract Logout(): void;
    public abstract IsLoggedIn(): boolean;
    public abstract RequestLogin(returnRoute?: string): void;
}
