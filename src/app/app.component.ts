import { Component, ContentChild, ViewChild, OnInit } from '@angular/core';
import { TreeModel, NodeMenuItemAction, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { LocalTransactionLoader, LocalTransactionWriter } from 'shared/Tracer/lib/ts/LocalTransaction';
import { TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript'
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  public tracker: TransactionTracker;

  constructor() {
    const proj = new TraceProject();
    proj.setId(Guid.create().toString());
    proj.setPartitionSize(30);
    proj.setDuration(0);

    const writer = new LocalTransactionWriter(proj);
    this.tracker = new TransactionTracker(proj, [], 0, writer);
    this.tracker.CreateFile(0, 'winning');
    this.tracker.CreateFile(2, 'winning2');
    this.tracker.InsertFile(42, 'winning2', 0, 0, 0, 'GOTCHABITCH');
    this.tracker.InsertFile(42, 'winning2', 0, 0, 11, 'NOWIGOTCHA');

    this.tracker.SaveChanges();

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
  private newCode = 'function helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\nfunction helloWorld(){\n\tconsole.log(\'helloWorld\');\n}\n\nhellowWorld();\n\n';
  private newCodePosition = 0;

  ngOnInit(): void {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
      }
    }, false);
  }

  onInit(codeEditor: editor.IEditor) {
    const model: editor.ITextModel = codeEditor.getModel() as editor.ITextModel;
    const start = Date.now();
    model.onDidChangeContent((e: editor.IModelContentChangedEvent) => {
      for (const change of e.changes) {
        console.log(change);
        const position = model.getPositionAt(change.rangeOffset);
        let offset = position.column;
        let lineOffset = 0;
        let remainingRange = change.rangeLength;
        const lineChanges = change.text.split(e.eol);
        for (const lineChange of lineChanges) {
          const currentLine = position.lineNumber + lineOffset;
          const lineLength = model.getLineLength(currentLine);
          const currentRange = Math.min(remainingRange, lineLength);
          const timeOffset = Date.now() - start;
          this.tracker.InsertFile(timeOffset, 'winning2', currentLine, offset,
            offset + currentRange, lineChange);
          console.log(timeOffset);
          console.log(currentLine);
          console.log(offset);
          console.log(currentRange);
          console.log(lineChange);
          lineOffset++;
          offset = 0;
          if (remainingRange > 0) {
            remainingRange -= currentRange;
          }
        }
      }
    });
  }

  teacherOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor;
    this.codeEditor.updateOptions({ automaticLayout: true, readOnly: true });
    const line = this.codeEditor.getPosition();
    const model: editor.ITextModel = this.codeEditor.getModel() as editor.ITextModel;
    console.log(model.getValue());

    const interval = setInterval(() => {
      model.setValue(model.getValue() + this.newCode.charAt(this.newCodePosition++));
      if (this.newCodePosition >= this.newCode.length) {
        clearInterval(interval);
      }
    }, 125);
    console.log(line);
  }

  public nodeSelected(event: any) {
    const test = this.treeComp.getControllerByNodeId(event.node.id);
    console.log(test.isCollapsed());
    if (!test.isCollapsed()) {
      test.collapse();
    } else {
      test.expand();
    }
    console.log(event);
  }
}
