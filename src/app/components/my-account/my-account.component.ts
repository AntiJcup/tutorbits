import { Component, OnInit } from '@angular/core';
import { IUserApiService } from 'src/app/services/abstract/IUserApiService';
import { ViewUser } from 'src/app/models/user/view-user';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.sass']
})
export class MyAccountComponent implements OnInit {
  user: ViewUser;
  loading = true;

  constructor(
    protected userApi: IUserApiService,
    private errorServer: IErrorService,
    private logServer: ILogService) { }

  ngOnInit() {
    this.userApi.GetUserInfo().then((user: ViewUser) => {
      this.user = user;
    }).catch((err) => {
      this.errorServer.HandleError('MyAccountComponent', `${err}`);
    }).finally(() => {
      this.loading = false;
    });
  }

}
