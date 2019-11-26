import { ViewChild, NgZone, Injectable, SimpleChange, SimpleChanges, Output, EventEmitter } from '@angular/core';
import {
  TreeComponent,
  Ng2TreeSettings,
  Tree,
  NodeSelectedEvent,
  NodeMenuItemAction,
  NodeMenuItem,
  NodeCreatedEvent,
  MenuItemSelectedEvent,
  TreeModel,
  NodeRenamedEvent
} from 'ng2-tree';
import { TreeStatus } from 'ng2-tree/src/tree.types';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { FileUtils, FileData } from 'shared/web/lib/ts/FileUtils';

export class FileUploadData {
  fileData: FileData;
  target: Tree;
}

@Injectable()
export abstract class NG2FileTreeComponent {
  editable = false;
  fileSelected: string = null;
  folderSelected: string = null;
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  @Output() previewClicked = new EventEmitter<string>();
  @Output() fileUploaded = new EventEmitter<FileUploadData>();

  constructor(private zone: NgZone, private logServer: ILogService) { }

  public nodeSelected(event: NodeSelectedEvent) {
    const test = this.treeComponent.getControllerByNodeId(event.node.id);
    this.fileSelected = null;
    this.folderSelected = null;
    if (!event.node.isBranch()) {
      this.fileSelected = this.getPathForNode(event.node);
      return;
    }
    this.folderSelected = this.getPathForNode(event.node);

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

    this.fileSelected = null;
    this.folderSelected = null;

    if (e.node.isBranch()) {
      this.folderSelected = this.getPathForNode(e.node);
    } else {
      this.fileSelected = this.getPathForNode(e.node);
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

  private GetSelectedBranch(): Tree {
    const path = this.fileSelected || this.folderSelected;
    let selectedNode = this.findNodeByPath(this.treeComponent.tree, path);

    if (this.fileSelected) {
      selectedNode = selectedNode.parent;
    }

    return selectedNode;
  }

  public onNewFolderClicked(e: MouseEvent) {
    const selectedNode = this.GetSelectedBranch();
    const selectedNodeController = this.treeComponent.getControllerByNodeId(selectedNode.id);

    selectedNodeController.addChild({
      value: 'Untitled Folder',
      _status: TreeStatus.New,
      children: []
    } as TreeModel);
  }

  public onNewFileClicked(e: MouseEvent) {
    const selectedNode = this.GetSelectedBranch();
    const selectedNodeController = this.treeComponent.getControllerByNodeId(selectedNode.id);

    selectedNodeController.addChild({
      value: 'Untitled File',
      _status: TreeStatus.New
    } as TreeModel);
  }

  public onUploadFileClicked(e: MouseEvent) {
    FileUtils.SelectFile().then((fileData: FileData) => {
      // Update path to be relative to selected branch
      // const selectedBranch = this.GetSelectedBranch();
      // const selectedBranchPath = this.getPathForNode(selectedBranch);
      // fileData.name = selectedBranchPath + '/' + fileData.name;

      this.fileUploaded.next({
        fileData,
        target: this.GetSelectedBranch()
      } as FileUploadData);
    });
  }

  public addResourceNode(nodePath: string, resourceId: string, nodeName: string) {
    const selectedNode = this.findNodeByPath(this.treeComponent.tree, nodePath);
    const selectedNodeController = this.treeComponent.getControllerByNodeId(selectedNode.id);
    selectedNodeController.addChild({
      value: nodeName,
      _status: TreeStatus.New,
      resourceId
    } as TreeModel);
  }

  public onNodeRenamed(e: NodeRenamedEvent) {
    this.fileSelected = null;
    this.folderSelected = null;

    if (e.node.isBranch()) {
      this.folderSelected = this.getPathForNode(e.node);
    } else {
      this.fileSelected = this.getPathForNode(e.node);
    }
  }

  private CreateChildTree(path: string, cache?: { [path: string]: TreeModel }, parentPath?: string): TreeModel {

    const splitPath = path.replace('/project/', '').split('/');

    parentPath = parentPath || '/project';

    let model: TreeModel = null;
    const nodeName = splitPath[0];
    if (nodeName === '') {
      return null;
    }
    const cacheName = parentPath + '/' + splitPath[0];

    cache = cache || {};

    if (cache && cache[cacheName]) {
      model = cache[cacheName];
    } else {
      model = {
        value: nodeName,
        settings: {
          menuItems: [
            { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
            { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
            { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
          ]
        }
      } as TreeModel;
      cache[cacheName] = model;
    }

    if (splitPath.length === 1) {
      return model;
    }

    const childTree = this.CreateChildTree(splitPath.slice(1).join('/'), cache, cacheName);
    if (childTree !== null) {
      if (model.children) {
        model.children.push(childTree);
      } else {
        model.children = [childTree];
      }
    } else { // This implies there was a trailing slash implying a folder
      model.children = [];
      model.settings.menuItems = [
        { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
        { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
        { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
        { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
      ];
    }

    return model;
  }

  public PropogateTree(paths: string[]): void {
    const stagingChildren: Array<TreeModel> = []; // TODO edit tree
    const cache = {};
    for (const path of paths) {
      const child = this.CreateChildTree(path, cache);
      if (child) {
        const exists = stagingChildren.find((c) => {
          return c.value === child.value;
        });
        if (exists) {
          continue;
        }
        stagingChildren.push(child);
      }
    }

    this.treeComponent.treeModel = {
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
        static: false
      },
      children: [
        {
          value: 'project',
          id: 2,
          children: stagingChildren,
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
    this.treeComponent.ngOnChanges(null);
  }
}
