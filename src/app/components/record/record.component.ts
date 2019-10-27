import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineTransactionRequestInfo } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { TreeComponent, Ng2TreeSettings, TreeModel } from 'ng2-tree';
import { TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit {
  constructor(private route: ActivatedRoute) {
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

  project = new TraceProject();
  requestInfo: OnlineTransactionRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');

    this.project.setId(projectId);

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
