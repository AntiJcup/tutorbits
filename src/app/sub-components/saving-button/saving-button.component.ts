import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-saving-button',
  templateUrl: './saving-button.component.html',
  styleUrls: ['./saving-button.component.sass']
})
export class SavingButtonComponent {
  @Input() saving = false;
  @Input() icon: string;
  @Input() text: string;
  @Input() disabled = false;
  @Input() savingText = 'Saving';

  constructor() { }

}
