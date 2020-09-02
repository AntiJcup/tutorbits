import { Component, OnInit, OnDestroy } from '@angular/core';
import { TreeModel, NodeMenuItemAction } from 'shared/Ng2-Tree';
import { NG2FileTreeComponent } from '../../file-tree/ng2-file-tree.component';
import { PathType } from 'src/app/services/abstract/IFileTreeService';

@Component({
  selector: 'app-recording-file-tree',
  templateUrl: './recording-file-tree.component.html',
  styleUrls: ['./recording-file-tree.component.sass']
})

export class RecordingFileTreeComponent extends NG2FileTreeComponent implements OnInit, OnDestroy {
  private keyboardCallback: (e: KeyboardEvent) => void;
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
      static: true
    },
    children: [
      {
        value: 'project',
        id: 2,
        children: [
        ],
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

  ngOnInit() {
    super.ngOnInit();
    this.keyboardCallback = (e: KeyboardEvent) => {
      if (!this.fileTreeService.selectedPath || this.myElement.nativeElement !== document.activeElement) {
        return;
      }

      if (this.fileTreeService.selectedPath === '/project') {
        return;
      }

      const isFolder = this.fileTreeService.selectedPathType === PathType.folder;
      switch (e.keyCode) {
        case 113: // F2
          this.fileTreeService.MarkForRenameByPath(
            this.fileTreeService.selectedPath,
            isFolder);
          break;
        case 46: // Delete
          this.fileTreeService.DeleteNode(this.fileTreeService.selectedPath, isFolder);
          break;
      }
    };
    document.addEventListener('keydown', this.keyboardCallback, false);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    document.removeEventListener('keydown', this.keyboardCallback);
  }
}
