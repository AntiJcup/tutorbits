import { BaseWorkspacePlugin } from 'shared/language-client/client/base-workspace-plugin';
import { SupportedWorkspaces } from 'shared/language-server/src/shared/plugin-types';

export class WebsiteWorkspacePlugin extends BaseWorkspacePlugin {
  public get projectType(): string {
    return SupportedWorkspaces[SupportedWorkspaces.Website];
  }

  public async setupWorkspace(): Promise<{ [path: string]: string }> {
    return {
      '/project/index.html':
        '<!doctype html>\n<html lang="en">\n<head>\n\t<meta charset="utf-8">\n\n\t<title>Tutorbits Example HTML</title>\n\t<meta name="description" content="Tutorbits Base Html Template">\n\t<meta name="author" content="Tutorbits">\n\n\t<link rel="stylesheet" href="css/main.css?v=1.0">\n</head>\n\n<body>\n\t<div><h1>Hello World HTML</h1> The is an auto generated html.<br/>Feel to edit to your hearts content.</div>\n\t<script src="js/main.js"></script>\n</body>\n</html>\n',
      '/project/js/': '',
      '/project/js/main.js': 'console.log("hello world!");',
      '/project/css/': '',
      '/project/css/main.css':
        'body {\n\tbackground: #f0f0f0;\n\tfont-family: "", Arial, sans-serif;\n\tfont-size: 12px;\n\tz-index: 1;\n\ttext-shadow: 0 1px 0;\n}\n\nh1, h2, h3, h4, h5, h6 { text-rendering: optimizelegibility; }\n\na { \n\tcolor: #4c4c4c;\n\ttext-decoration: underline;\n}\n\na:hover { \n\ttext-decoration: none;\n}\n\n::selection {\n\tbackground: #FE57A1;\n\tcolor: white;\n\ttext-shadow: none;\n}\n'
    };
  }
}
