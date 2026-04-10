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
import { Department } from '@admin-core/models/department-management/department.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { AssignUsersDialogComponent } from './assign-users-dialog/assign-users-dialog.component';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'app-department-listing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './department-listing.component.html',
  styleUrl: './department-listing.component.scss'
})
export class DepartmentListingComponent implements OnInit {
  currentPath: string = '';
  departments: Department[] = [];
  isLoading: boolean = true;
  displayedColumns: string[] = ['sno', 'name', 'description', 'actions'];

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    name: '',
    description: '',
    id: 0
  }));

  constructor(
    private router: Router,
    private apiHelperService: ApiHelperService,
    private snackbarService: SnackbarService,
    private departmentService: DepartmentService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.onInitPage();
    this.loadDepartments();
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  viewDepartmentDetails(department: Department): void {
    this.router.navigate([`${this.currentPath}/details/${department.id}`], {
      state: { department }
    });
  }

  editDepartment(department: Department): void {
    this.router.navigate([`${this.currentPath}/details/${department.id}`], {
      state: { department }
    });
  }

  async loadDepartments(): Promise<void> {
    try {
      this.isLoading = true;

      const response = await this.departmentService.getDepartmentMasterList();
      if (response) {
        this.departments = response;
      } else {
        this.departments = [];
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message ?? 'Error loading departments';
      this.snackbarService.openSnack(errorMessage);
      console.error('Error:', error);
      this.departments = [];
    } finally {
      this.isLoading = false;
    }
  }

  async deleteDepartment(department: Department): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Department Deletion',
        content: 'Are you sure you want to delete this department?',
        confirmationDetail: department.name,
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
        const response: any = await this.apiHelperService.deleteDepartment(department.id);
        if (response) {
          this.departments = this.departments.filter(d => d.id !== department.id);
          await this.departmentService.deleteDepartment(department.id);
          this.snackbarService.openSnack('Department deleted successfully');
        } else {
          this.snackbarService.openSnack('Failed to delete department');
        }
      } catch (error: any) {
        this.snackbarService.openSnack('Error deleting department');
        console.error('Error:', error);
      }
    });
  }

  addDepartment(): void {
    this.router.navigate([`${this.currentPath}/${routeConstants.DEPARTMENT_MANAGEMENT_CREATION}`]);
  }

  assignUsers(department: Department): void {
    return
    const dialogRef = this.dialog.open(AssignUsersDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        departmentId: department.id,
        departmentName: department.name
      }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadDepartments();
      }
    });
  }
}
