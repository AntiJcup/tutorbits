import { Component, OnInit } from '@angular/core';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ActivatedRoute } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ReturnStatement } from '@angular/compiler';
import { environment } from 'src/environments/environment';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsAccountService } from 'src/app/services/tutor-bits-account.service';

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
    private logger: ILogService) { }

  ngOnInit() {
    const code: string = this.route.snapshot.queryParamMap.get('code');
    this.authService.Login(code).then((a) => {
      this.accountService.Login().then((account) => {
        this.logger.LogToConsole('LoginComponent', `Logged in ${JSON.stringify(account)}`);
      }).catch((err) => {
        this.errorServer.HandleError('LoginError', JSON.stringify(err));
      });;
    }).catch((err) => {
      this.errorServer.HandleError('LoginError', JSON.stringify(err));
    });
  }

}
