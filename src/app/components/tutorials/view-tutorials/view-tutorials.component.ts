import { Component, OnInit } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { Router } from '@angular/router';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';

@Component({
  templateUrl: './view-tutorials.component.html',
  styleUrls: ['./view-tutorials.component.sass']
})
export class ViewTutorialsComponent implements OnInit {
  tutorials: Array<ViewTutorial> = [];

  constructor(private router: Router, private tutorialsService: TutorBitsTutorialService) { }

  ngOnInit() {
    this.tutorialsService.GetAll().then((tutorials) => {
      this.tutorials = tutorials;
      console.log(tutorials.length);
    });
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    console.log('card clicked');
    console.log(tutorial);
    this.router.navigate([`watch/${tutorial.id}`]);
  }

}
