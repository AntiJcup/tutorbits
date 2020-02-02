import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { CreateProject } from 'src/app/models/project/create-project';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { ViewProject } from 'src/app/models/project/view-project';
import { Guid } from 'guid-typescript';

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
    private titleService: ITitleService,
    private authService: IAuthService) { }

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
      this.errorServer.HandleError('CreateSandbox', err);
    }
  }

  ngOnDestroy(): void {
  }

  async submit(model: CreateProject) {
    this.logServer.LogToConsole('CreateTutorial', model);
    this.loading = true;

    const isLoggedIn = this.authService.IsLoggedIn();
    let newProjectId: string;
    if (isLoggedIn) {
      try {
        const createRes = await this.projectService.Create({
          projectType: model.projectType
        } as CreateProject);

        if (createRes.error) {
          this.errorServer.HandleError('CreateSandbox', createRes.error);
        }

        const createdProject: ViewProject = createRes.data;
        newProjectId = createdProject.id;
      } catch (err) {
        this.errorServer.HandleError('CreateSandbox', err);
      }
    } else {
      newProjectId = Guid.create().toString();
    }
    
    this.router.navigate([`sandbox/${model.projectType.toLowerCase()}/${newProjectId}`]); // Lower case this so the url is cleaner
  }
}
