import { Component, OnInit, Input } from '@angular/core';
import { ViewExample } from 'src/app/models/example/view-example';

@Component({
  selector: 'app-example-card',
  templateUrl: './example-card.component.html',
  styleUrls: ['./example-card.component.sass']
})
export class ExampleCardComponent implements OnInit {
  @Input() example: ViewExample;

  constructor() { }

  ngOnInit() {
  }

  get subTitle(): string {
    return `${this.example.topic} Example - By ${this.example.owner}`;
  }

  get createdDate(): string {
    return new Date(this.example.dateCreated).toLocaleDateString();
  }

}
