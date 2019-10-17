import { Component, ContentChild, ViewChild, OnInit } from '@angular/core';
import { TreeModel, NodeMenuItemAction, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { editor, IPosition, Range } from 'monaco-editor/esm/vs/editor/editor.api';
import { LocalTransactionLoader, LocalTransactionWriter } from 'shared/Tracer/lib/ts/LocalTransaction';
import { TraceProject, TraceTransaction } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript';
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';
import { debug } from 'util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  public tracker: TransactionTracker;
  public loader: LocalTransactionLoader;
  public proj: TraceProject;

  constructor() {
    this.proj = new TraceProject();
    this.proj.setId(Guid.create().toString());
    this.proj.setPartitionSize(30);
    this.proj.setDuration(0);

    const writer = new LocalTransactionWriter(this.proj);
    this.tracker = new TransactionTracker(this.proj, [], 0, writer);
    this.tracker.CreateFile(0, 'project/helloworld.js');

    this.tracker.SaveChanges();

    this.loader = new LocalTransactionLoader();

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

  public codeEditor: editor.ICodeEditor;

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

        const timeOffset = Date.now() - start;
        this.tracker.ModifyFile(timeOffset, 'winning2', change.rangeOffset,
          change.rangeOffset + change.rangeLength, change.text);
        console.log(timeOffset);
        console.log(change.rangeOffset);
        console.log(change.rangeLength);
        console.log(change.text);
      }
      this.tracker.SaveChanges();
    });
  }

  teacherOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;

    const readOnlyOptions: editor.IEditorOptions = {
      readOnly: true
    };
    const editOptions: editor.IEditorOptions = {
      readOnly: false
    };
    this.codeEditor.updateOptions(readOnlyOptions);

    const line = this.codeEditor.getPosition();
    const model: editor.ITextModel = this.codeEditor.getModel() as editor.ITextModel;
    console.log(model.getValue());

    let lastChecked = 0;
    const start = Date.now();
    const interval = setInterval(() => {
      const now = Date.now() - (start + lastChecked);
      const previous = lastChecked;
      const transactionLogs = this.loader.GetTransactionLogs(this.proj, lastChecked, lastChecked + now);
      lastChecked += now;
      const edits: editor.IIdentifiedSingleEditOperation[] = [];
      for (const transactionLog of transactionLogs) {
        const transactions = transactionLog.getTransactionsList();
        if (transactions.length > 0) {
          console.log('previous: ' + previous);
          console.log(transactions);
        }
        for (const transaction of transactions) {
          if (transaction.getTimeOffsetMs() <= previous) {
            continue;
          }
          lastChecked = transaction.getTimeOffsetMs();
          switch (transaction.getType()) {
            case TraceTransaction.TraceTransactionType.MODIFYFILE:
              console.log(transaction.toObject());

              const startPos = model.getPositionAt(transaction.getModifyFile().getOffsetStart());
              const endPos = model.getPositionAt(transaction.getModifyFile().getOffsetEnd());

              const newEdit: editor.IIdentifiedSingleEditOperation = {
                range: new monaco.Range(
                  startPos.lineNumber,
                  startPos.column,
                  endPos.lineNumber,
                  endPos.column),
                text: transaction.getModifyFile().getData(),
                forceMoveMarkers: true
              };

              edits.push(newEdit);
              break;
          }
        }
      }

      if (edits.length > 0) {
        this.codeEditor.updateOptions(editOptions);
        if (this.codeEditor.hasTextFocus()) {
          (document.activeElement as HTMLElement).blur();
        }
        this.codeEditor.executeEdits('teacher', edits);
        this.codeEditor.updateOptions(readOnlyOptions);
      }
    }, 3250);
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
