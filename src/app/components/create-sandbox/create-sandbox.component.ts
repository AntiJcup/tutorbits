import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { CreateProject } from 'src/app/models/project/create-project';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';

@Component({
  templateUrl: './create-sandbox.component.html',
  styleUrls: ['./create-sandbox.component.sass']
})
export class CreateSandboxComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateProject = {
    projectType: null
  };
  fields: FormlyFieldConfig[] = [];

  constructor(
    private projectService: ITracerProjectService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone,
    private titleService: ITitleService) { }

  async ngOnInit() {
    this.titleService.SetTitle('Create Sandbox');
    this.loading = true;
    try {
      const projectTypes = await this.projectService.GetProjectTypes();
      const projectTypeOptions = [];
      projectTypes.forEach(element => {
        projectTypeOptions.push({
          label: element,
          value: element
        });
      });

      this.zone.runTask(() => {
        this.fields = [{
          key: 'projectType',
          type: 'select',
          templateOptions: {
            label: 'Project Type',
            required: true,
            options: projectTypeOptions
          }
        }];
      });
      this.loading = false;
    } catch (err) {
      this.errorServer.HandleError('CreateInitializeError', err);
    }
  }

  ngOnDestroy(): void {
  }

  async submit(model: CreateProject) {
    this.logServer.LogToConsole('CreateTutorial', model);
    this.loading = true;

    this.router.navigate([`sandbox/${model.projectType.toLowerCase()}`]); // Lower case this so the url is cleaner
  }
}
