import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class TutorBitsMobileGuardService implements CanActivate {
  constructor(private deviceService: DeviceDetectorService, public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.deviceService.isDesktop()) {
      this.router.navigate(['mobilenotsupported']);
      return false;
    }
    return true;
  }
}
