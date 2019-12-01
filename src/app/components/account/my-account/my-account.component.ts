import { Component, OnInit } from '@angular/core';
import { IUserApiService } from 'src/app/services/abstract/IUserApiService';
import { ViewUser } from 'src/app/models/user/view-user';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsAccountService } from 'src/app/services/tutor-bits-account.service';
import { ViewAccount } from 'src/app/models/user/view-account';

@Component({
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.sass']
})
export class MyAccountComponent implements OnInit {
  account: ViewAccount;
  loading = true;

  constructor(
    protected accountService: TutorBitsAccountService,
    private errorServer: IErrorService,
    private logServer: ILogService) { }

  ngOnInit() {
    this.accountService.GetAccountInformation().then((account: ViewAccount) => {
      this.account = account;
    }).catch((err) => {
      this.errorServer.HandleError('MyAccountComponent', `${err}`);
    }).finally(() => {
      this.loading = false;
    });
  }

}