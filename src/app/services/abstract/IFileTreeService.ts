import { EventEmitter } from 'events';
import {
  TreeModel, TreeModelSettings,
} from '../../../../shared/Ng2-Tree';

export enum FileTreeEvents {
  InitializedSession,
  EndedSession,
  SelectedNode,
  AddedNode,
  AddedResource,
  UpdatedNode,
  ExpandedNode,
  DeletedNode,
  RenamedNode,
  MovedNode,
  TreeUpdate
}

export interface TutorBitsTreeModel extends TreeModel {
  resourceId?: string;
  type?: ResourceType;
  overrideProjectId?: string;
}

export enum ResourceType {
  code,
  asset
}

export interface PropogateTreeOptions {
  overrideProjectId?: string;
}

export enum PathType {
  none,
  file,
  folder,
}

export abstract class IFileTreeService extends EventEmitter {
  public abstract get selectedPath(): string;

  public abstract set selectedPath(path: string);

  public abstract get selectedFolder(): string;

  public abstract get selectedPathType(): PathType;

  public abstract get models(): Readonly<{ [path: string]: TutorBitsTreeModel }>;

  public abstract get tree(): TutorBitsTreeModel[];

  public abstract get editable(): boolean;

  public abstract set editable(editable: boolean);

  public abstract InitializeSession(): void;

  public abstract EndSession(): void;

  public abstract PropogateTreeJson(fileJson: { [path: string]: string }, options: PropogateTreeOptions): void;

  public abstract PropogateTree(files: { [path: string]: TutorBitsTreeModel }, options: PropogateTreeOptions): void;

  public abstract AddNode(path: string, isFolder: boolean, childModel?: TutorBitsTreeModel, startRename?: boolean): void;

  public abstract UpdateNodeSettings(path: string, isFolder: boolean, childModelSettings: TreeModelSettings): void;

  public abstract AddResourceNode(path: string, resourceId: string): void;

  public abstract DeleteNode(path: string, isFolder: boolean): void;

  public abstract RenameNode(sourcePath: string, destinationPath: string, isFolder: boolean): void;

  public abstract MarkForRenameByPath(sourcePath: string, isFolder: boolean): void;

  public abstract MoveNode(sourcePath: string, destinationPath: string, isFolder: boolean): void;

  public abstract ExpandNodeByPath(path: string, expand: boolean): void;

  public abstract ToggleExpandNodeByPath(path: string): void;

  public abstract PathIsExpanded(path: string): boolean;

  public abstract GetNodeType(node: TutorBitsTreeModel): ResourceType;

  public abstract GetNodeTypeByPath(path: string): ResourceType;

  public abstract SanitizeFileName(name: string): string;

  public abstract AddModifiersToFilePath(path: string): { path: string, file: string };

  public abstract DoesPathExist(path: string): boolean;

  public abstract GetPathForNode(node: TutorBitsTreeModel): string;

  public abstract GetNodeSettingsByPath(path: string): TreeModelSettings;

  public abstract GetPathTypeForPath(path: string): PathType;

  public abstract GetNodeForPath(path: string): Readonly<TutorBitsTreeModel>;

  public abstract GetParentPath(path: string): string;
}
