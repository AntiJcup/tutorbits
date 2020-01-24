import { Component, OnInit } from '@angular/core';
import { UpdateAccountUserName } from 'src/app/models/user/update-account-user-name';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './account-update-user-name.component.html',
  styleUrls: ['./account-update-user-name.component.sass']
})
export class AccountUpdateUserNameComponent implements OnInit {
  loading = false;
  form = new FormGroup({});
  accountId: string;
  model: UpdateAccountUserName = { userName: null };
  fields: FormlyFieldConfig[] = [{
    model: this.model,
    key: 'userName',
    type: 'input',
    templateOptions: {
      label: 'New User Name',
      placeholder: 'Enter New UserName',
      required: true,
      minLength: 4,
      maxLength: 256,
    },
    validators: {
      name($viewValue, $modelValue, scope) {
        const value = $viewValue.value;
        if (value) {
          return (/^[a-z0-9._-]+$/i).test(value);
        }
      }
    }
  }
  ];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private logServer: ILogService,
    private accountService: TutorBitsAccountService,
    private errorServer: IErrorService,
    private titleService: ITitleService) { }

  ngOnInit() {
    this.titleService.SetTitle('Update UserName');
    this.model.userName = this.route.snapshot.paramMap.get('currentUserName');
    this.accountId = this.route.snapshot.paramMap.get('accountId');
  }

  async submit(model: UpdateAccountUserName) {
    this.logServer.LogToConsole('AccountUpdateUserName', model);
    this.loading = true;

    try {
      await this.accountService.UpdateNickName(model.userName, this.accountId);
      this.router.navigate(['myaccount']);
    } catch (err) {
      this.errorServer.HandleError('AccountUpdateUserName', `${err}`);
    }

    this.loading = false;
  }
}
