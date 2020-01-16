import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IErrorService } from '../abstract/IErrorService';
import { MatSnackBar, SimpleSnackBar, MatSnackBarRef } from '@angular/material';
import { Router, Event, NavigationStart } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { IEventService } from '../abstract/IEventService';
import { ILogService } from '../abstract/ILogService';

@Injectable()
export class TutorBitsErrorService extends IErrorService {
  private lastSnackbar: MatSnackBarRef<SimpleSnackBar> = null;
  private lastSnackBarCloseListener: Subscription;

  constructor(private snackBar: MatSnackBar, private router: Router, private eventService: IEventService, private logService: ILogService) {
    super();
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (this.lastSnackbar) {
          this.lastSnackbar.dismiss();
          this.lastSnackbar = null;
        }
      }
    });
  }

  public HandleError(component: string, error: string): void {
    const message = `${component} - ${error}`;
    this.logService.LogErrorToConsole(component, error);
    if (this.lastSnackbar) {
      if (this.lastSnackbar.instance.data.message === message) {
        return; // Already showing
      }
      this.lastSnackbar.dismiss();
      if (this.lastSnackBarCloseListener) {
        this.lastSnackBarCloseListener.unsubscribe();
      }
    }

    this.lastSnackbar = this.snackBar.open(message, 'close');

    this.lastSnackBarCloseListener = this.lastSnackbar.afterDismissed().subscribe(() => {
      this.lastSnackbar = null;
      if (!this.lastSnackBarCloseListener) {
        return;
      }

      this.lastSnackBarCloseListener.unsubscribe();
    });

    this.eventService.TriggerError(component, error);
  }

  public ClearError(): void {
    if (this.lastSnackbar) {
      this.lastSnackbar.dismiss();
    }
  }
}
