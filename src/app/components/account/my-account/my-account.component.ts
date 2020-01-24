import { Component, OnInit } from '@angular/core';
import { IUserApiService } from 'src/app/services/abstract/IUserApiService';
import { ViewUser } from 'src/app/models/user/view-user';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';
import { ViewAccount } from 'src/app/models/user/view-account';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

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
    private logServer: ILogService,
    private titleService: ITitleService) { }

  async ngOnInit() {
    this.titleService.SetTitle('Account');

    try {
      this.account = await this.accountService.GetAccountInformation();
    } catch (err) {
      this.errorServer.HandleError('MyAccountComponent', `${err}`);
    }

    this.loading = false;
  }

}
