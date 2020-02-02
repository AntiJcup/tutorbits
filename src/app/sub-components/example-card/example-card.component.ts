import { Component, OnInit, Input } from '@angular/core';
import { ViewExample } from 'src/app/models/example/view-example';

@Component({
  selector: 'app-example-card',
  templateUrl: './example-card.component.html',
  styleUrls: ['./example-card.component.sass']
})
export class ExampleCardComponent implements OnInit {
  @Input() example: ViewExample;

  get exampleSubTitle(): string {
    return `${this.example.score} - ${this.example.owner} - ${this.example.topic}`;
  }

  constructor() { }

  ngOnInit() {
  }

}
