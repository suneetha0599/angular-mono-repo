import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateRolePayload, Permission, PermissionModule } from '@admin-core/models/role-management/role.model';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RoleService } from '@admin-core/services/role/role.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    ErrorLoadingItemsComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})

export class RoleFormComponent implements OnInit {
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup;
  submitLoading = false;
  initialDataLoading = false;
  isDataLoading = false;
  permissionsData: PermissionModule = {};
  allPermissions: Permission[] = [];
  roleData: any = null;
  roleId: number | null = null;

  isEditMode = false;
  objectKeys = Object.keys;

  private originalRoleName: string = '';
  private originalDescription: string = '';
  private originalPermissions: string[] = [];
  hasApiError: boolean = false;

  private roleService = inject(RoleService)
  currentRequestDetails = {
    roleId: 0,
    index: 0
  }

  private navigationDirection: 'prev' | 'next' | null = null;


  get roleNameControl(): FormControl {
    return this.form.get('roleName') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.form.get('description') as FormControl;
  }

  constructor() {
    this.form = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      permissions: [[], [Validators.required, Validators.minLength(1)]]
    });
  }


  shimmerModules = Array.from({ length: 4 }, (_, i) => ({
    name: `Module ${i + 1}`,
    permissions: Array.from({ length: 3 }, (_, j) => ({ id: j }))
  }));

  async ngOnInit(): Promise<void> {
    await this.loadPermissionsData();
    this.route.paramMap.subscribe(async params => {
      const roleIdParam = params.get('id');
      this.isEditMode = !!roleIdParam;
      this.roleId = roleIdParam ? Number(roleIdParam) : null;

      if (this.isEditMode && (!this.roleId || isNaN(this.roleId))) {
        this.snackbarService.openSnack('Invalid role ID');
        this.goBack();
        return;
      }

      if (this.isEditMode) {
        await this.loadRoleDetails();
      } else {
        this.initializePermissions();
        this.resetForm();
      }
    });
  }


  private async loadPermissionsData(): Promise<void> {
    this.initialDataLoading = true;
    try {
      const apiData = await this.apiHelperService.getPrimitives();
      if (apiData) {
        this.permissionsData = {};
        Object.keys(apiData).forEach(moduleName => {
          this.permissionsData[moduleName] = apiData[moduleName].map((perm: any) => ({
            name: perm.name,
            value: perm.value,
            description: perm.description,
            enabled: false,
            parentPrimitives: perm.parentPrimitives || []
          }));
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      this.snackbarService.openSnack('Failed to load permissions data');
    } finally {
      this.initialDataLoading = false;
    }
  }

  async goToPrevRequest() {
    this.currentRequestDetails.index--;

    if (this.roleService.getPrevRequestShifted()) {
      const prevList = this.roleService.getPrevRequestRid();
      this.roleService.setDsrRequestRid(prevList);

      this.currentRequestDetails.index = prevList.length - 1;
      this.roleService.setPrevRequestShifted('false');
      this.roleService.setPrevRequestPage(0, true);
    }

    const country = this.roleService.getNextOrPrevRequestRid(
      this.currentRequestDetails.index
    );

    if (country) {
      this.navigateToCountry(country.roleId);
    }
  }


  async goToNextRequest() {
    this.currentRequestDetails.index++;

    if (this.roleService.getNextRequestShifted()) {
      const nextList = this.roleService.getNextRequestRid();
      this.roleService.setDsrRequestRid(nextList);

      this.currentRequestDetails.index = 0;
      this.roleService.setNextRequestShifted('false');
      this.roleService.setNextRequestPage(0, true);
    }

    const country = this.roleService.getNextOrPrevRequestRid(
      this.currentRequestDetails.index
    );

    if (country) {
      this.navigateToCountry(country.roleId);
    }
  }
  navigateToCountry(roleId: number) {
    this.router.navigate(
      ['/admin/roles/details/', roleId]
    );
  }


  get disablePrevBtn(): boolean {
    return (
      this.currentRequestDetails.index === 0 &&
      !this.roleService.getPrevRequestShifted()
    );
  }

  get disableNextBtn(): boolean {
    const listLength = this.roleService.getDsrRequestRid()?.length ?? 0;
    return (
      this.currentRequestDetails.index === listLength - 1 &&
      !this.roleService.getNextRequestShifted()
    );
  }

  private async loadRoleDetails(): Promise<void> {
    if (!this.roleId) return;
    this.hasApiError = false;
    this.isDataLoading = true;
    try {
      const roleResponse = await this.apiHelperService.getRoleById(this.roleId);
      if (!roleResponse || roleResponse?.success == false) { this.hasApiError = true; return }
      if (roleResponse) {
        this.roleData = roleResponse;
        this.setupPermissionsWithRoleData();
        this.populateForm();

        this.storeOriginalData();
      } else {
        this.snackbarService.openSnack('Failed to load role details');
        this.goBack();
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading role details');
      console.error('Error:', error);
      this.hasApiError = true;
    } finally {
      this.isDataLoading = false;
    }
  }

  private setupPermissionsWithRoleData(): void {
    const assignedPrimitivesSet = new Set<string>();
    if (this.roleData && this.roleData.primitives) {
      Object.keys(this.roleData.primitives).forEach(moduleName => {
        const items = this.roleData.primitives[moduleName]?.items || [];
        items.forEach((perm: any) => {
          assignedPrimitivesSet.add(perm.value);
        });
      });

    }


    Object.keys(this.permissionsData).forEach(moduleName => {
      this.permissionsData[moduleName].forEach(permission => {
        permission.enabled = assignedPrimitivesSet.has(permission.value);
      });
    });

    this.initializePermissions();
  }

  private populateForm(): void {
    if (!this.roleData) return;

    this.form.patchValue({
      roleName: this.roleData.name,
      description: this.roleData.description
    });

    const selectedPrimitives: string[] = [];
    if (this.roleData.primitives) {
      Object.keys(this.roleData.primitives).forEach(category => {
        const items = this.roleData.primitives[category]?.items || [];
        items.forEach((primitive: any) => {
          selectedPrimitives.push(primitive.value);
        });
      });

    }

    this.form.patchValue({
      permissions: selectedPrimitives
    });
  }

  private storeOriginalData(): void {
    if (!this.roleData) return;

    this.originalRoleName = this.roleData.roleName || '';
    this.originalDescription = this.roleData.description || '';


    this.originalPermissions = [];
    if (this.roleData.primitives) {
      Object.keys(this.roleData.primitives).forEach(category => {
        const items = this.roleData.primitives[category]?.items || [];
        items.forEach((primitive: any) => {
          this.originalPermissions.push(primitive.value);
        });
      });

    }
    this.originalPermissions.sort();
  }

  private initializePermissions(): void {
    this.allPermissions = [];
    Object.keys(this.permissionsData).forEach(module => {
      this.permissionsData[module].forEach(permission => {
        this.allPermissions.push({ ...permission });
      });
    });
  }

  onPermissionToggle(permission: Permission, moduleName?: string): void {
    permission.enabled = !permission.enabled;

    let currentPermissions: string[] = [...(this.form.get('permissions')?.value || [])];

    if (permission.enabled) {
      currentPermissions.push(permission.value);
    } else {
      currentPermissions = currentPermissions.filter((p: string) => p !== permission.value);
    }
    if (moduleName) {
      const modulePermissions = this.permissionsData[moduleName] || [];
      for (const perm of modulePermissions) {
        if (perm.value === permission.value) continue;
        if (perm.parentPrimitives?.includes(permission.value)) {
          perm.enabled = permission.enabled;
          if (permission.enabled) {
            if (!currentPermissions.includes(perm.value)) {
              currentPermissions.push(perm.value);
            }
          } else {
            currentPermissions = currentPermissions.filter((p: string) => p !== perm.value);
          }
        }
      }
    }

    this.form.get('permissions')?.setValue(currentPermissions);
    this.form.get('permissions')?.updateValueAndValidity();
    this.form.get('permissions')?.markAsTouched();
  }

  get hasChanges(): boolean {
    if (!this.isEditMode) return true;

    const currentRoleName = this.form.get('roleName')?.value?.trim() || '';
    const currentDescription = this.form.get('description')?.value?.trim() || '';
    const currentPermissions = [...(this.form.get('permissions')?.value || [])].sort();

    return (
      currentRoleName !== this.originalRoleName ||
      currentDescription !== this.originalDescription ||
      !this.arraysEqual(currentPermissions, this.originalPermissions)
    );
  }


  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
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
      const requestBody: CreateRolePayload = {
        name: this.form.get('roleName')?.value?.trim(),
        description: this.form.get('description')?.value?.trim(),
        primitives: this.form.get('permissions')?.value || []
      };

      let response;
      if (this.isEditMode && this.roleId) {
        response = await this.apiHelperService.updateRole(this.roleId, requestBody);
        if (response) {
          this.snackbarService.openSnack('Role updated successfully');

          this.originalRoleName = requestBody.name;
          this.originalDescription = requestBody.description;
          this.originalPermissions = [...requestBody.primitives].sort();
          this.goBack();
        }
      } else {
        response = await this.apiHelperService.createRole(requestBody);
        if (response) {
          this.snackbarService.openSnack('Role created successfully');
          this.resetForm();
        }
      }
    } catch (error) {
      const errorMessage = this.isEditMode ? 'Failed to update role' : 'Failed to create role';
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
        roleName: this.originalRoleName,
        description: this.originalDescription,
        permissions: [...this.originalPermissions]
      });

      Object.keys(this.permissionsData).forEach(module => {
        this.permissionsData[module].forEach(permission => {
          permission.enabled = this.originalPermissions.includes(permission.value);
        });
      });
    } else {

      this.form.reset();
      Object.keys(this.permissionsData).forEach(module => {
        this.permissionsData[module].forEach(permission => {
          permission.enabled = false;
        });
      });
      this.form.get('permissions')?.setValue([]);
    }


    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get selectedPermissionsCount(): number {
    return this.allPermissions.filter(p => p.enabled).length;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Role Details' : 'Role Creation';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Save Role';
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