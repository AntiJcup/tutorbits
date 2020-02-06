import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';
import { CreateThumbnail } from 'src/app/models/thumbnail/create-thumbnail';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { TutorBitsThumbnailService } from 'src/app/services/thumbnail/tutor-bits-thumbnail.service';
import { ViewProject } from 'src/app/models/project/view-project';
import { TutorBitsTracerProjectService } from 'src/app/services/project/tutor-bits-tracer-project.service';
import { CreateProject } from 'src/app/models/project/create-project';
import { ViewVideo } from 'src/app/models/video/view-video';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { CreateVideo } from 'src/app/models/video/create-video';
import { CreateTutorialForm } from 'src/app/models/tutorial/create-tutorial-form';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateTutorialForm = {
    Title: null,
    Description: null,
    Topic: null,
    ThumbnailData: null,
    ProjectType: null
  };
  fields: FormlyFieldConfig[] = [];

  constructor(
    private tutorialService: TutorBitsTutorialService,
    private thumbnailService: TutorBitsThumbnailService,
    private projectService: ITracerProjectService,
    private videoService: IVideoService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone,
    private titleService: ITitleService) { }

  async ngOnInit() {
    this.titleService.SetTitle('Create Tutorial');
    this.loading = true;
    try {
      const tutorialTypes = await this.tutorialService.GetTutorialTopics();
      const tutorialTypeOptions = [];
      tutorialTypes.forEach(element => {
        tutorialTypeOptions.push({
          label: element,
          value: element
        });
      });

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
          key: 'Title',
          type: 'input',
          templateOptions: {
            label: 'Title',
            placeholder: 'Enter Tutorial Title',
            required: true,
            minLength: 4,
            maxLength: 64
          }
        },
        {
          key: 'Topic',
          type: 'select',
          templateOptions: {
            label: 'Tutorial Topic',
            required: true,
            options: tutorialTypeOptions
          }
        },
        {
          key: 'ProjectType',
          type: 'select',
          templateOptions: {
            label: 'Project Type',
            required: true,
            options: projectTypeOptions
          }
        },
        {
          key: 'Description',
          type: 'textarea',
          templateOptions: {
            label: 'Description',
            placeholder: 'Enter Tutorial Description',
            required: true,
            maxLength: 1028,
            rows: 8
          }
        },
        {
          key: 'ThumbnailData',
          type: 'file',
          templateOptions: {
            required: true,
            description: 'Upload Thumbnail'
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

  async submit(model: CreateTutorialForm) {
    this.logServer.LogToConsole('CreateTutorial', model);
    this.loading = true;

    if (model.ThumbnailData[0].type !== 'image/png' && model.ThumbnailData[0].type !== 'image/x-png') {
      this.errorServer.HandleError('ThumbnailError', `Unsupported image type ${model.ThumbnailData[0].type}`);
      this.loading = false;
      return;
    }

    const createThumb = {
      thumbnail: model.ThumbnailData[0]
    } as CreateThumbnail;

    try {
      const thumbnailResponse = await this.thumbnailService.Create(createThumb);
      if (thumbnailResponse.error) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(thumbnailResponse.error));
        return;
      }

      const createProjectModel = {
        projectType: model.ProjectType
      } as CreateProject;
      const projectResponse: ResponseWrapper<ViewProject> = await this.projectService.Create(createProjectModel);

      if (projectResponse.error) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(projectResponse.error));
        return;
      }

      const createVideoModel = {
      } as CreateVideo;
      const videoResponse: ResponseWrapper<ViewVideo> = await this.videoService.Create(createVideoModel);

      if (videoResponse.error) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(videoResponse.error));
        return;
      }

      const createTutorialModel = this.tutorialService.ConvertForm(model);
      createTutorialModel.VideoId = videoResponse.data.id;
      createTutorialModel.ProjectId = projectResponse.data.id;
      createTutorialModel.ThumbnailId = thumbnailResponse.data.id;
      const tutorialResponse: ResponseWrapper<ViewTutorial> = await this.tutorialService.Create(createTutorialModel);

      this.logServer.LogToConsole('CreateTutorial', tutorialResponse);
      if (tutorialResponse.error != null) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(tutorialResponse.error));
      } else {
        this.loading = false;
        this.router.navigate([`record/${tutorialResponse.data.id}`]);
      }
    } catch (e) {
      this.errorServer.HandleError('CreateError', e);
      this.loading = false;
    }
  }
}
