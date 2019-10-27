import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineTransactionRequestInfo } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { TreeModel, Ng2TreeSettings, TreeComponent } from 'ng2-tree';
import { environment } from 'src/environments/environment';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})
export class WatchComponent implements OnInit {
  constructor() {
  }

  title = 'tutorbits';
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

  projectId = 'cfc60589-bdc1-4b9b-ce93-08d756a3d323';
  requestInfo: OnlineTransactionRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  ngOnInit(): void {

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
