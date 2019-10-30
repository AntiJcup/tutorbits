import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { TreeModel } from 'ng2-tree';
import { NG2FileTreeComponent } from '../file-tree/ng2-file-tree.component';

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
    children: []
  };

  ngOnInit() {
  }
}
