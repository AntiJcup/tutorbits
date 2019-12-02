import { Component, OnInit } from '@angular/core';
import { Article } from 'src/app/models/blog/article';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  articles: Article[] = [{
    title: 'Welcome to TutorBits!',
    body: 'I am very happy to share with you my most recent project. This website is designed and made to help teach programming in a more integrated fashion.\n\n\n How you may ask? Programming tutorials in the form of videos are currently flat. With this website you get to experience the tutorial video and the teachers editor as it is being written. Want to test the code the teacher has written at a particular spot? Click preview and test it. Want to take what the teacher has made and make your own modifications? Export to sandbox and edit to your hearts content. \n\n\n Start by clicking the Tutorials button in the top right. \n Thanks for visiting!',
    owner: 'Jcup'
  } as Article];
  constructor() { }

  ngOnInit() {
  }

}
