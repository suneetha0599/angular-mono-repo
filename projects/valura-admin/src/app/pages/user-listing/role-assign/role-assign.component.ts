import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectChange } from '@angular/material/select';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Location } from '@angular/common';
import { Department, User, CreateUserAssignmentPayload } from '@admin-core/models/user-management/users.model';
import { Role } from '@admin-core/models/role-management/role.model';
import { USER_TYPES } from '@admin-core/constants/constants';
import { UserSearchParams } from '@admin-core/models/user-management/users.model';
import { UserService } from '@admin-core/services/user/user.service';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';

@Component({
  selector: 'app-role-assign',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    LoadingButtonComponent
  ],
  templateUrl: './role-assign.component.html',
  styleUrl: './role-assign.component.scss'
})
export class RoleAssignComponent implements OnInit {
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  departments: Department[] = [];
  roles: Role[] = [];
  allUsers: User[] = [];
  selectedUsers: User[] = [];
  selectedRoles: Role[] = [];
  filteredUsers$: Observable<User[]> | undefined;

  form: FormGroup;
  submitLoading = false;
  initialDataLoading = false;

  constructor() {
    this.form = this.fb.group({
      selectedUsers: [[], Validators.required],
      department: [null],
      role: [[], Validators.required],
      userSearch: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
    this.setupUserSearch();
  }

  async loadInitialData(): Promise<void> {
    this.initialDataLoading = true;

    const params: UserSearchParams = {
      userType: USER_TYPES
    };

    try {
      const [departments, roles] = await Promise.all([
        this.apiHelperService.getDepartmentsList(),
        this.apiHelperService.getRolesList(),
      ]);
      const users = await this.userService.getAllUserMasterList(false);
      this.departments = departments || [];
      this.roles = roles || [];
      this.allUsers = users || [];
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    } finally {
      this.initialDataLoading = false;
    }
  }

  setupUserSearch(): void {
    this.filteredUsers$ = this.form.get('userSearch')?.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const searchTerm = (value || '').toLowerCase();

        if (searchTerm.includes('@')) {
          return this.filterUsers(searchTerm);
        }

        return searchTerm.length >= 1
          ? this.filterUsers(searchTerm)
          : [];
      })
    );
  }

  private filterUsers(searchTerm: string): User[] {
    if (!searchTerm || searchTerm === '@') {
      return this.allUsers.filter(user =>
        !this.selectedUsers.some(su => su.applicationUserId === user.applicationUserId)
      );
    }

    return this.allUsers.filter(user => {
      const emailContains = user.email.toLowerCase().startsWith(searchTerm);
      const displayNameContains = user.displayName?.toLowerCase().startsWith(searchTerm);
      const isNotSelected = !this.selectedUsers.some(su => su.applicationUserId === user.applicationUserId);
      return (emailContains || displayNameContains) && isNotSelected;
    });
  }

  onUserSelected(user: User): void {
    if (!this.selectedUsers.some(u => u.applicationUserId === user.applicationUserId)) {
      this.selectedUsers.push(user);
      this.form.patchValue({
        selectedUsers: this.selectedUsers,
        userSearch: ''
      });

      this.form.get('selectedUsers')?.markAsTouched();
      this.form.get('selectedUsers')?.updateValueAndValidity();
    }
  }

  removeUser(userId: number): void {
    this.selectedUsers = this.selectedUsers.filter(
      user => user.applicationUserId !== userId
    );
    this.form.patchValue({ selectedUsers: this.selectedUsers });

    this.form.get('selectedUsers')?.markAsTouched();
    this.form.get('selectedUsers')?.updateValueAndValidity();
  }

  onRoleSelected(event: MatSelectChange): void {
    const selectedRole = event.value;
    if (selectedRole && !this.selectedRoles.some(r => r.id === selectedRole.id)) {
      this.selectedRoles.push(selectedRole);
      this.form.patchValue({ role: this.selectedRoles });
      this.form.get('role')?.markAsTouched();
    }
  }

  removeRole(roleId: number): void {
    this.selectedRoles = this.selectedRoles.filter(
      role => role.id !== roleId
    );

    this.form.patchValue({ role: this.selectedRoles });
    this.form.get('role')?.markAsTouched();
  }

  onDepartmentSelected(event: MatSelectChange): void {
    this.form.patchValue({ department: event.value });
  }

  get availableRoles(): Role[] {
    return this.roles.filter(role =>
      !this.selectedRoles.some(sr => sr.id === role.id)
    );
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        switch (fieldName) {
          case 'selectedUsers':
            return 'At least one user is required';
          case 'role':
            return 'At least one role is required';
          default:
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {

    if (fieldName === 'department') return false;

    const control = this.form.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {

      if (key !== 'department') {
        const control = this.form.get(key);
        control?.markAsTouched();
      }
    });
  }

  async onSubmit(): Promise<void> {
    this.markFormGroupTouched();

    if (this.form.invalid) {
      this.snackbarService.openSnack('Please fill in all required fields');
      return;
    }

    this.submitLoading = true;

    try {
      const requestBody: CreateUserAssignmentPayload = {
        roleIds: this.selectedRoles.map(role => role.id),
        departmentId: this.form.get('department')?.value?.id,
        applicationUserIds: this.selectedUsers.map(user => user.applicationUserId)
      };


      const rolePromise = this.apiHelperService.assignRoleToUsers({
        roleIds: requestBody.roleIds,
        applicationUserIds: requestBody.applicationUserIds
      });


      let departmentPromise: Promise<any> = Promise.resolve(true);

      if (requestBody.departmentId) {
        departmentPromise = this.apiHelperService.assignDepartmentToUsers(
          requestBody.departmentId,
          requestBody.applicationUserIds
        );
      }

      const [roleResponse, departmentResponse] = await Promise.all([
        rolePromise,
        departmentPromise
      ]);

      if (roleResponse) {
        const successMessage = requestBody.departmentId
          ? 'Roles and department assigned successfully'
          : 'Roles assigned successfully';

        this.snackbarService.openSnack(successMessage);
        this.resetForm();
      } else {
        throw new Error('Failed to assign roles');
      }
    } catch (error) {
      console.error('Error updating users:', error);
      this.snackbarService.openSnack('Failed to update users');
    } finally {
      this.submitLoading = false;
    }
  }

  resetForm(): void {
    this.selectedUsers = [];
    this.selectedRoles = [];
    this.form.reset();
  }

  get isFormValid(): boolean {
    return !!(this.form.get('selectedUsers')?.valid && this.form.get('role')?.valid);
  }

  displayUserFn(user: User): string {
    return user ? `${user.email} (${user.displayName})` : '';
  }

  goBack(): void {
    this.location.back();
  }
}