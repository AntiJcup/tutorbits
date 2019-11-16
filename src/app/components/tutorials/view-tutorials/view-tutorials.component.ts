import { Component, OnInit } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { Router } from '@angular/router';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

@Component({
  templateUrl: './view-tutorials.component.html',
  styleUrls: ['./view-tutorials.component.sass']
})
export class ViewTutorialsComponent implements OnInit {
  tutorials: Array<ViewTutorial> = [];

  constructor(
    private router: Router,
    private tutorialsService: TutorBitsTutorialService,
    private errorServer: IErrorService) { }

  ngOnInit() {
    this.tutorialsService.GetAll().then((tutorials) => {
      this.tutorials = tutorials;
      console.log(tutorials.length);
    }).catch((e) => {
      this.errorServer.HandleError('GetError', e);
    });
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    console.log('card clicked');
    console.log(tutorial);
    this.router.navigate([`watch/${tutorial.id}`]);
  }

}
