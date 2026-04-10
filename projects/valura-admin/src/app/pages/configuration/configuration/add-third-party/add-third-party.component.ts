import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { FormControl } from '@angular/forms';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

interface DialogData {
  thirdPartyId?: number;
  editMode?: boolean;
  viewMode?: boolean;
  key?: string;
  thirdParty?: any;
  existingList?: any;
}

@Component({
  selector: 'app-add-third-party',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LoadingButtonComponent,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-third-party.component.html',
  styleUrl: './add-third-party.component.scss',
})
export class AddThirdPartyComponent {
  form: FormGroup;
  isEditMode = false;
  isViewMode = false;
  thirdPartyId: number | null | undefined = null;
  submitLoading = false;
  key: string | null = null;
  existingList: any = [];

  get nameControl(): FormControl {
    return this.form.get("name") as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.form.get("description") as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<AddThirdPartyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData | null
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    if (!this.data?.thirdParty) return;

    const row = this.data.thirdParty;
    this.key = this.data.key || null;

    if (this.data.editMode) {
      this.isEditMode = true;

      this.form.patchValue({
        name: row.name,
        description: row.description,
      });
      this.existingList = this.data.existingList
    }

    if (this.data.viewMode) {
      this.isViewMode = true;

      this.form.patchValue({
        name: row.name,
        description: row.description,
      });
      this.existingList = this.data.existingList
      this.form.disable();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.isViewMode = false;
    this.isEditMode = true;
    this.form.enable();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack('All fields are required');
      return;
    }

    const formName = this.form.get('name')?.value?.trim().toLowerCase();
    const existingList =
      (this.data?.existingList as Array<{ id: any; name?: string }>) || [];

    const isDuplicate = existingList.some((item) => {
      if (this.isEditMode && item.id === this.data?.thirdParty?.id) {
        return false;
      }
      return item.name?.trim().toLowerCase() === formName;
    });

    if (isDuplicate) {
      this.snackbarService.openSnack(` '${this.form.value.name}' already exists in the table`);
      return;
    }
    if (this.isEditMode) {
      const updatedRow = {
        ...this.data?.thirdParty,
        name: this.form.get('name')?.value,
        description: this.form.get('description')?.value
      };
      this.dialogRef.close({
        success: true,
        data: updatedRow,
      });
      return;
    }
    const newRow = {
      id: Date.now(),
      name: this.form.get('name')?.value,
      description: this.form.get('description')?.value,
    };
    this.dialogRef.close({
      success: true,
      data: newRow,
    });
  }
}
