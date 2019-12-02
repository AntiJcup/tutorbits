import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
  confirmMessage?: string;
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class TutorBitsPendingChangesGuardService implements CanDeactivate<ComponentCanDeactivate> {
  constructor(public auth: IAuthService, public router: Router) { }

  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    // if there are no pending changes, just allow deactivation; else confirm first
    return component.canDeactivate() ?
      true :
      // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
      // when navigating away from your angular app, the browser will show a generic warning message
      // see http://stackoverflow.com/a/42207299/7307355
      confirm(component.confirmMessage ? component.confirmMessage :
        'WARNING: You have unsaved changes. Press Cancel to go back or OK to lose these changes.');
  }
}
