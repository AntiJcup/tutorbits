import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.sass']
})

export class PreviewComponent implements OnInit {
  @Output() closeClicked = new EventEmitter();
  
  constructor() { }

  ngOnInit() {
  }

}
