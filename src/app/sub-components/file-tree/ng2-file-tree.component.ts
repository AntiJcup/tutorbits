import { ViewChild } from '@angular/core';
import { editor } from 'monaco-editor';
import { TreeComponent, Ng2TreeSettings, Tree } from 'ng2-tree';

export abstract class NG2FileTreeComponent {
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  constructor() { }

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

  public getPathForNode(e: Tree) {
    let path = '';
    const parents = [];
    while (e.parent) {
      parents.push(e);
      e = e.parent;
    }

    for(const parent of parents.reverse()) {
      path += '/' + parent.value;
    }

    return path;
  }
}
