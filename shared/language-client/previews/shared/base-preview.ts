export abstract class BasePreview {
  private outputDiv: Element | null;
  private sourceIframe: HTMLIFrameElement | null;
  protected urlParams: URLSearchParams;
  protected sources: { [path: string]: string };
  protected targetSource: string | undefined;
  protected targetPath: string | undefined;

  constructor() {
    this.outputDiv = document.querySelector('#consoleOutput');
    this.sourceIframe = document.querySelector('#sourceCode');
    this.urlParams = new URLSearchParams(window.location.search);
    this.sources = {};
    this.targetSource = '';
    this.targetPath = '';

    this.overrideNativeLogging();
  }

  private overrideNativeLogging(): void {
    // Overriding log, error, and window.onerror are mainly for javascript and typescript previews
    const originalConsoleLog = console.log;
    console.log = () => {
      originalConsoleLog.call(window, arguments);
      const argArray = [...arguments] as any;
      const argString = [].concat(argArray).join(' ');
      this.outputDiv!.innerHTML += 'Log: ' + argString + '<br/>';
    }

    const originalConsoleError = console.error;
    console.error = () => {
      originalConsoleError.call(window, arguments);
      const argArray = [...arguments] as any;
      const argString = [].concat(argArray).join(' ');
      this.outputDiv!.innerHTML += 'Error: ' + argString + '<br/>';
    }

    window.onerror = function (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) {
      const argArray = [...arguments] as any;
      console.error([].concat(argArray).join(' '));
    };
  }

  public async initialize(): Promise<void> {
    console.log(`INTERNAL - Starting Initialization`);
    const base: string = this.urlParams.get('base')!;
    this.targetPath = this.urlParams.get('target')!;
    const otherPaths: string[] = JSON.parse(decodeURIComponent(this.urlParams.get('otherPaths')!));
    const allPaths = [this.targetPath, ...(otherPaths || [])];

    const pathsLoadPromise = this.loadSources(base, this.targetPath!, allPaths);
    const promises: Promise<any>[] = [pathsLoadPromise];

    await Promise.all(promises);
    console.log(`INTERNAL - Finished Initialization`);
  }

  public async start(): Promise<void> {
    await this.executeCode();
  }

  protected async loadSources(base: string, target: string, paths: string[]): Promise<void> {
    console.log(`INTERNAL - Loading Sources`);
    const loadPromises: Array<Promise<void>> = [];
    // tslint:disable-next-line: forin
    for (const pathIndex in paths) {
      const path = paths[pathIndex];
      const source = decodeURIComponent(`${base}/${path}`);
      console.log(`INTERNAL - Loading Source: ${path}`);
      loadPromises.push(new Promise<void>((resolve) => {
        fetch(source).then((response) => {
          console.log(`INTERNAL - Loaded Source: ${path}`);
          response.text().then((t) => {
            this.sources[path] = t;
            if (target === path) {
              this.targetSource = t;
              this.sourceIframe!.srcdoc = t;
            }
            resolve();
          });
        })
      }));
    }

    await Promise.all(loadPromises);
    console.log(`INTERNAL - Finished Loading Sources`);
  }

  protected abstract async executeCode(): Promise<void>;
}
