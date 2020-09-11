import { BaseWorkspacePlugin } from 'shared/language-client/client/base-workspace-plugin';
import { SupportedWorkspaces } from 'shared/language-server/src/shared/plugin-types';

export class WebsiteWorkspacePlugin extends BaseWorkspacePlugin {
  public get projectType(): string {
    return SupportedWorkspaces[SupportedWorkspaces.Website];
  }

  public async setupWorkspace(): Promise<{ [path: string]: string }> {
    // TODO replace with native end line
    return {
      '/project/': '',
      '/project/index.html':
        '<!doctype html>\r\n<html lang="en">\r\n<head>\r\n\t<meta charset="utf-8">\r\n\r\n\t<title>Tutorbits Example HTML</title>\r\n\t<meta name="description" content="Tutorbits Base Html Template">\r\n\t<meta name="author" content="Tutorbits">\r\n\r\n\t<link rel="stylesheet" href="css/main.css?v=1.0">\r\n</head>\r\n\r\n<body>\r\n\t<div><h1>Hello World HTML</h1> The is an auto generated html.<br/>Feel to edit to your hearts content.</div>\r\n\t<script src="js/main.js"></script>\r\n</body>\r\n</html>\r\n',
      '/project/js/': '',
      '/project/js/main.js': 'console.log("hello world!");',
      '/project/css/': '',
      '/project/css/main.css':
        'body {\r\n\tbackground: #f0f0f0;\r\n\tfont-family: "", Arial, sans-serif;\r\n\tfont-size: 12px;\r\n\tz-index: 1;\r\n\ttext-shadow: 0 1px 0;\r\n}\r\n\r\nh1, h2, h3, h4, h5, h6 { text-rendering: optimizelegibility; }\r\n\r\na { \r\n\tcolor: #4c4c4c;\r\n\ttext-decoration: underline;\r\n}\r\n\r\na:hover { \r\n\ttext-decoration: none;\r\n}\r\n\r\n::selection {\r\n\tbackground: #FE57A1;\r\n\tcolor: white;\r\n\ttext-shadow: none;\r\n}\r\n'
    };
  }
}
