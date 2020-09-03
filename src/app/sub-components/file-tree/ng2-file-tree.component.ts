import { ViewChild, NgZone, Injectable, Output, EventEmitter, ElementRef, Directive, OnInit, OnDestroy } from '@angular/core';
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
  NodeRemovedEvent,
  NodeMovedEvent
} from 'shared/Ng2-Tree';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { FileUtils, FileData } from 'shared/web/lib/ts/FileUtils';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { TutorBitsTreeModel, IFileTreeService, ResourceType, PathType, FileTreeEvents } from 'src/app/services/abstract/IFileTreeService';
import { ICurrentTracerProjectService } from 'src/app/services/abstract/ICurrentTracerProjectService';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { IRecorderService } from 'src/app/services/abstract/IRecorderService';

@Directive()
@Injectable()
export abstract class NG2FileTreeComponent implements OnInit, OnDestroy {
  counter = 3;
  public settings: Ng2TreeSettings = {
    rootIsVisible: false,
    showCheckboxes: false
  };
  protected log: (...args: any[]) => void;
  protected lastNodeCreated: { path: string, timestamp: number };
  protected readonly MINCREATETIME: number = 1000 * 1;
  protected ignoreNextSelectEvent = false;

  @ViewChild(TreeComponent, { static: true }) treeComponent: TreeComponent;

  @Output() previewClicked = new EventEmitter<string>();

  @Output()
  public get fileSelected(): string {
    if (this.fileTreeService.selectedPathType !== PathType.file) {
      return null;
    }

    return this.fileTreeService.selectedPath;
  }

  @Output()
  public get folderSelected(): string {
    if (this.fileTreeService.selectedPathType !== PathType.folder) {
      return null;
    }

    return this.fileTreeService.selectedPath;
  }

  @Output()
  public get editable(): boolean {
    return this.fileTreeService.editable;
  }

  constructor(
    private zone: NgZone,
    private logServer: ILogService,
    private eventService: IEventService,
    protected fileTreeService: IFileTreeService,
    private currentProjectService: ICurrentTracerProjectService,
    private authService: IAuthService,
    private previewService: IPreviewService,
    protected myElement: ElementRef) {
    this.log = this.logServer.LogToConsole.bind(this.logServer, 'NG2FileTreeComponent');
  }

  public ngOnInit() {
    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.TreeUpdate], () => {
      this.zone.runTask(() => {
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
              children: this.fileTreeService.tree,
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
        if (this.fileTreeService.selectedPath) {
          this.ignoreNextSelectEvent = true;
          setTimeout(() => {
            this.selectNodeByPath(this.treeComponent.tree, this.fileTreeService.selectedPath, true);
          }, 0);
        }
      });
    });
    this.fileTreeService.InitializeSession();

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
    this.log(`Selecting node: ${path}`);
    this.zone.runTask(() => {
      const foundNode = this.findNodeByPath(node, path);
      if (!foundNode) {
        if (retry) {
          setTimeout(() => {
            this.selectNodeByPath(node, path, false);
          }, 1);
          return;
        } else {
          throw new Error(`Node not found ${path}`);
        }
      }
      const controller = this.treeComponent.getControllerByNodeId(foundNode.id);
      if (controller == null) {
        if (retry) {
          setTimeout(() => {
            this.selectNodeByPath(node, path, false);
          }, 1);
        } else {
          throw new Error(`Node missing controller ${path}`);
        }
      }
      this.log(`Selecting found node: ${path}`);
      controller.select();
    });
  }

  public ngOnDestroy() {
    this.fileTreeService.EndSession();
  }

  public onNodeSelected(event: NodeSelectedEvent) {
    if (this.ignoreNextSelectEvent) {
      this.ignoreNextSelectEvent = false;
      return;
    }
    this.log(event);
    this.fileTreeService.selectedPath = this.getPathForNodeUI(event.node);

    if (event.node.parent.isRoot() || !event.node.isBranch()) { // No collapsing root level nodes
      return;
    }

    this.fileTreeService.ToggleExpandNodeByPath(this.fileTreeService.selectedPath);
  }

  public onEditChange(edit: boolean) {
    // this.editable = edit;
    if (edit) {
      this.treeComponent.treeModel.settings.menuItems = [
        { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
        { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
        { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
        { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
        { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
      ];

      this.treeComponent.treeModel.settings.static = false;
      const projectSettings = this.fileTreeService.GetNodeSettingsByPath('/project');
      projectSettings.menuItems = this.treeComponent.treeModel.settings.menuItems;
      this.fileTreeService.UpdateNodeSettings('/project', true, projectSettings);
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
      this.previewClicked.next(this.fileTreeService.GetPathForNode(e.node.node));
    }
  }

  public onPreviewHeaderButtonClicked(e: MouseEvent) {
    //this.previewService.ShowPreview(this.currentProjectService.projectId, )
  }

  public onNodeCreated(e: NodeCreatedEvent) {
    this.log(`NodeCreated Event Fired`);
    // Node created from this lib has a bug if you press enter on the rename module it can try and send 2 nodecreated events instead of one

    this.eventService.TriggerButtonClick('FileTree', 'NodeCreate');
    if (!this.fileTreeService.editable) {
      return;
    }

    const newPath = this.getPathForNodeUI(e.node);

    const now = (new Date()).valueOf();
    if (this.lastNodeCreated && this.lastNodeCreated.path === newPath && (now - this.lastNodeCreated.timestamp) < this.MINCREATETIME) {
      e.node.removeItselfFromParent();
      return;
    }

    this.lastNodeCreated = {
      path: newPath,
      timestamp: now
    };

    const newNodeModel = {
      value: e.node.isBranch() ? 'untitled_folder' : 'untitled_file',
      children: e.node.isBranch() ? [] : undefined,
      type: e.node.isBranch() ? undefined : ResourceType.code,
      settings: {
        menuItems: e.node.isBranch() ? [
          { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
          { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
          { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
          { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
        ] : [
            { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
            { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
            { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
          ]
      }
    } as TutorBitsTreeModel;

    this.fileTreeService.AddNode(newPath, e.node.isBranch(), newNodeModel, false);
    this.fileTreeService.selectedPath = newPath;
  }

  public async onNewFolderClicked(e: MouseEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'FolderCreate');

    const newNodeModel = {
      value: 'untitled_folder',
      children: [],
      settings: {
        menuItems: [
          { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
          { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
          { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
          { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
        ]
      }
    } as TutorBitsTreeModel;

    let targetPath = this.fileTreeService.selectedPath;
    if (this.fileTreeService.selectedPathType !== PathType.folder) {
      targetPath = this.fileTreeService.GetParentPath(targetPath);
    }
    const newPath = `${targetPath}/${newNodeModel.value}`;

    this.fileTreeService.AddNode(newPath, true, newNodeModel, true);
    this.fileTreeService.selectedPath = newPath;
  }

  public async onNewFileClicked(e: MouseEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'FileCreate');

    const newNodeModel = {
      value: 'untitled_file',
      type: ResourceType.code,
      settings: {
        menuItems: [
          { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
          { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' },
          { action: NodeMenuItemAction.Custom, name: 'Preview', cssClass: '' }
        ]
      }
    } as TutorBitsTreeModel;

    let targetPath = this.fileTreeService.selectedPath;
    if (this.fileTreeService.selectedPathType !== PathType.folder) {
      targetPath = this.fileTreeService.GetParentPath(targetPath);
    }
    const newPath = `${targetPath}/${newNodeModel.value}`;

    this.fileTreeService.AddNode(newPath, false, newNodeModel, true);
    this.fileTreeService.selectedPath = newPath;
  }

  public async onUploadFileClicked(e: MouseEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'UploadFileStart');
    const fileData: FileData = await FileUtils.SelectFile();
    // Update path to be relative to selected branch
    fileData.name = `${this.fileTreeService.selectedFolder}/${fileData.name}`;
    const resourceId = await this.currentProjectService.UploadResource(fileData.name, fileData.data, this.authService.IsLoggedIn());
    this.fileTreeService.AddResourceNode(fileData.name, resourceId);
  }

  public onNodeRenamed(e: NodeRenamedEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'NodeRenamed');
    this.fileTreeService.selectedPath = null;

    const newPath = this.getPathForNodeUI(e.node);
    const newPathPieces = newPath.split('/');
    newPathPieces.pop();
    const parentPath = newPathPieces.join('/');
    const oldPath = `${parentPath}/${e.oldValue}`;

    this.fileTreeService.RenameNode(oldPath, newPath, e.node.isBranch());
    this.fileTreeService.selectedPath = newPath;
  }

  public onNodeMoved(e: NodeMovedEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'NodeMoved');
    this.fileTreeService.selectedPath = null;

    const newPath = this.getPathForNodeUI(e.node);
    const previousParentPath = this.getPathForNodeUI(e.previousParent);
    const oldPath = `${previousParentPath}/${e.node.value}`;

    this.fileTreeService.RenameNode(oldPath, newPath, e.node.isBranch());
    this.fileTreeService.selectedPath = newPath;
  }

  public onNodeRemoved(e: NodeRemovedEvent) {
    this.eventService.TriggerButtonClick('FileTree', 'NodeRemoved');
    const deletePath = this.getPathForNodeUI(e.node);
    this.fileTreeService.DeleteNode(deletePath, e.node.isBranch());
  }

  public getPathForNodeUI(e: Tree) {
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
}
