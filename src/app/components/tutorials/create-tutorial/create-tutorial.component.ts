import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateTutorial = { Title: '', Description: '', Language: 'javascript' };
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
  ];

  constructor(
    private tutorialService: TutorBitsTutorialService,
    private router: Router,
    private errorServer: IErrorService) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  submit(model: CreateTutorial) {
    console.log(model);
    this.loading = true;
    this.tutorialService.Create(model).then((e) => {
      console.log(e);
      if (e.error != null) {
        this.errorServer.HandleError('CreateError', JSON.stringify(e.error));
      } else {
        this.router.navigate([`record/${e.data.id}`]);
      }
    }).catch((e) => {
      this.errorServer.HandleError('CreateError', JSON.stringify(e));
    }).finally(() => {
      this.loading = false;
    });
  }
}
