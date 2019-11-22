import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.sass']
})
export class TermsComponent implements OnInit {

  constructor() {
    window.location.href = 'https://www.termsfeed.com/terms-conditions/ca8ffb23d4787fe9929dd7ba6f0fd778';
  }

  ngOnInit() {

  }

}
