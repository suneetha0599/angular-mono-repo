import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { UserService } from '@admin-core/services/user/user.service';
import { ADMIN_USER, INTERNAL_USER } from '@admin-core/constants/constants';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface DialogData {
  assessmentId?: number;
  levelKey?: number;
  existingApprovers?: any[];
}

@Component({
  selector: 'app-add-assessment-approver',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatCheckboxModule
  ],
  templateUrl: './add-assessment-approver.component.html',
  styleUrl: './add-assessment-approver.component.scss'
})
export class AddAssessmentApproverComponent implements OnInit {
  form!: FormGroup;
  submitLoading = false;
  selectedLevel!: number;

  approverList: any[] = [];
  selectedNameText = '';
  assessmentId!: number;

  filteredApproverList: any[] = [];
  searchValue: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<AddAssessmentApproverComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData | null,
    private snackbarService: SnackbarService,
    private apiHelperService: ApiHelperService,
  ) {
    if (data?.levelKey !== undefined) {
      this.selectedLevel = data.levelKey;
    }
    if (data?.assessmentId) {
      this.assessmentId = data.assessmentId;
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [[], Validators.required]
    });

    this.getUserList();
  }

  async getUserList(): Promise<void> {
    try {
      const data = await this.userService.getAllUserMasterList(
        false,
        [ADMIN_USER]
      );

      const existingUserIds =
        this.data?.existingApprovers?.map(a => a.userId) || [];
      this.approverList = (data || []).filter(
        (user: any) =>
          !existingUserIds.includes(user.applicationUserId)
      );
      this.filteredApproverList = [...this.approverList];

      if (this.approverList.length === 0) {
        this.snackbarService.openSnack(
          'All users already added for this level'
        );
      }
    } catch (error) {
      console.error('Error loading approvers', error);
    }
  }

  filterApprovers(value: string) {
    this.searchValue = value;

    if (!value) {
      this.filteredApproverList = [...this.approverList];
      return;
    }

    const search = value.toLowerCase();

    this.filteredApproverList = this.approverList.filter(user =>
      (user.displayName || user.email).toLowerCase().includes(search)
    );
  }

  clearSearch(input?: HTMLInputElement) {
    this.searchValue = '';
    this.filteredApproverList = [...this.approverList];

    if (input) {
      input.value = '';
    }
  }

  comparenames(c1: any, c2: any): boolean {
    return c1 && c2
      ? c1.applicationUserId === c2.applicationUserId
      : c1 === c2;
  }

  updateSelectedNameText(): void {
    const selected = this.form.get('name')?.value || [];
    if (selected.length === 0) {
      this.selectedNameText = '';
    } else if (selected.length === 1) {
      this.selectedNameText =
        selected[0].displayName && selected[0].displayName.trim() !== ''
          ? selected[0].displayName
          : selected[0].email;
    } else {
      const firstName =
        selected[0].displayName && selected[0].displayName.trim() !== ''
          ? selected[0].displayName
          : selected[0].email;

      this.selectedNameText = `${firstName} +${selected.length - 1} more`;
    }
  }

  get currentOptions() {
    return this.approverList;
  }

  get nameControl(): FormControl {
    return this.form.get('name') as FormControl;
  }

  isUserSelected(user: any): boolean {
    const selected = this.form.get('name')?.value || [];
    return selected.some((u: any) => u.applicationUserId === user.applicationUserId);
  }

  toggleUser(user: any) {
    const control = this.form.get('name');
    const selected = control?.value || [];

    const index = selected.findIndex(
      (u: any) => u.applicationUserId === user.applicationUserId
    );

    if (index === -1) {
      selected.push(user);
    } else {
      selected.splice(index, 1);
    }

    control?.setValue([...selected]);
    this.updateSelectedNameText();
  }

  get levelLabel(): string {
    return `Level ${this.selectedLevel}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid || !this.assessmentId) return;

    this.submitLoading = true;

    const selectedUsers = this.form.value.name || [];

    const payload = {
      commands: [
        {
          type: 'addApprovers',
          approvers: selectedUsers.map((user: any) => ({
            level: this.selectedLevel,
            approver: {
              userId: user.applicationUserId,
              userType: user.userType
            }
          }))
        }
      ]
    };

    try {
      await this.apiHelperService.approversOperation(
        payload,
        this.assessmentId
      );

      this.snackbarService.openSnack('Approvers added successfully');

      this.dialogRef.close(true);

    } catch (error) {
      this.snackbarService.openSnack('Failed to add approvers');
    } finally {
      this.submitLoading = false;
    }
  }
}