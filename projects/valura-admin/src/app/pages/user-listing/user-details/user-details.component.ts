import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { Location } from '@angular/common';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { User, Department, Permission } from '@admin-core/models/user-management/users.model';
import { PrimitiveGroup, Primitive, UpdateUserPermissionsPayload, Role } from '@admin-core/models/role-management/role.model';
import { UserService } from '@admin-core/services/user/user.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { AddCategoryDialogComponent } from '@admin-page/data-discovery/data-discovery-dialog/add-category-dialog/add-category-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatDialog } from '@angular/material/dialog';
import { CustomMatErrorComponent } from '@valura-lib/components/custom-mat-error/custom-mat-error.component';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components/error-loading-items/error-loading-items.component';
@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCardModule,
    LoadingButtonComponent,
    EllipsisTooltipDirective,
    MatTooltipModule,
    ErrorLoadingItemsComponent,
    MatAutocompleteModule,
    CustomMatErrorComponent
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {

  userDetails: User | null = null;
  departments: Department[] = [];
  allRoles: Role[] = [];
  selectedRoles: Role[] = [];
  userId: number | null = null;
  newDepartments: Department[] = [];
  selectedDepartments: Department[] = [];
  departmentSearchTerm = ''
  filteredDepartmentList: any[] = []
  primitives: PrimitiveGroup = {};
  objectKeys = Object.keys;

  form: FormGroup;

  isLoading = false;
  submitLoading = false;
  initialDataLoading = false;
  hasTriedToSubmit = false;

  currentRequestDetails = {
    userId: 0,
    index: 0
  }

  private navigationDirection: 'prev' | 'next' | null = null;
  private originalDepartments: Department[] = [];
  private originalRoles: Role[] = [];
  private cdr = inject(ChangeDetectorRef);
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);

  hasApiError: boolean = false;

  ShowActivityLog() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        userAuditLog: true,
        userId: this.userId
      }
    });
  }

  constructor(private dialog: MatDialog) {
    this.form = this.fb.group({
      displayName: ['', Validators.required],
      phoneNumber: ['', [Validators.pattern(/^[+]?[\d\s\-\(\)]{10,}$/)]],
      department: [null],
      firstName: ['', Validators.required],
      lastName: [''],
      role: [null, Validators.required],
    });
  }
  async ngOnInit(): Promise<void> {
    this.departmentService.clearNewDepartmentList();
    this.route.paramMap.subscribe(async params => {
      const id = Number(params.get('id'));

      if (!id || isNaN(id)) {
        this.snackbarService.openSnack('Invalid user ID');
        this.location.back();
        return;
      }

      this.userId = id;
      await this.loadInitialData();
      await this.loadUserDetails();
    });
  }


  async loadInitialData(): Promise<void> {
    this.initialDataLoading = true;
    try {
      const [departments, roles, allPrimitives] = await Promise.all([
        this.departmentService.getDepartmentMasterList(),
        this.apiHelperService.getRolesList(),
        this.apiHelperService.getPrimitives()
      ]);

      this.departments = departments || [];
      this.filteredDepartmentList = departments || [];
      this.allRoles = roles.roles || [];

      if (allPrimitives) {
        this.initializePrimitives(allPrimitives);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    } finally {
      this.initialDataLoading = false;
    }
  }

  async goToPrevRequest() {
    if (this.currentRequestDetails.index <= 0) return;

    this.currentRequestDetails.index--;
    const user = this.userService.getNextOrPrevRequestRid(this.currentRequestDetails.index);

    if (user) {
      this.navigateToUser(user.userId);
    }
  }

  async goToNextRequest() {
    const listLength = this.userService.getDsrRequestRid()?.length ?? 0;
    if (this.currentRequestDetails.index >= listLength - 1) return;

    this.currentRequestDetails.index++;
    const user = this.userService.getNextOrPrevRequestRid(this.currentRequestDetails.index);

    if (user) {
      this.navigateToUser(user.userId);
    }
  }

  navigateToUser(userId: number) {
    const currentPath = this.router.url.split('/details')[0]; // get the base path
    this.router.navigate([`${currentPath}/details/${userId}`]);
  }

  get departmentControl(): FormControl {
    return this.form.get('department') as FormControl;
  }

  get disablePrevBtn(): boolean {
    return (
      this.currentRequestDetails.index === 0 &&
      !this.userService.getPrevRequestShifted()
    );
  }

  get disableNextBtn(): boolean {
    const listLength = this.userService.getDsrRequestRid()?.length ?? 0;
    return (
      this.currentRequestDetails.index === listLength - 1 &&
      !this.userService.getNextRequestShifted()
    );
  }

  private initializePrimitives(allPrimitives: PrimitiveGroup): void {
    Object.keys(allPrimitives).forEach(moduleName => {
      this.primitives[moduleName] = allPrimitives[moduleName].map((perm: any) => ({
        name: perm.name,
        value: perm.value,
        description: perm.description,
        enabled: false,
        initiallyEnabled: false
      }));
    });
  }

  async loadUserDetails(): Promise<void> {
    if (!this.userId) return;

    this.isLoading = true;
    this.hasApiError = false;
    try {
      const userData = await this.apiHelperService.getUserById(this.userId);
      if (!userData) {
        this.hasApiError = true;
        return
      }
      if (userData) {
        this.userDetails = userData;
        await this.userService.updateUserDetailsToDb(this.userId, userData)
        this.populateFormData();
        this.setupPermissions();
      } else {
        this.snackbarService.openSnack('User not found');
        this.location.back();
      }

    } catch (error) {
      console.error('Failed to load user details:', error);
      this.snackbarService.openSnack('Failed to load user details');
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  private populateFormData(): void {
    if (!this.userDetails) return;

    this.form.patchValue({
      displayName: this.userDetails.displayName || '',
      firstName: this.userDetails.firstName || '',
      lastName: this.userDetails.lastName || '',
      phoneNumber: this.userDetails.phone || ''
    });

    if (this.userDetails.departments?.length > 0) {
      this.selectedDepartments = this.userDetails.departments
        .map((userDept: number) => this.departments.find(d => d.id === userDept))
        .filter((dept): dept is Department => dept !== undefined);

      this.originalDepartments = [...this.selectedDepartments];
    }

    if (this.userDetails.roles?.length > 0) {
      this.selectedRoles = this.userDetails.roles
        .map(userRole =>
          this.allRoles.find(r => r.id === userRole.id)
        )
        .filter((role): role is Role => !!role);

      this.originalRoles = [...this.selectedRoles];
    }


    this.hasTriedToSubmit = false;
  }


  private setupPermissions(): void {
    if (!this.userDetails) return;

    const overrideMap = new Map<string, 'ALLOW' | 'DENY'>();

    this.userDetails.primitiveOverrides?.forEach((o: any) => {
      overrideMap.set(o.value, o.source);
    });

    Object.keys(this.primitives).forEach(module => {
      this.primitives[module].forEach(p => {
        const apiOverride = overrideMap.get(p.value);

        if (apiOverride) {
          p.overridden = true;
          p.enabled = apiOverride === 'ALLOW';
          p.source = `Manually Overridden: ${apiOverride === 'ALLOW' ? 'Granted' : 'Revoked'
            }`;
        } else {
          p.overridden = false;
        }
      });
    });


    this.recomputePermissionsFromRoles();


    Object.keys(this.primitives).forEach(module => {
      this.primitives[module].forEach(p => {
        p.initiallyEnabled = p.enabled;
      });
    });
  }

  private recomputePermissionsFromRoles(): void {
    const rolePermissionMap = new Map<string, string[]>();

    this.selectedRoles.forEach(role => {
      role.primitives?.forEach((perm: string) => {
        if (!rolePermissionMap.has(perm)) {
          rolePermissionMap.set(perm, []);
        }
        rolePermissionMap.get(perm)!.push(role.name);
      });
    });

    const newPrimitives: PrimitiveGroup = {};

    Object.keys(this.primitives).forEach(module => {
      newPrimitives[module] = this.primitives[module].map(p => {
        const roles = rolePermissionMap.get(p.value) || [];

        if (p.overridden) {
          const status = p.enabled ? 'Granted' : 'Revoked';
          return {
            ...p,
            source: `Manually Overridden: ${status}${roles.length ? ` (Inherited: ${roles.join(', ')})` : ''
              }`
          };
        }


        if (roles.length > 0) {
          return {
            ...p,
            enabled: true,
            source: `Role: ${roles.join(', ')}`
          };
        }


        return {
          ...p,
          enabled: false,
          source: undefined
        };
      });
    });


    this.primitives = newPrimitives;
  }



  onPermissionToggle(primitive: Primitive, moduleName?: string): void {
    primitive.enabled = !primitive.enabled;
    primitive.overridden = true;

    const status = primitive.enabled ? 'Granted' : 'Revoked';
    primitive.source = `Manually Overridden: ${status}`;
    primitive.overrideSource = primitive.enabled ? 'ALLOW' : 'DENY';
    if (moduleName) {
      const modulePermissions = this.primitives[moduleName] || [];
      for (const perm of modulePermissions) {
        if (perm.value === primitive.value) continue;
        if (perm.parentPrimitives?.includes(primitive.value)) {
          perm.enabled = primitive.enabled;
          perm.overridden = true;
          const permStatus = perm.enabled ? 'Granted' : 'Revoked';
          perm.source = `Manually Overridden: ${permStatus}`;
          perm.overrideSource = perm.enabled ? 'ALLOW' : 'DENY';
        }
      }
    }

    this.cdr.detectChanges();
  }

  onDepartmentSelected(event: MatSelectChange): void {
    const selectedDepartment = event.value;
    this.patchDepartment(selectedDepartment);
  }

  patchDepartment(selectedDepartment: any) {
    if (selectedDepartment && !this.isAlreadySelected(selectedDepartment, this.selectedDepartments)) {
      this.selectedDepartments.push(selectedDepartment);
      this.form.patchValue({ department: null });
    }
  }
  onRoleSelected(event: MatSelectChange): void {
    const selectedRole = event.value;
    if (!selectedRole || this.isAlreadySelected(selectedRole, this.selectedRoles)) return;

    this.selectedRoles = [...this.selectedRoles, selectedRole];

    this.recomputePermissionsFromRoles();
    this.form.patchValue({ role: null });
  }



  private isAlreadySelected(item: any, list: any[], idKey: string = 'id'): boolean {
    return list.some(listItem => listItem[idKey] === item[idKey]);
  }
  removeRole(roleId: number): void {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== roleId);

    this.recomputePermissionsFromRoles();
  }



  removeDepartment(departmentId: number): void {
    this.selectedDepartments = this.selectedDepartments.filter(dept => dept.id !== departmentId);
  }

  get availableDepartments(): Department[] {
    return this.departments.filter(dept =>
      !this.selectedDepartments.some(sd => sd.id === dept.id)
    );
  }

  get availableRoles(): Role[] {
    return this.allRoles.filter(role =>
      !this.selectedRoles.some(sr => sr.id === role.id)
    );
  }

  get hasDepartmentError(): boolean {
    return false;
  }

  get hasRoleSelectionError(): boolean {
    return this.selectedRoles.length === 0 && this.hasTriedToSubmit;
  }

  get isFormValid(): boolean {
    const basicFieldsValid =
      (this.form.get('displayName')?.valid ?? false) &&
      (this.form.get('phoneNumber')?.valid ?? false);
    return basicFieldsValid && this.selectedRoles.length > 0;
  }

  get hasChanges(): boolean {
    return this.hasBasicInfoChanges() || this.hasDepartmentChanges() || this.hasRoleChanges() || this.hasPermissionChanges();
  }

  private hasBasicInfoChanges(): boolean {
    if (!this.userDetails) return false;
    return this.form.get('displayName')?.value !== this.userDetails.displayName ||
      this.form.get('phoneNumber')?.value !== this.userDetails.phone
  }

  private hasDepartmentChanges(): boolean {
    if (this.selectedDepartments.length === 0 && this.originalDepartments.length === 0) {
      return false;
    }

    if (this.selectedDepartments.length !== this.originalDepartments.length) {
      return true;
    }

    const currentDeptIds = this.selectedDepartments.map(d => d.id).sort();
    const originalDeptIds = this.originalDepartments.map(d => d.id).sort();

    return !this.arraysEqual(currentDeptIds, originalDeptIds);
  }

  private hasRoleChanges(): boolean {
    if (this.selectedRoles.length !== this.originalRoles.length) {
      return true;
    }

    const currentRoleIds = this.selectedRoles.map(r => r.id).sort();
    const originalRoleIds = this.originalRoles.map(r => r.id).sort();

    return !this.arraysEqual(currentRoleIds, originalRoleIds);
  }

  private hasPermissionChanges(): boolean {
    return Object.keys(this.primitives).some(moduleName =>
      this.primitives[moduleName].some(primitive =>
        primitive.enabled !== primitive.initiallyEnabled
      )
    );
  }

  private arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  get canSaveChanges(): boolean {
    return this.isFormValid && this.hasChanges;
  }

  getDepartmentError(): string {
    return '';
  }

  getRoleSelectionError(): string {
    return this.hasRoleSelectionError ? 'Please select at least one role' : '';
  }
  private getPermissionOverrides(): UpdateUserPermissionsPayload {
    const overrides: { primitive: string; type: 'ALLOW' | 'DENY' }[] = [];

    Object.keys(this.primitives).forEach(moduleName => {
      this.primitives[moduleName].forEach(p => {
        if (p.overridden && p.initiallyEnabled === p.enabled) return;

        if (!p.initiallyEnabled && p.enabled) {
          overrides.push({ primitive: p.value, type: 'ALLOW' });
        }

        if (p.initiallyEnabled && !p.enabled) {
          overrides.push({ primitive: p.value, type: 'DENY' });
        }
      });
    });

    return { overrides };
  }


  private getDepartmentChanges(): { toAdd: number[], toRemove: number[] } {
    const originalDeptIds = this.originalDepartments.map(d => d.id);
    const currentDeptIds = this.selectedDepartments.map(d => d.id);

    return {
      toAdd: currentDeptIds.filter(id => !originalDeptIds.includes(id)),
      toRemove: originalDeptIds.filter(id => !currentDeptIds.includes(id))
    };
  }

  private getRoleChanges(): { toAdd: number[], toRemove: number[] } {
    const originalRoleIds = this.originalRoles.map(r => r.id);
    const currentRoleIds = this.selectedRoles.map(r => r.id);

    return {
      toAdd: currentRoleIds.filter(id => !originalRoleIds.includes(id)),
      toRemove: originalRoleIds.filter(id => !currentRoleIds.includes(id))
    };
  }

  async onSubmit(): Promise<void> {
    if (!this.userDetails || !this.userId) {
      this.snackbarService.openSnack('User data not available');
      return;
    }

    this.hasTriedToSubmit = true;

    // if (!this.isFormValid) {
    //   this.snackbarService.openSnack('Please select at least one role');
    //   return;
    // }

    if (!this.hasChanges) {
      this.snackbarService.openSnack('No changes to save');
      return;
    }

    this.submitLoading = true;

    try {
      const promises: Promise<any>[] = [];

      const updatePayload = this.buildUpdateUserPayload();

      promises.push(
        this.apiHelperService.updateUser(this.userId, updatePayload)
      );

      const permissionPayload = this.getPermissionOverrides();
      if (permissionPayload.overrides.length > 0) {
        promises.push(
          this.updateUserPermissions(permissionPayload)
        );
      }

      const responses = await Promise.all(promises);

      if (responses.every(Boolean)) {
        // this.snackbarService.openSnack('User updated successfully');

        this.originalRoles = [...this.selectedRoles];
        this.originalDepartments = [...this.selectedDepartments];

        Object.keys(this.primitives).forEach(moduleName => {
          this.primitives[moduleName].forEach(p => {
            p.initiallyEnabled = p.enabled;
          });
        });

        await this.loadUserDetails();
        this.hasTriedToSubmit = false;
        this.departmentService.clearNewDepartmentList();
        if (updatePayload?.newDepartmentList?.length) {
          this.departmentService.syncDepartment();
        }
        this.goBack();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error(error);
      // this.snackbarService.openSnack('Failed to update user');
    } finally {
      this.submitLoading = false;
    }
  }

  private buildUpdateUserPayload(): {
    displayName: string;
    firstName: string;
    lastName: string
    phone: string;
    roles: number[];
    departments: number[];
    newDepartmentList: Department[]
  } {
    const departmentIds = this.selectedDepartments.map((department: Department) => department.id);

    return {
      displayName: this.form.get('displayName')?.value,
      firstName: this.form.get('firstName')?.value,
      lastName: this.form.get('lastName')?.value,
      phone: this.form.get('phoneNumber')?.valid ? this.form.get('phoneNumber')?.value : '',
      roles: this.selectedRoles.map(r => r.id),
      departments: this.selectedDepartments.map(d => d.id),
      newDepartmentList: this.departmentService.getNewDepartmentMasterList(departmentIds ?? [])
    };
  }


  private async updateUserPermissions(changes: UpdateUserPermissionsPayload): Promise<any> {
    return await this.apiHelperService.updateUserPermissions(this.userId!, changes);
  }

  resetForm(): void {
    this.selectedDepartments = [...this.originalDepartments];
    this.selectedRoles = [...this.originalRoles];

    Object.keys(this.primitives).forEach(moduleName => {
      this.primitives[moduleName].forEach(primitive => {
        primitive.enabled = primitive.initiallyEnabled || false;
      });
    });

    this.form.patchValue({
      displayName: this.userDetails?.displayName || '',
      phoneNumber: this.userDetails?.phone || '',
      department: null,
      role: null
    });

    this.hasTriedToSubmit = false;
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  goBack(): void {
    this.location.back();
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
