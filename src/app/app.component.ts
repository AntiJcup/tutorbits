import { Component } from '@angular/core';
import { TreeModel, NodeMenuItemAction, Ng2TreeSettings } from 'ng2-tree';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'tutorbits';
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code = 'function x() {\n\tconsole.log("Hello world!");\n}';
  public tree: TreeModel = {
    value: '/',
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
      static: true
    },
        children: [
          {
            value: 'bin',
            id: 2,
            children: [
              { value: 'bash', id: 3 },
              { value: 'umount', id: 4 },
              { value: 'cp', id: 5 },
              { value: 'less', id: 6 },
              { value: 'rmdir', id: 7 },
              { value: 'touch', id: 8 },
              { value: 'chgrp', id: 9 },
              { value: 'chmod', id: 10 },
              { value: 'chown', id: 11 },
              { value: 'nano', id: 12 }
            ],
            settings: {
              isCollapsedOnInit: true
            }
          },
          {
            value: 'boot',
            id: 13,
            settings: {
              isCollapsedOnInit: true,
            },
            children: [
              {
                value: 'grub',
                id: 14,
                children: [
                  { value: 'fonts', id: 15 },
                  { value: 'gfxblacklist.txt', id: 16 },
                  { value: 'grub.cfg', id: 17 },
                  { value: 'grubenv', id: 18 },
                  { value: 'i386-pc', id: 19 },
                  { value: 'locale', id: 20 },
                  { value: 'unicode.pf2', id: 21 }
                ]
              },
              {
                value: 'lost+found',
                id: 22,
                children: [],
                settings: {
                  checked: true
                }
              },
              { value: 'abi-4.4.0-57-generic', id: 23 },
              { value: 'config-4.4.0-57-generic', id: 24 },
              { value: 'initrd.img-4.4.0-47-generic', id: 25 },
              { value: 'initrd.img-4.4.0-57-generic', id: 26 },
              { value: 'memtest86+.bin', id: 27 },
              { value: 'System.map-4.4.0-57-generic', id: 28 },
              { value: 'memtest86+.elf', id: 29 },
              { value: 'vmlinuz-4.4.0-57-generic', id: 30 },
              { value: 'memtest86+_multiboot.bin', id: 31 }
            ]
          },
          {
            value: 'build-no-left-no-right-menus',
            id: 32,
            settings: {
              leftMenu: false,
              rightMenu: false
            },
            children: [
              {
                value: 'php5-left-menu',
                id: 33,
                settings: {
                  leftMenu: true
                }
              },
              {
                value: 'grails-left-menu',
                id: 335,
                settings: {
                  leftMenu: true
                }
              },
              {
                value: 'python-right-menu',
                id: 333,
                settings: {
                  rightMenu: true
                }
              }
            ]
          },
          { value: 'cdrom', id: 34, children: [] },
          { value: 'dev', id: 35, children: [] },
          {
            value: 'etc',
            id: 36,
            loadChildren: callback => {
              console.log('callback function called to load etc`s children');
              setTimeout(() => {
                callback([
                  { value: 'apache2', id: 82, children: [] },
                  { value: 'nginx', id: 83, children: [] },
                  { value: 'dhcp', id: 84, children: [] },
                  { value: 'dpkg', id: 85, children: [] }
                ]);
              });
            }
          },
        ]
    };

  public settings: Ng2TreeSettings = {
    rootIsVisible: true,
    showCheckboxes: false
  };
}
