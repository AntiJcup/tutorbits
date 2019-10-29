import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { editor } from 'monaco-editor';
import { OnlineTransactionRequest, OnlineTransactionRequestInfo, OnlineTransactionWriter, OnlineProjectLoader, OnlineProjectWriter } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { MonacoRecorder } from '../recorder/monaco.recorder';
import { TreeModel, Ng2TreeSettings, TreeComponent } from 'ng2-tree';

@Component({
  selector: 'app-recording-file-tree',
  templateUrl: './recording-file-tree.component.html',
  styleUrls: ['./recording-file-tree.component.sass']
})

export class RecordingFileTreeComponent implements OnInit {
  editorOptions = { theme: 'vs-dark', language: 'javascript' };
  startingCode = '';

  codeEditor: editor.ICodeEditor;
  codeRecorder: MonacoRecorder;

  @Input() projectId: string;

  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

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
          // { value: 'helloworld.js', id: 3 },
        ],
        settings: {
          isCollapsedOnInit: false
        }
      }
    ]
  };

  constructor() { }

  public get CodeRecorder(): MonacoRecorder {
    return this.codeRecorder;
  }

  ngOnInit() {
  }

  public nodeSelected(event: any) {
    const test = this.treeComponent.getControllerByNodeId(event.node.id);
    console.log(test.isCollapsed());
    if (!test.isCollapsed()) {
      test.collapse();
    } else {
      test.expand();
    }
    console.log(event);
  }

}
