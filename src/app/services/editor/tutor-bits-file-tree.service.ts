import { IFileTreeService, PathType, PropogateTreeOptions, TutorBitsTreeModel, ResourceNodeType, FileTreeEvents } from '../abstract/IFileTreeService';
import { Guid } from 'guid-typescript';
import { TreeStatus, FoldingType, TreeModelSettings } from '../../../../shared/Ng2-Tree/src/tree.types';
import { Injectable } from '@angular/core';

@Injectable()
export class TutorBitsFileTreeService extends IFileTreeService {
  private internalSelectedPath: string;
  private internalSelectedPathType: PathType;
  private internalModels: { [path: string]: TutorBitsTreeModel } = {};
  private internalTree: TutorBitsTreeModel[] = [];
  private internalEditable = false;
  private initialized = false;

  public get selectedPath(): string {
    return this.internalSelectedPath;
  }

  public set selectedPath(path: string) {
    this.internalSelectedPath = path;
    if (this.internalSelectedPath) { // If not null figure out the path type
      this.internalSelectedPathType = this.GetPathTypeForPath(path);
      // TODO selection
      this.emit(FileTreeEvents[FileTreeEvents.SelectedNode], path, this.internalSelectedPathType, this.GetNodeTypeByPath(path));
    } else {
      this.internalSelectedPathType = PathType.none;
    }
  }

  public get selectedFolder(): string {
    if (this.selectedPathType === PathType.folder) {
      return this.selectedPath;
    }

    return this.GetParentPath(this.selectedPath);
  }

  public get selectedPathType(): PathType {
    return this.internalSelectedPathType;
  }

  public get models(): Readonly<{ [path: string]: TutorBitsTreeModel }> {
    return this.internalModels;
  }

  public get tree(): TutorBitsTreeModel[] {
    return this.internalTree;
  }

  // Bool to control whether ui can edit the tree
  public get editable(): boolean {
    return this.internalEditable;
  }

  public set editable(editable: boolean) {
    this.internalEditable = editable;
  }

  public InitializeSession(): void {
    if (this.initialized) {
      throw new Error('Already initialized');
    }

    this.AddNode('/project', true);
    this.initialized = true;
    this.emit(FileTreeEvents[FileTreeEvents.InitializedSession]);
  }

  public EndSession(): void {
    this.internalModels = {};
    this.internalTree = [];
    this.internalSelectedPath = '';
    this.internalSelectedPathType = PathType.none;
    this.initialized = false;
    this.internalEditable = false;
    this.emit(FileTreeEvents[FileTreeEvents.EndedSession]);
  }

  public Cleanup(): void {
    this.removeAllListeners();
  }

  public PropogateTreeJson(fileJson: { [path: string]: string; }, options: PropogateTreeOptions = {}): void {
    const files: { [path: string]: TutorBitsTreeModel } = {};

    for (let path of Object.keys(fileJson)) {
      const model = {
        id: Guid.create().toString()
      } as TutorBitsTreeModel;

      if (path.startsWith('res:')) {
        model.resourceId = fileJson[path];
        path = path.replace('res:', '');
        model.type = ResourceNodeType.asset;
      }

      files[path] = model;
    }

    this.PropogateTree(files, options);
  }

  public PropogateTree(files: { [path: string]: TutorBitsTreeModel }, options: PropogateTreeOptions = {}): void {
    const stagingChildren: Array<TutorBitsTreeModel> = [];
    const cache = {};

    this.internalModels = files;

    for (const path of Object.keys(files).sort((a, b) => {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return a.length - b.length;
    })) {
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

    this.internalTree = stagingChildren;
    this.emit(FileTreeEvents[FileTreeEvents.TreeUpdate]);
  }

  private CreateChildTree(
    path: string, tmodel: TutorBitsTreeModel, options: PropogateTreeOptions,
    cache?: { [path: string]: TutorBitsTreeModel }, parentPath?: string): TutorBitsTreeModel {

    const splitPath = path.replace('/project/', '').split('/');

    parentPath = parentPath || '/project';

    let model: TutorBitsTreeModel = null;
    const type: ResourceNodeType = tmodel.type || ResourceNodeType.code;
    const id: string | number = tmodel.id;
    const nodeName = splitPath[0];
    const resourceId: string = tmodel.resourceId;
    const status = tmodel._status;
    const foldingType = tmodel._foldingType;
    const settings = tmodel.settings;
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
        settings,
        _status: status,
        _foldingType: foldingType,
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
        const exists = model.children.find((c) => {
          return c.value === childTree.value;
        });
        if (!exists) {
          model.children.push(childTree);
        }
      } else {
        model.children = [childTree];
      }
    } else { // This implies there was a trailing slash implying a folder
      if (!model.children || model.children.length <= 0) {
        model.children = [];
      }
      // TODO move this into the component on tree update event
      // model.settings.menuItems = options.branchMenu || [
      //   { action: NodeMenuItemAction.NewFolder, name: 'Add folder', cssClass: '' },
      //   { action: NodeMenuItemAction.NewTag, name: 'Add file', cssClass: '' },
      //   { action: NodeMenuItemAction.Remove, name: 'Delete', cssClass: '' },
      //   { action: NodeMenuItemAction.Rename, name: 'Rename', cssClass: '' }
      // ];
    }

    return model;
  }

  public AddNode(path: string, isFolder: boolean, childModel?: TutorBitsTreeModel, startRename?: boolean): void {
    const normalPath = this.NormalizePath(path, isFolder);
    const parentPath = this.GetParentPath(normalPath);
    if (this.GetPathTypeForPath(parentPath) !== PathType.folder) {
      throw new Error(`Can't add files to files`);
    }

    childModel = childModel || {
      value: ''
    } as TutorBitsTreeModel;
    childModel.id = Guid.create().toString();

    const fixedPath = this.AddModifiersToFilePath(this.SanitizePath(normalPath).path);
    const fixedNormalPath = this.NormalizePath(fixedPath.path, isFolder);

    childModel.value = fixedPath.file;
    this.internalModels[fixedNormalPath] = childModel;

    if (startRename) {
      childModel._status = TreeStatus.IsBeingRenamed;
    }
    this.emit(FileTreeEvents[FileTreeEvents.AddedNode], fixedNormalPath);
    this.PropogateTree(this.internalModels);
  }

  public UpdateNodeSettings(path: string, isFolder: boolean, childModelSettings: TreeModelSettings): void {
    const normalPath = this.NormalizePath(path, isFolder);

    this.internalModels[normalPath].settings = childModelSettings;

    this.emit(FileTreeEvents[FileTreeEvents.UpdatedNode], normalPath);
    this.PropogateTree(this.internalModels);
  }

  public AddResourceNode(path: string, resourceId: string): void {
    const newNodeModel = {
      value: path.split('/').pop(),
      resourceId,
      type: ResourceNodeType.asset // TODO add interpretation of file type so not everything is an asset (like code uploads)
    } as TutorBitsTreeModel;

    this.emit(FileTreeEvents[FileTreeEvents.UpdatedNode], path, resourceId);
    this.AddNode(`${path}`, false, newNodeModel);
  }

  public DeleteNode(path: string, isFolder: boolean): void {
    const normalPath = this.NormalizePath(path, isFolder);

    Object.keys(this.internalModels).sort((a, b) => {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return b.length - a.length;
    }).forEach((existingPath: string) => {
      if (existingPath.startsWith(normalPath)) {
        const existingIsFolder = this.GetPathTypeForPath(existingPath) === PathType.folder;
        const existingType = this.GetNodeTypeByPath(existingPath);
        delete this.internalModels[existingPath];
        this.emit(FileTreeEvents[FileTreeEvents.DeletedNode], existingPath, existingIsFolder, existingType);
      }
    });

    this.PropogateTree(this.internalModels);
  }

  public RenameNode(sourcePath: string, destinationPath: string, isFolder: boolean): void {
    if (sourcePath === destinationPath) {
      return;
    }

    const normalSourcePath = this.NormalizePath(sourcePath, isFolder);
    const normalDestinationPath = this.NormalizePath(destinationPath, isFolder);
    const fixedDestinationPath = this.AddModifiersToFilePath(this.SanitizePath(normalDestinationPath).path);
    const fixedNormalDestinationPath = this.NormalizePath(fixedDestinationPath.path, isFolder);

    Object.keys(this.internalModels).sort((a, b) => {
      // ASC  -> a.length - b.length
      // DESC -> b.length - a.length
      return b.length - a.length;
    }).forEach((existingPath: string) => {
      if (existingPath.startsWith(normalSourcePath)) {
        const oldNode = this.internalModels[existingPath];
        let targetPath = fixedNormalDestinationPath;

        oldNode._status = TreeStatus.Modified;
        if (existingPath === normalSourcePath) {
          oldNode.value = 'asdasd';
        } else {
          // I dont want the trailing slash so I use fixedDestinationPath
          targetPath = `${fixedDestinationPath.path}${existingPath.substr(sourcePath.length)}`;
        }

        this.internalModels[targetPath] = oldNode;

        delete this.internalModels[existingPath];
        this.emit(FileTreeEvents[FileTreeEvents.RenamedNode], existingPath, targetPath);
      }
    });

    this.PropogateTree(this.internalModels);
  }

  public MarkForRenameByPath(path: string, isFolder: boolean): void {
    const normalPath = this.NormalizePath(path, isFolder);
    const node = this.internalModels[normalPath];
    node._status = TreeStatus.IsBeingRenamed;

    this.PropogateTree(this.internalModels);
  }

  public MoveNode(sourcePath: string, destinationPath: string, isFolder: boolean): void {
    this.RenameNode(sourcePath, destinationPath, isFolder);
  }

  public ExpandNodeByPath(path: string, expand: boolean): void {
    const normalPath = this.NormalizePath(path, true);

    const node = this.internalModels[normalPath];
    node._foldingType = expand ? FoldingType.Expanded : FoldingType.Collapsed;

    this.emit(FileTreeEvents[FileTreeEvents.ExpandedNode], normalPath);
    this.PropogateTree(this.internalModels);
  }

  public ToggleExpandNodeByPath(path: string): void {
    const normalPath = this.NormalizePath(path, true);
    const expanded = this.PathIsExpanded(normalPath);
    this.ExpandNodeByPath(path, !expanded);
  }

  public PathIsExpanded(path: string): boolean {
    const normalPath = this.NormalizePath(path, true);
    return this.internalModels[normalPath]._foldingType === FoldingType.Expanded;
  }

  public GetNodeType(node: TutorBitsTreeModel): ResourceNodeType {
    return node.type || ResourceNodeType.code;
  }

  public GetNodeTypeByPath(path: string): ResourceNodeType {
    return this.internalModels[path]?.type || ResourceNodeType.code;
  }

  public SanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9._-]+/ig, '_');
  }

  public SanitizePath(path: string): { path: string, file: string } {
    let newPath = path;
    if (newPath.endsWith('/')) {
      newPath = newPath.substr(0, newPath.length - 1);
    }

    const splitPath = newPath.split('/');
    const fileName = this.SanitizeFileName(splitPath.pop());

    return { path: [...splitPath, fileName].join('/'), file: fileName };
  }

  public AddModifiersToFilePath(path: string): { path: string, file: string } {
    let newPath = path;
    let index = 1;
    const splitPath = path.split('.');
    const indexToModify = Math.max(0, splitPath.length - 2);
    let fileName = '';

    let altNewPath = newPath.endsWith('/') ? newPath.substr(0, newPath.length - 1) : (`${newPath}/`);
    while (this.DoesPathExist(newPath) || this.DoesPathExist(altNewPath)) {
      newPath = path;
      const newSplitPath = splitPath.concat([]);
      fileName = newSplitPath[indexToModify] = `${splitPath[indexToModify]}_${index++}`;
      newPath = newSplitPath.join('.');
      altNewPath = newPath.endsWith('/') ? newPath.substr(0, newPath.length - 1) : (`${newPath}/`);
    }

    return { path: newPath, file: fileName };
  }

  public NormalizePath(path: string, isFolder: boolean): string {
    let newPath = path;
    if (newPath.endsWith('/') && !isFolder) {
      newPath = newPath.substr(0, newPath.length - 1);
    } else if (!newPath.endsWith('/') && isFolder) {
      newPath += '/';
    }

    return newPath;
  }

  public DoesPathExist(path: string): boolean {
    return !!this.internalModels[path];
  }

  public GetPathForNode(node: TutorBitsTreeModel): string {
    let foundNodePath = '';
    Object.keys(this.internalModels).forEach((path: string) => {
      if (this.internalModels[path].id === node.id) {
        foundNodePath = path;
      }
    });

    return foundNodePath;
  }

  public GetNodeSettingsByPath(path: string): TreeModelSettings {
    return this.internalModels[path].settings;
  }

  public GetPathTypeForPath(path: string): PathType {
    if (path === '/') {
      return PathType.folder;
    }

    let node = this.internalModels[path];
    if (!node && !path.endsWith('/')) {
      path = `${path}/`;
      node = this.internalModels[path];
    }

    return node.children ||
      path.endsWith('/') ?
      PathType.folder : PathType.file;
  }

  public GetParentPath(path: string): string {
    const splitPath = path.split('/');
    splitPath.pop();
    if (path.endsWith('/')) {
      splitPath.pop();
    }

    const outPath = splitPath.join('/');
    return outPath.length === 0 ? '/' : outPath;
  }

  public GetNodeForPath(path: string): Readonly<TutorBitsTreeModel> {
    return this.internalModels[path];
  }

  public Reset(): void {
    this.internalModels = {};
    this.AddNode('/project', true);
  }
}
