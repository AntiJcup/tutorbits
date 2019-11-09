import { Component, OnInit, Input } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';

@Component({
  selector: 'app-tutorial-card',
  templateUrl: './tutorial-card.component.html',
  styleUrls: ['./tutorial-card.component.sass']
})
export class TutorialCardComponent implements OnInit {
  @Input() tutorial: ViewTutorial;

  constructor() { }

  ngOnInit() {
  }

}
