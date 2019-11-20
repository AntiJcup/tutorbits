import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IErrorService } from './abstract/IErrorService';
import { MatSnackBar, SimpleSnackBar, MatSnackBarRef } from '@angular/material';
import { Router, Event, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable()
export class TutorBitsErrorService extends IErrorService {
  private lastSnackbar: MatSnackBarRef<SimpleSnackBar> = null;

  constructor(private snackBar: MatSnackBar, private router: Router) {
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
    if (this.lastSnackbar) {
      this.lastSnackbar.dismiss();
    }

    this.lastSnackbar = this.snackBar.open(`${component} - ${error}`, null);
  }

  public ClearError(): void {
    if (this.lastSnackbar) {
      this.lastSnackbar.dismiss();
    }
  }
}
