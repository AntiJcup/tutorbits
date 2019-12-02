import { Component, OnInit, Input } from '@angular/core';
import { Article } from 'src/app/models/blog/article';

@Component({
  selector: 'app-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.sass']
})
export class BlogCardComponent implements OnInit {
  @Input() article: Article;
  constructor() { }

  ngOnInit() {
  }

}
