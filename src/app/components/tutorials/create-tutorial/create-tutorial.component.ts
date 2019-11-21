import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateTutorial = { Title: '', Description: '', Language: 'javascript', ThumbnailData: null };
  fields: FormlyFieldConfig[] = [{
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
    type: 'input',
    templateOptions: {
      label: 'Programming Language',
      placeholder: 'Enter Tutorial Programming Language',
      required: true,
      minLength: 1,
      maxLength: 64
    }
  },
  {
    key: 'Description',
    type: 'textarea',
    templateOptions: {
      label: 'Description',
      placeholder: 'Enter Tutorial Description',
      required: false,
    }
  },
  {
    key: 'ThumbnailData',
    type: 'file',
    templateOptions: {
      required: true,
      description: 'Upload Thumbnail'
    }
  },
  ];

  constructor(
    private tutorialService: TutorBitsTutorialService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService) { }

  ngOnInit() {
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
        this.errorServer.HandleError('CreateError', JSON.stringify(e.error));
      } else {
        this.tutorialService.UploadThumbnail(model.ThumbnailData[0], e.data.id).then(() => {
          this.router.navigate([`record/${e.data.id}`]);
        }).catch((err) => {
          this.errorServer.HandleError('ThumbnailError', err);
        }).finally(() => {
          this.loading = false;
        });
      }
    }).catch((e) => {
      this.errorServer.HandleError('CreateError', e);
    }).finally(() => {
      this.loading = false;
    });
  }
}
