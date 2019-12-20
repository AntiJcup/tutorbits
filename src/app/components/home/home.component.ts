import { Component, OnInit } from '@angular/core';
import { Article } from 'src/app/models/blog/article';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  articles: Article[] = [{
    title: 'Welcome to TutorBits!',
    body: 'This website is designed to help teach programming by example while being able to tinker with the code as you go. \nWatch pros program all kinds of projects all the way through learning the process of making the project. Then tinker with the project in the sandbox adding your own features.\n\n Start by clicking the Tutorials button in the top right.\nThanks for visiting!',
    owner: 'Jcup'
  } as Article];
  constructor(private titleService: ITitleService) { }

  ngOnInit() {
    this.titleService.SetTitle('Home');
  }

}
