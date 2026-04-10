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
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
interface DialogData {
  requesterInfo?: any;
  editMode?: boolean;
  viewMode?: boolean;
  key?: string;
}

@Component({
  selector: 'app-add-requester-info',
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
    CustomMatTextareaComponent
  ],
  templateUrl: './add-requester-info.component.html',
  styleUrl: './add-requester-info.component.scss',
})
export class AddRequesterInfoComponent {
  form: FormGroup;
  isEditMode = false;
  isViewMode = false;
  requesterInfoId: number | null | undefined = null;
  submitLoading = false;
  key: string | null = null;
  original_description: string | null = null;
  description: string | null = null;

  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<AddRequesterInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData | null
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      overridden: [''],
      original_description: [''],
      selected: [false],
    });
  }

  ngOnInit(): void {
    if (!this.data?.requesterInfo) return;

    const row = this.data.requesterInfo;
    this.key = this.data.key || null;

    if (this.data.editMode) {
      this.isEditMode = true;

      this.form.patchValue({
        name: row.label,
        overridden: row.overridden,
        original_description: row.original_description || row.overridden,
        selected: row.selected ?? false,
      });
      this.original_description = row.original_description || row.overridden;
      this.description = row.overridden;
      this.form.get('name')?.disable();
      this.form.get('overridden')?.enable();
      const normalize = (v: string | null) => v?.trim() ?? '';
      if (
        normalize(this.original_description) === normalize(this.description)
      ) {
        this.form.get('selected')?.setValue(true);
      } else {
        this.form.get('selected')?.setValue(false);
      }
    }

    if (this.data.viewMode) {
      this.isViewMode = true;

      this.form.patchValue({
        name: row.label,
        overridden: row.overridden,
        original_description: row.original_description || row.overridden,
      });

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

  onToggleDescription() {
    const checked = this.form.get('selected')?.value;
    const descCtrl = this.form.get('overridden');

    if (this.isEditMode) {
      if (checked) {
        descCtrl?.setValue(this.original_description);
      } else {
        descCtrl?.setValue(this.description);
      }
    }
  }

  onDescriptionChange(): void {
    if (!this.isEditMode) return;

    const descCtrl = this.form.get('overridden');
    const selectedCtrl = this.form.get('selected');

    if (!descCtrl || !selectedCtrl) return;

    const currentValue = descCtrl.value ?? '';
    const originalValue = this.original_description ?? '';

    const normalize = (v: string) => v.trim();

    if (normalize(currentValue) === normalize(originalValue)) {
      selectedCtrl.setValue(true, { emitEvent: false });
    } else {
      selectedCtrl.setValue(false, { emitEvent: false });
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack('All fields are required');
      return;
    }

    if (this.isEditMode) {
      const updatedRow = {
        ...this.data?.requesterInfo,
        name: this.form.get('name')?.value,
        overridden: this.form.get('overridden')?.value,
        original_description: (this.form.get('original_description')?.value === "") ? (this.form.get('overridden')?.value) : (this.form.get('original_description')?.value),
        selected: this.form.get('selected')?.value,
      };
      this.dialogRef.close({
        success: true,
        data: updatedRow,
      });

      this.dialogRef.close({
        success: true,
        data: updatedRow,
      });
    }
  }
}
