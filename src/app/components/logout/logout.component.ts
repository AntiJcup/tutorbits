import { Component, OnInit } from '@angular/core';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ActivatedRoute } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

@Component({
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.sass']
})
export class LogoutComponent implements OnInit {

  constructor(
    private authService: IAuthService,
    private errorServer: IErrorService) { }

  ngOnInit() {
    this.authService.Logout();
  }

}
