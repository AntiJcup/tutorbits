import { Component, OnInit, NgZone } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { Router } from '@angular/router';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { DeleteTutorialEvent } from 'src/app/sub-components/tutorials/edit-tutorial-card/edit-tutorial-card.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './my-tutorials.component.html',
  styleUrls: ['./my-tutorials.component.sass']
})
export class MyTutorialsComponent implements OnInit {
  tutorials: Array<ViewTutorial> = [];
  loading = true;

  constructor(
    private router: Router,
    private tutorialsService: TutorBitsTutorialService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private zone: NgZone) { }

  async ngOnInit() {
    this.titleService.SetTitle('My Tutorials');
    try {
      const tutorials = await this.tutorialsService.GetAllByOwnerCached();

      this.zone.runTask(() => {
        this.tutorials = tutorials;
      });
      this.logServer.LogToConsole('MyTutorialsComponent', tutorials.length);
    } catch (e) {
      this.errorServer.HandleError('MyTutorialsComponent', e);
    }

    this.loading = false;
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    this.logServer.LogToConsole('MyTutorialsComponent', 'card clicked', tutorial);
    this.router.navigate([`watch/${tutorial.id}`]);
  }

  async onDeleteClicked(e: DeleteTutorialEvent) {
    if (!confirm('Are you sure you want to delete this tutorial?')) {
      return;
    }

    try {
      await this.tutorialsService.Delete(e.tutorial.id);
    } catch (err) {
      this.errorServer.HandleError('MyTutorialsComponent', `Failed deleting tutorial: ${err}`);
    }

    const index = this.tutorials.indexOf(e.tutorial);
    if (index === -1) {
      this.errorServer.HandleError('MyTutorialsComponent', `Failed removing tutorial card, doesn't exist`);
      return;
    }

    this.tutorials.splice(index, 1);
  }
}
