import { Component, OnInit } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { Router } from '@angular/router';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  templateUrl: './view-tutorials.component.html',
  styleUrls: ['./view-tutorials.component.sass']
})
export class ViewTutorialsComponent implements OnInit {
  tutorials: Array<ViewTutorial> = [];
  loading = true;

  constructor(
    private router: Router,
    private tutorialsService: TutorBitsTutorialService,
    private errorServer: IErrorService,
    private logServer: ILogService) { }

  ngOnInit() {
    this.tutorialsService.GetAll().then((tutorials) => {
      this.tutorials = tutorials;
      this.logServer.LogToConsole('ViewTutorials', tutorials.length);
    }).catch((e) => {
      this.errorServer.HandleError('GetError', e);
    }).finally(() => {
      this.loading = false;
    });
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    this.logServer.LogToConsole('ViewTutorials', 'card clicked', tutorial);
    this.router.navigate([`watch/${tutorial.id}`]);
  }

}
