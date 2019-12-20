import { Component, OnInit } from '@angular/core';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.sass']
})
export class ContactComponent implements OnInit {

  constructor(
    private titleService: ITitleService) { }

  ngOnInit() {
    this.titleService.SetTitle('Contact Us');
  }

}
