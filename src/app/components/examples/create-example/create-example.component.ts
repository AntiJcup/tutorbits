import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateExample } from 'src/app/models/example/create-example';
import { CreateThumbnail } from 'src/app/models/thumbnail/create-thumbnail';
import { TutorBitsExampleService } from 'src/app/services/example/tutor-bits-example.service';
import { Router, ActivatedRoute } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewExample } from 'src/app/models/example/view-example';
import { TutorBitsThumbnailService } from 'src/app/services/thumbnail/tutor-bits-thumbnail.service';
import { ViewProject } from 'src/app/models/project/view-project';
import { TutorBitsTracerProjectService } from 'src/app/services/project/tutor-bits-tracer-project.service';
import { CreateProject } from 'src/app/models/project/create-project';
import { ViewVideo } from 'src/app/models/video/view-video';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { CreateVideo } from 'src/app/models/video/create-video';
import { CreateExampleForm } from 'src/app/models/example/create-example-form';

@Component({
  templateUrl: './create-example.component.html',
  styleUrls: ['./create-example.component.sass']
})
export class CreateExampleComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateExampleForm = {
    Title: null,
    Description: null,
    Topic: null,
    ThumbnailData: null
  };
  fields: FormlyFieldConfig[] = [];
  projectId: string;

  constructor(
    private exampleService: TutorBitsExampleService,
    private thumbnailService: TutorBitsThumbnailService,
    private projectService: ITracerProjectService,
    private videoService: IVideoService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone,
    private titleService: ITitleService,
    private route: ActivatedRoute) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  async ngOnInit() {
    this.titleService.SetTitle('Create Example');
    this.loading = true;
    try {
      const existingProject = await this.projectService.Get(this.projectId);
      if (!existingProject) {
        throw new Error('Project doesnt exist');
      }

      const exampleTypes = await this.exampleService.GetExampleTopics();
      const exampleTypeOptions = [];
      exampleTypes.forEach(element => {
        exampleTypeOptions.push({
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
            placeholder: 'Enter Example Title',
            required: true,
            minLength: 4,
            maxLength: 64
          }
        },
        {
          key: 'Topic',
          type: 'select',
          templateOptions: {
            label: 'Example Topic',
            required: true,
            options: exampleTypeOptions
          }
        },
        {
          key: 'Description',
          type: 'textarea',
          templateOptions: {
            label: 'Description',
            placeholder: 'Enter Example Description',
            required: true,
            maxLength: 1028
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

  async submit(model: CreateExampleForm) {
    this.logServer.LogToConsole('CreateExample', model);
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

      const createVideoModel = {
      } as CreateVideo;
      const videoResponse: ResponseWrapper<ViewVideo> = await this.videoService.Create(createVideoModel);

      if (videoResponse.error) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(videoResponse.error));
        return;
      }

      const createExampleModel = this.exampleService.ConvertForm(model);
      createExampleModel.ProjectId = this.projectId;
      createExampleModel.ThumbnailId = thumbnailResponse.data.id;
      const exampleResponse: ResponseWrapper<ViewExample> = await this.exampleService.Create(createExampleModel);

      this.logServer.LogToConsole('CreateExample', exampleResponse);
      if (exampleResponse.error != null) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(exampleResponse.error));
      } else {
        this.loading = false;
        this.router.navigate([`sandbox/${this.projectId}`]);
      }
    } catch (e) {
      this.errorServer.HandleError('CreateError', e);
      this.loading = false;
    }
  }
}
