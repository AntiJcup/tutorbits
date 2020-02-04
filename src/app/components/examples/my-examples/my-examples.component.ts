import { Component, OnInit, NgZone } from '@angular/core';
import { ViewExample } from 'src/app/models/example/view-example';
import { Router } from '@angular/router';
import { TutorBitsExampleService } from 'src/app/services/example/tutor-bits-example.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { DeleteExampleEvent } from 'src/app/sub-components/edit-example-card/edit-example-card.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './my-examples.component.html',
  styleUrls: ['./my-examples.component.sass']
})
export class MyExamplesComponent implements OnInit {
  examples: Array<ViewExample> = [];
  loading = true;

  constructor(
    private router: Router,
    private examplesService: TutorBitsExampleService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private zone: NgZone) { }

  async ngOnInit() {
    this.titleService.SetTitle('My Examples');
    try {
      const examples = await this.examplesService.GetAllByOwner();
      this.zone.runTask(() => {
        this.examples = examples;
      });
      this.logServer.LogToConsole('MyExamplesComponent', examples.length);
    } catch (e) {
      this.errorServer.HandleError('MyExamplesComponent', e);
    }

    this.loading = false;
  }

  onExampleCardClick(e: any, example: ViewExample) {
    this.logServer.LogToConsole('MyExamplesComponent', 'card clicked', example);
    this.router.navigate([`create/sandbox/${example.projectId}/${example.id}/${example.title}`]);
  }

  async onDeleteClicked(e: DeleteExampleEvent) {
    if (!confirm('Are you sure you want to delete this example?')) {
      return;
    }

    try {
      await this.examplesService.Delete(e.example.id);
    } catch (err) {
      this.errorServer.HandleError('MyExamplesComponent', `Failed deleting example: ${err}`);
    }

    const index = this.examples.indexOf(e.example);
    if (index === -1) {
      this.errorServer.HandleError('MyExamplesComponent', `Failed removing example card, doesn't exist`);
      return;
    }

    this.examples.splice(index, 1);
  }
}
