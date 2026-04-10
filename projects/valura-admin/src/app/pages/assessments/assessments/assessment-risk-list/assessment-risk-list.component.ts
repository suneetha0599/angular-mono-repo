import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { RiskViewDrawerService } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { RiskDrawerService } from '@admin-core/services/risk-drawer/risk-drawer.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { priorityTextColor, statusColors, statusTextColors } from '../../../task-management/task-utils';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { v1 as uuidv1 } from 'uuid';
import { Router } from '@angular/router';
import { AssessmentAttachedTo, formatStatus } from '../constants';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ASSESSMENT_RISK, ASSESSMENT_VENDOR_RISK } from '@admin-core/constants/api-constants';
import { AuthService } from '@admin-core/services/auth.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';

interface FilterOption {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-assessment-risk-list',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ItemNotFoundComponent,
    MatMenuModule,
    MatCheckboxModule,
    MatSidenavModule,
    LoadingButtonComponent,
    EllipsisTooltipDirective
  ],
  templateUrl: './assessment-risk-list.component.html',
  styleUrl: './assessment-risk-list.component.scss',
})
export class AssessmentRiskListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() assessmentId: number = 0;
  @Input() sections: any[] = [];
  @Input() assessmentRiskMaster: boolean = false;
  @Input() isApprover: boolean = false;
  @Input() isRespondent: boolean = false;
  @Input() assessmentStatus: string = '';

  @Output() openCreate = new EventEmitter<void>();
  @Output() openEdit = new EventEmitter<any>();
  @Output() onRefresh = new EventEmitter<void>();
  @Output() navigateToQuestion = new EventEmitter<{ sectionId: number; questionId: number }>();
  @Output() navigateToAssessment = new EventEmitter<{ assessmentId: number }>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('filterDrawer') filterDrawer!: MatDrawer;

  dataSource = new MatTableDataSource<any>([]);
  shimmerDataSource = Array(4).fill({});
  displayedColumns = ['riskId', 'riskTitle', 'description', 'parameter', 'riskLevel', 'status', 'linkedTasks', 'action'];
  displayedMasterColumns = ['riskId', 'riskTitle', 'assessment', 'description', 'parameter', 'riskLevel', 'status', 'linkedTasks'];
  displayHeaders: any = [];

  isLoading = false;
  totalElements = 0;
  currentPage = 1;
  pageSize = 10;
  sortBy = '';
  sortDirection = '';
  showSearch = false;
  searchText = '';
  private searchSubject = new Subject<string>();
  riskSummary = { total: 0, high: 0, medium: 0, low: 0 };
  private risks: any[] = [];
  isVendorContext: boolean = false;
  isContextSet: boolean = false;
  currentPath: string = '';

  riskLevelOptions: FilterOption[] = [
    { label: 'High', value: 'HIGH', selected: false },
    { label: 'Medium', value: 'MEDIUM', selected: false },
    { label: 'Low', value: 'LOW', selected: false },
  ];
  measureTypeOptions: FilterOption[] = [
    { label: 'Avoid', value: 'AVOID', selected: false },
    { label: 'Accept', value: 'ACCEPT', selected: false },
    { label: 'Transfer', value: 'TRANSFER', selected: false },
    { label: 'Mitigate', value: 'MITIGATE', selected: false },
  ];
  selectedRiskLevels: string[] = [];
  selectedMeasureTypes: string[] = [];

  private readonly sortFieldMapping: Record<string, string> = {
    riskId: 'id',
    riskTitle: 'title',
    description: 'description',
    riskLevel: 'riskLevel',
  };

  private readonly LIKELIHOOD_SCORES: Record<string, number> = { REMOTE: 1, POSSIBLE: 2, PROBABLE: 3 };
  private readonly IMPACT_SCORES: Record<string, number> = { MINIMUM: 1, SIGNIFICANT: 2, SEVERE: 3 };

  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private riskDrawerService = inject(RiskDrawerService);
  private apiHelperService = inject(ApiHelperService);
  private router = inject(Router);
  private subs = new Subscription();
  private authService = inject(AuthService);
  private assessmentService = inject(AssessmentService);

  get filterApplied(): boolean {
    return this.selectedRiskLevels.length > 0 || this.selectedMeasureTypes.length > 0;
  }

  ngOnInit(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.setPageContext();
    this.subs.add(this.riskViewDrawerService.edit$.subscribe(risk => this.onEdit(risk)));
    this.subs.add(this.riskViewDrawerService.delete$.subscribe(risk => this.onDelete(risk)));
    this.subs.add(this.riskViewDrawerService.taskSaved$.subscribe(() => { this.clearFilters(); this.loadData(); }));
    this.subs.add(this.riskDrawerService.saved$.subscribe(() => { this.clearFilters(); this.loadData(); }));
    this.subs.add(
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
        this.currentPage = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadData();
      })
    );
  }

  setPageContext() {
    if (this.isContextSet) {
      return
    }
    this.isVendorContext = this.router.url.includes(routeConstants.VENDORS);
    this.isContextSet = true;
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.paginator._intl.itemsPerPageLabel = 'Rows per page:';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentId'] && this.assessmentId > 0) {
      this.setTableHeaders();
      this.setPageContext();
      this.currentPage = 1;
      this.loadData();
    }
    if (changes['sections']) {
      this.recomputeRaisedFor();
    }
    if (changes['assessmentRiskMaster'] && this.assessmentRiskMaster) {
      this.setTableHeaders();
      this.setPageContext();
      this.currentPage = 1;
      this.loadData();
    }
    if (changes['assessmentStatus']) {
      this.setTableHeaders();
    }
  }

  onBasisClick(row: any, event: Event): void {
    event.stopPropagation();

    if (row?.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || row?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION) {
      if (this.assessmentRiskMaster) {
        const templateBasePath = this.currentPath.split(`/${routeConstants.RISK}`)[0];
        this.router.navigate([`${templateBasePath}/${routeConstants.ASSESSMENT}/${routeConstants.ASSESSMENT_DETAILS}/${row.assessmentId}`], {
          queryParams: {
            tab: 'QR',
            sectionId: row.sectionId,
            questionId: row.attachedToId
          }
        });
      } else {
        this.navigateToQuestion.emit({
          sectionId: row.sectionId,
          questionId: row.attachedToId
        });
      }
    }

    else if (row?.attachedTo === AssessmentAttachedTo.ASSESSMENT || row?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
      if (this.assessmentRiskMaster) {
        this.onAssessmentClick(row)
      }
      else {
        this.navigateToAssessment.emit({
          assessmentId: row?.assessmentId
        });
      }
    }
  }
  setTableHeaders(): void {
    let columns = this.assessmentRiskMaster ? this.displayedMasterColumns : this.displayedColumns;
    if (this.isAssessmentReadOnly) {
      columns = columns.filter(c => c !== 'action');
    }
    this.displayHeaders = columns;
  }

  private recomputeRaisedFor(): void {
    this.dataSource.data = this.dataSource.data.map(r => ({ ...r, raisedFor: this.computeRaisedFor(r) }));
  }

  async loadData(page: number = this.currentPage, size: number = this.pageSize): Promise<void> {
    this.isLoading = true;
    const params: any = { page, size };
    if (this.searchText?.trim()) params.searchQuery = this.searchText.trim();
    if (this.sortBy) params.sortBy = this.sortBy;
    if (this.sortDirection) params.sortDirection = this.sortDirection;
    if (this.selectedRiskLevels.length) params.riskLevels = this.selectedRiskLevels;
    if (this.selectedMeasureTypes.length) params.measureTypes = this.selectedMeasureTypes;

    try {
      const _url = this.isVendorContext ? ASSESSMENT_VENDOR_RISK : ASSESSMENT_RISK;
      const responseData = await this.apiHelperService.getAssessmentRisks(this.assessmentId || null, params, _url);
      const apiRisks = responseData.risks || [];
      this.totalElements = responseData.totalRiskCount || apiRisks.length;
      this.risks = apiRisks.map((r: any) => this.mapRisk(r));
      this.dataSource.data = [...this.risks];
      this.updateRiskSummary(apiRisks);
    } catch (error) {
      console.error('Error loading risks:', error);
      this.snackbarService.openSnack('Failed to load risks', 'error');
      this.dataSource.data = [];
      this.risks = [];
      this.totalElements = 0;
      this.riskSummary = { total: 0, high: 0, medium: 0, low: 0 };
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(this.currentPage, this.pageSize);
  }

  onSortChange(event: Sort): void {
    const backendField = this.sortFieldMapping[event.active];
    if (backendField && event.direction) {
      this.sortBy = backendField;
      this.sortDirection = event.direction;
    } else {
      this.sortBy = '';
      this.sortDirection = '';
    }
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadData();
  }


  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch && this.searchText) {
      this.searchText = '';
      this.currentPage = 1;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.loadData();
    }
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchText.trimStart());
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchSubject.next('');
  }

  openFilterDrawer(): void {
    this.riskLevelOptions.forEach(o => o.selected = this.selectedRiskLevels.includes(o.value));
    this.measureTypeOptions.forEach(o => o.selected = this.selectedMeasureTypes.includes(o.value));
    this.filterDrawer.open();
  }

  onRiskLevelChange(selected: FilterOption, checked: boolean): void {
    selected.selected = checked;
  }

  onMeasureTypeChange(selected: FilterOption, checked: boolean): void {
    selected.selected = checked;
  }

  applyFilterFromDrawer(): void {
    this.selectedRiskLevels = this.riskLevelOptions.filter(o => o.selected).map(o => o.value);
    this.selectedMeasureTypes = this.measureTypeOptions.filter(o => o.selected).map(o => o.value);
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.filterDrawer.close();
    this.loadData();
  }

  resetAllFilters(): void {
    this.selectedRiskLevels = [];
    this.selectedMeasureTypes = [];
    this.riskLevelOptions.forEach(o => o.selected = false);
    this.measureTypeOptions.forEach(o => o.selected = false);
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.filterDrawer?.close();
    this.loadData();
  }

  clearRiskLevelFilter(): void {
    this.selectedRiskLevels = [];
    this.riskLevelOptions.forEach(o => o.selected = false);
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadData();
  }

  clearMeasureTypeFilter(): void {
    this.selectedMeasureTypes = [];
    this.measureTypeOptions.forEach(o => o.selected = false);
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadData();
  }

  getRiskLevelLabel(): string {
    const labels = this.riskLevelOptions.filter(o => this.selectedRiskLevels.includes(o.value)).map(o => o.label);
    return labels.length ? labels.join(', ') : this.selectedRiskLevels.join(', ');
  }

  getMeasureTypeLabel(): string {
    const labels = this.measureTypeOptions.filter(o => this.selectedMeasureTypes.includes(o.value)).map(o => o.label);
    return labels.length ? labels.join(', ') : this.selectedMeasureTypes.join(', ');
  }


  onCreate(): void {
    this.openCreate.emit();
  }

  openViewDrawer(risk: any): void {
    this.riskViewDrawerService.open({
      riskData: risk,
      assessmentId: this.assessmentId || risk.assessmentId || 0,
      sections: this.sections,
      isApprover: this.isApprover,
      isRespondent: this.isRespondent,
      assessmentRiskMaster: this.assessmentRiskMaster,
    });
  }

  onEdit(risk: any): void {
    this.openEdit.emit(risk);
  }

  onCreateTask(risk: any): void {
    this.riskViewDrawerService.triggerCreateTask({
      riskData: risk,
      assessmentId: this.assessmentId,
      sections: this.sections,
      risks: this.risks,
      source: 'RISK_CREATE_TASK',
    });
  }

  onMarkAsCompleted(risk: any): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Mark as Completed',
        content: 'Do you want to mark this risk as completed?',
        confirmationDetail: risk.riskTitle ?? '',
        confirmText: 'Mark as Completed',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'check_circle',
        iconColor: 'text-green-600',
        confirmIcon: 'check_circle',
      } as PopupDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        const payload = {
          commands: [{ type: 'performRiskAction', action: 'CLOSE_RISK' }],
          commandId: uuidv1(),
        };
        if (risk.attachedTo === AssessmentAttachedTo.ASSESSMENT || risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.apiHelperService.updateAssessmentRiskCommands(this.assessmentId, risk.riskId, payload, this.isVendorContext);
        } else {
          await this.apiHelperService.updateQuestionRisk(this.assessmentId, risk.attachedToId || 0, risk.riskId, payload, this.isVendorContext);
        }
        this.snackbarService.openSnack('Risk marked as completed', 'success');
        this.clearFilters();
        this.loadData();
      } catch (error) {
        console.error('Error marking risk as completed:', error);
        this.snackbarService.openSnack('Failed to mark risk as completed', 'error');
      }
    });
  }

  onDelete(risk: any): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this risk?',
        confirmationDetail: risk.riskTitle ?? '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600',
      } as PopupDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        const payload = {
          commands: [{ type: 'deleteRisk', riskId: risk.riskId }],
          commandId: uuidv1(),
        };
        if (risk.attachedTo === AssessmentAttachedTo.ASSESSMENT || risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.apiHelperService.updateAssessmentRiskCommands(this.assessmentId, risk.riskId, payload, this.isVendorContext);
        } else {
          await this.apiHelperService.updateQuestionRisk(this.assessmentId, risk.attachedToId || 0, risk.riskId, payload, this.isVendorContext);
        }
        this.snackbarService.openSnack('Risk deleted successfully', 'success');
        this.clearFilters();
        this.loadData();
      } catch (error) {
        console.error('Error deleting risk:', error);
        this.snackbarService.openSnack('Failed to delete risk', 'error');
      }
    });
  }

  onAssessmentClick(row: any): void {
    const id = row?.assessmentId || row?.assessmentId || this.assessmentId;
    if (id) {
      const templateBasePath = this.currentPath.split(`/${routeConstants.RISK}`)[0];

      this.router.navigate([`${templateBasePath}/${routeConstants.ASSESSMENT}/${routeConstants.ASSESSMENT_DETAILS}/${id}`], {
        queryParams: { viewDetails: true, returnTo: 'RISK_MASTER' }
      });
    }
  }


  getRiskLevel(row: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (row.riskLevel) return row.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW';
    const score = (this.LIKELIHOOD_SCORES[row.likelihood] ?? 1) * (this.IMPACT_SCORES[row.impact] ?? 1);
    if (score >= 6) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  getDescription(row: any): string {
    return (row.riskDescription || row.description || '').replace(/<[^>]*>/g, '').trim() || '-';
  }

  getRiskLevelTextColor(row: any): string {
    return priorityTextColor(this.getRiskLevel(row));
  }

  getStatusColors(status: string): string { return statusColors(status); }
  getStatusTextColors(status: string): string { return statusTextColors(status); }
  getStatusLabel(status: string): string { return formatStatus(status); }

  formatCount(value: number): string {
    return String(value).padStart(2, '0');
  }

  private mapRisk(risk: any): any {
    return {
      ...risk,
      riskId: risk.id,
      riskTitle: risk.title,
      riskDescription: risk.description,
      attachedToId: risk.attachedToId,
      questionId: risk.attachedToId,
      status: risk.status ?? 'OPEN',
      linkedTasksCount: risk.linkedTasksCount ?? 0,
      raisedFor: this.computeRaisedFor(risk),
    };
  }

  private computeRaisedFor(risk: any): string {
    if (risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) return `R-${risk.attachedToId}`;
    if (risk.attachedTo === AssessmentAttachedTo.ASSESSMENT || risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) return `A-${risk.attachedToId}`;
    if (risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || risk.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION) return `Section ${risk.sectionDisplayOrder} | Q${risk.questionDisplayOrder}`;
    return '-';
  }

  private updateRiskSummary(risks: any[]): void {
    const high = risks.filter(r => this.getRiskLevel(r) === 'HIGH').length;
    const medium = risks.filter(r => this.getRiskLevel(r) === 'MEDIUM').length;
    const low = risks.filter(r => this.getRiskLevel(r) === 'LOW').length;
    this.riskSummary = { total: this.totalElements, high, medium, low };
  }

  private clearFilters(): void {
    this.selectedRiskLevels = [];
    this.selectedMeasureTypes = [];
    this.riskLevelOptions.forEach(o => o.selected = false);
    this.measureTypeOptions.forEach(o => o.selected = false);
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.searchSubject.complete();
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  get isAssessmentReadOnly(): boolean {
    // return this.assessmentStatus === AssessmentStatus.COMPLETED || this.assessmentStatus === AssessmentStatus.CANCELLED || this.assessmentStatus === AssessmentStatus.APPROVED;
    return this.assessmentService.assessmentCompleted(this.assessmentStatus) || this.assessmentService.assessmentCancelled(this.assessmentStatus)
  }

  get showCreateRiskButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly) return false;
    return true;
  }

  get showCreateTaskButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly) return false;
    return true;
  }

  get showActionButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly) return false;
    return true;
  }

  get actionMenuDisabled() {
    if (this.isAssessmentReadOnly) return true;
    return this.isApprover || this.isRespondent || this.showActionButton || this.showCreateTaskButton ? false : true
  }
}
