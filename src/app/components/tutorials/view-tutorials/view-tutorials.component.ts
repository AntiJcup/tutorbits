import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { Router } from '@angular/router';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { Meta } from '@angular/platform-browser';

@Component({
  templateUrl: './view-tutorials.component.html',
  styleUrls: ['./view-tutorials.component.sass']
})
export class ViewTutorialsComponent implements OnInit, OnDestroy {
  tutorials: Array<ViewTutorial> = [];
  tutorialsByType: { [key: string]: ViewTutorial[] } = {};
  tutorialTypes: string[] = [];
  loading = true;
  allKey = 'All';

  constructor(
    private router: Router,
    private tutorialsService: TutorBitsTutorialService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private metaService: Meta) { }

  async ngOnInit() {
    this.titleService.SetTitle('TutorBits - Gallery');
    this.metaService.updateTag({
      name: 'description',
      content: `TutorBits - Home to a better programming tutorial experience. Watch as programmers write code, interact, and test the code as they write it.`
    },
      'name=\'description\'');

    try {
      const tutorials = await this.tutorialsService.GetAll();
      this.tutorials = tutorials;
      this.logServer.LogToConsole('ViewTutorials', tutorials.length);
      this.tutorials.forEach(element => {
        this.tutorialsByType[this.allKey] = this.tutorialsByType[this.allKey] ? this.tutorialsByType[this.allKey] : [];
        this.tutorialsByType[this.allKey].push(element);

        this.tutorialsByType[element.topic] = this.tutorialsByType[element.topic] ? this.tutorialsByType[element.topic] : [];
        this.tutorialsByType[element.topic].push(element);

        if (this.tutorialTypes.indexOf(element.topic) === -1) {
          this.tutorialTypes.push(element.topic);
        }
      });

      this.tutorialTypes.push(this.allKey);
    } catch (e) {
      this.errorServer.HandleError('ViewTutorials', e);
    }
    this.loading = false;
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    this.logServer.LogToConsole('ViewTutorials', 'card clicked', tutorial);
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
  }
}
