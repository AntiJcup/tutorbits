import { Component, ContentChild, ViewChild } from '@angular/core';
import { TreeModel, NodeMenuItemAction, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { EditorModule } from './editor/editor.module';
import { LocalTransactionLoader, LocalTransactionWriter } from 'shared/Tracer/lib/ts/LocalTransaction';
import { TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript'
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  constructor() {
    const proj = new TraceProject();
    proj.setId(Guid.create().toString());
    proj.setPartitionSize(30);
    proj.setDuration(0);

    const writer = new LocalTransactionWriter(proj);
    const tracker = new TransactionTracker(proj, [], 0, writer);
    tracker.CreateFile(0, 'winning');
    tracker.CreateFile(2, 'winning2');
    tracker.InsertFile(42, 'winning2', 0, 0, 'GOTCHABITCH');

    tracker.SaveChanges();

    const loader = new LocalTransactionLoader();
    const loadedProj = loader.LoadProject(proj.getId());
    const transactionLogs = loader.GetTransactionLogs(loadedProj, 0, 1000);
    console.log(loadedProj.toObject());
    for (const transactionLog of transactionLogs) {
      console.log(transactionLog.toObject());
    }

  }

  title = 'tutorbits';
  editorOptions = { theme: 'vs-dark', language: 'javascript' };
  code = '';
  teacherCode = '';
  public tree: TreeModel = {
    value: '/',
    id: 1,
    settings: {
      cssClasses: {
        expanded: 'fa fa-caret-down',
        collapsed: 'fa fa-caret-right',
        empty: 'fa fa-caret-right disabled',
        leaf: 'fa'
      },
      templates: {
        node: '<i class="fa fa-folder-o"></i>',
        leaf: '<i class="fa fa-file-o"></i>'
      },
      keepNodesInDOM: true,
      static: true,
      selectionAllowed: false,
    },
    children: [
      {
        value: 'project',
        id: 2,
        children: [
          { value: 'helloworld.js', id: 3 },
        ],
        settings: {
          isCollapsedOnInit: false
        }
      }
    ]
  };

  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComp: TreeComponent;

  public codeEditor: editor.IEditor;
  private newCode = "function helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log('helloWorld');\n}\n\nhellowWorld();\n\n";
  private newCodePosition: number = 0;

  ngOnInit(): void {
    document.addEventListener("keydown", function (e) {
      if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
      }
    }, false);
  }

  onInit(editor) {

  }

  teacherOnInit(editor) {
    this.codeEditor = editor;
    this.codeEditor.updateOptions({ automaticLayout: true, readOnly: true });
    let line = this.codeEditor.getPosition();
    let model: editor.ITextModel = this.codeEditor.getModel() as editor.ITextModel;
    console.log(model.getValue());

    var interval = setInterval(() => {
      model.setValue(model.getValue() + this.newCode.charAt(this.newCodePosition++));
      if (this.newCodePosition >= this.newCode.length) {
        clearInterval(interval);
      }
    }, 125);
    console.log(line);
  }

  public nodeSelected(event: any) {
    var test = this.treeComp.getControllerByNodeId(event.node.id);
    console.log(test.isCollapsed());
    if (!test.isCollapsed()) {
      test.collapse();
    } else {
      test.expand();
    }
    console.log(event);
  }
}
