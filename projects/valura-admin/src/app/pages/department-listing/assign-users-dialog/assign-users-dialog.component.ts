import { Component, Inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { UserService } from '@admin-core/services/user/user.service';

export interface AssignUsersDialogData {
  departmentId: number;
  departmentName: string;
}

interface UserRow {
  userId: number;
  userName: string;
  email: string;
  isAssigned: boolean;
  selected: boolean;
  originallyAssigned: boolean;
}

type LoadingState = 'idle' | 'loading' | 'error' | 'success';

@Component({
  selector: 'app-assign-users-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LoadingButtonComponent
  ],
  templateUrl: './assign-users-dialog.component.html',
  styleUrls: ['./assign-users-dialog.component.scss']
})
export class AssignUsersDialogComponent {
  readonly loadingState = signal<LoadingState>('idle');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly users = signal<UserRow[]>([]);

  readonly isLoading = computed(() => this.loadingState() === 'loading');
  readonly hasError = computed(() => this.loadingState() === 'error');

  readonly hasChanges = computed(() => {
    return this.users().some(user => user.selected !== user.originallyAssigned);
  });

  readonly isSubmitDisabled = computed(() => {
    return this.isSubmitting() || !this.hasChanges();
  });

  readonly selectedCount = computed(() => {
    return this.users().filter(u => u.selected).length;
  });

  readonly totalCount = computed(() => this.users().length);

  constructor(
    public dialogRef: MatDialogRef<AssignUsersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignUsersDialogData,
    private apiHelperService: ApiHelperService,
    private snackbarService: SnackbarService,
    private userService: UserService,
  ) {
    effect(() => {
      if (this.loadingState() === 'idle') {
        this.loadUsers();
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.hasError() && this.users().length === 0) {
        setTimeout(() => this.dialogRef.close(false), 2000);
      }
    });
  }

  async loadUsers(): Promise<void> {
    this.loadingState.set('loading');
    this.errorMessage.set(null);

    try {

      const allUsersResponse = await this.userService.getAllUserMasterList(false);
      if (!allUsersResponse || allUsersResponse.length === 0) {
        throw new Error('No users available');
      }

      const processedUsers = allUsersResponse.map((user: any) => {
        const isAssignedToDepartment = user.departments?.some(
          (dept: any) => dept.id === this.data.departmentId
        ) || false;

        return {
          userId: user.applicationUserId,
          userName: user.userName,
          email: user.email,
          isAssigned: isAssignedToDepartment,
          selected: isAssignedToDepartment,
          originallyAssigned: isAssignedToDepartment
        };
      });

      this.users.set(processedUsers);
      this.loadingState.set('success');

    } catch (error) {
      this.handleLoadError(error);
    }
  }

  private handleLoadError(error: any): void {
    const message = this.extractErrorMessage(error);
    this.errorMessage.set(message);
    this.loadingState.set('error');
    console.error('Error loading users:', error);
    this.snackbarService.openSnack(message);
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.message
      || error?.message
      || (typeof error === 'string' ? error : 'Failed to load users. Please try again.');
  }

  toggleUser(user: UserRow): void {
    // NgModel already updated the selected property, we just need to trigger signal update
    this.users.set([...this.users()]);
  }

  toggleAll(checked: boolean): void {
    const updatedUsers = this.users().map(user => ({ ...user, selected: checked }));
    this.users.set(updatedUsers);
  }

  get allSelected(): boolean {
    const userList = this.users();
    return userList.length > 0 && userList.every(user => user.selected);
  }

  get someSelected(): boolean {
    const userList = this.users();
    return userList.some(user => user.selected) && !this.allSelected;
  }

  async onSubmit(): Promise<void> {
    if (!this.hasChanges()) {
      this.snackbarService.openSnack('No changes to save');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const userList = this.users();

      // Users to assign (selected but not originally assigned)
      const usersToAssign = userList
        .filter(user => user.selected && !user.originallyAssigned)
        .map(user => user.userId);

      // Users to unassign (not selected but originally assigned)
      const usersToUnassign = userList
        .filter(user => !user.selected && user.originallyAssigned)
        .map(user => user.userId);

      // Perform assignments
      if (usersToAssign.length > 0) {
        await this.apiHelperService.assignUsersToDepartment(
          this.data.departmentId,
          usersToAssign
        );
      }

      // Perform unassignments
      if (usersToUnassign.length > 0) {
        await this.apiHelperService.unassignUsersFromDepartment(
          this.data.departmentId,
          usersToUnassign
        );
      }

      this.snackbarService.openSnack('Users updated successfully');
      this.dialogRef.close(true);

    } catch (error) {
      console.error('Error saving user assignments:', error);
      const errorMessage = this.extractErrorMessage(error);
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  retryLoading(): void {
    this.loadingState.set('idle');
  }

  getStatusText(user: UserRow): string {
    if (user.selected && !user.originallyAssigned) {
      return 'Will be assigned';
    } else if (!user.selected && user.originallyAssigned) {
      return 'Will be removed';
    } else if (user.selected && user.originallyAssigned) {
      return 'Assigned';
    } else {
      return 'Not assigned';
    }
  }

  getStatusClass(user: UserRow): string {
    if (user.selected && !user.originallyAssigned) {
      return 'text-green-600';
    } else if (!user.selected && user.originallyAssigned) {
      return 'text-red-600';
    } else if (user.selected && user.originallyAssigned) {
      return 'text-blue-600';
    } else {
      return 'text-gray-500';
    }
  }

  trackByUserId(_index: number, user: UserRow): number {
    return user.userId;
  }
}
