import { Component, OnInit } from '@angular/core';
import { TreeModel, NodeMenuItemAction } from 'ng2-tree';
import { NG2FileTreeComponent } from '../file-tree/ng2-file-tree.component';

@Component({
  selector: 'app-recording-file-tree',
  templateUrl: './recording-file-tree.component.html',
  styleUrls: ['./recording-file-tree.component.sass']
})

export class RecordingFileTreeComponent extends NG2FileTreeComponent implements OnInit {
  public tree: TreeModel = {
    value: '/',
    id: 1,
    settings: {
      menuItems: [
      ],
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
      static: true
    },
    children: [
      {
        value: 'project',
        id: 2,
        children: [
        ],
        settings: {
          isCollapsedOnInit: false,
          menuItems: [
            { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
            { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
          ]
        }
      }
    ]
  };

  ngOnInit() {
  }
}
