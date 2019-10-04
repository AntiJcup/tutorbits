import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'tutorbits';
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code = 'function x() {\nconsole.log("Hello world!");\n}';
}
