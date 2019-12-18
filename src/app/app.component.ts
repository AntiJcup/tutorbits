import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './services/abstract/IAuthService';
import { Router, NavigationEnd } from '@angular/router';
import { IEventService } from './services/abstract/IEventService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})

export class AppComponent implements OnInit {
  public loginUrl: string;
  public logoutUrl: string;
  public loggedIn = false;

  constructor(
    private auth: IAuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private eventService: IEventService) {
    this.loginUrl = environment.loginUrl;
    this.logoutUrl = environment.logoutUrl;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.eventService.TriggerPageView(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
      }
    }, false);

    this.auth.getTokenObserver().subscribe((token) => {
      this.zone.runTask(() => {
        this.loggedIn = !!token;
        this.cdr.detectChanges();
      });
    });
  }
}
