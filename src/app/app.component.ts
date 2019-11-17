import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './services/abstract/IAuthService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})

export class AppComponent implements OnInit {
  public loginUrl: string;
  public logoutUrl: string;
  public loggedIn = false;

  constructor(private auth: IAuthService) {
    this.loginUrl = environment.loginUrl;
    this.logoutUrl = environment.logoutUrl;
  }

  ngOnInit(): void {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
      }
    }, false);

    this.auth.getTokenObserver().subscribe((token) => {
      this.loggedIn = !!token;
    });
  }
}
