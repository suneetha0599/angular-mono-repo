import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Status, StatusList } from '../constants';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { templateStatusUpdateMessage } from '@admin-core/utils/error-message/template-error-message-util';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';

@Component({
  selector: 'app-status-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    LoadingButtonComponent,
    MatDialogModule,
    MatButtonModule,
    MatInputModule
  ],
  templateUrl: './status-update-dialog.component.html',
  styleUrl: './status-update-dialog.component.scss'
})
export class StatusUpdateDialogComponent {

  statusList = StatusList;
  comment = ''
  selectedStatus!: Status.ACTIVE | Status.INACTIVE;
  loading = false;
  isVendorContext: boolean = false;
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private snackbarService = inject(SnackbarService);

  constructor(
    private dialogRef: MatDialogRef<StatusUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.selectedStatus = data.currentStatus;
    this.isVendorContext = data?.isVendorContext;
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  async update() {
    if (this.data.type === 'assessment') {

      if (!this.comment?.trim()) {
        return;
      }

      this.loading = true;
      setTimeout(() => {
        this.dialogRef.close({
          confirmed: true,
          comment: this.comment
        });
      }, 300);

      return;
    }
    if (!this.selectedStatus || this.selectedStatus === this.data.currentStatus) {
      this.dialogRef.close(false);
      return;
    }
    this.onUpdateTemplate();
  }

  onUpdateTemplate() {
    this.loading = true;
    const data = {
      commands: [
        {
          type: "updateTemplateStatus",
          status: this.selectedStatus
        }
      ]
    }
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    this.assessmentApiHelperService.updateTemplateDetails(this.data.templateId, data, _url, false)
      .subscribe({
        next: async (res) => {
          this.snackbarService.openSnack(templateStatusUpdateMessage());
          this.dialogRef.close(true);
          this.loading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.loading = false;
        },
      });
  }

  isUpdateDisabled(): boolean {
    if (this.data.type === 'assessment') {
      return !this.comment || !this.comment.trim();
    }

    if (this.data.type === 'template') {
      return !this.selectedStatus || this.selectedStatus === this.data.currentStatus;
    }

    return false;
  }
}
