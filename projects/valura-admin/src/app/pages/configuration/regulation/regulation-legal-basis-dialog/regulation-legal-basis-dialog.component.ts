import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { LegalBasisService } from '@admin-core/services/legalBasis/legal-basis.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { FormControl } from '@angular/forms';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-regulation-legal-basis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LoadingButtonComponent,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './regulation-legal-basis-dialog.component.html',
  styleUrl: './regulation-legal-basis-dialog.component.scss'
})
export class RegulationLegalBasisDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isLoading = false;
  isSaving = false;
  legalBasisId?: number;
  actId?: number;

  private apiService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private legalBasisService = inject(LegalBasisService);

  constructor(
    public dialogRef: MatDialogRef<RegulationLegalBasisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      legalBasisId?: number;
      actId?: number;
      forceEditMode?: boolean;
    },
    private fb: FormBuilder
  ) { }

  get provisionControl(): FormControl {
    return this.form.get('provision') as FormControl;
  }

  get legalGroundControl(): FormControl {
    return this.form.get('legalGround') as FormControl;
  }

  get simplyiedLegalGroundControl(): FormControl {
    return this.form.get('simplifiedDescription') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.legalBasisId = this.data.legalBasisId;
    this.actId = this.data.actId;

    this.initForm();

    if (this.legalBasisId) {
      await this.loadLegalBasis();

      this.isEdit = !!this.data.forceEditMode;
    } else {
      this.isEdit = true;
    }
    if (!this.isEdit) {
      this.form.disable();
    }
  }

  get mode(): 'add' | 'edit' | 'view' {
    if (this.legalBasisId && this.isEdit) return 'edit';
    if (this.legalBasisId && !this.isEdit) return 'view';
    return 'add';
  }

  private async loadLegalBasis(): Promise<void> {
    this.isLoading = true;
    try {
      let data = await this.legalBasisService.getLegalBasisById(this.legalBasisId!);

      if (!data) {
        const res = await this.apiService.getLegalBasisDetailsById(this.legalBasisId!);
        data = res?.legalBasis || res;
        if (data) {
          await this.legalBasisService.addLegalBasis(data);
        }
      }

      if (data) {
        this.form.patchValue({
          legalGround: data.name || '',
          provision: data.provision || '',
          simplifiedDescription: data.description || ''
        });
      }
    } catch (error) {
      console.error('Failed to load legal basis:', error);
      this.snackbarService.openSnack('Failed to load legal basis details');
    } finally {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      legalGround: ['', Validators.required],
      provision: ['', Validators.required],
      simplifiedDescription: ['', Validators.required]
    });
  }

  startEditing(): void {
    this.isEdit = true;
    this.form.enable();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const payload: any = {
      name: this.form.value.legalGround,
      provision: this.form.value.provision,
      description: this.form.value.simplifiedDescription
    };

    try {
      let result;
      if (this.legalBasisId) {
        const existingData = await this.legalBasisService.getLegalBasisById(this.legalBasisId);

        result = await this.apiService.updateLegalBasis(this.legalBasisId, payload);

        const apiResponseData = result?.legalBasis || result?.data?.legalBasis || result;
        const updatedLegalBasis = {
          ...existingData,
          ...apiResponseData,
          ...payload,
          id: this.legalBasisId,
          actId: existingData?.actId || this.actId
        };

        await this.legalBasisService.updateLegalBasisToDb(this.legalBasisId, updatedLegalBasis);

      } else {
        result = await this.apiService.createLegalBasis(this.actId!, payload);
        const newLegalBasis = result?.legalBasis || { ...payload, actId: this.actId };
        if (newLegalBasis.id) {
          await this.legalBasisService.createAndAddLegalBasis(newLegalBasis);
        }
      }

      this.dialogRef.close({ success: true, data: result });
    } catch (error: any) {
      console.error(error?.message || 'Failed to save');
    } finally {
      this.isSaving = false;
    }
  }
}
