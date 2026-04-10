import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';

@Component({
  selector: 'app-assessment-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './assessment-warning-dialog.component.html',
  styleUrls: ['./assessment-warning-dialog.component.scss'],
})
export class AssessmentWarningDialogComponent {

  form: FormGroup;
  isSavingTemplate = false;
  isSavingAssessment = false;
  isTemplateLoading = false;
  isTemplateNameExists = false;
  suggestedName: string | null = null;
  shouldSaveAsMaster: boolean = false;
  originalTemplateName!: string;
  isVendorContext: boolean = false

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssessmentWarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private assessmentApiHelperService: AssessmentApiHelperService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      templateName: ['', Validators.required],
    });

    const originalName = this.data?.payload?.template?.name ?? '';
    this.isVendorContext = this.data?.isVendorContext
    this.originalTemplateName = this.data?.payload?.template?.name ?? '';
    this.templateName.setValue(this.originalTemplateName);
  }

  get templateName(): FormControl {
    return this.form.get('templateName') as FormControl;
  }

  async duplicateTemplate() {
    try {
      this.isTemplateLoading = true;
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const templateRes = await this.assessmentApiHelperService.duplicateTemplate({ templateName: this.templateName.value }, _url);

      if (!templateRes?.success) {
        this.snackbarService.openSnack('Failed to generate template name!', 'error');
        return;
      }
      this.templateName.setValue(templateRes.data.newTemplateName);
      this.templateName.markAsDirty();

    } catch (error) {
      this.snackbarService.openSnack('Something went wrong!');
    } finally {
      this.isTemplateLoading = false;
    }
  }

  async duplicateTemplates(): Promise<boolean> {
    try {
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const templateRes = await this.assessmentApiHelperService.duplicateTemplate({ templateName: this.templateName.value }, _url);
      if (!templateRes?.success) {
        this.snackbarService.openSnack(
          'Failed to generate template name!',
          'error'
        );
        return false;
      }

      if (templateRes.data.templateNameExists) {
        this.snackbarService.openSnack(
          'Template name already exists',
          'error'
        );
        return false;
      }

      this.templateName.setValue(templateRes.data.newTemplateName);
      this.templateName.markAsDirty();

      return true;

    } catch (error) {
      this.snackbarService.openSnack('Something went wrong!');
      return false;
    }
  }

  async saveAssessment(
    shouldSaveAsMaster: boolean,
    shouldUpdateMaster: boolean = false
  ) {

    if (shouldSaveAsMaster === true) {
      this.isSavingTemplate = true;
      if (this.templateName.value === this.originalTemplateName) {
        this.templateName.setValue(`${this.originalTemplateName} Copy`);
      }
      const isValid = await this.duplicateTemplates();

      if (!isValid) {
        this.isSavingTemplate = false;
        return;
      }

      this.shouldSaveAsMaster = true;
    } else {
      this.isSavingAssessment = true;
    }

    try {
      const finalTemplateName = shouldSaveAsMaster
        ? this.templateName.value
        : this.originalTemplateName;

      const payload = {
        ...this.data.payload,
        template: {
          ...this.data.payload.template,
          name: finalTemplateName,
          shouldSaveAsMaster
        }
      };

      let assessmentRes;

      if (this.data.mode === 'EDIT') {
        assessmentRes = await this.assessmentApiHelperService.updateAssessmentDetails(this.data.assessmentId, payload);
      } else {
        assessmentRes = await this.assessmentApiHelperService.createAssessment(
          payload
        );
      }

      if (assessmentRes.success) {
        this.dialogRef.close(true);
      }

    } catch (error) {
      console.log(error)
    } finally {
      this.isSavingAssessment = false;
      this.isSavingTemplate = false;
    }
  }

  closeDialog(result = false) {
    this.dialogRef.close(result);
  }
}
