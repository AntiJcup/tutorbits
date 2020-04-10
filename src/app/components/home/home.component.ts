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
    owner: 'Jcup',
    dateCreated: '12/01/2019'
  } as Article,
  {
    title: 'Tutorbits Progress Checkin 1',
    body: 'Tutorbits feature set continues to grow! Examples and Questions coming soon. \nExamples can be created from sandboxes that are published allowing to show off end results instead of a tutorial. These will be great for easy to port snippets of code. \nQuestions will bring the ability to ask any programming question here on the site and the ability to answer them using the tools on TutorBits.',
    owner: 'Jcup',
    dateCreated: '1/05/2020'
  } as Article,
  {
    title: 'Tutorbits Progress Checkin 2',
    body: 'Examples and Questions have been officially added to Tutorbits. In the first form they are bare but they give the idea and potential of what they can do',
    owner: 'Jcup',
    dateCreated: '2/12/2020'
  } as Article,
  {
    title: 'Tutorbits Progress Checkin 3',
    body: 'With all the new features came bugs. Lately TutorBits development has been focused on polishing existing features before adding new language support and expanding on answer functionality. \nThe new language will most likely be C# as I love working with it and it should be easy enough to add. \nIt will feature a interactable terminal in the existing preview functionality.',
    owner: 'Jcup',
    dateCreated: '4/10/2020'
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
