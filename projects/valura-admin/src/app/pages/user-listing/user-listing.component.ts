import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Department, User } from '@admin-core/models/user-management/users.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ADMIN_USER, EXTERNAL_USER, GLOBAL_DIALOG_DEFAULTS, INTERNAL_USER } from '@admin-core/constants/constants';
import { UserService } from '@admin-core/services/user/user.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { InviteUserDialogComponent } from '@valura-lib/components/invite-user-dialog/invite-user-dialog.component';
interface TabHeader {
  name: string;
  userType: string;
}
@Component({
  selector: 'app-user-listing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatTableModule, MatTabsModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule, MatCheckboxModule, FormsModule, ItemNotFoundComponent, ErrorLoadingItemsComponent],
  templateUrl: './user-listing.component.html',
  styleUrls: ['./user-listing.component.scss']
})
export class UserListingComponent implements OnInit {
  currentPath: string = '';
  adminUsers: User[] = [];
  internalUsers: User[] = [];
  externalUsers: User[] = []
  filteredUsers: User[] = [];
  isLoading: boolean = true;
  inviteUser: Boolean = false;
  submitLoading: boolean = false;
  showInviteUserPopUp: boolean = false;
  selectedUserId: number | null = null;
  displayedColumns: string[] = ['sno', 'email', 'role', 'department', 'created', 'actions'];
  departmentMap = new Map<number, Department>();
  createUser: boolean = false;
  editUser: boolean = false;
  viewUser: boolean = false;
  selectedTabIndex: number = 0;
  tabHeaderDetails: TabHeader[] = [
    { name: 'Primary User', userType: ADMIN_USER },
    { name: 'Internal User', userType: INTERNAL_USER },
    { name: 'External User', userType: EXTERNAL_USER }
  ];

  dialogRef: MatDialogRef<any> | null = null;

  @ViewChild('emailConfirmDialog') emailConfirmDialogTemplate !: TemplateRef<any>;

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    email: '',
    roles: [],
    departments: [],
    createdAt: '',
    applicationUserId: 0
  }));

  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);

  hasApiError: boolean = false;;

  constructor(
    private router: Router,
    private apiHelper: ApiHelperService,
    private dialog: MatDialog,
  ) { }

  private rolePermissionService = inject(RolePermissionService);

  async ngOnInit(): Promise<void> {
    this.userService.clearUserNavigationState()
    this.onInitPage();
    await this.loadDepartments();
    this.loadUsers();
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.createUser = this.rolePermissionService.createAuthUser || this.rolePermissionService.fullAccessAuthUser || this.rolePermissionService.fullAccessAuth;
    this.editUser = this.rolePermissionService.editAuthUser || this.rolePermissionService.fullAccessAuthUser || this.rolePermissionService.fullAccessAuth;
    this.viewUser = this.rolePermissionService.viewAuthUser || this.rolePermissionService.fullAccessAuthUser || this.rolePermissionService.fullAccessAuth;
  }

  async loadDepartments(): Promise<void> {
    const departments = await this.departmentService.getDepartmentMasterList();
    departments.forEach(dept => {
      if (dept.id != null) {
        this.departmentMap.set(dept.id, dept);
      }
    });
  }


  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  applyTabFilter(tabIndex: number): void {
    this.selectedTabIndex = tabIndex;
    if (tabIndex === 0) {
      this.filteredUsers = this.adminUsers;
    }
    else if (tabIndex === 1) {
      this.filteredUsers = this.internalUsers;
    }
    else {
      this.filteredUsers = this.externalUsers;
    }
  }

  getRolesTooltip(roles: any[]): string {
    return roles
      .map(role => role.name)
      .join(', ');
  }


  getDepartment(departments: Department[]): string {
    if (!departments || departments.length === 0) return 'No department';
    return departments.map(dept => dept.name).join(', ');
  }

  getDepartmentsTooltip(departments: Department[]): string {
    return departments && departments.length > 1
      ? departments.map(dept => dept.name).join(', ')
      : '';
  }


  async loadUsers() {
    this.hasApiError = false;
    try {
      this.isLoading = true;
      const adminResponse: any = await this.userService.getAdminUserMasterList();
      const internalResponse: any = await this.userService.getInternalUserMasterList();
      const externalResponse: any = await this.userService.getExternalUserMasterList();


      this.adminUsers = (adminResponse || []).map((user: any) => ({
        ...user,
        userType: ADMIN_USER,
        departments: (user.departments || [])
          .map((deptId: number) => this.departmentMap.get(deptId))
          .filter(Boolean) // remove undefined
      }));

      this.internalUsers = (internalResponse || []).map((user: User) => ({ ...user, userType: INTERNAL_USER }));
      this.externalUsers = (externalResponse || []).map((user: User) => ({ ...user, userType: EXTERNAL_USER }));

      this.applyTabFilter(0);
    } catch (error) {
      console.error('Failed to load users:', error);
      this.snackbarService.openSnack('Failed to load users');
      this.adminUsers = [];
      this.internalUsers = [];
      this.filteredUsers = [];
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteUser(user: User): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this user?',
        confirmationDetail: user.email,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.apiHelper.deleteUser(user.applicationUserId);
        await this.userService.deleteAdminUser(user.applicationUserId)
        this.adminUsers = this.adminUsers.filter(u => u.applicationUserId !== user.applicationUserId);
        this.internalUsers = this.internalUsers.filter(u => u.applicationUserId !== user.applicationUserId);

        this.applyTabFilter(this.selectedTabIndex);
        this.snackbarService.openSnack('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error);
        this.snackbarService.openSnack('Failed to delete user');
      }
    });
  }

  async onInviteUser(): Promise<void> {
    if (!this.selectedUserId) return;
    this.submitLoading = true;
    try {
      await this.apiHelper.inviteUser(this.selectedUserId);
      await this.userService.updateUserDetailsToDb(this.selectedUserId, { userType: ADMIN_USER, invitationPending: false });
      this.snackbarService.openSnack('User invited successfully');
      this.onCancel();
    } catch (error) {
      this.snackbarService.openSnack('Failed to invite user');
    } finally {
      this.submitLoading = false;
      this.loadUsers();
    }
  }

  async onCancel(): Promise<void> {
    this.inviteUser = false;
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async inviteUserModal(userId: number) {
    this.selectedUserId = userId;

    const dialogRef = this.dialog.open(InviteUserDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      panelClass: 'dialog-wrapper',
      data: {
        submitLoading: this.submitLoading,
        inviteUser: true
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      if (result.action === 'cancel') {
        this.onCancel();
      } else if (result.action === 'save') {
        await this.onInviteUser();
      }
    });
  }

  viewUserDetails(user: User): void {
    this.setCurrentRequestList()
    this.router.navigate([`${this.currentPath}/details/${user.applicationUserId}`]);
  }
  setCurrentRequestList(): void {

    const currentList = this.selectedTabIndex === 0 ? this.adminUsers : this.internalUsers;

    if (!currentList || !currentList.length) {
      return;
    }

    const requestList = currentList.map(user => ({
      userId: user.applicationUserId
    }));

    this.userService.setDsrRequestRid(requestList);
  }


  assignRole(): void {
    this.router.navigate([`${this.currentPath}/${routeConstants.USER_MANAGEMENT_ASSIGN}`]);
  }

  addUser(): void {
    this.router.navigate([`${this.currentPath}/${routeConstants.USER_MANAGEMENT_CREATION}`]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  get showRequestList() {
    return this.filteredUsers?.length
  }
}
