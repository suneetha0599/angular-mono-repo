import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsrDrawerContentComponent } from '../request-management/dsr-drawer-content/dsr-drawer-content.component';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ConfigService } from '@admin-core/services/config.service';
import { MatPaginator, MatPaginatorModule, PageEvent, } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { DsrConfiguration } from '@admin-core/models/DsrConfiguration';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  ALL, CLARIFICATION_MANAGEMENT_HEADER, FIRST_PAGE, HEADER_ACTION, HEADER_DATE, HEADER_DESC, HEADER_NAME, HEADER_PRIORITY,
  HEADER_STATUS, HEADER_LOE, PAGE_SIZE, statusList, TASK_MANAGEMENT_HEADER,
  HEADER_ASSIGNEE
} from './constant';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule, NgModel } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateTaskDialogComponent } from '../request-management/request-management-dialog/create-task-dialog/create-task-dialog.component';
import { OPEN, PRIORITY, RequestDialogTypes, } from '../request-management/constant';
import moment from 'moment';
import { ItemNotFoundComponent } from '@valura-lib/components/item-not-found/item-not-found.component';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject } from 'rxjs';
import { DialogService } from '@admin-core/services/dialog.service';
import { convertTaskFlatToNestedList, formatPriority, formatStatus, getPriorityIcon, priorityTextColor, statusColors, statusTextColors, formatEffortLevel } from './task-utils';
import { RequestClarification, RequestTask, } from '@admin-core/models/request-management/DsrRequest';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { AuthService } from '@admin-core/services/auth.service';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon } from "@angular/material/datepicker";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { User } from '@admin-core/models/user.model';
import { UserService } from '@admin-core/services/user/user.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { TaskManagementService } from '@admin-core/services/task-management/task-management.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PRIORITY_OPTIONS } from '@admin-core/constants/constants';
import { EFFORT_LEVELS } from '@admin-core/constants/constants';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-task-management',
  imports: [EllipsisTooltipDirective, MatTooltipModule, CommonModule, MatButtonModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatTabsModule, MatIconModule, MatSortModule, MatCheckboxModule,
    MatPaginatorModule, MatMenuModule, LoadingButtonComponent, MatSidenavModule, DsrDrawerContentComponent, MatButtonToggleModule, FormsModule, ItemNotFoundComponent, MatSlideToggleModule,
    MatInputModule, NgModelDebounceChangeDirective, MatDatepicker, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, ErrorLoadingItemsComponent],
  providers: [{ provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE], },
  { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }],
  templateUrl: './task-management.component.html',
  styleUrl: './task-management.component.scss',
})
export class TaskManagementComponent {
  SEGMENT_TASK = 'TASK';
  SEGMENT_CLARIFICATION = 'CLARIFICATION';
  selectedSegment?: string = this.SEGMENT_TASK;
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME;
  HEADER_DESC = HEADER_DESC;
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE;
  HEADER_ACTION = HEADER_ACTION;
  ALL = ALL;
  pageSize: number = PAGE_SIZE;
  FIRST_PAGE = FIRST_PAGE;
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE;
  selectedTab: string = ALL;
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>();
  requestTaskList: RequestTask[] | RequestClarification[] = [];
  filteredDataSource: RequestTask[] = [];
  selectedTabIndex = 0;
  filterConfiguration: FilterConfiguration = new FilterConfiguration({});
  STATUS = 'STATUS';
  LOE = 'LOE';
  PRIORITY = 'PRIORITY';
  ASSIGNEE = 'ASSIGNEE';
  ASSIGNED_TO = 'ASSIGNED_TO';
  DATA_SUBJECT_TYPE = 'DATA_SUBJECT_TYPE';
  tabHeaderDetails = [
    { name: 'Task', count: 0, key: ALL },
    { name: 'Priority', count: 0, key: PRIORITY },
    { name: 'Open', count: 0, key: OPEN },
  ];
  isLoading = true;
  shimmerDataSource = Array(4).fill({});
  private searchSubject = new Subject<string>();
  filterApplied: boolean = false;
  requestLoading: boolean = true;
  assigned: boolean = false;
  HEADER_PRIORITY = HEADER_PRIORITY;
  HEADER_LOE = HEADER_LOE;
  HEADER_ASSIGNEE = HEADER_ASSIGNEE;
  isExternalUser: boolean = false;
  isInternalUser: boolean = false;
  maxDateFilter = new Date();
  minToDateFilter = new Date();
  sortByField: string = '';
  sortDirection: string = '';
  initialListIsEmpty: boolean = false;
  hasApiError: boolean = false;
  viewTaskRequest: boolean = false;
  editTaskRequest: boolean = false;

  private apiHelperService = inject(ApiHelperService);
  private configService = inject(ConfigService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private taskService = inject(TaskManagementService);
  private rolePermissionService = inject(RolePermissionService);
  private snackbarService = inject(SnackbarService);

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('fromDate') fromDate!: NgModel;
  @ViewChild('toDate') toDate!: NgModel;
  @ViewChild('createTaskDrawer') createTaskDrawer: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private router: Router, private dialog: MatDialog) {
    let today = new Date();
    today.setHours(23, 59, 9);
    this.maxDateFilter = today;
  }

  ngOnInit() {
    this.onInitPage();
    this.searchSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.filterConfiguration.searchText = value;
        this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
      });
    // this.updateTabCounts();
    this.isExternalUser = this.authService.isExternalUser;
    this.isInternalUser = this.authService.isInternalUser;
    this.setTableInfo();
  }

  ngAfterViewInit() {
    this.setTablePaginator();
    this.dataSource.sort = this.sort;
    setTimeout(() => {
      this.restoreSavedFilters();
    });
  }

  scrollTotop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0
    }
  }

  async restoreSavedFilters() {
    const filters = this.taskService.getTaskFilters();
    if (filters?.selectedTab) {
      this.selectedTab = filters.selectedTab;
      const idx = this.tabHeaderDetails.findIndex(t => t.key === filters.selectedTab);
      if (idx !== -1) this.selectedTabIndex = idx;
    }
    if (filters?.page) {
      this.pageNo = filters.page ?? this.pageNo;
      this.pageSize = filters.size ?? this.pageSize;
      if (this.paginator) this.paginator.pageIndex = filters.page - 1;
    }
    if (filters?.filterConfiguration) {
      await this.getFilterConfiguration()
      const saved = filters.filterConfiguration;
      const fc = this.filterConfiguration;
      const mapToListItems = (savedArr: any[], list: any[], matcher: (l: any, s: any) => boolean) => {
        if (!Array.isArray(savedArr) || !Array.isArray(list)) return [];
        return savedArr
          .map(s => list.find(l => matcher(l, s)))
          .filter(Boolean);
      };
      fc.selectedStatus = mapToListItems(saved.selectedStatus, fc.statusList, (l, s) =>
        (l.value && s.value && l.value === s.value) || (l.name && s.name && l.name === s.name)
      );
      fc.selectedChannel = mapToListItems(saved.selectedChannel, fc.channelList, (l, s) =>
        (l.value && s.value && l.value === s.value) || (l.name && s.name && l.name === s.name)
      );
      fc.selectedDataSubject = mapToListItems(saved.selectedDataSubject, fc.dataSubjectList, (l, s) =>
        l.id === s.id || (l.name && s.name && l.name === s.name)
      );
      // if ((fc.requestTypeList?.length ?? 0) === 0 && saved.selectedCountry?.id) {
      //   fc.tempSelectedCountry = fc.tempSelectedCountry || saved.selectedCountry;
      //   await this.getCoutryConfiguration();
      // }
      fc.selectedRequestType = mapToListItems(saved.selectedRequestType, fc.requestTypeList, (l, s) =>
        l.id === s.id || (l.name && s.name && l.name === s.name)
      );
      fc.selectedAssignedTo = mapToListItems(saved.selectedAssignedTo, fc.assignedToList, (l, s) =>
        (l.applicationUserId && s.applicationUserId && l.applicationUserId === s.applicationUserId) ||
        (l.id && s.id && l.id === s.id)
      );
      // fc.selectedCountry = (fc.countryList || []).find(c => c.id === saved.selectedCountry?.id) ?? null;
      fc.fromDate = saved.fromDate ?? fc.fromDate;
      fc.toDate = saved.toDate ?? fc.toDate;
      fc.tempFromDate = saved.fromDate ?? fc.fromDate;
      fc.tempToDate = saved.toDate ?? fc.toDate;

      fc.searchText = saved.searchText ?? fc.searchText;
      this.openSearchIfTextExists()
      this.resetTopFilters();
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection, true);
      setTimeout(() => this.taskService.clearTaskFilters(), 0);

      return;
    }
    this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection, true);
    setTimeout(() => this.taskService.clearTaskFilters());
  }



  openSearchIfTextExists() {
    if (this.filterConfiguration?.searchText?.trim()) {
      this.showSearch = true;

      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[placeholder="Search..."]'
        ) as HTMLInputElement;

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  onOpenCreateTaskDrawer() {
    if (this.createTaskDrawer) {
      this.createTaskDrawer.open();
    }
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  getPriorityTextColor(priority: string): string {
    return priorityTextColor(priority)
  }
  getStatusText(status: string): string {
    return formatStatus(status);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }



  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    // this.resetAllFilter();
    this.storeTabFilter();
    // this.setTableInfo();
    this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
    this.scrollTotop()
  }

  async onInitPage() {
    this.setUserPermissions();
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    await this.getFilterConfiguration();
    await this.getAssignerList()
  }

  setUserPermissions() {
    this.editTaskRequest = this.rolePermissionService.viewDsrTask || this.rolePermissionService.fullAccessDsrRequest;
    this.viewTaskRequest = this.rolePermissionService.viewDsrTask || this.rolePermissionService.fullAccessDsrRequest;
  }

  exportReport() { }

  searchFilter() {
    this.rightDrawer.open();
  }

  showSearch: boolean = false;

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.filterConfiguration.searchText = '';
    if (!this.showSearch) {
      this.prepareFilters();
    } else {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }
  }

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer();
  }

  async getFilterConfiguration() {
    const dsrConfiguration: DsrConfiguration = await this.configService.getDsrConfiguration();
    if (dsrConfiguration) {
      this.filterConfiguration = new FilterConfiguration({});
      this.filterConfiguration.statusList = statusList
      this.filterConfiguration.countryList = dsrConfiguration?.countryList ?? [];
      this.filterConfiguration.dataSubjectList = dsrConfiguration?.dataSubjectRequestUserTypeList ?? [];
      this.filterConfiguration.channelList = dsrConfiguration.channelList.map((channel, index) => ({ id: index + 1, name: channel, value: channel, selected: false, })
      );
      this.filterConfiguration.requestTypeList = [];
      await this.getAssignedToList()
    }
  }

  async resetAllFilter() {
    if (!this.filterApplied) {
      return;
    }
    await this.getFilterConfiguration();
    this.resetTopFilters();
    this.prepareFilters();
  }

  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected;
    if (filterKey == this.STATUS) {
      const index = this.filterConfiguration.tempSelectedStatus.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedStatus.push(value);
      } else {
        this.filterConfiguration.tempSelectedStatus.splice(index, 1);
      }
    } else if (filterKey == this.LOE) {
      const index = this.filterConfiguration.tempSelectedLevelofEfforts.findIndex(
        (v) => v.value === value.value
      );
      if (index === -1) {
        this.filterConfiguration.tempSelectedLevelofEfforts.push(value);
      } else {
        this.filterConfiguration.tempSelectedLevelofEfforts.splice(index, 1);
      }
    } else if (filterKey == this.PRIORITY) {
      const index = this.filterConfiguration.tempSelectedPriority.findIndex(
        (p) => p.value === value.value
      );

      if (index === -1) {
        this.filterConfiguration.tempSelectedPriority.push(value);
      } else {
        this.filterConfiguration.tempSelectedPriority.splice(index, 1);
      }
    } else if (filterKey == this.ASSIGNEE) {
      const index =
        this.filterConfiguration.tempSelectedAssigner.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedAssigner.push(value);
      } else {
        this.filterConfiguration.tempSelectedAssigner.splice(index, 1);
      }
    }
    else if (filterKey == this.DATA_SUBJECT_TYPE) {
      const index =
        this.filterConfiguration.tempSelectedDataSubject.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedDataSubject.push(value);
      } else {
        this.filterConfiguration.tempSelectedDataSubject.splice(index, 1);
      }
    } else if (filterKey == this.ASSIGNED_TO) {
      const index =
        this.filterConfiguration.tempSelectedAssignedTo.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedAssignedTo.push(value);
      } else {
        this.filterConfiguration.tempSelectedAssignedTo.splice(index, 1);
      }
    }
  }

  clearSelection(filterKey: 'status' | 'dataSubjectType' | 'assignedTo' | 'fromDate' | 'toDate' | 'priority' | 'loe' | 'assignee') {
    if (filterKey == 'status') {
      if (this.filterConfiguration.selectedStatus.length == 0) {
        return;
      }
      this.filterConfiguration.selectedStatus = [];
      this.resetTopFilters(this.STATUS);
    }
    if (filterKey == 'priority') {
      if (this.filterConfiguration.selectedPriority.length == 0) {
        return
      }
      this.filterConfiguration.selectedPriority = [];
      this.resetTopFilters(this.PRIORITY);
    }
    if (filterKey == 'loe') {
      if (this.filterConfiguration.selectedLOE.length == 0) {
        return
      }
      this.filterConfiguration.selectedLOE = [];
      this.resetTopFilters(this.LOE);
    }
    if (filterKey == "assignee") {
      if (this.filterConfiguration.selectedAsssignee.length == 0) {
        return
      }
      this.filterConfiguration.selectedAsssignee = []
      this.resetTopFilters(this.ASSIGNEE)
    }
    if (filterKey == 'dataSubjectType') {
      if (this.filterConfiguration.selectedDataSubject.length == 0) {
        return;
      }
      this.filterConfiguration.selectedDataSubject = [];
      this.resetTopFilters(this.DATA_SUBJECT_TYPE);
    }
    if (filterKey == 'assignedTo') {
      if (this.filterConfiguration.selectedAssignedTo.length == 0) {
        return;
      }
      this.filterConfiguration.selectedAssignedTo = [];
      this.resetTopFilters(this.ASSIGNED_TO);
    }
    if (filterKey == 'fromDate') {
      this.filterConfiguration.fromDate = '';
      this.filterConfiguration.tempFromDate = '';
    }
    if (filterKey == 'toDate') {
      this.filterConfiguration.toDate = '';
      this.filterConfiguration.tempToDate = '';
    }
    this.prepareFilters();
  }

  get selectedStatus() {
    return this.filterConfiguration.selectedStatus?.length ?? 0;
  }

  get selectedLOE() {
    return this.filterConfiguration.selectedLOE?.length ?? 0;
  }

  get selectedPriority() {
    return this.filterConfiguration.selectedPriority?.length ?? 0;
  }

  get selectedAssignee() {
    return this.filterConfiguration.selectedAsssignee?.length ?? 0;
  }

  get selectedAssignedTo() {
    return this.filterConfiguration.selectedAssignedTo?.length ?? 0;
  }

  syncTempDate(type: 'from' | 'to') {
    if (type === 'from') {
      this.filterConfiguration.tempFromDate = this.filterConfiguration.fromDate;
    } else {
      this.filterConfiguration.tempToDate = this.filterConfiguration.toDate;
    }
  }

  applyFilterFromDrawer() {
    this.filterConfiguration.selectedStatus = [
      ...this.filterConfiguration.tempSelectedStatus,
    ];
    this.filterConfiguration.selectedAssignedTo = [
      ...this.filterConfiguration.tempSelectedAssignedTo,
    ];

    this.filterConfiguration.selectedAsssignee = [
      ...this.filterConfiguration.tempSelectedAssigner
    ]
    this.filterConfiguration.selectedCountry =
      this.filterConfiguration.tempSelectedCountry;
    this.filterConfiguration.selectedCountry =
      this.filterConfiguration.tempSelectedCountry;
    this.filterConfiguration.selectedPriority =
      this.filterConfiguration.tempSelectedPriority;
    this.filterConfiguration.selectedLOE =
      this.filterConfiguration.tempSelectedLevelofEfforts;
    this.resetTopFilters();
    this.prepareFilters();
  }

  applyDateFilter(menuTrigger: MatMenuTrigger) {
    this.filterConfiguration.fromDate = this.filterConfiguration.tempFromDate;
    this.filterConfiguration.toDate = this.filterConfiguration.tempToDate;

    if (this.filterConfiguration.fromDate) {
      let minToDate = new Date(this.filterConfiguration.fromDate);
      minToDate.setHours(0, 0, 0);
      this.minToDateFilter = minToDate;
    }

    this.prepareFilters();
    menuTrigger.closeMenu();
  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == this.STATUS) {
      this.filterConfiguration.selectedStatus = [
        ...this.filterConfiguration.tempSelectedStatus,
      ];
    } else if (type == this.LOE) {
      this.filterConfiguration.selectedLOE = [
        ...this.filterConfiguration.tempSelectedLevelofEfforts,
      ];
    } else if (type == this.PRIORITY) {
      this.filterConfiguration.selectedPriority = [
        ...this.filterConfiguration.tempSelectedPriority,
      ];
    } else if (type == this.ASSIGNEE) {
      this.filterConfiguration.selectedAsssignee = [
        ...this.filterConfiguration.tempSelectedAssigner
      ]
    } else if (type == this.ASSIGNED_TO) {
      this.filterConfiguration.selectedAssignedTo = [
        ...this.filterConfiguration.tempSelectedAssignedTo,
      ];
    }

    if (menuTrigger) {
      menuTrigger.closeMenu();
    }
    this.prepareFilters();
  }

  // async onClickName(request: any) {
  //   if (request.loading) {
  //     return;
  //   }

  //   let details: any = null;
  //   let viewType: string = this.SEGMENT_TASK;
  //   let description: string = '';
  //   request.loading = true;

  //   try {
  //     if (this.selectedSegment === this.SEGMENT_TASK) {
  //       details = await this.apiHelperService.getTaskDetails(request.taskId);
  //       viewType = this.SEGMENT_TASK;
  //       description = details?.taskDetails?.description || details?.description || '';
  //     }
  //     else if (this.selectedSegment === this.SEGMENT_CLARIFICATION) {
  //       details = await this.apiHelperService.getClarificationDetails(request.clarificationId);
  //       viewType = this.SEGMENT_CLARIFICATION;
  //       description = details?.clarificationDetails?.description || details?.description || '';
  //     }

  //     if (details) {
  //       this.dialog.open(TaskManagementDialogComponent, {
  //         width: '75%',
  //         panelClass: 'dialog-wrapper',
  //         data: {
  //           dsrDetails: details.dsrDetails || details,
  //           documents: details.documents || [],
  //           taskDetails: details.taskDetails || details,
  //           title: request.taskTitle || request.clarificationTitle,
  //           taskId: request.taskId,
  //           clarificationId: request.clarificationId,
  //           viewType,
  //           description: description
  //         }
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error loading task details:', error);
  //   } finally {
  //     request.loading = false;
  //   }
  // }
  async onClickName(request: any) {
    if (request.loading) {
      return;
    }
    this.storeTabFilter()

    const taskId = request.taskId || request.clarificationId;
    if (taskId) {
      this.router.navigate([
        `${this.currentPath}/${routeConstants.TASK_MANAGEMENT_DETAILS}/${taskId}`,
      ]);
    }
  }

  async setTableInfo() {
    if (!this.selectedSegment) {
      this.selectedSegment = this.SEGMENT_TASK;
    }

    this.tableHeaders =
      this.selectedSegment === this.SEGMENT_CLARIFICATION
        ? CLARIFICATION_MANAGEMENT_HEADER
        : TASK_MANAGEMENT_HEADER.map(h => ({ ...h }));
    if (this.authService.isInternalUser || this.authService.isExternalUser) {
      const assigneeHeader = this.tableHeaders.find(
        (h: { columnDef: string; }) => h.columnDef === 'assigneeToUserName'
      );

      if (assigneeHeader) {
        assigneeHeader.headerName = 'Assignor';
      }
    }

    this.displayedHeaders = this.tableHeaders.map((h: { columnDef: any; }) => h.columnDef);
    this.dataSource = new MatTableDataSource<RequestTask>();
    this.setTablePaginator();
  }


  async filterBySegment(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = '', sortDirection: string = '', onInit: boolean = false): Promise<void> {
    if (this.selectedSegment === this.SEGMENT_TASK) {
      await this.getTaskList(pageNo, filters, sortBy, sortDirection, onInit);
    } else if (this.selectedSegment === this.SEGMENT_CLARIFICATION) {
      // this.getClarificationList(pageNo, filters);
    }
  }


  async deleteTask(task: RequestTask): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        type: 'confirmation',
        title: 'Confirm Task Deletion',
        content: 'Are you sure you want to delete this task?',
        confirmationDetail: task.title || `Task ${task.taskId}`,
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
        const res = await firstValueFrom(this.apiHelperService.deleteTask(task.taskId));
        if (res) {
          this.restoreSavedFilters()
        }

      } catch (error) {

        console.error('Error:', error);
      }
    });
  }



  async getTaskList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = this.sortByField, sortDirection: string = this.sortDirection, onInit: boolean = false) {
    const tabStatusFilters = this.getTabStatus();


    let params: any = {
      page: pageNo,
      size: this.pageSize,
      ...tabStatusFilters,
    };

    if (this.authService.isExternalUser || this.authService.isInternalUser) {
      params.assigned = true;
    }
    // else if (this.authService.isAdminUser()) {
    //    params.assigned = this.assigned; //https://devappsys.atlassian.net/browse/VAL-327
    // }

    if (filters) {
      params = { ...params, ...filters };
    }

    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }

    try {
      this.hasApiError = false;
      this.requestLoading = true;
      const res = await this.apiHelperService.getTaskList(params);
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo;

      if (res) {
        this.requestLoading = false;
        const taskList = res.taskListings;
        const taskManagementTaskList = Array.isArray(taskList) ? convertTaskFlatToNestedList(taskList) : [];
        this.requestTaskList = taskManagementTaskList ?? [];
        this.dataSource = new MatTableDataSource(taskManagementTaskList);
        this.filteredDataSource = taskManagementTaskList
        this.paginator.length = Number(res?.totalFilteredItemsCount ?? 0);
        this.paginator.pageIndex = this.pageNo - 1;
        this.paginator.pageSize = this.pageSize;
        this.setRequestTabCount(res, params);
        if (pageNo == FIRST_PAGE) {
          //   this.setRequestTabCount(res, params);
          //   if (this.paginator) {
          //     this.paginator.firstPage();
          //   }
          if (!this.initialListIsEmpty) {
            if (onInit && (!Object.keys(filters)?.length) && (!this.requestTaskList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
    } catch (error) {
      this.requestLoading = false;
      console.error('Error loading task list:', error);
      this.hasApiError = true
    }
    finally {
      setTimeout(() => {
        this.requestLoading = false;
        this.isLoading = false
      }, 1000);
      this.filterConfiguration.priorityOptions = PRIORITY_OPTIONS;
      this.filterConfiguration.effortlevels = EFFORT_LEVELS;
    }
  }


  toggleAssignedSwitch(event: any) {

    if (this.authService.isAdminUser) {
      this.assigned = event.checked;
      this.getTaskList();
    } else {

      event.source.checked = true;
      this.assigned = true;
    }
  }

  async getClarificationList(pageNo: number = FIRST_PAGE, filters: any = null) {
    //not using this getClarificationList function

    const tabStatusFilters = this.getTabStatus();
    let params = {
      page: pageNo,
      size: this.pageSize,
      ...tabStatusFilters,
    };

    if (filters) params = { ...params, ...filters };

    const res = await this.apiHelperService.getClarificationList(params);
    this.pageNo = pageNo;
    if (res) {
      this.requestTaskList = res.taskManagementClarificationList ?? [];
      this.dataSource.data = this.requestTaskList;
      if (pageNo === FIRST_PAGE) {
        this.totalItems = +(res?.totalCount ?? 0);
        this.tabHeaderDetails[0].count = this.totalItems;
      }
    }
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageSize = event.pageSize ?? this.pageSize;
      this.pageNo = event.pageIndex + 1;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
      this.scrollTotop()
    }
  }
  stopDefaultBehaviour(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onCloseMenu(type: string) {
    this.resetTopFilters(type);
  }

  resetTopFilters(type: string = '') {
    if (type == this.STATUS || !type) {
      this.filterConfiguration.tempSelectedStatus = [
        ...this.filterConfiguration.selectedStatus,
      ];
      this.filterConfiguration.statusList.map((status) => {
        let checked =
          this.filterConfiguration.tempSelectedStatus.includes(status);
        status.selected = checked;
      });
    }

    if (type == this.LOE || !type) {
      this.filterConfiguration.tempSelectedLevelofEfforts = [
        ...this.filterConfiguration.selectedLOE,
      ];

      this.filterConfiguration.effortlevels.map((loe) => {
        loe.selected =
          this.filterConfiguration.tempSelectedLevelofEfforts.some(
            (s) => s.value === loe.value
          );
      });
    }

    if (type == this.PRIORITY || !type) {
      this.filterConfiguration.tempSelectedPriority = [
        ...this.filterConfiguration.selectedPriority,
      ];

      this.filterConfiguration.priorityOptions.map((priority) => {
        priority.selected =
          this.filterConfiguration.tempSelectedPriority.some(
            (p) => p.value === priority.value
          );
      });
    }

    if (type == this.ASSIGNEE || !type) {
      this.filterConfiguration.tempSelectedAssigner = [
        ...this.filterConfiguration.selectedAsssignee,
      ];

      this.filterConfiguration.assignerList.map((assigner) => {
        let checked =
          this.filterConfiguration.tempSelectedAssigner.includes(assigner);
        assigner.selected = checked;
      });
    }

    if (type == this.DATA_SUBJECT_TYPE || !type) {
      this.filterConfiguration.tempSelectedDataSubject = [
        ...this.filterConfiguration.selectedDataSubject,
      ];
      this.filterConfiguration.dataSubjectList.map((ds) => {
        let checked =
          this.filterConfiguration.tempSelectedDataSubject.includes(ds);
        ds.selected = checked;
      });
    }
    if (type == this.ASSIGNED_TO || !type) {
      this.filterConfiguration.tempSelectedAssignedTo = [
        ...this.filterConfiguration.selectedAssignedTo,
      ];
      this.filterConfiguration.assignedToList.map((assignedTo) => {
        let checked =
          this.filterConfiguration.tempSelectedAssignedTo.includes(assignedTo);
        assignedTo.selected = checked;
      });
    }
  }

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {};

    if (this.filterConfiguration.selectedStatus?.length) {
      filters['status'] = this.filterConfiguration.selectedStatus.map(
        (status) => status.value
      );
    }
    if (this.filterConfiguration.selectedAssignedTo?.length) {
      filters['assigneeId'] = this.filterConfiguration.selectedAssignedTo.map(
        (assigneeTo) => assigneeTo.applicationUserId
      );
    }
    if (this.filterConfiguration.selectedAsssignee?.length) {
      filters['assignerId'] = this.filterConfiguration.selectedAsssignee.map(
        (assignee) => assignee.applicationUserId
      )
    }
    if (this.filterConfiguration.fromDate) {
      filters['fromDate'] = moment(this.filterConfiguration.fromDate).format(
        'DD-MM-YYYY'
      );
    }
    if (this.filterConfiguration.toDate) {
      filters['toDate'] = moment(this.filterConfiguration.toDate).format(
        'DD-MM-YYYY'
      );
    }
    if (this.filterConfiguration.selectedPriority?.length) {
      filters['priority'] = this.filterConfiguration.selectedPriority.map(
        (priority: any) => priority.value
      );
    }
    if (this.filterConfiguration.selectedLOE?.length) {
      filters['levelOfEffort'] = this.filterConfiguration.selectedLOE.map(
        (loe: any) => loe.value
      )
    };
    if (this.filterConfiguration.searchText) {
      filters['searchQuery'] = this.filterConfiguration.searchText.trim();
    }

    this.filterApplied = true;
    if (this.selectedTab !== this.ALL) {
      if (filters.status) {
        delete filters.status;
      }
    }
    if (!Object.keys(filters).length || this.filterConfiguration.searchText) {
      this.filterApplied = false;
    }
    this.filterBySegment(pageNo, filters, sortBy, sortDirection, onInit);
  }
  get showStatusFilter() {
    return this.filterConfiguration.statusList?.length;
  }

  get showLOEfilter() {
    return this.filterConfiguration.effortlevels?.length;
  }

  get showPriorityfilter() {
    return this.filterConfiguration.priorityOptions?.length;
  }

  get showAssigneefilter() {
    return this.filterConfiguration.assignerList?.length;
  }

  get showDataSubjectTypeFilter() {
    return this.filterConfiguration.dataSubjectList?.length;
  }

  get showAssignedTo() {
    return this.filterConfiguration.assignedToList?.length;
  }

  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = 'Rows per page:';
  }

  getTabStatus() {
    if (this.selectedTab == PRIORITY) {
      return { priority: true };
    }
    if (this.selectedTab == OPEN) {
      return { status: OPEN };
    }
    return;
  }

  get allTabSelected(): boolean {
    return this.selectedTab === ALL
  }

  setRequestTabCount(res: any, params: any) {
    let totalItems = 0;
    this.tabHeaderDetails.map((tabHeader, index) => {
      // if (tabHeader.key == DRAFTS) {
      //   totalItems = +(res?.draftItemsCount ?? 0);
      //   this.tabHeaderDetails[index].count = totalItems;

      //   if (this.selectedTab == DRAFTS) {
      //     this.totalItems = +(totalItems);
      //   }
      // }
      if (tabHeader.key == PRIORITY) {
        if (this.selectedTab == PRIORITY) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.priorityItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      } else if (tabHeader.key == OPEN) {
        if (this.selectedTab == OPEN) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.openItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      } else {
        if (this.allTabSelected) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      this.totalItems = +totalItems;
    });
    const searchVal = this.filterConfiguration.searchText?.trim() || '';
    this.storeRequestFilter({ ...params, searchQuery: searchVal, searchText: searchVal })
  }

  storeRequestFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.taskService.storeTaskFilter(filterData);
  }

  storeTabFilter() {
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab };
    this.taskService.storeTaskFilter(filterData)
  }

  get showRequestList() {
    return this.requestTaskList?.length || this.pageNo > 1;
  }

  get isEmptyRequest() {
    return this.requestTaskList?.length ? false : true
  }

  openCreateSubTaskDialog(task: RequestTask | null = null) {
    const parentTaskId = task?.parentTaskId
      ? task.parentTaskId
      : task?.taskId ?? 0;
    const dialogTitle = task?.parentTaskId
      ? 'Task etails'
      : 'Sub task will be created for Organization';
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        task: task?.parentTaskId ? { ...task } : null,
        dialogTitle: dialogTitle,
        parentTaskId: parentTaskId,
        dialogType: RequestDialogTypes.TASK_MANAGEMENT_TASK,
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.taskUpdated) {
        this.filterBySegment(FIRST_PAGE);
      }
    });
  }

  async deleteSubTaskDetails(task: RequestTask) {
    const isConfirmed = await firstValueFrom(
      this.dialogService.openConfirmDialog({
        title: 'Delete confirmation',
        message: `Do you continue with this delete actions?`,
        cancelText: 'Cancel',
        confirmText: 'Continue',
      })
    );
    if (!isConfirmed) {
      return;
    }
    this.apiHelperService
      .deleteSubTaskDetails(task.parentTaskId, task.taskId)
      .subscribe({
        next: async (res) => {
          this.filterBySegment(FIRST_PAGE);
        },
        error: (e: Error) => {
          console.error(e.message);
        },
      });
  }

  hasSubTasks(index: number, row: any): boolean {
    return !row.parentTaskId && row.subTasks?.length > 0;
  }

  viewTaskDetail(request: RequestTask) {
    if (!this.viewTaskRequest) {
      this.snackbarService.openSnack("You do not have permission to view this task request.")
      return
    }
    this.setCurrentTaskList()
    const taskId = request.taskId;
    this.router.navigate([
      `${this.currentPath}/${routeConstants.TASK_MANAGEMENT_DETAILS}/${taskId}`,
    ]);
  }

  getPriority(priority: string): string {
    return formatPriority(priority);
  }

  getPriorityIcon(priority: string): string {
    return getPriorityIcon(priority)
  }

  getAssigneeName(task: any): string {
    if (this.isExternalUser || this.isInternalUser) {
      return (task?.createdByUserName ?? '');
    }
    return (task?.assigneeToUserName ?? '');
  }

  getEffortLevel(effortLevel: string): string {
    return formatEffortLevel(effortLevel);
  }

  onSearchChange() {
    const value = this.filterConfiguration.searchText.trimStart();
    this.searchSubject.next(value);
  }

  clearSearch() {
    if (!this.filterConfiguration.searchText) return;

    this.filterConfiguration.searchText = '';
    this.searchSubject.next('');
  }

  async getAssignedToList() {
    let assignedToList = [];
    assignedToList = await this.userService.getAllUserMasterList()
    this.filterConfiguration.assignedToList = assignedToList;
    return assignedToList
  }

  async getAssignerList() {
    if (this.authService.isExternalUser || this.authService.isInternalUser) {
      let assignedToList = await this.userService.getAdminUserMasterList(true);
      this.filterConfiguration.assignerList = (assignedToList ?? []);
      return assignedToList
    }
    return []
  }

  getDisplayName(assignedTo: User) {
    return `${assignedTo.displayName ? (assignedTo.displayName) : `${assignedTo.firstName ? `${assignedTo.firstName} ${assignedTo.lastName ?? ''}` : `${assignedTo.email ?? ''}`}`}`
  }

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    if (backendField) {
      this.sortByField = backendField;
      this.sortDirection = event.direction;
      this.prepareFilters(this.FIRST_PAGE, backendField, event.direction);
    }
  }

  private sortFieldMapping: any = {
    taskId: 'id',
    title: 'title',
    description: 'description',
    dueDate: 'dueDate',
    status: 'status',
    levelOfEffort: 'levelOfEffort',
    priority: 'priority',
    createdOn: 'createdAt',
    taskType: 'taskType'
  };

  get showAssignedToFilter(): boolean {
    return (!this.authService.isExternalUser && !this.authService.isInternalUser)
  }

  setCurrentTaskList() {
    let reqRidList: any = [];
    this.filteredDataSource.map((item) => {
      reqRidList.push({ 'id': item.taskId, 'name': item.title })
    })
    this.taskService.setTaskRequestRid(reqRidList);
  }

  // get errorTitle() {
  //   return (this.filterConfiguration.searchText && (!this.requestTaskList?.length)
  //       ? `No results match your search criteria`
  //       : `This body copy explains the empty state`)
  // }

  get errorTitle() {
    return this.filterConfiguration.searchText ? 'No tasks match your search criteria' :
      this.filterApplied
        ? `No tasks match the selected view`
        : `No tasks have been assigned yet`
  }

  get tableColumnCount() {
    return TASK_MANAGEMENT_HEADER?.length
  }
}
