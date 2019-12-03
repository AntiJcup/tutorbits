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
  tutorialsByType: { [key: string]: ViewTutorial[] } = {};
  tutorialTypes: string[] = [];
  loading = true;
  allKey = 'All';

  constructor(
    private router: Router,
    private tutorialsService: TutorBitsTutorialService,
    private errorServer: IErrorService,
    private logServer: ILogService) { }

  ngOnInit() {
    this.tutorialsService.GetAll().then((tutorials) => {
      this.tutorials = tutorials;
      this.logServer.LogToConsole('ViewTutorials', tutorials.length);
      this.tutorials.forEach(element => {
        this.tutorialsByType[this.allKey] = this.tutorialsByType[this.allKey] ? this.tutorialsByType[this.allKey] : [];
        this.tutorialsByType[this.allKey].push(element);

        this.tutorialsByType[element.type] = this.tutorialsByType[element.type] ? this.tutorialsByType[element.type] : [];
        this.tutorialsByType[element.type].push(element);
        
        if (this.tutorialTypes.indexOf(element.type) === -1) {
          this.tutorialTypes.push(element.type);
        }
      });

      this.tutorialTypes.push(this.allKey);
    }).catch((e) => {
      this.errorServer.HandleError('ViewTutorials', e);
    }).finally(() => {
      this.loading = false;
    });
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    this.logServer.LogToConsole('ViewTutorials', 'card clicked', tutorial);
    this.router.navigate([`watch/${tutorial.id}`]);
  }

}
