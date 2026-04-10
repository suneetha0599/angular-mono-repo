import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Role } from '@admin-core/models/role-management/role.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RoleService } from '@admin-core/services/role/role.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-role-listing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './roles-listing.component.html',
  styleUrl: './roles-listing.component.scss'
})
export class RolesListingComponent implements OnInit {
  currentPath: string = '';
  roles: Role[] = [];
  isLoading: boolean = true;
  displayedColumns: string[] = ['sno', 'roleName', 'description', 'created', 'actions'];


  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    roleName: '',
    description: '',
    createdAt: '',
    roleId: 0
  }));
  hasApiError: boolean = false;

  createRole: boolean = false;
  editRole: boolean = false;
  viewRole: boolean = false;

  constructor(
    private router: Router,
    private apiHelperService: ApiHelperService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private roleService: RoleService
  ) { }

  private rolePermissionService = inject(RolePermissionService);

  ngOnInit(): void {
    this.roleService.clearRoleNavigationState()
    this.onInitPage();
    this.loadRoles();
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.createRole = this.rolePermissionService.createAuthRole || this.rolePermissionService.fullAccessAuthRole || this.rolePermissionService.fullAccessAuth;
    this.editRole = this.rolePermissionService.editAuthRole || this.rolePermissionService.fullAccessAuthRole || this.rolePermissionService.fullAccessAuth;
    this.viewRole = this.rolePermissionService.viewAuthRole || this.rolePermissionService.fullAccessAuthRole || this.rolePermissionService.fullAccessAuth;
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  viewRoleDetails(role: Role): void {
    this.setCurrentRequestList()
    this.router.navigate([`${this.currentPath}/details/${role.id}`]);
  }

  setCurrentRequestList(): void {
    if (!this.roles || !this.roles.length) {
      return;
    }

    const roleList = this.roles.map(item => ({
      roleId: item.id
    }));

    this.roleService.setDsrRequestRid(roleList);
  }

  async loadRoles(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasApiError = false;

      const [response] = await Promise.all([
        this.apiHelperService.getRolesList(),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      if (!response || response.success == false) {
        this.hasApiError = true;
        return
      }
      if (response) {
        this.roles = response.roles;
      } else {
        this.roles = [];
        this.snackbarService.openSnack('Failed to load roles');
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading roles');
      console.error('Error:', error);
      this.roles = [];
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteRole(role: Role): Promise<void> {

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Role Deletion',
        content: 'Are you sure you want to delete this role?',
        confirmationDetail: role.name,
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

        const response = await this.apiHelperService.deleteRole(role.id);
        if (response) {

          this.roles = this.roles.filter(r => r.id !== role.id);
          this.snackbarService.openSnack('Role deleted successfully');
        } else {
          this.snackbarService.openSnack('Failed to delete role');
        }
      } catch (error) {
        this.snackbarService.openSnack('Error deleting role');
        console.error('Error:', error);
      }
    });
  }

  addRole(): void {
    this.router.navigate([`${this.currentPath}/${routeConstants.ROLE_MANAGEMENT_CREATION}`]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  get showRequestList() {
    return this.roles?.length
  }
}
