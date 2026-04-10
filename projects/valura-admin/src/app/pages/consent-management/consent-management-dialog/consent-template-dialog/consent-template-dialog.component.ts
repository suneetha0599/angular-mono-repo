import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { CONSENT_PURPOSES, CONSENT_TEMPLATE, CONSENT_UPSTREAM, PUBLISH_CONFIRMATION, TERMS_AND_CONDITIONS } from '@admin-core/constants/constants';

@Component({
  selector: 'app-consent-template-dialog',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, RouterModule,
    MatButtonModule, MatCheckboxModule, TextFieldModule, MatTooltipModule, LoadingButtonComponent, MatDialogActions, MatDialogContent],
  templateUrl: './consent-template-dialog.component.html',
  styleUrl: './consent-template-dialog.component.scss'
})
export class ConsentTemplateDialogComponent {
  purposes: string[] = ['Purpose A', 'Purpose B', 'Purpose C']
  CONSENT_PURPOSES = CONSENT_PURPOSES
  CONSENT_UPSTREAM = CONSENT_UPSTREAM
  CONSENT_TEMPLATE = CONSENT_TEMPLATE
  PUBLISH_CONFIRMATION = PUBLISH_CONFIRMATION
  TERMS_AND_CONDITIONS = TERMS_AND_CONDITIONS

  dialogType: string

  constructor(
    public dialogRef: MatDialogRef<ConsentTemplateDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { this.dialogType = data.dialogType; }

  closeDialog(): void {
    this.dialogRef.close();
  }

}
