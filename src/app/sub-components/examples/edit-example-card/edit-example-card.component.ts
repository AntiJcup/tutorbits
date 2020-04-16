import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewExample } from 'src/app/models/example/view-example';

export interface DeleteExampleEvent {
  example: ViewExample;
}

@Component({
  selector: 'app-edit-example-card',
  templateUrl: './edit-example-card.component.html',
  styleUrls: ['./edit-example-card.component.sass']
})
export class EditExampleCardComponent implements OnInit {
  @Input() example: ViewExample;

  @Output() DeleteClick: EventEmitter<DeleteExampleEvent> = new EventEmitter<DeleteExampleEvent>();

  get exampleSubTitle(): string {
    return `${this.example.topic} - ${this.example.status}`;
  }

  constructor() { }

  ngOnInit() {
  }

  public onDeleteClicked(e: MouseEvent) {
    e.stopImmediatePropagation();
    this.DeleteClick.next({
      example: this.example
    } as DeleteExampleEvent);
  }
}
