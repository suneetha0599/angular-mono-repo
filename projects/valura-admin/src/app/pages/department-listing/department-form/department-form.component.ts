import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingButtonComponent } from '../../../shared/components/loading-button/loading-button.component';
import { ApiHelperService } from '@admin-coreservices/network/api-helper.service';
import { SnackbarService } from '@admin-coreservices/snackbar/snackbar.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateDepartmentPayload } from '@admin-coremodels/department-management/department.model';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    LoadingButtonComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent implements OnInit {
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private departmentService = inject(DepartmentService);
  form: FormGroup;
  submitLoading = false;
  isDataLoading = false;
  departmentData: any = null;
  departmentId: number | null = null;

  isEditMode = false;

  private originalName: string = '';
  private originalDescription: string = '';

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get descriptionControl(): FormControl {
    return this.form.get('description') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    const departmentIdParam = this.route.snapshot.paramMap.get('id');
    if (departmentIdParam) {
      this.isEditMode = true;
      this.departmentId = Number(departmentIdParam);

      if (!this.departmentId || isNaN(this.departmentId)) {
        this.snackbarService.openSnack('Invalid department ID');
        this.goBack();
        return;
      }

      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras?.state || history.state;

      if (state && state['department']) {
        this.departmentData = state['department'];
        this.populateForm();
        this.storeOriginalData();
      } else {
        await this.loadDepartmentDetails();
      }
    }
  }

  private async loadDepartmentDetails(): Promise<void> {
    if (!this.departmentId) return;

    this.isDataLoading = true;
    try {
      const departmentResponse = await this.apiHelperService.getDepartmentById(this.departmentId);

      if (departmentResponse) {
        this.departmentData = departmentResponse;
        this.populateForm();
        this.storeOriginalData();
      } else {
        this.snackbarService.openSnack('Failed to load department details');
        this.goBack();
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading department details');
      console.error('Error:', error);
      this.goBack();
    } finally {
      this.isDataLoading = false;
    }
  }

  private populateForm(): void {
    if (!this.departmentData) return;

    this.form.setValue({
      name: this.departmentData.name || '',
      description: this.departmentData.description || ''
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private storeOriginalData(): void {
    if (!this.departmentData) return;

    this.originalName = this.departmentData.name || '';
    this.originalDescription = this.departmentData.description || '';
  }

  get hasChanges(): boolean {
    if (!this.isEditMode) return true;

    const currentName = this.form.get('name')?.value?.trim() || '';
    const currentDescription = this.form.get('description')?.value?.trim() || '';

    return (
      currentName !== this.originalName ||
      currentDescription !== this.originalDescription
    );
  }

  get canSave(): boolean {
    if (!this.isEditMode) {
      return this.isFormValid;
    }
    return this.isFormValid && this.hasChanges;
  }

  async onSubmit(): Promise<void> {
    this.markFormGroupTouched();

    if (this.form.invalid) {
      return;
    }

    if (this.isEditMode && !this.hasChanges) {
      this.snackbarService.openSnack('No changes to save');
      return;
    }

    this.submitLoading = true;

    try {
      const requestBody: CreateDepartmentPayload = {
        name: this.form.get('name')?.value?.trim(),
        description: this.form.get('description')?.value?.trim()
      };

      let response;
      if (this.isEditMode && this.departmentId) {
        response = await this.apiHelperService.updateDepartment(this.departmentId, requestBody);
        await this.departmentService.updateDepartmentDetailsDb(this.departmentId, requestBody)
        if (response) {
          this.snackbarService.openSnack('Department updated successfully');
          this.originalName = requestBody.name;
          this.originalDescription = requestBody.description;
          this.goBack();
        }
      } else {
        response = await this.apiHelperService.createDepartment(requestBody);
        await this.departmentService.createAndNewDepartment(response)
        if (response) {
          this.snackbarService.openSnack('Department created successfully');
          this.resetForm();
        }
      }
    } catch (error) {
      const errorMessage = this.isEditMode ? 'Failed to update department' : 'Failed to create department';
      this.snackbarService.openSnack(errorMessage);
      console.error('Error:', error);
    } finally {
      this.submitLoading = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    if (this.isEditMode) {
      this.form.patchValue({
        name: this.originalName,
        description: this.originalDescription
      });
    } else {
      this.form.reset();
    }

    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Department Details' : 'Create Department';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Save Department';
  }

  get showCancelButton(): boolean {
    return !this.isEditMode;
  }

  get resetButtonText(): string {
    return this.isEditMode ? 'Reset' : 'Clear';
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  goBack(): void {
    this.location.back();
  }
}
