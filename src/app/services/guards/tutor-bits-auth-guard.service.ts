import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TutorBitsAuthGuardService implements CanActivate {
  constructor(public auth: IAuthService, public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.IsLoggedIn()) {
      this.auth.RequestLogin(state.url);
      return false;
    }
    return true;
  }
}
