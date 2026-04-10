import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Component, OnInit, OnDestroy, AfterViewInit, inject, Input, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { v1 as uuidv1 } from 'uuid';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { formatPriority, formatStatus, priorityTextColor, statusColors, statusTextColors } from '../../../task-management/task-utils';
import { TaskType } from '@admin-page/task-management/constant';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { ASESSMENT_TASK_HEADER, AssessmentAttachedTo, AssessmentStatus, TAB_HEADER_DETAILS } from '../constants';
import { RiskViewDrawerService } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { DbService } from '@admin-core/services/db/db.service';
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { AssessmentTaskDetailDrawerComponent } from "./assessment-task-detail-drawer/assessment-task-detail-drawer.component";
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { AuthService } from '@admin-core/services/auth.service';
import { ASSESSMENT_RISK, ASSESSMENT_TASK, ASSESSMENT_VENDOR_RISK, ASSESSMENT_VENDOR_TASK } from '@admin-core/constants/api-constants';

interface FilterOption {
  label: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-assessment-task-list',
  imports: [
    ItemNotFoundComponent,
    LoadingButtonComponent,
    MatPaginatorModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSidenavModule,
    AssessmentTaskDetailDrawerComponent,
    EllipsisTooltipDirective
  ],
  templateUrl: './assessment-task-list.component.html',
  styleUrls: ['./assessment-task-list.component.scss'],
})
export class AssessmentTaskListComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() assessmentId: number = 0;
  @Input() sections: any[] = [];
  @Input() assessmentTaskMaster: boolean = false;
  @Input() pendingTaskId: number | null = null;
  @Input() pendingMessageId: number | null = null;
  @Input() assessmentStatus: string = '';
  @Output() navigateToQuestion = new EventEmitter<{ sectionId: number; questionId: number }>();
  @Output() navigateToAssessment = new EventEmitter<{ assessmentId: number }>();
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>([]);
  shimmerDataSource = Array(4).fill({});
  totalElements = 0;
  currentPage = 1;
  pageSize = 10;
  sortBy: string = '';
  sortDirection: string = '';
  isLoading = false;
  showSearch = false;
  searchText = '';
  taskSummary = { total: 0, open: 0, inProgress: 0, completed: 0 };
  selectedTaskDetails: any = null;
  selectedAttachedToDetail: any = null;
  isDrawerLoading = false;
  drawerAssessmentId: number = 0;
  drawerHighlightMessageId: number | null = null;
  highlightedTaskId: number | null = null;
  private highlightTimer: any = null;
  private taskDataMap = new Map<number, any>();
  private subs = new Subscription();
  private searchSubject = new Subject<string>();

  basisOptions: FilterOption[] = [];
  selectedBasis: string[] = [];
  selectedAttachedToId: number = 0;
  draftAttachedToId: number = 0;
  riskOptions: { id: number; label: string }[] = [];
  isRisksLoading = false;
  isVendorContext: boolean = false;
  isContextSet: boolean = false;

  private sortFieldMapping: Record<string, string> = {
    taskId: 'id',
    title: 'title',
    assessment: 'assessment_title',
    status: 'state',
    priority: 'priority',
    createdOn: 'created_at',
    dueDate: 'dueDate',
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('editTaskDrawer') rightDrawer!: MatDrawer;
  @ViewChild('filterDrawer') filterDrawer!: MatDrawer;

  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackbarService);
  private assessmentService = inject(AssessmentService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private dbService = inject(DbService);
  private router = inject(Router);
  private authService = inject(AuthService);

  tableHeaders = [
    { columnDef: 'taskId', headerName: 'Task ID', sortable: true },
    { columnDef: 'title', headerName: 'Task Title', sortable: true },
    { columnDef: 'status', headerName: 'Status', sortable: true },
    { columnDef: 'priority', headerName: 'Priority', sortable: true },
    { columnDef: 'assignedTo', headerName: 'Assignee', sortable: true },
    { columnDef: 'basis', headerName: 'Basis', sortable: true },
    { columnDef: 'createdOn', headerName: 'Created On', sortable: true },
    { columnDef: 'action', headerName: 'Action', sortable: false },
  ];

  tableHeadersOnView = [
    { columnDef: 'taskId', headerName: 'Task ID', sortable: true },
    { columnDef: 'title', headerName: 'Task Title', sortable: true },
    { columnDef: 'assessment', headerName: 'Assessment', sortable: true },
    { columnDef: 'status', headerName: 'Status', sortable: true },
    { columnDef: 'priority', headerName: 'Priority', sortable: true },
    { columnDef: 'assignedTo', headerName: 'Assignee', sortable: true },
    { columnDef: 'basis', headerName: 'Basis', sortable: true },
    { columnDef: 'createdOn', headerName: 'Created On', sortable: true }
  ];
  displayedHeaders: any = [];

  get filterApplied(): boolean {
    return this.selectedBasis.length > 0 || this.selectedAttachedToId > 0;
  }

  get activeHeaders() {
    return this.assessmentTaskMaster ? this.tableHeadersOnView : this.tableHeaders;
  }

  ngAfterViewInit(): void {
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = 'Rows per page:';
    if (this.pendingTaskId) {
      const taskId = this.pendingTaskId;
      const messageId = this.pendingMessageId;
      this.pendingTaskId = null;
      this.pendingMessageId = null;
      setTimeout(() => {
        this.openTaskDrawer(
          { taskId },
          messageId
        );
      }, 1000);
      this.highlightTask(taskId);
    }
  }

  ngOnInit() {
    this.setPageContext();
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.setBasisOptions();
    this.subs.add(
      this.riskViewDrawerService.taskSaved$.subscribe(() => { this.clearFilters(); this.loadData(); })
    );
    this.subs.add(
      this.riskViewDrawerService.createTask$.subscribe(() => this.rightDrawer?.close())
    );
    this.subs.add(
      this.riskViewDrawerService.reopenTaskDetail$.subscribe(({ taskId }) => {
        this.openTaskDrawer({ taskId });
      })
    );
    this.subs.add(
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
        this.currentPage = 1;
        if (this.paginator) this.paginator.firstPage();
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentId'] && this.assessmentId > 0) {
      this.setTableHeaders();
      this.setPageContext();
      this.currentPage = 1;
      this.loadData();
    }
    if (changes['assessmentTaskMaster'] && this.assessmentTaskMaster) {
      this.setTableHeaders();
      this.setPageContext();
      this.currentPage = 1;
      this.loadData();
    }
    if (changes['assessmentStatus']) {
      this.setTableHeaders();
    }
  }

  private clearFilters(): void {
    this.selectedBasis = [];
    this.basisOptions.forEach(o => o.selected = false);
    this.selectedAttachedToId = 0;
    this.draftAttachedToId = 0;
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.searchSubject.complete();
  }

  private highlightTask(taskId: number): void {
    this.highlightedTaskId = taskId;
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => {
      this.highlightedTaskId = null;
    }, 5000);
  }

  onBasisClick(row: any, event: Event): void {
    event.stopPropagation();

    const rawTask = this.taskDataMap.get(row.taskId);
    const sectionId = rawTask?.sectionId;

    if (rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION) {
      if (this.assessmentTaskMaster) {
        const templateBasePath = this.currentPath.split(`/${routeConstants.ASSESSMENT_TASKS_LIST}`)[0];
        console.log(templateBasePath, this.currentPath)
        this.router.navigate([`${templateBasePath}/${routeConstants.ASSESSMENT}/${routeConstants.ASSESSMENT_DETAILS}/${rawTask.assessmentId}`], {
          queryParams: {
            tab: 'QR',
            sectionId: rawTask.sectionId,
            questionId: rawTask.attachedToId
          }
        });
      } else {
        this.navigateToQuestion.emit({
          sectionId,
          questionId: rawTask?.attachedToId
        });
      }
    }
    else if (rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) {
      this.riskViewDrawerService.open({
        riskData: { id: rawTask.attachedToId },
        assessmentId: this.assessmentId || rawTask.assessmentId || 0,
        sections: this.sections,
      });
    }
    else if (rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT || rawTask?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
      if (this.assessmentTaskMaster) {
        this.onAssessmentClick(rawTask)
      }
      else {
        this.navigateToAssessment.emit({ assessmentId: rawTask.attachedToId });
      }
    }
  }
  setTableHeaders() {
    let headers = this.assessmentTaskMaster ? this.tableHeadersOnView : this.tableHeaders;
    if (this.isAssessmentReadOnly) {
      headers = headers.filter(h => h.columnDef !== 'action');
    }
    this.displayedHeaders = headers.map(h => h.columnDef);
  }

  async loadData(page: number = this.currentPage, size: number = this.pageSize) {
    this.isLoading = true;
    try {
      const params = this.prepareParams(this.assessmentId, page, size);
      const _url = this.isVendorContext ? ASSESSMENT_VENDOR_TASK : ASSESSMENT_TASK;
      const res = await this.assessmentApiHelperService.getAssessmentTasks(params, _url);
      const raw: any[] = res?.data?.tasks ?? [];
      this.totalElements = res?.data?.totalElements ?? raw.length;
      this.taskDataMap.clear();
      const tasks = await Promise.all(raw.map(async (task: any) => {
        this.taskDataMap.set(task.taskId, task);
        const basis = this.computeBasis(task);
        const assignedTo = await this.resolveAssigneeName(task.assignee);
        return {
          taskId: task.taskId,
          taskType: task.taskType || null,
          title: task.title,
          assignedTo,
          status: task?.status || null,
          state: task?.state || null,
          priority: task?.priority,
          createdOn: task?.createdOn
            ? this.formatDueDate(task.createdOn)
            : null,
          basis,
          assessmentTitle: task?.assessmentTitle || '',
          assessmentId: task?.assessmentId || task?.assessmentRid || 0
        };
      }));
      this.dataSource = new MatTableDataSource(tasks);
      this.taskSummary = {
        total: this.totalElements,
        open: tasks.filter(t => t.status === 'OPEN').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
      };
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.dataSource = new MatTableDataSource<any>([]);
    } finally {
      this.isLoading = false;
    }
  }

  prepareParams(assessmentId: number, page: number = 1, size: number = 10) {
    const taskAttachedTo = this.selectedBasis.length > 0 ? this.selectedBasis[0] : undefined;
    const taskAttachedToId = this.selectedAttachedToId > 0 ? this.selectedAttachedToId : undefined;
    const searchQuery = this.searchText.trim() || undefined;

    const params: any = { assessmentId, page, size };
    if (this.sortBy) params.sortBy = this.sortBy;
    if (this.sortDirection) params.sortDirection = this.sortDirection;
    if (taskAttachedTo) params.taskAttachedTo = taskAttachedTo;
    if (taskAttachedToId) params.taskAttachedToId = taskAttachedToId;
    if (searchQuery) params.searchQuery = searchQuery;
    if (this.authService.isExternalUser || this.authService.isInternalUser) {
      params.assigned = true;
    }
    return params
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData(this.currentPage, this.pageSize);
  }

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];
    if (backendField && event.direction) {
      this.sortBy = backendField;
      this.sortDirection = event.direction;
    } else {
      this.sortBy = '';
      this.sortDirection = '';
    }
    this.currentPage = 1;
    if (this.paginator) this.paginator.firstPage();
    this.loadData();
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch && this.searchText) {
      this.searchText = '';
      this.currentPage = 1;
      if (this.paginator) this.paginator.firstPage();
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

  onBasisOptionChange(selected: FilterOption, checked: boolean): void {
    this.basisOptions.forEach(o => o.selected = false);
    selected.selected = checked;
  }

  openFilterDrawer(): void {
    this.basisOptions.forEach(o => o.selected = this.selectedBasis.includes(o.value));
    this.draftAttachedToId = this.selectedAttachedToId;
    this.loadRiskOptions();
    this.filterDrawer.open();
  }

  private async loadRiskOptions(): Promise<void> {
    this.isRisksLoading = true;
    try {
      const params: any = { page: 1, size: 100 };
      const _url = this.isVendorContext ? ASSESSMENT_VENDOR_RISK : ASSESSMENT_RISK;
      const res = await this.assessmentApiHelperService.getAssessmentRisks(this.assessmentId || null, {}, _url);
      const risks: any[] = res?.risks ?? [];
      this.riskOptions = risks.map(r => ({ id: r.id, label: `R-${r.id} - ${r.title}` }));
    } catch {
      this.riskOptions = [];
    } finally {
      this.isRisksLoading = false;
    }
  }

  applyFilterFromDrawer(): void {
    this.selectedBasis = this.basisOptions.filter(o => o.selected).map(o => o.value);
    this.selectedAttachedToId = this.draftAttachedToId || 0;
    if (this.selectedAttachedToId > 0) {
      const _riskBasis = this.isVendorContext ? AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK : AssessmentAttachedTo.ASSESSMENT_RISK;
      this.selectedBasis = [_riskBasis];
      this.basisOptions.forEach(o => o.selected = o.value === _riskBasis);
    }
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.filterDrawer.close();
    this.loadData();
  }

  resetAllFilters(): void {
    this.selectedBasis = [];
    this.basisOptions.forEach(o => o.selected = false);
    this.selectedAttachedToId = 0;
    this.draftAttachedToId = 0;
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.filterDrawer?.close();
    this.loadData();
  }

  clearBasisFilter(): void {
    this.selectedBasis = [];
    this.basisOptions.forEach(o => o.selected = false);
    this.selectedAttachedToId = 0;
    this.currentPage = 1;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadData();
  }

  getSelectedBasisLabel(): string {
    if (!this.selectedBasis.length) return 'Basis';
    const first = this.basisOptions.find(o => o.value === this.selectedBasis[0])?.label ?? this.selectedBasis[0];
    return this.selectedBasis.length === 1
      ? `Basis: ${first}`
      : `Basis: ${first} +${this.selectedBasis.length - 1}`;
  }

  onCreateTask() {
    this.riskViewDrawerService.triggerCreateTask({
      riskData: null,
      assessmentId: this.assessmentId,
      sections: this.sections,
      isEditMode: false,
      source: 'ASSESSMENT_TASK',
    });
  }

  async onDelete(row: any): Promise<void> {
    const fullTaskData = this.taskDataMap.get(row.taskId);
    if (!fullTaskData) {
      this.snackbarService.openSnack('Error: Task data not found', 'error');
      return;
    }
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Task Deletion',
        content: 'Are you sure you want to delete this task?',
        confirmationDetail: row.title || `Task ${row.taskId}`,
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
          commandId: uuidv1(),
          commands: [{ type: 'deleteTask', taskId: row.taskId }]
        };
        const attachedTo = fullTaskData.attachedTo;
        if (attachedTo === AssessmentAttachedTo.ASSESSMENT || attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.assessmentApiHelperService.updateAssessmentMainTaskCommands(
            this.assessmentId,
            row.taskId,
            payload,
            this.isVendorContext
          );
        } else if (attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) {
          await this.assessmentApiHelperService.updateAssessmentRiskTaskCommands(
            this.assessmentId,
            fullTaskData.attachedToId,
            row.taskId,
            payload,
            this.isVendorContext
          );
        } else {
          await this.assessmentApiHelperService.updateAssessmentTask(
            this.assessmentId,
            fullTaskData.attachedToId,
            row.taskId,
            payload,
            undefined,
            this.isVendorContext
          );
        }
        this.snackbarService.openSnack('Task deleted successfully', 'success');
        this.clearFilters();
        this.loadData();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    });
  }

  async onEdit(row: any): Promise<void> {
    try {
      const detail = await this.assessmentApiHelperService.getAssessmentTaskDetail(this.assessmentId, row.taskId);
      if (!detail) {
        this.snackbarService.openSnack('Error: Task data not found', 'error');
        return;
      }
      const taskData = {
        taskId: detail.taskId,
        title: detail.title,
        priority: detail.priority,
        dueDate: detail.dueDate,
        description: detail.description || '',
        levelOfEffort: detail.levelOfEffort || null,
        status: detail.state || detail.status || 'OPEN',
        assignToUserType: detail.assignee?.userType || 'INTERNAL_USER',
        assignToUserId: detail.assignee?.userId || null,
        assigneeToUserName: detail.assignee?.userName || row.assignedTo,
        taskLabelMappings: detail.taskLabelMappings || detail.labelMappings || [],
        documentAttached: detail.taskDetails?.documentsAttached || [],
        parentTaskId: detail.parentTaskId || 0,
        attachedTo: detail.attachedTo,
        attachedToId: detail.attachedToId,
        sectionId: detail.attachedToDetail?.questionDetail?.sectionId ?? 0,
        sectionTitle: detail.attachedToDetail?.questionDetail?.sectionTitle ?? '',
        questionTitle: detail.attachedToDetail?.questionDetail?.questionTitle ?? '',
        riskTitle: detail.attachedToDetail?.riskDetail?.riskTitle ?? '',
      };
      const questionId = detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION ? detail.attachedToId : 0;
      this.riskViewDrawerService.triggerCreateTask({
        riskData: null,
        assessmentId: this.assessmentId,
        sections: this.sections,
        isEditMode: true,
        taskData,
        questionId,
        source: 'ASSESSMENT_TASK_EDIT',
        hideParameterFields: detail.attachedTo === AssessmentAttachedTo.ASSESSMENT || detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR,
      });
    } catch (error) {
      this.snackbarService.openSnack('Failed to load task details', 'error');
    }
  }

  goToDetails(element: any) {
    if (!element?.taskId) return;
    this.assessmentService.setRouteBack(TAB_HEADER_DETAILS[3].key);
    const targetUrl = [
      '/user/dsrr',
      routeConstants.TASK_MANAGEMENT,
      routeConstants.TASK_MANAGEMENT_DETAILS,
      element.taskId,
    ];
    this.router.navigate(targetUrl, {
      state: { data: element },
      queryParams: { type: TaskType.ASSESSMENT, assessmentId: this.assessmentId, }
    });
  }

  private userNameCache = new Map<string, string | null>();

  private async resolveAssigneeName(assignee: any): Promise<string | null> {
    if (!assignee?.userId) return null;
    const cacheKey = `${assignee.userType}:${assignee.userId}`;
    if (this.userNameCache.has(cacheKey)) {
      return this.userNameCache.get(cacheKey)!;
    }
    const id = Number(assignee.userId);
    let user: any;
    if (assignee.userType === 'ADMIN_USER') {
      user = await this.dbService.getAdminUserById(id);
    } else if (assignee.userType === 'EXTERNAL_USER') {
      user = await this.dbService.getExternalUserById(id);
    } else {
      user = await this.dbService.getInternalUserById(id);
    }
    const name = user
      ? (user.displayName?.trim()
        || [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
        || user.email?.trim()
        || null)
      : (assignee.userName?.trim() || null);
    this.userNameCache.set(cacheKey, name);
    return name;
  }

  formatCount(value: number): string {
    return String(value).padStart(2, '0');
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  getStatusText(status: string): string {
    return formatStatus(status);
  }

  getPriority(priority: string): string {
    return formatPriority(priority);
  }

  getPriorityTextColor(priority: string): string {
    return priorityTextColor(priority);
  }

  private computeBasis(task: any): string {
    if (task.attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || task.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) return `R-${task.attachedToId}`;
    if (task.attachedTo === AssessmentAttachedTo.ASSESSMENT || task.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) return `A-${task.attachedToId}`;
    if (task.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || task.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION) {
      return `Section ${task.sectionDisplayOrder} | Q${task.questionDisplayOrder}`;
    }
    return '-';
  }

  formatDueDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }


  async openTaskDrawer(row: any, messageId: number | null = null) {
    this.selectedTaskDetails = null;
    this.selectedAttachedToDetail = null;
    this.isDrawerLoading = true;
    const rawTask = this.taskDataMap.get(row.taskId);
    const taskAssessmentId = row?.assessmentId || rawTask?.assessmentId || rawTask?.assessmentRid || this.assessmentId;
    this.drawerAssessmentId = taskAssessmentId;
    this.drawerHighlightMessageId = messageId;
    this.rightDrawer.open();
    try {
      const rawData = await this.assessmentApiHelperService.getAssessmentTaskDetail(taskAssessmentId, row.taskId);
      if (rawData) {
        this.drawerAssessmentId = rawData.assessmentId || rawData.assessmentRid || taskAssessmentId;
        this.selectedTaskDetails = {
          ...rawData,
          assignToUserId: rawData.assignee?.userId ?? 0,
          assignToUserName: rawData.assignee?.userName ?? '',
          assignToUserType: rawData.assignee?.userType ?? '',
          isAssigned: rawData?.isAssigned ?? false,
          createdDate: rawData.createdOn ?? '',
          createdBy: 0,
          createdByUserName: rawData.createdBy.userName ?? '',
          documentAttached: rawData.taskDetails?.documentsAttached ?? [],
          taskLabelMappings: rawData.taskLabelMappings ?? rawData.labelMappings ?? [],
          isCompleted: rawData.completed ?? false,
          taskResolution: [],
          taskType: 'ASSESSMENT',
          attachedTo: rawData.attachedTo ?? '',
          attachedToId: rawData.attachedToId ?? 0,
          attachedToDetail: rawData.attachedToDetail ?? null,
        };
        this.selectedAttachedToDetail = rawData.attachedToDetail ?? null;
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      this.snackbarService.openSnack('Failed to load task details', 'error');
    } finally {
      this.isDrawerLoading = false;
    }
  }

  onAssessmentClick(row: any) {
    const rawTask = this.taskDataMap.get(row.taskId);
    const id = row?.assessmentId || rawTask?.assessmentId || rawTask?.assessmentRid || this.assessmentId;
    const templateBasePath = this.currentPath.split(`/${routeConstants.ASSESSMENT_TASKS_LIST}`)[0];
    if (id) {
      this.router.navigate([`${templateBasePath}/${routeConstants.ASSESSMENT}/${routeConstants.ASSESSMENT_DETAILS}/${id}`], { queryParams: { viewDetails: true, returnTo: 'TASK_MASTER' } });
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  setBasisOptions() {
    this.basisOptions = [
      { label: 'Assessment', value: this.isVendorContext ? AssessmentAttachedTo.ASSESSMENT : AssessmentAttachedTo.ASSESSMENT_VENDOR, selected: false },
      { label: 'Risk', value: this.isVendorContext ? AssessmentAttachedTo.ASSESSMENT_RISK : AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK, selected: false },
      { label: 'Question', value: this.isVendorContext ? AssessmentAttachedTo.ASSESSMENT_QUESTION : AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION, selected: false },
    ];
  }


  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  get isAssessmentReadOnly(): boolean {
    // return this.assessmentStatus === AssessmentStatus.COMPLETED || this.assessmentStatus === AssessmentStatus.CANCELLED || this.assessmentStatus === AssessmentStatus.APPROVED;
    return this.assessmentService.assessmentCompleted(this.assessmentStatus) || this.assessmentService.assessmentCancelled(this.assessmentStatus)
  }

  get showCreateTaskButton() {
    if (this.isInternalOrExternalUser || this.isAssessmentReadOnly) return false;
    return true;
  }

  get disableActionButton() {
    if (this.isAssessmentReadOnly) return true;
    return this.isInternalOrExternalUser ? true : false
  }
}
