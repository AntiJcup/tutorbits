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
  NodeRenamedEvent,
  TreeController
} from 'ng2-tree';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { FileUtils, FileData } from 'shared/web/lib/ts/FileUtils';
import { TreeService } from 'ng2-tree/src/tree.service';

export interface FileUploadData {
  fileData: FileData;
  target: Tree;
}

export enum ResourceType {
  code,
  asset
}

export interface TutorBitsTreeModel extends TreeModel {
  resourceId?: string;
  type?: ResourceType;
  overrideProjectId?: string;
}

export interface PropogateTreeOptions {
  topLevelMenu?: NodeMenuItem[];
  branchMenu?: NodeMenuItem[];
  fileMenu?: NodeMenuItem[];
  overrideProjectId?: string;
}

@Injectable()
export abstract class NG2FileTreeComponent {
  editable = false;
  fileSelected: string = null;
  folderSelected: string = null;
  internalFiles: { [path: string]: TutorBitsTreeModel } = {};
  counter = 3;
  public selectedPath: string;
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  @Output() previewClicked = new EventEmitter<string>();
  @Output() fileUploaded = new EventEmitter<FileUploadData>();

  constructor(private zone: NgZone, private logServer: ILogService, private treeService: TreeService) { }

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

  public listNodesByPath(node: Tree, path: string): Tree[] {
    const splitPath = path.split('/');
    if (path === '/') {
      splitPath.pop();
    }
    let subPath = splitPath[0];
    if (subPath === '') {
      subPath = '/';
    }
    let matches: Tree[] = [];
    if (node.value === subPath) {
      if (splitPath.length > 1) {
        if (!node.children) {
          return matches;
        }
        for (const childNode of node.children) {
          const matchingChildNodes = this.listNodesByPath(childNode, splitPath.slice(1).join('/'));
          matches = matches.concat(matchingChildNodes);
        }
      } else {
        matches.push(node);
      }
    }

    return matches;
  }

  public selectNodeByPath(node: Tree, path: string, retry: boolean = true) {
    if (path === '/project') {
      return;
    }
    this.logServer.LogToConsole('FileTree', `Selecting node: ${path}`);
    this.selectedPath = path;
    this.zone.runTask(() => {
      const foundNode = this.findNodeByPath(node, path);
      if (!foundNode) {
        if (retry) {
          setTimeout(() => {
            this.selectNodeByPath(node, path, false);
          }, 1);
          return;
        } else {
          throw new Error('Node not found');
        }
      }
      const controller = this.treeComponent.getControllerByNodeId(foundNode.id);
      if (controller == null) {
        if (retry) {
          setTimeout(() => {
            this.selectNodeByPath(node, path, false);
          }, 1);
        } else {
          throw new Error('Node missing controller');
        }
      }
      controller.select();
    });
  }

  public addNodeByPath(path: string, isBranch: boolean, childModel: TutorBitsTreeModel = { value: '' }): void {
    this.zone.runTask(() => {
      if (path.endsWith('/') && !isBranch) {
        path = path.substr(0, path.length - 1);
      } else if (!path.endsWith('/') && isBranch) {
        path += '/';
      }


      childModel.id = this.counter++;
      this.internalFiles[path] = childModel;

      this.PropogateTree(this.internalFiles);
    });
  }

  public deleteNodeByPath(path: string, retry: boolean = true): void {
    this.zone.runTask(() => {
      delete this.internalFiles[path];

      this.PropogateTree(this.internalFiles);
    });
  }

  public renameNodeByPath(sourcePath: string, destinationPath: string, isBranch: boolean) {
    if (sourcePath === destinationPath) {
      return;
    }
    this.zone.runTask(() => {
      const oldNode = this.internalFiles[sourcePath];
      this.internalFiles[destinationPath] = oldNode;
      delete this.internalFiles[sourcePath];

      this.PropogateTree(this.internalFiles);
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

    const newNodeModel = {
      value: 'Untitled_Folder',
      children: []
    } as TreeModel;

    selectedNodeController.addChildAsync(newNodeModel).then((newNode) => {
      const newNodeController = this.treeComponent.getControllerByNodeId(newNode.id);
      newNodeController.rename('Untitled_Folder');
      newNodeController.startRenaming();
    });
  }

  public onNewFileClicked(e: MouseEvent) {
    const selectedNode = this.GetSelectedBranch();
    const selectedNodeController = this.treeComponent.getControllerByNodeId(selectedNode.id);

    const newNodeModel = {
      value: 'Untitled_File',
      type: ResourceType.code
    } as TutorBitsTreeModel;

    selectedNodeController.addChildAsync(newNodeModel).then((newNode) => {
      const newNodeController = this.treeComponent.getControllerByNodeId(newNode.id);
      newNodeController.rename('Untitled_File');
      newNodeController.startRenaming();
    });
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

    const newNodeModel = {
      value: nodeName,
      resourceId,
      type: ResourceType.asset
    } as TutorBitsTreeModel;

    selectedNodeController.addChildAsync(newNodeModel).then((newNode) => {
      const newNodeController = this.treeComponent.getControllerByNodeId(newNode.id);
      newNodeController.rename(nodeName);
    });
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

  private CreateChildTree(
    path: string, tmodel: TutorBitsTreeModel, options: PropogateTreeOptions,
    cache?: { [path: string]: TreeModel }, parentPath?: string): TreeModel {

    const splitPath = path.replace('/project/', '').split('/');

    parentPath = parentPath || '/project';

    let model: TreeModel = null;
    const type: ResourceType = tmodel.type || ResourceType.code;
    const id: string | number = tmodel.id;
    const nodeName = splitPath[0];
    const resourceId: string = tmodel.resourceId;
    if (nodeName === '') {
      return null;
    }
    const cacheName = parentPath + '/' + splitPath[0];

    cache = cache || {};

    if (cache && cache[cacheName]) {
      model = cache[cacheName];
    } else {
      model = {
        id,
        value: nodeName,
        settings: {
          menuItems: options.fileMenu || [
            { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
            { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
            { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
          ]
        },
        type,
        resourceId,
        overrideProjectId: options.overrideProjectId
      } as TutorBitsTreeModel;
      cache[cacheName] = model;
    }

    if (splitPath.length === 1) {
      return model;
    }

    const childTree = this.CreateChildTree(splitPath.slice(1).join('/'), tmodel, options, cache, cacheName);
    if (childTree !== null) {
      if (model.children) {
        model.children.push(childTree);
      } else {
        model.children = [childTree];
      }
    } else { // This implies there was a trailing slash implying a folder
      model.children = [];
      model.settings.menuItems = options.branchMenu || [
        { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
        { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
        { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
        { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
      ];
    }

    return model;
  }

  public PropogateTreeJson(fileJson: { [path: string]: string }, options: PropogateTreeOptions = {}): void {
    const files: { [path: string]: TutorBitsTreeModel } = {};

    for (let path of Object.keys(fileJson)) {
      const model = {

      } as TutorBitsTreeModel;

      if (path.startsWith('res:')) {
        model.resourceId = fileJson[path];
        path = path.replace('res:', '');
        model.type = ResourceType.asset;
      }

      files[path] = model;
    }

    this.PropogateTree(files, options);
  }

  public PropogateTree(files: { [path: string]: TutorBitsTreeModel }, options: PropogateTreeOptions = {}): void {
    const stagingChildren: Array<TreeModel> = [];
    const cache = {};
    for (const path of Object.keys(files)) {
      const child = this.CreateChildTree(path, files[path], options, cache);
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
            menuItems: options.topLevelMenu || [
              { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
              { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
            ]
          }
        }
      ]
    };
    this.treeComponent.ngOnChanges(null);
    if (this.selectedPath) {
      setTimeout(() => {
        this.selectNodeByPath(this.treeComponent.tree, this.selectedPath);
      }, 1);
    }
  }

  public GetNodeType(node: Tree): ResourceType {
    return (node.node as TutorBitsTreeModel).type || ResourceType.code;
  }

  public SantizeFileName(name: string): string {
    return name.replace(/[^a-z0-9._-]+/ig, '_');
  }

  public AddModifiersToFilePath(path: string, node: Tree): string {
    let newPath = path;
    let index = 1;
    const splitPath = path.split('.');
    const indexToModify = Math.max(0, splitPath.length - 2);
    while (this.DoesPathExist(newPath, node)) {
      newPath = path;
      const newSplitPath = splitPath.concat([]);
      newSplitPath[indexToModify] = `${splitPath[indexToModify]}_${index++}`;
      newPath = newSplitPath.join('.');
    }

    const newPathSplit = newPath.split('/');
    return newPathSplit[newPathSplit.length - 1];
  }

  public DoesPathExist(path: string, node?: Tree, parent?: Tree): boolean {
    const matchingNodes = this.listNodesByPath(parent || this.treeComponent.tree, path);

    for (const matchingNode of matchingNodes) {
      if (node && matchingNode.id === node.id) {
        continue;
      }

      return true;
    }

    return false;
  }
}
