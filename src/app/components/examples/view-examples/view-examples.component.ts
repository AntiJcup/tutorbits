import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewExample } from 'src/app/models/example/view-example';
import { Router } from '@angular/router';
import { TutorBitsExampleService } from 'src/app/services/example/tutor-bits-example.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { Meta } from '@angular/platform-browser';

@Component({
  templateUrl: './view-examples.component.html',
  styleUrls: ['./view-examples.component.sass']
})
export class ViewExamplesComponent implements OnInit, OnDestroy {
  examples: Array<ViewExample> = [];
  examplesByType: { [key: string]: ViewExample[] } = {};
  exampleTypes: string[] = [];
  loading = true;
  allKey = 'All';

  constructor(
    private router: Router,
    private examplesService: TutorBitsExampleService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private metaService: Meta) { }

  async ngOnInit() {
    this.titleService.SetTitle('TutorBits - Gallery');
    this.metaService.updateTag({
      name: 'description',
      content: `TutorBits - Home to a better programming example experience. Watch as programmers write code, interact, and test the code as they write it.`
    },
      'name=\'description\'');

    try {
      const examples = await this.examplesService.GetAllCached();
      this.examples = examples;
      this.logServer.LogToConsole('ViewExamples', examples.length);
      this.examples.forEach(element => {
        this.examplesByType[this.allKey] = this.examplesByType[this.allKey] ? this.examplesByType[this.allKey] : [];
        this.examplesByType[this.allKey].push(element);

        this.examplesByType[element.topic] = this.examplesByType[element.topic] ? this.examplesByType[element.topic] : [];
        this.examplesByType[element.topic].push(element);

        if (this.exampleTypes.indexOf(element.topic) === -1) {
          this.exampleTypes.push(element.topic);
        }
      });

      this.exampleTypes.push(this.allKey);
    } catch (e) {
      this.errorServer.HandleError('ViewExamples', e);
    }
    this.loading = false;
  }

  onExampleCardClick(e: any, example: ViewExample) {
    this.logServer.LogToConsole('ViewExamples', 'card clicked', example);
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
  }
}
