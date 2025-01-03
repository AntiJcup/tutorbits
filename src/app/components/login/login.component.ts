import { Component, OnInit } from '@angular/core';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ActivatedRoute, Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ReturnStatement } from '@angular/compiler';
import { environment } from 'src/environments/environment';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';
import { IDataService } from 'src/app/services/abstract/IDataService';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(
    private authService: IAuthService,
    private accountService: TutorBitsAccountService,
    private route: ActivatedRoute,
    private errorServer: IErrorService,
    protected dataService: IDataService,
    private logger: ILogService,
    protected router: Router) { }

  async ngOnInit() {
    const code: string = this.route.snapshot.queryParamMap.get('code');
    try {
      await this.authService.AuthenticateToken(code);
      const account = this.accountService.Login();
      this.logger.LogToConsole('LoginComponent', `Logged in ${JSON.stringify(account)}`);
      const newRoute = this.dataService.GetCurrentRoute();
      this.dataService.SetCurrentRoute(null);
      if (newRoute) {
        this.router.navigate([newRoute]);
      } else {
        this.router.navigate(['home']);
      }
    } catch (err) {
      this.errorServer.HandleError('LoginError', err);
    }
  }

}
