import { ViewChild, NgZone, Injectable } from '@angular/core';
import { editor } from 'monaco-editor';
import { TreeComponent, Ng2TreeSettings, Tree, NodeSelectedEvent, TreeModel, TreeController } from 'ng2-tree';
import { InvokeFunctionExpr } from '@angular/compiler';
import { start } from 'repl';
import { runInThisContext } from 'vm';
import { TreeStatus } from 'ng2-tree/src/tree.types';

@Injectable()
export abstract class NG2FileTreeComponent {
  private currentId = 100;
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  constructor(private zone: NgZone) { }

  public nodeSelected(event: NodeSelectedEvent) {
    const test = this.treeComponent.getControllerByNodeId(event.node.id);
    if (!event.node.isBranch()) {
      return;
    }
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

    for (const parent of parents.reverse()) {
      path += '/' + parent.value;
    }

    return path;
  }

  public findNodeByPath(node: Tree, path: string): Tree {
    const splitPath = path.split('/');
    if (path === '/') {
      splitPath.pop();
    }
    let subPath = splitPath[0];
    if (subPath === '') {
      subPath = '/';
    }
    if (node.value === subPath) {
      if (splitPath.length > 1) {
        if (!node.children) {
          return null;
        }
        for (const childNode of node.children) {
          const matchingChildNode = this.findNodeByPath(childNode, splitPath.slice(1).join('/'));
          if (matchingChildNode) {
            return matchingChildNode;
          }
        }
      } else {
        return node;
      }
    }

    return null;
  }

  public selectNodeByPath(node: Tree, path: string) {
    this.zone.run(() => {
      const foundNode = this.findNodeByPath(node, path);
      if (!foundNode) {
        throw new Error('Node not found');
      }

      // this.treeComponent.getControllerByNodeId(foundNode.id).expandToParent();
      this.treeComponent.getControllerByNodeId(foundNode.id).select();
    });

  }

  public addNodeByPath(path: string, isBranch: boolean): void {
    const splitPath = path.split('/');
    let node: Tree = this.treeComponent.tree;
    this.zone.runTask(() => {
      for (let i = splitPath.length; i >= 0; --i) {
        const subSplitPath = splitPath.slice(0, splitPath.length - i);
        let subPath = subSplitPath.join('/');
        if (subPath === '') {
          subPath = '/';
        }
        const matchingNode = this.findNodeByPath(node, subPath);
        if (matchingNode) {
          node = matchingNode;
        } else {
          const isLast = i === 0;
          const subNodeIsBranch = isBranch || !isLast;
          const nodeController = this.treeComponent.getControllerByNodeId(node.id);

          const newNodeName = subSplitPath[subSplitPath.length - 1];
          const newNodeModel: TreeModel = {
            value: newNodeName,
            children: subNodeIsBranch ? [] : undefined,
            _status: TreeStatus.New
          };

          nodeController.addChildAsync(newNodeModel).then((newNode) => {
            const newNodeController = this.treeComponent.getControllerByNodeId(newNode.id);
            newNodeController.rename(newNodeName);
            if (!isLast) {
              this.addNodeByPath(path, isBranch);
            }
          });
          break;
        }
      }
    });
  }

  public deleteNodeByPath(path: string): void {
    this.zone.runTask(() => {
      const nodeToDelete = this.findNodeByPath(this.treeComponent.tree, path);
      const nodeToDeleteController = this.treeComponent.getControllerByNodeId(nodeToDelete.id);
      nodeToDeleteController.remove();
    });
  }
}
