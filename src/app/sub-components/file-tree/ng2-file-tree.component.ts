import { ViewChild, NgZone, Injectable, SimpleChange, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TreeComponent, Ng2TreeSettings, Tree, NodeSelectedEvent, TreeModel, TreeController, NodeMenuItemAction, NodeMenuItem, NodeCreatedEvent, MenuItemSelectedEvent } from 'ng2-tree';
import { TreeStatus } from 'ng2-tree/src/tree.types';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Injectable()
export abstract class NG2FileTreeComponent {
  editable = false;
  fileSelected = null;
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  @Output() previewClicked = new EventEmitter<string>();

  constructor(private zone: NgZone, private logServer: ILogService) { }

  public nodeSelected(event: NodeSelectedEvent) {
    const test = this.treeComponent.getControllerByNodeId(event.node.id);
    this.fileSelected = null;
    if (!event.node.isBranch()) {
      this.fileSelected = this.getPathForNode(event.node);
      return;
    }

    if (!test.isCollapsed()) {
      test.collapse();
    } else {
      test.expand();
    }
    this.logServer.LogToConsole('FileTree', event);
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

  public selectNodeByPath(node: Tree, path: string, retry: boolean = true) {
    this.zone.runTask(() => {
      const foundNode = this.findNodeByPath(node, path);
      if (!foundNode) {
        if (retry) {
          setTimeout(() => {
            this.selectNodeByPath(node, path, false);
          }, 1);
        } else {
          throw new Error('Node not found');
        }
      }

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
        const matchingNode = this.findNodeByPath(this.treeComponent.tree, subPath);
        if (matchingNode) {
          node = matchingNode;
        } else {
          const isLast = i === 0;
          const subNodeIsBranch = isBranch || !isLast;
          const nodeController = this.treeComponent.getControllerByNodeId(node.id);

          const newNodeName = subSplitPath[subSplitPath.length - 1];

          const settings = {
            menuItems: this.editable ? undefined : (subNodeIsBranch ? [] : [
              { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
            ])
          };
          const newNodeModel: TreeModel = {
            value: newNodeName,
            children: subNodeIsBranch ? [] : undefined,
            _status: TreeStatus.New,
            settings
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

  public deleteNodeByPath(path: string, retry: boolean = true): void {
    this.zone.runTask(() => {
      const nodeToDelete = this.findNodeByPath(this.treeComponent.tree, path);
      const nodeToDeleteController = this.treeComponent.getControllerByNodeId(nodeToDelete.id);
      if (!nodeToDeleteController && retry) { // THIS MAY BE BAD BUT THE TREE DOESNT UPDATE SO WE TRY AGAIN
        setTimeout(() => {
          this.deleteNodeByPath(path, false);
        }, 0);
        return;
      }
      nodeToDeleteController.remove();
    });
  }

  public allowEdit(edit: boolean) {
    this.editable = edit;
    if (edit) {
      this.treeComponent.treeModel.settings.menuItems = [
        { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
        { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
        { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
        { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
        { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
      ];

      this.treeComponent.treeModel.settings.static = false;
      const projectNode = this.findNodeByPath(this.treeComponent.tree, '/project');
      projectNode.node.settings.menuItems = this.treeComponent.treeModel.settings.menuItems;
    } else {
      this.treeComponent.treeModel = this.treeComponent.tree.toTreeModel();
      this.treeComponent.treeModel.settings.menuItems = this.GetReadonlyMenuItems();
      this.treeComponent.treeModel.settings.static = true;
    }

    this.treeComponent.ngOnChanges(null);
  }

  protected GetReadonlyMenuItems(): NodeMenuItem[] {
    return [];
  }

  public onMenuItemSelected(e: MenuItemSelectedEvent) {
    if (e.selectedItem === 'Preview') {
      this.previewClicked.next(this.getPathForNode(e.node));
    }
  }

  public onPreviewHeaderButtonClicked(e: MouseEvent) {
    this.previewClicked.next(this.fileSelected);
  }

  public onNodeCreated(e: NodeCreatedEvent) {
    if (!this.editable) {
      return;
    }

    e.node.node.settings.menuItems = e.node.isBranch() ? [
      { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
      { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
      { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
      { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
    ] : [
        { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
        { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
        { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
      ];
  }
}
