import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.sass']
})
export class PrivacyComponent implements OnInit {

  constructor() {
    window.location.href = 'https://www.termsfeed.com/privacy-policy/a1ea4e4cb7810ee36c0fe0ceced7d8be';
  }

  ngOnInit() {

  }

}
