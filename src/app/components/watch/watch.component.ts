import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineTransactionRequestInfo, OnlineTransactionWriter, OnlineTransactionRequest, OnlineTransactionLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { TransactionTracker } from 'shared/Tracer/lib/ts/TransactionTracker';
import { TreeModel, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { editor } from 'monaco-editor';
import { MonacoPlayer } from 'src/app/sub-components/player/monaco.player';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})
export class WatchComponent implements OnInit {
  constructor() {
    this.proj = new TraceProject();
    this.proj.setId('cfc60589-bdc1-4b9b-ce93-08d756a3d323');
    this.proj.setPartitionSize(5000);
  }
  public tracker: TransactionTracker;
  public proj: TraceProject;

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

  public timer: number = null;

  public teacherCodePlayer: MonacoPlayer;
  public codeRecorder: MonacoRecorder;

  ngOnInit(): void {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
      }
    }, false);
  }

  onInit(codeEditor: editor.IEditor) {
    this.codeRecorder = new MonacoRecorder(codeEditor as editor.ICodeEditor,
      this.proj,
      new OnlineTransactionWriter(new OnlineTransactionRequest({
        host: 'http://api.tutorbits.com:5000'
      } as OnlineTransactionRequestInfo), 'cfc60589-bdc1-4b9b-ce93-08d756a3d323', this.proj));

    // this.codeRecorder.StartRecording();
  }

  teacherOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;

    this.teacherCodePlayer = new MonacoPlayer(this.codeEditor, new OnlineTransactionLoader(new OnlineTransactionRequest({
      host: 'http://api.tutorbits.com:5000'
    } as OnlineTransactionRequestInfo)), 'cfc60589-bdc1-4b9b-ce93-08d756a3d323');

    this.teacherCodePlayer.Load().then(() => {
      this.teacherCodePlayer.Play();
      // setTimeout(() => {
      //   this.teacherCodePlayer.position = 0;
      // }, 5000);
    });
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
