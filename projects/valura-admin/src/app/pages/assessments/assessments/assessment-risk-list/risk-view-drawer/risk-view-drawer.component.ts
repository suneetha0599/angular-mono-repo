import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { QuestionConversationPanelComponent } from '@valura-lib/components//question-conversation-panel/question-conversation-panel.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { DbService } from '@admin-core/services/db/db.service';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { v1 as uuidv1 } from 'uuid';
import { AssessmentAttachedTo } from '../../constants';
import { AuthService } from '@admin-core/services/auth.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';

const RISK_MATRIX: Record<string, Record<string, string>> = {
  ALMOST_CERTAIN: {
    CATASTROPHIC: 'VERY_HIGH', CRITICAL: 'VERY_HIGH', SERIOUS: 'HIGH', SIGNIFICANT: 'HIGH', MINOR: 'MEDIUM',
  },
  VERY_LIKELY: {
    CATASTROPHIC: 'VERY_HIGH', CRITICAL: 'HIGH', SERIOUS: 'HIGH', SIGNIFICANT: 'MEDIUM', MINOR: 'LOW',
  },
  LIKELY: {
    CATASTROPHIC: 'HIGH', CRITICAL: 'HIGH', SERIOUS: 'MEDI  UM', SIGNIFICANT: 'LOW', MINOR: 'LOW',
  },
  RATHER_UNLIKELY: {
    CATASTROPHIC: 'MEDIUM', CRITICAL: 'MEDIUM', SERIOUS: 'LOW', SIGNIFICANT: 'LOW', MINOR: 'VERY_LOW',
  },
  UNLIKELY: {
    CATASTROPHIC: 'LOW', CRITICAL: 'LOW', SERIOUS: 'LOW', SIGNIFICANT: 'VERY_LOW', MINOR: 'VERY_LOW',
  },
};

@Component({
  selector: 'app-risk-view-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    LoadingButtonComponent,
    SafeHtmlPipe,
    QuestionConversationPanelComponent
  ], templateUrl: './risk-view-drawer.component.html',
  styleUrl: './risk-view-drawer.component.scss',
})
export class RiskViewDrawerComponent implements OnChanges {
  @Input() riskData: any = null;
  @Input() assessmentId: number = 0;
  @Input() sections: any[] = [];
  @Input() isApprover: boolean = false;
  @Input() isRespondent: boolean = false;
  @Input() assessmentRiskMaster: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onCreateTask = new EventEmitter<any>();
  @Output() onRefresh = new EventEmitter<void>();
  @Output() onNavigateToTask = new EventEmitter<{ taskId: number; messageId: number }>();
  @Input() viewMode: boolean = false;
  @Input() assessmentStatus: string = '';

  createdByName: string = '-';
  isLoadingDetail = false;
  assigneeNames: Map<number, string> = new Map();

  selectedAction = '';
  get disableActionButton(): boolean {
    return this._actionInProgress;
  }
  private _actionInProgress = false;

  actionOptions = [
    { value: 'COMPLETED', label: 'Mark as Completed' }
  ];

  private dbService = inject(DbService);
  private apiHelperService = inject(ApiHelperService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackbarService);
  private authService = inject(AuthService);
  private assessmentService = inject(AssessmentService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['riskData']) {
      this.resolveCreatedByName();
    }
  }

  async onDrawerOpened(): Promise<void> {
    const riskId = this.riskData?.riskId || this.riskData?.id;
    if (!this.assessmentId || !riskId) return;

    this.isLoadingDetail = true;
    this.cdr.detectChanges();

    try {
      const detail = await this.apiHelperService.getAssessmentRiskDetail(this.assessmentId, riskId);
      if (detail) {
        const questionDetail = detail.attachedToDetail?.questionDetail;
        const assessmentDetail = detail.attachedToDetail?.assessmentDetail;
        this.riskData = {
          ...this.riskData,
          ...detail,
          riskId: detail.id,
          riskDescription: detail.description,
          questionId: detail.attachedToId,
          measureDetails: detail.measureDetail,
          sectionId: questionDetail?.sectionId ?? this.riskData?.sectionId,
          sectionTitle: questionDetail?.sectionTitle ?? this.riskData?.sectionTitle ?? '',
          questionTitle: questionDetail?.questionTitle ?? this.riskData?.questionTitle ?? '',
          helperText: questionDetail?.helperText ?? '',
          assessmentTitle: assessmentDetail?.assessmentTitle ?? '',
        };
        this.resolveCreatedByName();
        await this.resolveTaskAssignees();
      }
    } catch (error) {
      console.error('Error loading risk detail:', error);
    } finally {
      this.isLoadingDetail = false;
      this.cdr.detectChanges();
    }
  }

  private async resolveCreatedByName(): Promise<void> {
    const id = this.riskData?.createdBy;
    if (!id) { this.createdByName = '-'; return; }

    const numId = Number(id);
    const user =
      await this.dbService.getInternalUserById(numId) ??
      await this.dbService.getExternalUserById(numId) ??
      await this.dbService.getAdminUserById(numId);

    this.createdByName = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : '-';
  }



  private readonly IMPACT_LABELS: Record<string, string> = {
    CATASTROPHIC: 'Catastrophic', CRITICAL: 'Critical', SERIOUS: 'Serious', SIGNIFICANT: 'Significant', MINOR: 'Minor',
  };
  private readonly LIKELIHOOD_LABELS: Record<string, string> = {
    ALMOST_CERTAIN: 'Almost certain', VERY_LIKELY: 'Very likely', LIKELY: 'Likely',
    RATHER_UNLIKELY: 'Rather unlikely', UNLIKELY: 'Unlikely',
  };
  private readonly MEASURE_LABELS: Record<string, string> = {
    MITIGATE: 'Mitigate', ACCEPT: 'Accept', AVOID: 'Avoid', TRANSFER: 'Transfer', UNKNOWN: 'Unknown',
  };
  private readonly RISK_EFFECT_LABELS: Record<string, string> = {
    REDUCED: 'Reduced', ELIMINATED: 'Eliminated', ACCEPTED: 'Accepted',
  };
  private readonly RESIDUAL_LABELS: Record<string, string> = {
    VERY_HIGH: 'Very High', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', VERY_LOW: 'Very Low',
  };

  get riskId(): string {
    return this.riskData?.riskId ? `R-${this.riskData.riskId}` : '-';
  }

  get createdOn(): string {
    const dateStr = this.riskData?.createdOn || this.riskData?.createdAt;

    if (!dateStr) return '-';

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }
  get createdBy(): string {
    return this.createdByName;
  }

  get riskTitle(): string {
    return this.riskData?.riskTitle || '-';
  }

  get description(): string {
    return this.riskData?.riskDescription || this.riskData?.description || '';
  }

  get raisedFor(): string {
    if (this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT || this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
      return `Assessment: ${this.riskData?.attachedToId ?? '-'}`;
    }
    return `Section ${this.riskData?.sectionId}: Question ${this.riskData?.questionId}`;
  }

  get impactLabel(): string {
    return this.IMPACT_LABELS[this.riskData?.impact] ?? (this.riskData?.impact || '-');
  }

  get likelihoodLabel(): string {
    return this.LIKELIHOOD_LABELS[this.riskData?.likelihood] ?? (this.riskData?.likelihood || '-');
  }

  get measureTypeLabel(): string {
    return this.MEASURE_LABELS[this.riskData?.measureType] ?? (this.riskData?.measureType || '-');
  }

  get isMitigate(): boolean {
    return this.riskData?.measureType === 'MITIGATE';
  }

  get mitigateMeasure(): string {
    return this.riskData?.measureDetails?.measure || '-';
  }

  get standard(): string {
    return this.riskData?.measureDetails?.standard || '-';
  }

  get controlCategory(): string {
    return this.riskData?.measureDetails?.controlCategory || '-';
  }

  get controlDescription(): string {
    return this.riskData?.measureDetails?.controlDescription || '-';
  }

  get riskEffect(): string {
    const val = this.riskData?.measureDetails?.riskEffect;
    return this.RISK_EFFECT_LABELS[val] ?? (val || '-');
  }

  get measureDescription(): string {
    return this.riskData?.measureDetails?.description || '-';
  }

  get riskLevel(): string {
    const level = this.riskData?.riskLevel;
    if (level) return level;
    const l = this.riskData?.likelihood;
    const i = this.riskData?.impact;
    if (!l || !i) return 'LOW';
    return RISK_MATRIX[l]?.[i] ?? 'LOW';
  }

  get riskLevelLabel(): string {
    const labels: Record<string, string> = {
      VERY_HIGH: 'Very High', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', VERY_LOW: 'Very Low',
    };
    return labels[this.riskLevel] ?? this.riskLevel;
  }

  get riskLevelClass(): string {
    const map: Record<string, string> = {
      VERY_HIGH: 'badge-risk-very-high',
      HIGH: 'badge-risk-high',
      MEDIUM: 'badge-risk-medium',
      LOW: 'badge-risk-low',
      VERY_LOW: 'badge-risk-very-low',
    };
    return map[this.riskLevel] ?? '';
  }

  get residualRisk(): string {
    return (this.riskData?.measureDetails?.residualRisk || '').toUpperCase();
  }

  get residualRiskLabel(): string {
    return this.RESIDUAL_LABELS[this.residualRisk] ?? (this.residualRisk || '-');
  }

  get residualRiskClass(): string {
    const map: Record<string, string> = {
      VERY_HIGH: 'badge-risk-very-high',
      HIGH: 'badge-risk-high',
      MEDIUM: 'badge-risk-medium',
      LOW: 'badge-risk-low',
      VERY_LOW: 'badge-risk-very-low',
    };
    return map[this.residualRisk] ?? '';
  }

  get linkedTasksCount(): number {
    return this.riskData?.linkedTasksCount ?? 0;
  }

  get taskDetails(): any[] {
    return this.riskData?.taskDetails || [];
  }

  private async resolveTaskAssignees(): Promise<void> {
    this.assigneeNames.clear();
    for (const task of this.taskDetails) {
      const id = Number(task.assignee);
      if (!id || this.assigneeNames.has(id)) continue;
      const user =
        await this.dbService.getInternalUserById(id) ??
        await this.dbService.getExternalUserById(id) ??
        await this.dbService.getAdminUserById(id);
      const name = user
        ? (user.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '-')
        : '-';
      this.assigneeNames.set(id, name);
    }
    this.cdr.detectChanges();
  }

  getAssigneeName(task: any): string {
    return this.assigneeNames.get(Number(task.assignee)) || '-';
  }

  formatTaskDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
  }

  getTaskDisplayId(task: any): string {
    const id = Number(task.taskId);
    return id ? `T-${id}` : '-';
  }

  onActionChange(): void {
    if (this.selectedAction === 'COMPLETED') {
      this.markAsCompleted();
    }
  }

  markAsCompleted(): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Mark as Completed',
        content: 'Do you want to mark this risk as completed?',
        confirmationDetail: this.riskData?.riskTitle ?? '',
        confirmText: 'Mark as Completed',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'check_circle',
        iconColor: 'text-green-600',
        confirmIcon: 'check_circle',
      } as PopupDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        this.selectedAction = '';
        return;
      }

      this._actionInProgress = true;
      try {
        const payload = {
          commands: [{ type: 'performRiskAction', action: 'CLOSE_RISK' }],
          commandId: uuidv1(),
        };

        if (this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT || this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.apiHelperService.updateAssessmentRiskCommands(
            this.assessmentId,
            this.riskData.riskId,
            payload
          );
        } else {
          await this.apiHelperService.updateQuestionRisk(
            this.assessmentId,
            this.riskData?.attachedToId || 0,
            this.riskData?.riskId,
            payload
          );
        }

        this.riskData = { ...this.riskData, status: 'COMPLETED' };
        this.snackbarService.openSnack('Risk marked as completed', 'success');
        this.onRefresh.emit();
      } catch (error) {
        console.error('Error marking risk as completed:', error);
        this.snackbarService.openSnack('Failed to mark risk as completed', 'error');
        this.selectedAction = '';
        this._actionInProgress = false;
      }
    });
  }

  goToTaskDetail(task: any): void {
    if (!task?.taskId) return;
    this.onNavigateToTask.emit({ taskId: task.taskId, messageId: 0 });
  }

  close(): void { this.onClose.emit(); }
  edit(): void { this.onEdit.emit(this.riskData); }
  delete(): void { this.onDelete.emit(this.riskData); }
  createTask(): void { this.onCreateTask.emit(this.riskData); }

  get attachedToAssessment() {
    return this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT || this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR
  }

  get attachedToQuestion() {
    return this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || this.riskData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  get isAssessmentReadOnly(): boolean {
    // return this.assessmentStatus === AssessmentStatus.COMPLETED || this.assessmentStatus === AssessmentStatus.CANCELLED || this.assessmentStatus === AssessmentStatus.APPROVED;
    return this.assessmentService.assessmentCompleted(this.assessmentStatus) || this.assessmentService.assessmentCancelled(this.assessmentStatus)
  }

  get isRiskClosed(): boolean {
    return this.riskData?.state === 'CLOSED';
  }

  get showCreateTaskButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly || this.isRiskClosed) return false;
    return true;
  }

  get showActionButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly || this.isRiskClosed) return false;
    return true;
  }
}
