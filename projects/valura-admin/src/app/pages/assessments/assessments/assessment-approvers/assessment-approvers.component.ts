import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { AssessmentApproversDetailsComponent } from '../assessment-approvers-details/assessment-approvers-details.component';
import { AddAssessmentApproverComponent } from '../add-assessment-approver/add-assessment-approver.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { APPROVER_COLUMNS, AssessementAction } from '../constants';
import { inject } from '@angular/core';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { Sort, MatSort, MatSortModule } from '@angular/material/sort';
import { OnChanges, SimpleChanges } from '@angular/core';
import { UserService } from '@admin-core/services/user/user.service';
import { Output, EventEmitter } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusUpdateDialogComponent } from '../../templates/status-update-dialog/status-update-dialog.component';
import { assessmentApproverApproveMessage, assessmentApproverDeleteMessage, assessmentApproverRejectMessage, assessmentCompleteMessage, assessmentRejectMessage } from '@admin-core/utils/error-message/assessment-error-message-util';
import { buildAssessmentActionUpdateCommand } from '../assessment-utils';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
@Component({
  selector: 'app-assessment-approvers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatSortModule,
    LoadingButtonComponent,
    AssessmentApproversDetailsComponent,
    MatTooltipModule,
    EllipsisTooltipDirective
  ],
  templateUrl: './assessment-approvers.component.html',
  styleUrls: ['./assessment-approvers.component.scss']
})
export class AssessmentApproversComponent implements OnInit, OnChanges {

  @Input() assessmentId!: number;
  @Input() approversData: any[] | null = null;
  @Input() isApprover!: boolean;
  @Input() isAuthor!: boolean;
  @Input() status!: string;
  @Output() refreshApprovers = new EventEmitter<boolean>();

  approverLevels: any[] = [];
  displayedColumns: string[] = APPROVER_COLUMNS.map(c => c.columnDef);
  selectedApprover: any = null;
  isLoading: boolean = false;
  loadingRowId: number | null = null;
  approveIsLoading: boolean = false;
  rejectLoading: boolean = false;

  private userService = inject(UserService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private assessmentService = inject(AssessmentService);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('createDetailsDrawer') createTaskDrawer!: MatDrawer;

  constructor(private dialog: MatDialog, private snackbarService: SnackbarService, private apiHelperService: ApiHelperService,) { }

  APPROVER_COLUMNS = APPROVER_COLUMNS;

  columnWidthMap: Record<string, string> = {};

  loggedInUserId: number | null = null;

  levels = [1, 2, 3];

  getLevelData(levelNumber: number) {
    return this.approverLevels?.find(l => l.level === levelNumber) || {
      level: levelNumber,
      approvers: []
    };
  }

  ngOnInit() {
    this.APPROVER_COLUMNS.forEach(col => {
      this.columnWidthMap[col.columnDef] = col.width;
    });

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.loggedInUserId = parsedUser?.applicationUserId || null;
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['approversData']) {
      const dataArray = Array.isArray(this.approversData)
        ? this.approversData
        : [];

      if (dataArray.length) {
        this.approverLevels = await this.prepareApprovalData(dataArray);
      } else {
        this.approverLevels = this.levels.map(level => ({
          level,
          approvers: []
        }));
      }
    }
  }

  private async prepareApprovalData(data: any[]): Promise<any[]> {
    if (!data || !data.length) return [];

    const levelMap = new Map<number, any>();
    const userCache = new Map<number, any>();

    await Promise.all(
      data.map(async (item) => {
        const levelNumber = item.level;
        const userId = item?.approver?.userId;

        let user = null;

        if (userId) {
          if (userCache.has(userId)) {
            user = userCache.get(userId);
          } else {
            user = await this.userService.getUserById(userId);
            userCache.set(userId, user);
          }
        }

        const approverObj = {
          id: item.approverMappingId,
          level: item.level,
          userId: userId,
          name: user ? this.userService.getDisplayName(user) : '-',
          status: this.formatStatus(item.status),
          dateOfApproval: item.approvedAt
            ? this.formatDate(item.approvedAt)
            : item.rejectedAt
              ? this.formatDate(item.rejectedAt)
              : '-', comment: item.comment || '-',
          isCurrentUser: userId === this.loggedInUserId,
        };

        if (!levelMap.has(levelNumber)) {
          levelMap.set(levelNumber, {
            level: levelNumber,
            approvers: []
          });
        }

        levelMap.get(levelNumber).approvers.push(approverObj);
      })
    );

    return Array.from(levelMap.values()).sort(
      (a, b) => a.level - b.level
    );
  }

  private formatStatus(status: string): string {
    if (!status) return '-';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  private formatDate(date: string): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  }

  onSortChange(event: Sort) {
    // if (backendField) {
    //   this.prepareFilters(backendField, event.direction);
    // }
  }

  onopenDetailsDrawer(approverData: any): void {
    this.selectedApprover = approverData;
    this.createTaskDrawer.open();
  }

  countApproved(approvers?: { status: string }[]): number {
    return approvers?.filter(a => a.status === 'Approved').length || 0;
  }

  getStatusColors(status: string): string {
    if (status === 'Approved') return '#EDF7ED';
    if (status === 'Rejected') return '#FFDAD6';
    return '#FFF4E5';
  }

  getStatusTextColors(status: string): string {
    if (status === 'Approved') return '#1E4620';
    if (status === 'Rejected') return '#410002';
    return '#663C00';
  }

  onDelete(data: any): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        confirmationDetail: data?.name,
        content: "Are you sure you want to delete this approver?",
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      const payload = {
        commands: [
          {
            type: 'deleteApprovers',
            approverMappingIds: [data.id]
          }
        ]
      };

      await this.apiHelperService.approversOperation(payload, this.assessmentId, false); // or call correct delete API method
      this.refreshApprovers.emit(true);
      this.snackbarService.openSnack(assessmentApproverDeleteMessage());
    }
    );
  }

  async approveRequest(data: any): Promise<void> {
    this.isLoading = true;
    this.loadingRowId = data.id;
    try {
      const payload = {
        commands: [
          {
            type: 'updateApprover',
            approverMappingId: data.id,
            commands: [
              {
                type: 'updateApproverLevel',
                level: data.level
              },
              {
                type: 'updateApproverStatus',
                status: 'APPROVED'
              }
            ]
          }
        ]
      };
      await this.apiHelperService.approversOperation(
        payload,
        this.assessmentId,
        false
      );
      this.approverLevels = this.approverLevels.map(level => ({
        ...level,
        approvers: level.approvers.map((approver: any) =>
          approver.id === data.id
            ? { ...approver, status: 'Approved' }
            : approver
        )
      }));
      this.snackbarService.openSnack(assessmentApproverApproveMessage());
      this.refreshApprovers.emit(true);
    } finally {
      this.isLoading = false;
      this.loadingRowId = null;
    }
  }

  rejectRequest(data: any): void {

    const dialogRef = this.dialog.open(StatusUpdateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'assessment'
      }
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {

      if (!result?.confirmed) return;

      this.isLoading = true;

      try {

        const payload = {
          commands: [
            {
              type: 'updateApprover',
              approverMappingId: data.id,
              commands: [
                {
                  type: 'updateApproverComment',
                  comment: result.comment
                },
                {
                  type: 'updateApproverLevel',
                  level: data.level
                },
                {
                  type: 'updateApproverStatus',
                  status: 'REJECTED'
                }
              ]
            }
          ]
        };

        await this.apiHelperService.approversOperation(
          payload,
          this.assessmentId,
          false
        );
        this.approverLevels = this.approverLevels.map(level => ({
          ...level,
          approvers: level.approvers.map((approver: any) =>
            approver.id === data.id
              ? { ...approver, status: 'Rejected', comment: result.comment }
              : approver
          )
        }));
        this.snackbarService.openSnack(assessmentApproverRejectMessage());
        this.refreshApprovers.emit(true);

      } finally {
        this.isLoading = false;
      }

    });
  }

  onAddClick(levelKey: number): void {
    const selectedLevel = this.approverLevels.find(
      level => level.level === levelKey
    );

    const dialogRef = this.dialog.open(AddAssessmentApproverComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: false,
        assessmentId: this.assessmentId,
        levelKey,
        existingApprovers: selectedLevel?.approvers || []
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshApprovers.emit(true);
      }
    });
  }

  onRejectAssessment() {
    const dialogRef = this.dialog.open(StatusUpdateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'assessment'
      }
    });
    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (!result?.confirmed) return;
      this.rejectLoading = true
      const action = AssessementAction.REJECT_ASSESSMENT;
      const comment = result.comment
      const payload = buildAssessmentActionUpdateCommand(action, comment);
      try {
        await this.assessmentApiHelperService.updateAssessmentDetails(this.assessmentId, payload, false);
        this.snackbarService.openSnack(assessmentRejectMessage());
        this.refreshApprovers.emit(true);
      }
      catch (e) {
        console.error(e)
      }
      finally {
        this.rejectLoading = false;
      }
    });
  }

  async onApproveAssessment() {
    this.approveIsLoading = true
    const action = AssessementAction.COMPLETE_ASSESSMENT;
    const payload = buildAssessmentActionUpdateCommand(action);
    try {
      await this.assessmentApiHelperService.updateAssessmentDetails(this.assessmentId, payload, false);
      this.snackbarService.openSnack(assessmentCompleteMessage());
      this.refreshApprovers.emit(true);
    }
    catch (e) {
      console.error(e)
    }
    finally {
      this.approveIsLoading = false;
    }
  }


  get canDoAssessementAction() {
    return this.isAuthor && this.assessmentIsApproved
  }

  get assessmentIsApproved() {
    return this.assessmentService.assessmentApproved(this.status)
  }

  get assessmentIsRejected() {
    return this.assessmentService.assessmentCancelled(this.status)
  }

  get assessmentIsCompleted() {
    return this.assessmentService.assessmentCompleted(this.status)
  }

  get canAddApprover() {
    return this.isAuthor && ((!this.assessmentIsCompleted) && (!this.assessmentIsRejected))
  }
}