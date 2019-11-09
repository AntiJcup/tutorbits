import { Component, OnInit } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';

@Component({
  templateUrl: './view-tutorials.component.html',
  styleUrls: ['./view-tutorials.component.sass']
})
export class ViewTutorialsComponent implements OnInit {
  tutorials: Array<ViewTutorial> = [{
    id: 'f7bdf2c3-5996-467b-0e52-08d7646e553c',
    title: 'TEST',
    // tslint:disable-next-line: max-line-length
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut blandit posuere pharetra. Aenean tempus varius congue. Phasellus vitae dictum felis, vel tincidunt ante. Mauris pretium tincidunt vulputate. Suspendisse ipsum ipsum, varius vitae maximus at, sagittis at lectus. Donec at pellentesque mi, sit amet interdum dui. Nam pulvinar magna ligula, at mattis lorem sollicitudin nec. Etiam faucibus tellus id justo consectetur molestie. Sed nunc ligula, aliquam quis orci et, dictum gravida nulla. Donec vehicula odio felis, sed tempor tortor convallis a. Pellentesque mattis pharetra sollicitudin. Nulla facilisi. Proin posuere lacus dui, quis iaculis augue tristique ac. Donec mollis odio ullamcorper fermentum convallis.',
    language: 'jabascript'
  } as ViewTutorial,
  {
    id: 'a7bdf2c3-5996-467b-0e52-08d7646e553c',
    title: 'TEST2',
    // tslint:disable-next-line: max-line-length
    description: '2Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut blandit posuere pharetra. Aenean tempus varius congue. Phasellus vitae dictum felis, vel tincidunt ante. Mauris pretium tincidunt vulputate. Suspendisse ipsum ipsum, varius vitae maximus at, sagittis at lectus. Donec at pellentesque mi, sit amet interdum dui. Nam pulvinar magna ligula, at mattis lorem sollicitudin nec. Etiam faucibus tellus id justo consectetur molestie. Sed nunc ligula, aliquam quis orci et, dictum gravida nulla. Donec vehicula odio felis, sed tempor tortor convallis a. Pellentesque mattis pharetra sollicitudin. Nulla facilisi. Proin posuere lacus dui, quis iaculis augue tristique ac. Donec mollis odio ullamcorper fermentum convallis.',
    language: 'javascript'
  } as ViewTutorial];

  constructor() { }

  ngOnInit() {
  }

  onTutorialCardClick(e: any, tutorial: ViewTutorial) {
    console.log('card clicked');
    console.log(tutorial);
  }

}
