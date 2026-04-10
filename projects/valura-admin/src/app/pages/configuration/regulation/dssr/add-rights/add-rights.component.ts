import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { TextFieldModule } from '@angular/cdk/text-field';
import { SplitByDirectivesDirective } from '@valura-lib/directives/split-by-directives';
import { FormControl } from '@angular/forms';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

@Component({
  selector: 'app-add-rights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    LoadingButtonComponent,
    MatDialogModule,
    TextFieldModule,
    SplitByDirectivesDirective,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-rights.component.html',
})
export class AddRightsComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddRightsComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private fb = inject(FormBuilder);

  snackbarService = inject(SnackbarService);
  configApiHelperService = inject(ConfigApiHelperService);
  regulationsService = inject(RegulationsService);

  rightForm!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  submitLoading = false;

  regulationId!: number;
  selectedId: number | null = null;
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.rightForm = this.fb.group({
      provision: ['', Validators.required],
      rightTitle: ['', Validators.required],
      rightDescription: ['', Validators.required],
      rightTitleSimplified: ['', Validators.required],
      rightDescriptionSimplified: ['', Validators.required],
    });
    if (this.data) {
      if (this.data.regulationId) {
        this.regulationId = this.data.regulationId;
      }
      if (this.data?.isEditMode) {
        this.isEditMode = true;
        this.selectedId = this.data.rightId;
        this.rightForm.patchValue({
          ...this.data,
        });
      }
      if (this.data?.isViewMode) {
        this.isViewMode = true;
        this.selectedId = this.data.rightId;
        this.rightForm.patchValue({
          ...this.data,
        });
      }
      if (this.isViewMode) {
        this.rightForm.disable();
      }
    }
  }

  get provision(): FormControl {
    return this.rightForm.get('provision') as FormControl;
  }

  get rightTitle(): FormControl {
    return this.rightForm.get('rightTitle') as FormControl;
  }

  get rightDescription(): FormControl {
    return this.rightForm.get('rightDescription') as FormControl;
  }

  get rightTitleSimplified(): FormControl {
    return this.rightForm.get('rightTitleSimplified') as FormControl;
  }

  get rightDescriptionSimplified(): FormControl {
    return this.rightForm.get('rightDescriptionSimplified') as FormControl;
  }

  formatDescription(value: string): string {
    if (!value) return '';

    return value
      .split(/(?=\d+\.\s)/g) // split only before "1. ", "2. ", etc.
      .map(v => v.trim())
      .join('\n');
  }

  async onSave(): Promise<void> {
    if (this.rightForm.invalid) {
      this.rightForm.markAllAsTouched();
      return;
    }

    this.submitLoading = true;
    const result = this.rightForm.value;

    try {
      if (this.isEditMode) {
        await this.updateRight(result);
      } else {
        await this.addRights(result);
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving right:', error);
      this.snackbarService.openSnack('Something went wrong while saving the right');
    } finally {
      this.submitLoading = false;
    }
  }

  toggleEditMode() {
    this.isViewMode = false;
    this.isEditMode = true;
    this.rightForm.enable();
  }

  async addRights(result: any) {
    const {
      provision,
      rightTitle,
      rightDescription,
      rightTitleSimplified,
      rightDescriptionSimplified,
    } = result;

    if (
      !provision?.trim() ||
      !rightTitle?.trim() ||
      !rightDescription?.trim() ||
      !rightTitleSimplified?.trim() ||
      !rightDescriptionSimplified?.trim()
    ) {
      this.snackbarService.openSnack('All fields are required');
      return;
    }

    const payload = {
      ...result,
      actId: this.regulationId
    };

    let response = await this.configApiHelperService.createRight(payload);
    if (response) {
      const { actId, ...rest } = response.right;

      const payloadData = {
        ...rest,
        actId: this.regulationId
      };
      await this.regulationsService.addRightItem(payloadData);
    }
  }

  async updateRight(result: any) {
    const {
      provision,
      rightTitle,
      rightDescription,
      rightTitleSimplified,
      rightDescriptionSimplified,
    } = result;

    if (
      !provision?.trim() ||
      !rightTitle?.trim() ||
      !rightDescription?.trim() ||
      !rightTitleSimplified?.trim() ||
      !rightDescriptionSimplified?.trim()
    ) {
      this.snackbarService.openSnack('All fields are required');
      return;
    }

    const payload = {
      actId: this.regulationId,
      provision,
      rightTitle,
      rightDescription,
      rightTitleSimplified,
      rightDescriptionSimplified,
    };

    const response = await this.configApiHelperService.updateRight(this.selectedId!, payload);

    if (response) {

      const { actId, ...rest } = response;

      const payloadData = {
        ...rest,
        actId: this.regulationId,
      };
      await this.regulationsService.updateRight(this.selectedId!, payloadData);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
