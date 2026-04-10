import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CreateDepartmentPayload } from '@admin-core/models/department-management/department.model';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

export interface Department {
  id: number;
  name: string;
  description: string;
  version?: number;
}

interface DialogData {
  editMode?: boolean;
  viewMode?: boolean;
  departmentId?: number;
  itemData?: Department;
}

@Component({
  selector: 'app-add-department-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-department-dialog.component.html',
  styleUrl: './add-department-dialog.component.scss'
})
export class AddDepartmentDialogComponent implements OnInit {
  form!: FormGroup;
  buttonName: string = 'Add';
  isEdit: boolean = false;
  viewMode: boolean = false;
  submitLoading: boolean = false;
  isLoading: boolean = false;
  departmentId?: number;

  private apiHelperService = inject(ApiHelperService);
  private departmentService = inject(DepartmentService);
  private snackbarService = inject(SnackbarService);

  constructor(
    private dialog: MatDialogRef<AddDepartmentDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  async ngOnInit() {
    this.departmentId = this.data?.departmentId;

    if (this.data?.viewMode) {
      this.isEdit = false;
      this.viewMode = true;
    } else if (this.data?.editMode) {
      this.isEdit = true;
      this.viewMode = false;
    }

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });

    if (this.departmentId) {
      await this.loadDepartmentFromDb();
    } else if (this.data?.itemData) {
      this.form.patchValue({
        name: this.data.itemData.name,
        description: this.data.itemData.description
      });
    }

    if (this.viewMode) {
      this.form.disable();
    }

    if (this.departmentId) {
      this.buttonName = 'Update';
    } else {
      this.buttonName = 'Add';
    }
  }

  private async loadDepartmentFromDb(): Promise<void> {
    this.isLoading = true;
    try {
      const department = await this.departmentService.getDepartmentById(this.departmentId!);

      if (department) {
        this.form.patchValue({
          name: department.name || '',
          description: department.description || ''
        });
      } else {
        console.warn('[Department Dialog] Department not found in IndexedDB');
        this.snackbarService.openSnack('Failed to load department details');
      }
    } catch (error) {
      console.error('[Department Dialog] Error loading department:', error);
      this.snackbarService.openSnack('Failed to load department details');
    } finally {
      this.isLoading = false;
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitLoading = true;

    try {
      const formValue = this.form.value;
      const requestBody: CreateDepartmentPayload = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || ''
      };

      let response: any;

      if (this.departmentId) {
        const existingData = await this.departmentService.getDepartmentById(this.departmentId);

        response = await this.apiHelperService.updateDepartment(this.departmentId, requestBody);

        const apiResponseData = response?.department || response?.data?.department || response;

        const updatedDepartment = {
          ...existingData,
          ...apiResponseData,
          ...requestBody,
          id: this.departmentId
        };

        await this.departmentService.updateDepartmentDetailsDb(this.departmentId, updatedDepartment);

        const successMessage = response?.message ?? 'Department updated successfully';
        this.snackbarService.openSnack(successMessage);
        this.dialog.close({ success: true });
      } else {
        response = await this.apiHelperService.createDepartment(requestBody);
        let newDepartment = response?.department || response?.data?.department || response;
        if (!newDepartment.id) {
          newDepartment = {
            ...requestBody,
            ...(typeof response === 'object' ? response : {})
          };
        }

        if (newDepartment.id) {
          await this.departmentService.createAndNewDepartment(newDepartment);
        } else {
          console.warn('[Department Dialog] No ID found in response. Department may not be saved to IndexedDB.');
        }

        const successMessage = response?.message ?? 'Department created successfully';
        this.snackbarService.openSnack(successMessage);
        this.dialog.close({ success: true });
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message
        ?? (this.departmentId ? 'Failed to update department' : 'Failed to create department');

      this.snackbarService.openSnack(errorMessage);
      console.error('[Department Dialog] Error saving department:', error);
    } finally {
      this.submitLoading = false;
    }
  }
  startEditing(): void {
    this.isEdit = true;
    this.viewMode = false;
    this.form.enable();
    this.buttonName = 'Update';
  }

  closeDialog(): void {
    this.dialog.close();
  }

  onCancel() {
    this.dialog.close({ success: false });
    this.form.reset();
  }

  get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }

  departmentName(): string {
    return this.form.get('name')?.value || '';
  }

  departmentDescription(): string {
    return this.form.get('description')?.value || '';
  }
}
