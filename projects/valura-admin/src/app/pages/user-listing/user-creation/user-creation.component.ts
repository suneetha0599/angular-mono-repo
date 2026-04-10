import { Component, OnInit, ViewChild, inject, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  FormControl
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Location } from '@angular/common';
import { CreateUserPayload, Department } from '@admin-core/models/user-management/users.model';
import { Role } from '@admin-core/models/user-management/users.model';
import { MatSelectChange } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@admin-core/services/user/user.service';
import { ADMIN_USER, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { InviteUserDialogComponent } from '@valura-lib/components/invite-user-dialog/invite-user-dialog.component';
import { AddCategoryDialogComponent } from '@admin-page/data-discovery/data-discovery-dialog/add-category-dialog/add-category-dialog.component';
@Component({
  selector: 'app-user-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingButtonComponent,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    MatCheckboxModule,
    CustomMatErrorComponent,
    MatAutocompleteModule
  ],
  templateUrl: './user-creation.component.html',
  styleUrls: ['./user-creation.component.scss'],
})
export class UserCreationComponent implements OnInit {

  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private originalDepartments: Department[] = [];
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);

  form: FormGroup;
  submitLoading = false;
  roles: Role[] = [];
  selectedRoles: Role[] = [];
  inviteUser: Boolean = false;
  departments: Department[] = [];
  newDepartments: Department[] = [];
  selectedDepartments: Department[] = [];
  departmentSearchTerm = ''
  filteredDepartmentList: any[] = []

  @ViewChild('emailConfirmDialog') emailConfirmDialogTemplate !: TemplateRef<any>;

  dialogRef: MatDialogRef<any> | null = null;
  constructor(public dialog: MatDialog) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^[+]?[\d\s\-\(\)]{10,}$/)]],
      role: [[], Validators.required],
      departments: [[], Validators.required],
      firstName: ['', Validators.required],
      lastName: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.departmentService.clearNewDepartmentList();
    await this.loadInitialData();
    await this.loadDepartmentData();
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get displayNameControl(): FormControl {
    return this.form.get('displayName') as FormControl;
  }

  get firstNameControl(): FormControl {
    return this.form.get('firstName') as FormControl;
  }

  get roleControl(): FormControl {
    return this.form.get('role') as FormControl;
  }

  get departmentControl(): FormControl {
    return this.form.get('departments') as FormControl;
  }


  async loadInitialData(): Promise<void> {
    try {
      const rolesResponse = await this.apiHelperService.getRolesList();
      if (rolesResponse) {
        this.roles = rolesResponse.roles;
      }
    } catch (error) {
      this.snackbarService.openSnack('Failed to load initial data.');
    }
  }

  async loadDepartmentData(): Promise<void> {
    try {
      const departments = await this.departmentService.getDepartmentMasterList();
      this.departments = departments || [];
      this.filteredDepartmentList = departments || [];
    } catch (error) {
      this.snackbarService.openSnack('Failed to load initial data.');
    }
  }

  private isAlreadySelected(item: any, list: any[], idKey: string = 'id'): boolean {
    return list.some(listItem => listItem[idKey] === item[idKey]);
  }

  onDepartmentSelected(event: MatSelectChange): void {
    const selectedDepartment = event.value;
    this.patchDepartment(selectedDepartment);
  }

  patchDepartment(selectedDepartment: any) {
    if (selectedDepartment && !this.isAlreadySelected(selectedDepartment, this.selectedDepartments)) {
      this.selectedDepartments.push(selectedDepartment);
      this.form.patchValue({ departments: this.selectedDepartments });
      this.form.get('departments')?.markAsTouched();
    }
  }

  removeDepartment(departmentId: number): void {
    this.selectedDepartments = this.selectedDepartments.filter(dept => dept.id !== departmentId);
    this.form.patchValue({ departments: this.selectedDepartments });
    this.form.get('departments')?.markAsTouched();
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        switch (fieldName) {
          case 'email':
            return 'Email is required';
          case 'displayName':
            return 'displayName is required';

          case 'role':
            return 'role is required';
          case 'departments':
            return 'departments is required';
          default:
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
              } is required`;
        }
      }

      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }

      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        switch (fieldName) {
          case 'displayName':
            return `Name must be at least ${requiredLength} characters`;
          default:
            return `Must be at least ${requiredLength} characters`;
        }
      }

      if (control.errors['pattern'] && fieldName === 'phoneNumber') {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  async onSubmit() {
    this.markFormGroupTouched();

    if (this.form.invalid) {
      this.snackbarService.openSnack('Please fill in all required fields correctly');
      return;
    }
    const dialogRef = this.dialog.open(InviteUserDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      panelClass: 'dialog-wrapper',
      data: { submitLoading: this.submitLoading }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      if (result.action === 'cancel') {
        this.onCancel();
      } else if (result.action === 'save') {
        this.inviteUser = result.inviteUser;
        await this.onSave();
      }
    });
  }

  async onCancel(): Promise<void> {
    this.inviteUser = false;
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async onSave(): Promise<void> {
    this.markFormGroupTouched();

    if (this.form.invalid) {
      this.snackbarService.openSnack('Please fill in all required fields correctly');
      return;
    }

    this.submitLoading = true;

    try {
      const formValue = this.form.value;
      const departmentIds = this.selectedDepartments.map((department: Department) => department.id);
      const requestBody: CreateUserPayload = {
        email: formValue.email.trim().toLowerCase(),
        displayName: formValue.displayName.trim(),
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        phone: formValue.phoneNumber.trim(),
        roles: this.selectedRoles.map((role: Role) => role.id),
        departments: departmentIds,
        sendInvite: !!this.inviteUser,
        newDepartmentList: this.departmentService.getNewDepartmentMasterList(departmentIds ?? [])
      };

      const response = await this.apiHelperService.createUser(requestBody);

      if (response) {
        await this.userService.addAdminUser({ ...response, invitationPending: !(this.inviteUser) });
        this.resetForm();
        this.departmentService.clearNewDepartmentList();
        if (requestBody?.newDepartmentList?.length) {
          this.departmentService.syncDepartment();
        }
        this.goBack();
        if (this.dialogRef) {
          this.dialogRef.close({ inviteUser: this.inviteUser });
        }
      } else {
        throw new Error('Failed to create user');
      }
    }
    catch (error: any) {
      console.log(error)
      // const extractedErrorMessage =
      //   error?.response?.data?.message ||
      //   error?.error?.message ||
      //   error?.message ||
      //   'Failed to create user. Please try again.';

      // this.snackbarService.openSnack(extractedErrorMessage);
    }
    finally {
      this.submitLoading = false;
    }
  }

  resetForm(): void {
    this.form.reset();
    this.selectedRoles = [];
    this.selectedDepartments = [...this.originalDepartments];

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  goBack(): void {
    this.location.back();
  }

  onRoleSelected(event: MatSelectChange): void {
    const selectedRole = event.value;
    if (
      selectedRole &&
      !this.selectedRoles.some((r) => r.id === selectedRole.roleId)
    ) {
      this.selectedRoles.push(selectedRole);
      this.form.patchValue({ role: this.selectedRoles });
      this.form.get('role')?.markAsTouched();
    }
  }

  removeRole(roleId: number): void {
    this.selectedRoles = this.selectedRoles.filter(
      role => role.id != roleId
    );
    this.form.patchValue({ role: this.selectedRoles });
    this.form.get('role')?.markAsTouched();
  }

  get availableRoles(): Role[] {
    return this.roles.filter(
      (role) => !this.selectedRoles.some((sr) => sr.id === role.id)
    );
  }

  displayDepartmentName(department: any): string {
    return department?.name || '';
  }

  onSearchDepartment(term: string) {
    this.departmentSearchTerm = term;
    const allDepartments = [...this.departments, ...this.newDepartments];

    this.filteredDepartmentList = allDepartments.filter(d =>
      d.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  isExistingDepartment(name: string): boolean {
    return this.departments?.some((dep: any) => dep.name.toString().toLowerCase() === name.toString().toLowerCase()) || false;
  }

  onSelectDepartment(department: any) {
    if (!department) return;
    this.patchDepartment(department)
  }

  openAddDialog(type: 'userDepartment', initialName: string) {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: { type },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (type === 'userDepartment') {
          this.patchDepartment(result);
          this.departmentSearchTerm = result.name;
        }
      }
      this.newDepartments = this.departmentService.newDepartmentList || [];
      this.filteredDepartmentList = [...this.departments, ...this.newDepartments];
    });
  }
}
