import { Component, OnInit, OnDestroy } from '@angular/core';
import { Article } from 'src/app/models/blog/article';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { Meta } from '@angular/platform-browser';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit, OnDestroy {
  articles: Article[] = [{
    title: 'Welcome to TutorBits!',
    body: 'This website is designed to help teach programming by example while being able to tinker with the code as you go. \nWatch pros program all kinds of projects all the way through learning the process of making the project. Then tinker with the project in the sandbox adding your own features.\n\n Start by clicking the Tutorials button in the top right.\nThanks for visiting!',
    owner: 'Jcup'
  } as Article];
  constructor(private titleService: ITitleService, private metaService: Meta) { }

  ngOnInit() {
    this.titleService.SetTitle('TutorBits - Home');
    this.metaService.updateTag({
      name: 'description',
      content: `TutorBits - Home to a better programming tutorial experience. Watch as programmers write code, interact, and test the code as they write it.`
    },
      'name=\'description\'');
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
  }

}
