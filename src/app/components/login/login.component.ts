import { Component, OnInit } from '@angular/core';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ActivatedRoute } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ReturnStatement } from '@angular/compiler';
import { environment } from 'src/environments/environment';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(
    private authService: IAuthService,
    private route: ActivatedRoute,
    private errorServer: IErrorService) { }

  ngOnInit() {
    const code: string = this.route.snapshot.queryParamMap.get('code');
    this.authService.Login(code).then((a) => {
      // TODO nav to old url
    }).catch((e) => {
      this.errorServer.HandleError('LoginError', JSON.stringify(e));
    });
  }

}
