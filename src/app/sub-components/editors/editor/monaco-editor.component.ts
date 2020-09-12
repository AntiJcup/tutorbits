import { OnDestroy, Directive, OnInit, NgZone } from '@angular/core';
import { ILogService } from 'src/app/services/abstract/ILogService';
import 'shared/web/lib/ts/extensions';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { ICodeService, CodeEvents, GoToDefinitionEvent } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService, FileTreeEvents, PathType, ResourceNodeType } from 'src/app/services/abstract/IFileTreeService';
import { EventSub } from 'shared/web/lib/ts/EasyEventEmitter';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class MonacoEditorComponent implements OnInit, OnDestroy {
  public editorOptions = {
    theme: 'vs-dark', language: 'javascript'
  };

  public visible = false;

  private fileSelectSub: EventSub;

  public get currentFilePath(): string {
    return this.codeService.currentFilePath;
  }

  private windowCallback: (e: UIEvent) => any;
  constructor(
    protected logService: ILogService,
    protected editorPluginService: IEditorPluginService,
    protected codeService: ICodeService,
    protected fileTreeService: IFileTreeService,
    protected zone: NgZone) {
    this.windowCallback = (e: UIEvent) => {
      this.onWindowResize();
    };
    window.addEventListener('resize', this.windowCallback);
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.windowCallback);
    this.codeService.EndSession();
    this.codeService.Cleanup();

    if (this.fileSelectSub) {
      this.fileSelectSub.Dispose();
    }
  }

  onWindowResize() {
    this.codeService.editor.layout({ width: window.innerWidth - 810, height: window.innerHeight });
  }

  editorOnInit(codeEditor: monaco.editor.IEditor) {
    this.codeService.on(CodeEvents[CodeEvents.GotoDefinition], (e) => {
      this.onGoToDefinition(e);
    });

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

    this.fileSelectSub = this.fileTreeService.sub(FileTreeEvents[FileTreeEvents.SelectedNode],
      (path: string, pathType: PathType, nodeType: ResourceNodeType) => {
        if (this.fileTreeService.GetPathTypeForPath(path) === PathType.folder) {
          return;
        }

        switch (nodeType) {
          case ResourceNodeType.code:
            this.codeService.currentFilePath = path;
            this.codeService.UpdateCacheForCurrentFile();
            break;
          case ResourceNodeType.asset:
            this.codeService.currentFilePath = '';
            this.codeService.UpdateCacheForCurrentFile();
            break;
        }
      });
  }

  public Show(show: boolean) {
    this.visible = show;
  }

  onGoToDefinition(event: GoToDefinitionEvent) {
    this.logService.LogToConsole(JSON.stringify(event));

    if (!event.path.startsWith('/project')) {
      const fileExtension = event.path.split('.').pop();
      event.path = `$external.${fileExtension}`; // Fake selected path
      this.codeService.currentFilePath = event.path;
      this.zone.runTask(() => {
        this.fileTreeService.selectedPath = '/project';
        this.codeService.editor.focus();
        this.codeService.editor.setPosition(event.offset);
        this.codeService.editor.revealPositionInCenter(event.offset, monaco.editor.ScrollType.Smooth);
      });
      return;
    }

    this.fileTreeService.selectedPath = event.path;
    this.zone.runTask(() => {
      this.codeService.editor.focus();
      this.codeService.editor.setPosition(event.offset);
      this.codeService.editor.revealPositionInCenter(event.offset, monaco.editor.ScrollType.Smooth);
    });
  }
}
