import { OnDestroy, Directive } from '@angular/core';
import { ILogService } from 'src/app/services/abstract/ILogService';
import 'shared/web/lib/ts/extensions';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { ICodeService, CodeEvents } from 'src/app/services/abstract/ICodeService';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class MonacoEditorComponent implements OnDestroy {
  public editorOptions = {
    theme: 'vs-dark', language: 'javascript'
  };

  public visible = false;

  public get currentFilePath(): string {
    return this.codeService.currentFilePath;
  }

  private windowCallback: (e: UIEvent) => any;
  constructor(protected logServer: ILogService, protected editorPluginService: IEditorPluginService, protected codeService: ICodeService) {
    this.windowCallback = (e: UIEvent) => {
      this.onWindowResize();
    };
    window.addEventListener('resize', this.windowCallback);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.windowCallback);
    this.codeService.EndSession();
  }

  onWindowResize() {
    this.codeService.editor.layout({ width: window.innerWidth - 810, height: window.innerHeight });
  }

  editorOnInit(codeEditor: monaco.editor.IEditor) {
    this.codeService.on(CodeEvents[CodeEvents.SelectedFileChanged], (e) => {
      if (!this.codeService.currentFilePath || this.codeService.currentFilePath === '') {
        this.Show(false);
        return;
      }
      this.Show(true);
    });

    this.codeService.on(CodeEvents[CodeEvents.FileContentChanged], async (e, fileModel) => {
      await this.editorPluginService.getPlugin(fileModel.getModeId())?.validateEditor(e, fileModel);
    });

    this.codeService.InitializeSession(codeEditor);
    if (!this.codeService.currentFilePath || this.codeService.currentFilePath === '') {
      this.Show(false);
    }

    this.editorPluginService.registerPlugins().then();
  }

  public Show(show: boolean) {
    this.visible = show;
  }
}
