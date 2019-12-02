import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatSidenavModule,
  MatToolbarModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatButtonModule,
  MatInputModule,
  MatCardModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatTooltip,
  MatTooltipModule
} from '@angular/material';

@NgModule({
  declarations: [],
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  exports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class MaterialModule { }
