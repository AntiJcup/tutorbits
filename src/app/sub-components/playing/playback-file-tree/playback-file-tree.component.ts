import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TreeModel, NodeMenuItem, NodeMenuItemAction } from 'shared/Ng2-Tree';
import { NG2FileTreeComponent } from '../../file-tree/ng2-file-tree.component';

@Component({
  selector: 'app-playback-file-tree',
  templateUrl: './playback-file-tree.component.html',
  styleUrls: ['./playback-file-tree.component.sass']
})

export class PlaybackFileTreeComponent extends NG2FileTreeComponent implements OnInit {
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
      static: false,
      selectionAllowed: true,
    },
    children: []
  };

  ngOnInit() {
    super.ngOnInit();
  }

  protected GetReadonlyMenuItems(): NodeMenuItem[] {
    return [
      { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
    ];
  }
}
