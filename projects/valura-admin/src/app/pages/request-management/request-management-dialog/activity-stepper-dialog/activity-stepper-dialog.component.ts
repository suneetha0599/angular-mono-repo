import { AuditLogs } from '@admin-core/models/request-management/DsrRequest';
import { Component, Inject, inject, Input } from '@angular/core';
import { ActivityStepperComponent } from '../../activity-stepper/activity-stepper.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-activity-stepper-dialog',
  imports: [ActivityStepperComponent, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './activity-stepper-dialog.component.html',
  styleUrl: './activity-stepper-dialog.component.scss'
})
export class ActivityStepperDialogComponent {
  auditLogs: AuditLogs[] = [];
  dialogTitle: string = "Activity log";
  entityId: number = 0;
  auditLogModule: string;
  entityType: string;
  userAuditLog: boolean = false;
  userId?: number = 0;

  constructor(
    public dialogRef: MatDialogRef<ActivityStepperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.auditLogs = data.auditLogs ?? [];
    this.entityId = data.entityId ?? 0;
    this.entityType = data.auditLogs ?? "";
    this.auditLogModule = data.audit_log_module ?? "";
    this.userAuditLog = data.userAuditLog ?? false;
    this.userId = data.userId ?? 0;
  }

  ngOnInit() {

  }

  closeDialog() {
    this.dialogRef.close()
  }
}
