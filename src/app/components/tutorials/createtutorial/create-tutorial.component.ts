import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit {
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
    }
  },
  {
    key: 'Language',
    type: 'input',
    templateOptions: {
      label: 'Programming Language',
      placeholder: 'Enter Tutorial Programming Language',
      required: true,
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

  constructor(private tutorialService: TutorBitsTutorialService) { }

  ngOnInit() {
  }

  submit(model: CreateTutorial) {
    console.log(model);
    this.loading = true;
    this.tutorialService.Create(model).then((e) => {
      console.log(e);
    }).finally(() => {
      this.loading = false;
    });
  }
}
