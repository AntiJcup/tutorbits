import { Injectable } from '@angular/core';
import { IAuthService } from './abstract/IAuthService';
import { Router, CanActivate } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorBitsAuthGuardService implements CanActivate {
  constructor(public auth: IAuthService, public router: Router) { }

  canActivate(): boolean {
    if (!this.auth.IsLoggedIn()) {
      window.location.href = environment.loginUrl;
      return false;
    }
    return true;
  }
}
