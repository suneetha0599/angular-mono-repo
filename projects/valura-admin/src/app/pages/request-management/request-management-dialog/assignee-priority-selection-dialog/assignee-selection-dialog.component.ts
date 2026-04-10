import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ConfigService } from '@admin-core/services/config.service';
import { User } from '@admin-core/models/user.model';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { RequestDialogTypes } from '../../constant';
import { UserService } from '@admin-core/services/user/user.service';
import { DbService } from '@admin-core/services/db/db.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

interface AssigneeDialogData {
  dialogType: string;
  requestRid: number;
  currentAssigneeId: number;
  requestTitle?: string;
  currentPriority: string;
  isPaused?: boolean;
}

interface AssigneeDialogResult {
  assigneeUpdated?: boolean;
  priorityUpdated?: boolean;
  requestPaused?: boolean;
  requestResumed?: boolean;
  newAssigneeId?: number;
  newAssigneeName?: string;
}

interface UserWithStatus extends User {
  isCurrentAssignee: boolean;
  displayName: string;
  isSelectable: boolean;
}

interface AssigneeForm {
  toUserId: FormControl<number | null>;
}

interface PriorityForm {
  priority: FormControl<string | null>;
}

type LoadingState = 'idle' | 'loading' | 'error' | 'success';
type EditMode = RequestDialogTypes.ASSIGNEE_CHANGE | RequestDialogTypes.PRIORITY_CHANGE

@Component({
  selector: 'app-assignee-priority-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LoadingButtonComponent,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatAutocompleteModule,
    CustomMatTextareaComponent
  ],
  templateUrl: './assignee-selection-dialog.component.html',
  styleUrl: './assignee-selection-dialog.component.scss'
})
export class AssigneeSelectionDialogComponent implements AfterViewInit {
  private readonly dialogRef = inject(MatDialogRef<AssigneeSelectionDialogComponent, AssigneeDialogResult>);
  private readonly dialogData = inject<AssigneeDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly apiHelperService = inject(ApiHelperService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly configService = inject(ConfigService);
  private readonly userService = inject(UserService);
  private readonly dbService = inject(DbService);

  readonly requestRid = this.dialogData?.requestRid ?? 0;
  readonly currentAssigneeId = this.dialogData?.currentAssigneeId ?? 0;
  readonly requestTitle = this.dialogData?.requestTitle ?? '';
  readonly currentPriority = this.dialogData?.currentPriority ?? '';
  readonly dialogType: EditMode = (this.dialogData?.dialogType as EditMode) ?? RequestDialogTypes.ASSIGNEE_CHANGE;

  readonly loadingState = signal<LoadingState>('idle');
  readonly isSubmitting = signal(false);
  readonly searchTerm = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly userList = signal<ReadonlyArray<UserWithStatus>>([]);
  readonly priorityList = signal<ReadonlyArray<string>>([]);

  readonly assigneeSearchControl = new FormControl<string | UserWithStatus>('');

  @ViewChild('assigneeInput', { read: ElementRef }) assigneeInput!: ElementRef<HTMLInputElement>;

  readonly isLoading = computed(() => this.loadingState() === 'loading');
  readonly hasError = computed(() => this.loadingState() === 'error');
  readonly isAssigneeMode = computed(() => this.dialogType === RequestDialogTypes.ASSIGNEE_CHANGE);
  readonly isPriorityMode = computed(() => this.dialogType === RequestDialogTypes.PRIORITY_CHANGE);
  readonly isPausedRequest = this.dialogData?.isPaused ?? false;
  readonly isPauseMode = computed(() => this.dialogData?.dialogType === RequestDialogTypes.PAUSE_REQUEST);
  readonly isResumeMode = computed(() => this.dialogData?.dialogType === RequestDialogTypes.RESUME_REQUEST);

  readonly pauseForm: FormGroup<{ reason: FormControl<string | null> }> = this.fb.group({
    reason: this.fb.control<string | null>(null, [Validators.required])
  });

  get reasonControl(): FormControl {
    return this.pauseForm.get('reason') as FormControl;
  }

  readonly isPauseFormValid = computed(() => {
    if (!this.isPauseMode()) return true;
    // This line makes the computed reactive to form changes
    this.pauseFormValue();
    return this.pauseForm.valid;
  });
  readonly pauseFormValue = toSignal(this.pauseForm.valueChanges, {
    initialValue: this.pauseForm.value
  });

  readonly isSubmitDisabled = computed(() => {
    if (this.isSubmitting()) return true;
    if (this.isPauseMode()) return !this.isPauseFormValid();
    if (this.isResumeMode()) return false;
    return this.isAssigneeMode() ? !this.isAssigneeFormValid() : !this.isPriorityFormValid();
  });

  readonly isAssigneeFormValid = computed(() => {
    if (!this.isAssigneeMode()) return true;
    this.assigneeFormValue();
    return this.assigneeForm.valid;
  });

  readonly isPriorityFormValid = computed(() => {
    if (!this.isPriorityMode()) return true;
    this.priorityFormValue();
    return this.priorityForm.valid;
  });



  readonly filteredUserList = computed(() => {
    const users = this.userList();
    const search = this.searchTerm().toLowerCase().trim();

    if (!search) return users;

    return users.filter(user => {
      const name = user.displayName.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      return name.includes(search) || email.includes(search);
    });
  });

  readonly availableUsersCount = computed(() =>
    this.filteredUserList().filter(user => user.isSelectable).length
  );

  readonly currentAssigneeName = computed(() => {
    if (!this.currentAssigneeId) return 'Unassigned';
    const currentUser = this.userList().find(u => u.isCurrentAssignee);
    return currentUser?.displayName ?? 'Unknown User';
  });

  readonly assigneeForm: FormGroup<AssigneeForm> = this.fb.group<AssigneeForm>({
    toUserId: this.fb.control<number | null>(
      null,
      [Validators.required, this.createDifferentAssigneeValidator()]
    )
  });

  readonly priorityForm: FormGroup<PriorityForm> = this.fb.group<PriorityForm>({
    priority: this.fb.control<string | null>(
      this.currentPriority || null,
      [Validators.required]
    )
  });

  readonly assigneeFormValue = toSignal(this.assigneeForm.valueChanges, {
    initialValue: this.assigneeForm.value
  });

  readonly priorityFormValue = toSignal(this.priorityForm.valueChanges, {
    initialValue: this.priorityForm.value
  });

  constructor() {
    effect(() => {
      if (this.loadingState() === 'idle') {
        this.initializeData();
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.hasError() && this.userList().length === 0) {
        setTimeout(() => this.dialogRef.close(), 2000);
      }
    });

    this.assigneeSearchControl.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        this.searchTerm.set(value);
      }
    });
  }

  ngAfterViewInit(): void {
    !!this.assigneeInput;
  }

  private createDifferentAssigneeValidator(): ValidatorFn {
    return (control) => {
      if (this.currentAssigneeId === 0) return null;
      if (!control.value || control.value !== this.currentAssigneeId) {
        return null;
      }
      return { sameAssignee: true };
    };
  }

  private async initializeData(): Promise<void> {
    this.loadingState.set('loading');
    this.errorMessage.set(null);

    try {
      const [users, config] = await Promise.all([
        this.loadUserList(),
        this.loadConfiguration()
      ]);

      if (this.isAssigneeMode() && (!users || users.length === 0)) {
        throw new Error('No users available for assignment');
      }

      this.loadingState.set('success');
    } catch (error) {
      this.handleLoadError(error);
    }
  }

  private async loadUserList(): Promise<User[]> {
    if (!this.isAssigneeMode()) return [];

    try {
      const users = await this.dbService.getAllAdminUsers();
      const processedUsers = this.processUsers(users);
      this.userList.set(processedUsers);
      return users;
    } catch (error) {
      console.error('Error loading users from local DB:', error);
      return [];
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (!this.isPriorityMode()) return;

    const config = await this.configService.getDsrConfiguration();
    if (config?.priorityList) {
      this.priorityList.set(config.priorityList);
    }
  }

  private getCurrentUserFromLocalStorage(): User | null {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  private processUsers(users: User[]): UserWithStatus[] {
    return users
      .map(user => ({
        ...user,
        isCurrentAssignee: user.applicationUserId === this.currentAssigneeId,
        displayName: this.formatUserName(user),
        isSelectable: user.applicationUserId !== this.currentAssigneeId
      }))
      .sort((a, b) => {
        if (a.isCurrentAssignee !== b.isCurrentAssignee) {
          return a.isCurrentAssignee ? 1 : -1;
        }
        return a.displayName.localeCompare(b.displayName);
      });
  }

  private formatUserName(user: User): string {
    const displayName = user.displayName?.trim() || '';

    if (!displayName) {
      return user.email || 'Unknown User';
    }

    return `${displayName}`;
  }

  private handleLoadError(error: any): void {
    const message = this.extractErrorMessage(error);
    this.errorMessage.set(message);
    this.loadingState.set('error');
    console.error('Error loading data:', error);
    this.snackbarService.openSnack(message);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.assigneeSearchControl.setValue('');
  }

  displayUserName(user: UserWithStatus | string | null): string {
    if (!user || typeof user === 'string') return '';
    return this.getUserDisplayName(user)
  }

  onAssigneeSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedUser = event.option.value as UserWithStatus;
    if (selectedUser && this.isUserSelectable(selectedUser)) {
      this.assigneeForm.patchValue({
        toUserId: selectedUser.applicationUserId
      });
    }
  }

  clearAssigneeSelection(): void {
    this.assigneeSearchControl.setValue('');
    this.assigneeForm.patchValue({
      toUserId: null
    });
    this.searchTerm.set('');
  }

  isUserSelectable(user: UserWithStatus): boolean {
    return user.isSelectable;
  }

  compareUserIds(id1: number, id2: number): boolean {
    return id1 === id2;
  }

  async onSubmit(): Promise<void> {
    if (this.isPauseMode()) {
      await this.handlePauseSubmit();
    } else if (this.isResumeMode()) {
      await this.handleResumeSubmit();
    } else if (this.isAssigneeMode()) {
      await this.handleAssigneeSubmit();
    } else {
      await this.handlePrioritySubmit();
    }
  }

  private async handlePauseSubmit(): Promise<void> {
    if (!this.pauseForm.valid) {
      this.pauseForm.markAllAsTouched();
      this.snackbarService.openSnack('Please provide a reason for pausing');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const reason = this.pauseForm.value.reason?.trim();
      if (!reason) {
        this.snackbarService.openSnack('Please provide a reason for pausing');
        return;
      }

      await firstValueFrom(this.apiHelperService.pauseDsrRequest(this.requestRid, reason));
      this.snackbarService.openSnack('Request paused successfully');
      this.dialogRef.close({ requestPaused: true });
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async handleResumeSubmit(): Promise<void> {
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.apiHelperService.resumeDsrRequest(this.requestRid));
      this.snackbarService.openSnack('Request resumed successfully');
      this.dialogRef.close({ requestResumed: true });
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async handleAssigneeSubmit(): Promise<void> {
    if (!this.validateAssigneeForm()) return;

    const newAssigneeId = this.assigneeForm.value.toUserId;
    if (!newAssigneeId) return;

    this.isSubmitting.set(true);

    try {
      await this.performAssigneeUpdate(newAssigneeId);
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async handlePrioritySubmit(): Promise<void> {
    if (!this.validatePriorityForm()) return;

    const newPriority = this.priorityForm.value.priority;
    if (!newPriority) return;

    this.isSubmitting.set(true);

    try {
      await this.performPriorityUpdate(newPriority);
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private validateAssigneeForm(): boolean {
    if (this.assigneeForm.valid) return true;

    this.assigneeForm.markAllAsTouched();
    const control = this.assigneeForm.get('toUserId');
    const message = this.getAssigneeValidationMessage(control);
    this.snackbarService.openSnack(message);
    return false;
  }

  private validatePriorityForm(): boolean {
    if (this.priorityForm.valid) return true;

    this.priorityForm.markAllAsTouched();
    this.snackbarService.openSnack('Please select a priority');
    return false;
  }

  private getAssigneeValidationMessage(control: any): string {
    if (control?.hasError('required')) return 'Please select an assignee';
    if (control?.hasError('sameAssignee')) return 'Please select a different assignee';
    return 'Please correct the form errors';
  }

  private async performAssigneeUpdate(newAssigneeId: number): Promise<void> {
    await firstValueFrom(
      this.apiHelperService.assignDsrRequest(
        { toUserId: newAssigneeId },
        this.requestRid
      )
    );

    const newUser = this.userList().find(u => u.applicationUserId === newAssigneeId);
    const result: AssigneeDialogResult = {
      assigneeUpdated: true,
      newAssigneeId,
      newAssigneeName: newUser?.displayName
    };

    this.snackbarService.openSnack('Assignee updated successfully');
    this.dialogRef.close(result);
  }

  private async performPriorityUpdate(newPriority: string): Promise<void> {
    await firstValueFrom(
      this.apiHelperService.onChangePriority(
        { priority: newPriority },
        this.requestRid
      )
    );

    const result: AssigneeDialogResult = {
      priorityUpdated: true
    };

    this.snackbarService.openSnack('Priority updated successfully');
    this.dialogRef.close(result);
  }

  private handleSubmissionError(error: any): void {
    console.error('Error updating:', error);
    const errorMessage = this.extractErrorMessage(error);
    this.snackbarService.openSnack(errorMessage);
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.message
      || error?.message
      || (typeof error === 'string' ? error : 'Failed to update. Please try again.');
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  trackByUserId(_index: number, user: UserWithStatus): number {
    return user.applicationUserId;
  }

  formatUserAriaLabel(user: UserWithStatus): string {
    const email = user.email ? `, ${user.email}` : '';
    return user.isCurrentAssignee
      ? `${user.displayName}${email}, current assignee, cannot be selected`
      : `${user.displayName}${email}, available for assignment`;
  }

  retryLoading(): void {
    this.loadingState.set('idle');
  }

  getSelectAriaLabel(): string {
    if (this.isAssigneeMode()) {
      const count = this.availableUsersCount();
      return `Select new assignee from ${count} available ${count === 1 ? 'user' : 'users'}`;
    }
    return 'Select priority level';
  }

  getSearchAriaLabel(): string {
    const count = this.userList().length;
    return `Search through ${count} ${count === 1 ? 'user' : 'users'}`;
  }

  getEmptyStateMessage(): string {
    if (this.isAssigneeMode()) {
      return this.searchTerm()
        ? `No users found matching "${this.searchTerm()}"`
        : 'No users available';
    }
    return 'No priorities available';
  }

  isPriorityDisabled(priority: string): boolean {
    return priority === this.currentPriority;
  }

  getUserDisplayName(user: User) {
    return `${user.displayName} ${user.email ? `(${user.email})` : ``}`
  }
}
