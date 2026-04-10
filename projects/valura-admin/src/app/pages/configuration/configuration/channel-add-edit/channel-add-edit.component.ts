import { Component, Inject, OnInit } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { FormControl } from '@angular/forms';
export interface ChannelDialogData {
  editMode?: boolean;
  viewMode?: boolean;
  viewType?: string;
  channel?: {
    id: string;
    label: string;
  };
  existingList?: Array<{ id: string; label: string }>;
}

@Component({
  selector: 'app-channel-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    LoadingButtonComponent,
    CustomMatErrorComponent
  ],
  templateUrl: './channel-add-edit.component.html',
  styleUrl: './channel-add-edit.component.scss',
})
export class ChannelAddEditComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  submitLoading = false;

  constructor(
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ChannelAddEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChannelDialogData
  ) { }

  get labelControl(): FormControl {
    return this.form.get('label') as FormControl;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      label: ['', Validators.required],
      description: [''],
    });

    this.isEditMode = !!this.data?.editMode;
    this.isViewMode = !!this.data?.viewMode;

    if (this.data?.channel) {
      this.form.patchValue({
        label: this.data.channel.label,
      });
    }

    if (this.isViewMode) {
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

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbar.openSnack('Channel name is required');
      return;
    }

    const label = this.form.value.label.trim().toLowerCase();
    const list = this.data?.existingList ?? [];

    const isDuplicate = list.some(item => {
      if (this.isEditMode && item.id === this.data.channel?.id) {
        return false;
      }
      return item.label.trim().toLowerCase() === label;
    });

    if (isDuplicate) {
      this.snackbar.openSnack(
        `'${this.form.value.label}' already exists`
      );
      return;
    }

    const payload = {
      ...(this.data.channel ?? {}),
      label: this.form.value.label.trim(),
      description: this.form.value.description,
    };

    this.dialogRef.close({
      success: true,
      data: payload,
    });
  }
}
