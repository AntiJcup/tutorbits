import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateTutorial = { Title: null, Description: null, Language: null, ThumbnailData: null, Category: 'Tutorial' };
  fields: FormlyFieldConfig[] = [];

  constructor(
    private tutorialService: TutorBitsTutorialService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone,
    private titleService: ITitleService) { }

  ngOnInit() {
    this.titleService.SetTitle('Create Tutorial');
    this.loading = true;
    this.tutorialService.GetTutorialLanguages().then((tutorialTypes) => {
      const tutorialTypeOptions = [];
      tutorialTypes.forEach(element => {
        tutorialTypeOptions.push({
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
          key: 'Language',
          type: 'select',
          templateOptions: {
            label: 'Language',
            required: true,
            options: tutorialTypeOptions
          }
        },
        {
          key: 'Description',
          type: 'textarea',
          templateOptions: {
            label: 'Description',
            placeholder: 'Enter Tutorial Description',
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
    }).catch((err) => {
      this.errorServer.HandleError('CreateInitializeError', err);
    });
  }

  ngOnDestroy(): void {
  }

  submit(model: CreateTutorial) {
    this.logServer.LogToConsole('CreateTutorial', model);
    this.loading = true;

    if (model.ThumbnailData[0].type !== 'image/png' && model.ThumbnailData[0].type !== 'image/x-png') {
      this.errorServer.HandleError('ThumbnailError', `Unsupported image type ${model.ThumbnailData[0].type}`);
      this.loading = false;
      return;
    }

    const createModel = JSON.parse(JSON.stringify(model)) as CreateTutorial;
    createModel.ThumbnailData = null;
    this.tutorialService.Create(createModel).then((e) => {
      this.logServer.LogToConsole('CreateTutorial', e);
      if (e.error != null) {
        this.loading = false;
        this.errorServer.HandleError('CreateError', JSON.stringify(e.error));
      } else {
        this.tutorialService.UploadThumbnail(model.ThumbnailData[0], e.data.id).then(() => {
          this.loading = false;
          this.router.navigate([`record/${e.data.id}`]);
        }).catch((err) => {
          this.errorServer.HandleError('ThumbnailError', err);
          this.loading = false;
        });
      }
    }).catch((e) => {
      this.errorServer.HandleError('CreateError', e);
      this.loading = false;
    });
  }
}
