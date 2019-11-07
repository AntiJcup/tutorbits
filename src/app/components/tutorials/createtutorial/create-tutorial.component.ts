import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateTutorial } from 'src/app/models/tutorial/create-tutorial';

@Component({
  templateUrl: './create-tutorial.component.html',
  styleUrls: ['./create-tutorial.component.sass']
})
export class CreateTutorialComponent implements OnInit {
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

  constructor() { }

  ngOnInit() {
  }

  submit(model: CreateTutorial) {
    console.log(model);
  }
}
