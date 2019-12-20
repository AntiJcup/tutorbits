import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IAuthService } from './services/abstract/IAuthService';
import { Router, NavigationEnd, Route, ActivatedRoute, NavigationStart } from '@angular/router';
import { IEventService } from './services/abstract/IEventService';
import { ITitleService } from './services/abstract/ITitleService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})

export class AppComponent implements OnInit {
  public loginUrl: string;
  public logoutUrl: string;
  public loggedIn = false;
  public title = 'Home';

  constructor(
    private auth: IAuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private eventService: IEventService,
    private titleService: ITitleService) {
    this.loginUrl = environment.loginUrl;
    this.logoutUrl = environment.logoutUrl;

    this.titleService.GetTitleObs().subscribe((title: string) => {
      this.title = title;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.eventService.TriggerPageView(event.urlAfterRedirects);
      }

      if (event instanceof NavigationStart) {
        this.titleService.SetTitle('');
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
