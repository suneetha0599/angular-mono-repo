import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule, PageEvent, } from '@angular/material/paginator';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import {
  ALL, DRAFTS, FIRST_PAGE, HEADER_DATE, HEADER_NAME, HEADER_ACTION, HEADER_STATUS, OPEN, PAGE_SIZE,
  PRIORITY, REQUEST_MANAGEMENT_HEADER, RequestDialogTypes, HEADER_REQUEST_TYPE, HEADER_THROUGH, WEB_FORM,
  dsrRequestTypes,
  RequestFilterKey,
} from './constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { displayStatusText, requestLockMessage, statusColors, statusTextColors } from './request-utils';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { DsrDrawerContentComponent } from './dsr-drawer-content/dsr-drawer-content.component';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { ConfigService } from '@admin-core/services/config.service';
import { DsrConfiguration } from '@admin-core/models/DsrConfiguration';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import moment from 'moment';
import { ItemNotFoundComponent } from '@valura-lib/components/item-not-found/item-not-found.component';
import { DsrRequest } from '@admin-core/models/request-management/DsrRequest';
import { AssigneeSelectionDialogComponent } from './request-management-dialog/assignee-priority-selection-dialog/assignee-selection-dialog.component';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon } from '@angular/material/datepicker';
import { FormsModule, NgModel } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, } from '@angular/material/core';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { User } from '@admin-core/models/user.model';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTooltip } from '@angular/material/tooltip';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { UserService } from '@admin-core/services/user/user.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { CountryService } from '@admin-core/services/country/country.service';
import { NGXLogger } from 'ngx-logger';
import { LogClickDirective } from '@valura-lib/directives/log-click/log-click.directive';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';

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
  selector: 'app-request-management',
  imports: [CommonModule, MatButtonModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatTabsModule, MatIconModule, MatSortModule, MatCheckboxModule, MatPaginatorModule, MatMenuModule, LogClickDirective,
    LoadingButtonComponent, MatSidenavModule, DsrDrawerContentComponent, ItemNotFoundComponent, FormsModule, MatDatepicker, MatDatepickerInput, MatInput, MatDatepickerToggle, MatDatepickerToggleIcon, NgModelDebounceChangeDirective,
    MatTooltipModule, MatTooltip, EllipsisTooltipDirective, ErrorLoadingItemsComponent],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }],
  templateUrl: './request-management.component.html',
  styleUrl: './request-management.component.scss',
})
export class RequestManagementComponent {
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME;
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE;
  HEADER_ACTION = HEADER_ACTION;
  HEADER_REQUEST_TYPE = HEADER_REQUEST_TYPE;
  HEADER_THROUGH = HEADER_THROUGH

  ALL = ALL;
  pageSize: number = PAGE_SIZE;
  FIRST_PAGE = FIRST_PAGE;
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE;
  selectedTab: string = ALL;
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>();
  requestManagementList: DsrRequest[] = [];
  filteredDataSource: DsrRequest[] = [];
  selectedTabIndex = 0;
  isClearingAll = false;
  filterConfiguration: FilterConfiguration = new FilterConfiguration({});
  drawerView: 'FILTER' | 'EXPORT' = 'FILTER';
  RequestFilterKey = RequestFilterKey;
  tabHeaderDetails = [
    { name: 'All Requests', count: 0, key: ALL },
    { name: 'Priority', count: 0, key: PRIORITY },
    { name: 'Open', count: 0, key: OPEN },
    { name: 'Drafts', count: 0, key: DRAFTS },
  ];
  filterApplied: boolean = false;
  requestLoading: boolean = true;
  RequestDialogTypes = RequestDialogTypes;
  shimmerDataSource = Array(4).fill({});
  isDownloadInProgress = false;
  createDsrRequest: boolean = false;
  editDsrRequest: boolean = false;
  viewDsrFeature: boolean = false;
  dsrExport: boolean = false;
  selectedExportColumns: string[] = [];
  initialListIsEmpty: boolean = false;
  private searchSubject = new Subject<string>();
  maxDateFilter = new Date();
  minToDateFilter = new Date();
  sortByField: string = '';
  sortDirection: string = '';
  showSearch: boolean = false;
  hasApiError: boolean = false;

  private apiHelperService = inject(ApiHelperService);
  private configService = inject(ConfigService);
  private requestManagementService = inject(RequestManagementService);
  private userService = inject(UserService);
  private countryService = inject(CountryService);
  private logger = inject(NGXLogger)
  private snackbarService = inject(SnackbarService)
  private configApiHelperService = inject(ConfigApiHelperService);
  private rightService = inject(RegulationsService)
  private rolePermissionService = inject(RolePermissionService);

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('fromDate') fromDate!: NgModel;
  @ViewChild('toDate') toDate!: NgModel;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private router: Router, private dialog: MatDialog) {
    let today = new Date();
    today.setHours(23, 59, 9);
    this.maxDateFilter = today;
  }


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

  ngOnInit() {
    this.logger.info("Request Listing Component Initialised")
    this.requestManagementService.removePrevOrNextNodeData()
    this.onInitPage();
    // this.updateTabCounts();
    this.searchSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.filterConfiguration.searchText = value;
        this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
      });
    this.setTableInfo();
    this.filterConfiguration.tempFromDate = this.filterConfiguration.fromDate;
    this.filterConfiguration.tempToDate = this.filterConfiguration.toDate;
  }

  ngAfterViewInit() {
    this.setTablePaginator();
    this.dataSource.sort = this.sort;
    setTimeout(async () => {
      await this.getFilterConfiguration()
      await this.restoreSavedFilters();
    });
  }

  async restoreSavedFilters() {
    const filters = this.requestManagementService.getRequestListingFilter();
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
      fc.selectedThrough = mapToListItems(saved.selectedThrough, fc.through, (l, s) =>
        (l.value && s.value && l.value === s.value) || (l.name && s.name && l.name === s.name)
      );
      fc.selectedChannel = mapToListItems(saved.selectedChannel, fc.channelList, (l, s) =>
        (l.value && s.value && l.value === s.value) || (l.name && s.name && l.name === s.name)
      );
      fc.selectedDataSubject = mapToListItems(saved.selectedDataSubject, fc.dataSubjectList, (l, s) =>
        l.id === s.id || (l.name && s.name && l.name === s.name)
      );
      fc.selectedCountry = mapToListItems(saved.selectedCountry, fc.countryList, (l, s) =>
        l.id === s.id || (l.name && s.name && l.name === s.name)
      );
      if ((fc.requestTypeList?.length ?? 0) === 0 && saved.selectedCountry?.length) {
        fc.tempSelectedCountry = fc.tempSelectedCountry || saved.selectedCountry;
        await this.getCoutryConfiguration();
      }
      fc.selectedRequestType = mapToListItems(saved.selectedRequestType, fc.requestTypeList, (l, s) =>
        l.id === s.id || (l.name && s.name && l.name === s.name)
      );
      fc.selectedAssignedTo = mapToListItems(saved.selectedAssignedTo, fc.assignedToList, (l, s) =>
        (l.applicationUserId && s.applicationUserId && l.applicationUserId === s.applicationUserId) ||
        (l.id && s.id && l.id === s.id)
      );

      fc.fromDate = saved.fromDate ?? fc.fromDate;
      fc.toDate = saved.toDate ?? fc.toDate;
      fc.tempFromDate = saved.fromDate ?? fc.fromDate;
      fc.tempToDate = saved.toDate ?? fc.toDate

      fc.searchText = saved.searchText ?? fc.searchText;
      this.openSearchIfTextExists();
      this.resetTopFilters();
      this.dataSource = new MatTableDataSource<DsrRequest>();
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection, false, true);
      setTimeout(() => this.requestManagementService.clearRequestFilters(), 0);

      return;
    }
    this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
    setTimeout(() => this.requestManagementService.clearRequestFilters());
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

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  getStatusText(status: string): string {
    return displayStatusText(status);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
    this.scrollToTop()
  }

  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }
  formatText(value: string): string {
    if (!value) return '';

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }


  onInitPage() {
    this.setUserPermissions()
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.getFilterConfiguration();
    // this.requestManagementService.clearRequestFilters()
  }

  getRequesterName(request: DsrRequest) {
    return `${request.firstName} ${request.lastName ? request.lastName : ''}`
  }

  onClickName(request: DsrRequest) {
    const requestId = request.id;
    this.setCurrentRequestList();
    this.storeTabFilter();
    this.requestManagementService.deleteRequestStage();
    if (this.selectedTab == DRAFTS) {
      if (!this.editDsrRequest) {
        this.snackbarService.openSnack("You do not have permission to edit this request.")
        return
      }
      this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`], { queryParams: { requestRid: requestId }, });
      return;
    }
    if (!this.viewDsrFeature) {
      this.snackbarService.openSnack("You do not have permission to view this request.")
      return
    }
    this.router.navigate([
      `${this.currentPath}/${routeConstants.REQUEST_MANAGEMENT_DETAILS}/${requestId}`,
    ]);
  }

  onCreateRequest() {
    this.storeTabFilter()
    this.router.navigate([
      `${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`,
    ]);
  }

  async setTableInfo() {
    this.tableHeaders = REQUEST_MANAGEMENT_HEADER;

    this.dataSource = new MatTableDataSource<DsrRequest>();
    // const hasFilter = this.requestManagementService.getRequestFilter();
    // if (!hasFilter) {
    //   await this.getDsrRequestsList();
    // }
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
  }

  openAssigneeSelectionDialog(request: DsrRequest, dialogType: string): void {
    const currentAssigneeId = request.assignedToId ?? 0;
    const currentPriority = request?.priority || '';
    const displayName = this.getRequesterName(request);

    const dialogRef = this.dialog.open(AssigneeSelectionDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        requestRid: request.id,
        currentAssigneeId: currentAssigneeId,
        currentPriority: currentPriority,
        requestTitle: displayName || `Request ${request.id}`,
        dialogType,
      },
      height: 'fit-content',
      width: '450px',
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.assigneeUpdated || result?.priorityUpdated) {
        this.refreshCurrentPageData();
      }
    });
  }

  private refreshCurrentPageData(): void {
    this.prepareFilters();
  }

  async getDsrRequestsList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = this.sortByField, sortDirection: string = this.sortDirection, onInit: boolean = false) {
    const tabStatusFilters = this.getTabStatus();
    let params: any = {
      page: pageNo,
      size: this.pageSize,
      ...tabStatusFilters,
    };

    if (filters) {
      params = { ...params, ...filters };
    }

    //sorting
    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }
    this.requestLoading = true;
    this.hasApiError = false;
    try {
      const res = await this.apiHelperService.getDsrRequestsList(params);
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo;
      if (res) {
        this.requestManagementList = res?.dsrRequestListings
          ? await Promise.all(
            res.dsrRequestListings.map(async (item: { assignedToId: number; requestRightId: number }) => ({
              ...item,
              requestRightId: (await this.rightService.getRightById(item.requestRightId))?.rightTitleSimplified,
              assignedToId: (await this.userService.getUserById(item.assignedToId))?.displayName
            }))
          )
          : [];

        this.dataSource = new MatTableDataSource(this.requestManagementList);
        this.paginator.length = Number(res?.totalFilteredItemsCount ?? 0);
        this.paginator.pageIndex = this.pageNo - 1;
        this.paginator.pageSize = this.pageSize;
        this.filteredDataSource = this.requestManagementList;
        this.setRequestTabCount(res, params);
        if (pageNo == FIRST_PAGE) {
          //   this.setRequestTabCount(res, params);
          //   if (this.paginator) {
          //     this.paginator.firstPage();
          //   }
          if (!this.initialListIsEmpty) {
            if (onInit && (!Object.keys(filters)?.length) && (!this.requestManagementList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
    } catch (error) {
      this.hasApiError = true
    } finally {
      this.requestLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
      this.scrollToTop()
    }
  }


  exportReport() {
    this.drawerView = 'EXPORT';
    this.rightDrawer.open();
  }

  onDownloadApply(event: any) {
    this.rightDrawer.close();

    this.selectedExportColumns = [];

    if (event.type === 'CUSTOM') {
      this.selectedExportColumns = event.columns;
    }

    this.prepareFilters(FIRST_PAGE, '', '', true, false);
  }


  async getDownload(filters: any = null) {
    const tabStatusFilters = this.getTabStatus();

    const { columns, ...restFilters } = filters || {};

    let params: any = {
      ...tabStatusFilters,
      ...restFilters
    };

    const isDefault = !columns || columns.length === 0;
    const body = {
      columns: isDefault ? [] : columns,
      isDefault
    };

    const res = await this.apiHelperService.getDownloadResponse(params, body);

    if (res) {
      this.snackbarService.openSnack('The export has been initiated.');
      this.isDownloadInProgress = false;
    }
  }


  searchFilter() {
    this.drawerView = 'FILTER';
    this.rightDrawer.open();
  }


  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer();
  }

  async getFilterConfiguration() {
    const dsrConfiguration: DsrConfiguration = await this.configService.getDsrConfiguration();
    if (dsrConfiguration) {
      this.filterConfiguration ??= new FilterConfiguration({});
      dsrConfiguration.channelList.push(WEB_FORM);
      this.filterConfiguration.channelList = dsrConfiguration.channelList.map((channel, index) => ({ id: index + 1, name: channel, value: channel, selected: false, disabled: false, }));
      this.filterConfiguration.statusList = (dsrConfiguration.dsrFormStatusConstants ?? []).map((status, index) => ({ id: index + 1, name: status.label, value: status.value, selected: false, disabled: false, }));
      this.filterConfiguration.countryList = (await this.countryService.getCountryMasterList()) ?? [];
      this.filterConfiguration.filteredCountryList = this.filterConfiguration.countryList;
      this.filterConfiguration.dataSubjectList = dsrConfiguration?.dataSubjectRequestUserTypeList ?? [];
      this.filterConfiguration.through = dsrRequestTypes.map((_thourgh, index) => ({ id: index + 1, name: _thourgh.name, value: _thourgh.key, selected: false, disabled: false, }));

      this.filterConfiguration.requestTypeList = [];
      this.filterConfiguration.assignedToList = (await this.userService.getAdminUserMasterList()) ?? [];
    }
  }


  resetAllFilter() {
    if (!this.filterApplied) return;
    this.isClearingAll = true;
    this.filterApplied = false;
    // this.getFilterConfiguration();
    // this.resetTopFilters();
    // this.prepareFilters();

    this.filterConfiguration.selectedStatus = [];
    this.filterConfiguration.selectedThrough = [];
    this.filterConfiguration.selectedChannel = [];
    this.filterConfiguration.selectedDataSubject = [];
    this.filterConfiguration.selectedAssignedTo = [];
    this.filterConfiguration.selectedRequestType = [];
    this.filterConfiguration.selectedCountry = [];
    this.filterConfiguration.fromDate = '';
    this.filterConfiguration.toDate = '';
    this.filterConfiguration.tempSelectedStatus = [];
    this.filterConfiguration.tempSelectedThrough = [];
    this.filterConfiguration.tempSelectedChannel = [];
    this.filterConfiguration.tempSelectedDataSubject = [];
    this.filterConfiguration.tempSelectedAssignedTo = [];
    this.filterConfiguration.tempSelectedRequestType = [];
    this.filterConfiguration.tempSelectedCountry = [];
    this.filterConfiguration.tempFromDate = '';
    this.filterConfiguration.tempToDate = '';
    this.resetTopFilters('');
    this.prepareFilters(this.FIRST_PAGE);
    this.requestManagementService.clearRequestFilters();
  }


  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected;
    if (filterKey == RequestFilterKey.STATUS) {
      const index = this.filterConfiguration.tempSelectedStatus.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedStatus.push(value);
      } else {
        this.filterConfiguration.tempSelectedStatus.splice(index, 1);
      }
    }
    else if (filterKey == RequestFilterKey.DATA_SUBJECT_TYPE) {
      const index =
        this.filterConfiguration.tempSelectedDataSubject.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedDataSubject.push(value);
      } else {
        this.filterConfiguration.tempSelectedDataSubject.splice(index, 1);
      }
    }
    else if (filterKey == RequestFilterKey.ASSIGNED_TO) {
      const index =
        this.filterConfiguration.tempSelectedAssignedTo.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedAssignedTo.push(value);
      } else {
        this.filterConfiguration.tempSelectedAssignedTo.splice(index, 1);
      }
    }
    else if (filterKey == RequestFilterKey.THROUGH) {
      const index = this.filterConfiguration.tempSelectedThrough.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedThrough.push(value);
      } else {
        this.filterConfiguration.tempSelectedThrough.splice(index, 1);
      }
    }
    else if (filterKey == RequestFilterKey.CHANNEL) {
      const index = this.filterConfiguration.tempSelectedChannel.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedChannel.push(value);
      } else {
        this.filterConfiguration.tempSelectedChannel.splice(index, 1);
      }
    }
    else if (filterKey == RequestFilterKey.REQUEST_TYPE) {
      const index =
        this.filterConfiguration.tempSelectedRequestType.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedRequestType.push(value);
      } else {
        this.filterConfiguration.tempSelectedRequestType.splice(index, 1);
      }
    }
  }

  clearSelection(filterKey: string) {
    if (filterKey == RequestFilterKey.STATUS) {
      if (!this.filterConfiguration.selectedStatus.length) return;
      this.filterConfiguration.selectedStatus = [];
      this.resetTopFilters(RequestFilterKey.STATUS);
    }
    if (filterKey == RequestFilterKey.DATA_SUBJECT_TYPE) {
      if (!this.filterConfiguration.selectedDataSubject.length) return;
      this.filterConfiguration.selectedDataSubject = [];
      this.resetTopFilters(RequestFilterKey.DATA_SUBJECT_TYPE);
    }
    if (filterKey == RequestFilterKey.ASSIGNED_TO) {
      if (!this.filterConfiguration.selectedAssignedTo.length) return;
      this.filterConfiguration.selectedAssignedTo = [];
      this.resetTopFilters(RequestFilterKey.ASSIGNED_TO);
    }
    if (filterKey == RequestFilterKey.THROUGH) {
      if (!this.filterConfiguration.selectedThrough.length) return;
      this.filterConfiguration.selectedThrough = [];
      this.resetTopFilters(RequestFilterKey.THROUGH);
    }
    if (filterKey == RequestFilterKey.CHANNEL) {
      if (!this.filterConfiguration.selectedChannel.length) return;
      this.filterConfiguration.selectedChannel = [];
      this.resetTopFilters(RequestFilterKey.CHANNEL);
    }
    if (filterKey == RequestFilterKey.REQUEST_TYPE) {
      if (!this.filterConfiguration.selectedRequestType.length) return;
      this.filterConfiguration.selectedRequestType = [];
      this.resetTopFilters(RequestFilterKey.REQUEST_TYPE);
    }
    if (filterKey == RequestFilterKey.FROM_DATE) {
      this.filterConfiguration.fromDate = '';
      this.filterConfiguration.tempFromDate = '';
    }
    if (filterKey == RequestFilterKey.TO_DATE) {
      this.filterConfiguration.toDate = '';
      this.filterConfiguration.tempToDate = '';
    }
    if (filterKey == RequestFilterKey.COUNTRY) {
      if (!this.filterConfiguration.selectedCountry.length) return;
      this.filterConfiguration.selectedCountry = [];
      this.resetTopFilters(RequestFilterKey.COUNTRY);
      if (!this.filterConfiguration.selectedRequestType.length) return;
      this.filterConfiguration.selectedRequestType = [];
      this.resetTopFilters(RequestFilterKey.REQUEST_TYPE);
    }

    this.prepareFilters();
  }

  get selectedStatus() {
    return this.filterConfiguration.selectedStatus?.length ?? 0;
  }

  get selectedRequestDataSubject() {
    return this.filterConfiguration.selectedDataSubject?.length ?? 0;
  }

  get selectedAssignedTo() {
    return this.filterConfiguration.selectedAssignedTo?.length ?? 0;
  }

  get selectedRequestType() {
    return this.filterConfiguration.selectedRequestType?.length ?? 0;
  }

  get selectedThrough() {
    return this.filterConfiguration.selectedThrough?.length ?? 0;
  }

  get selectedChannel() {
    return this.filterConfiguration.selectedChannel?.length ?? 0;
  }

  get selectedCountry() {
    return this.filterConfiguration.selectedCountry?.length ?? 0;
  }

  applyFilterFromDrawer() {
    this.filterConfiguration.selectedStatus = [...this.filterConfiguration.tempSelectedStatus];
    this.filterConfiguration.selectedRequestType = [...this.filterConfiguration.tempSelectedRequestType];
    this.filterConfiguration.selectedAssignedTo = [...this.filterConfiguration.tempSelectedAssignedTo];
    this.filterConfiguration.selectedThrough = [...this.filterConfiguration.tempSelectedThrough];
    this.filterConfiguration.selectedChannel = [...this.filterConfiguration.tempSelectedChannel];
    this.filterConfiguration.selectedDataSubject = [...this.filterConfiguration.tempSelectedDataSubject];
    this.filterConfiguration.selectedCountry = [...this.filterConfiguration.tempSelectedCountry];
    this.resetTopFilters();
    this.prepareFilters();
  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == RequestFilterKey.STATUS) {
      this.filterConfiguration.selectedStatus = [...this.filterConfiguration.tempSelectedStatus];
    }
    else if (type == RequestFilterKey.DATA_SUBJECT_TYPE) {
      this.filterConfiguration.selectedDataSubject = [...this.filterConfiguration.tempSelectedDataSubject];
    }
    else if (type == RequestFilterKey.ASSIGNED_TO) {
      this.filterConfiguration.selectedAssignedTo = [...this.filterConfiguration.tempSelectedAssignedTo];
    }
    else if (type == RequestFilterKey.THROUGH) {
      this.filterConfiguration.selectedThrough = [...this.filterConfiguration.tempSelectedThrough];
    }
    else if (type == RequestFilterKey.CHANNEL) {
      this.filterConfiguration.selectedChannel = [...this.filterConfiguration.tempSelectedChannel];
    }
    else if (type == RequestFilterKey.REQUEST_TYPE) {
      this.filterConfiguration.selectedRequestType = [...this.filterConfiguration.tempSelectedRequestType];
    }
    else if (type == RequestFilterKey.COUNTRY) {
      this.filterConfiguration.selectedRequestType = [];
      this.filterConfiguration.selectedCountry = [...this.filterConfiguration.tempSelectedCountry];
    }

    if (menuTrigger) {
      menuTrigger.closeMenu();
    }
    this.prepareFilters();
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
    if (type == RequestFilterKey.STATUS || !type) {
      this.filterConfiguration.tempSelectedStatus = [...this.filterConfiguration.selectedStatus];
      this.filterConfiguration.statusList.map((status) => {
        let checked = this.filterConfiguration.tempSelectedStatus.includes(status);
        status.selected = checked;
      });
    }
    if (type == RequestFilterKey.DATA_SUBJECT_TYPE || !type) {
      this.filterConfiguration.tempSelectedDataSubject = [...this.filterConfiguration.selectedDataSubject];
      this.filterConfiguration.dataSubjectList.map((ds) => {
        let checked = this.filterConfiguration.tempSelectedDataSubject.includes(ds);
        ds.selected = checked;
      });
    }
    if (type == RequestFilterKey.ASSIGNED_TO || !type) {
      this.filterConfiguration.tempSelectedAssignedTo = [...this.filterConfiguration.selectedAssignedTo];
      this.filterConfiguration.assignedToList.map((assignedTo) => {
        let checked = this.filterConfiguration.tempSelectedAssignedTo.includes(assignedTo);
        assignedTo.selected = checked;
      });
    }
    if (type == RequestFilterKey.THROUGH || !type) {
      this.filterConfiguration.tempSelectedThrough = [...this.filterConfiguration.selectedThrough];
      this.filterConfiguration.through.map((_through) => {
        let checked = this.filterConfiguration.tempSelectedThrough.includes(_through);
        _through.selected = checked;
      });
    }
    if (type == RequestFilterKey.CHANNEL || !type) {
      this.filterConfiguration.tempSelectedChannel = [...this.filterConfiguration.selectedChannel];
      this.filterConfiguration.channelList.map((channel) => {
        let checked = this.filterConfiguration.tempSelectedChannel.includes(channel);
        channel.selected = checked;
      });
    }
    if (type == RequestFilterKey.REQUEST_TYPE || !type) {
      this.filterConfiguration.tempSelectedRequestType = [...this.filterConfiguration.selectedRequestType];
      this.filterConfiguration.requestTypeList.map((requestType) => {
        let checked = this.filterConfiguration.tempSelectedRequestType.includes(requestType);
        requestType.selected = checked;
      });
    }
    if (type == RequestFilterKey.COUNTRY || !type) {
      this.filterConfiguration.tempSelectedCountry = [...this.filterConfiguration.selectedCountry];
      this.filterConfiguration.countryList.map((country) => {
        let checked = this.filterConfiguration.tempSelectedCountry.includes(country);
        country.selected = checked;
      });
    }
    this.isDownloadInProgress = false
  }

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', isExport: boolean = false, onInit: boolean = false) {
    const filters: any = {};
    if (this.filterConfiguration.selectedStatus?.length) {
      filters.status = this.filterConfiguration.selectedStatus.map(s => s.value);
    }
    if (this.filterConfiguration.selectedThrough?.length) {
      filters.through = this.filterConfiguration.selectedThrough.map(c => c.value);
    }
    if (this.filterConfiguration.selectedChannel?.length) {
      filters.channels = this.filterConfiguration.selectedChannel.map(c => c.value);
    }
    if (this.filterConfiguration.selectedDataSubject?.length) {
      filters.dataSubjectTypeIds = this.filterConfiguration.selectedDataSubject.map(d => d.id);
    }
    if (this.filterConfiguration.selectedRequestType?.length) {
      filters.requestTypeId = this.filterConfiguration.selectedRequestType.map(r => r.id);
    }
    if (this.filterConfiguration.selectedAssignedTo?.length) {
      filters.assigneeId = this.filterConfiguration.selectedAssignedTo.map(a => a.applicationUserId);
    }
    if (this.filterConfiguration.fromDate) {
      filters.fromDate = moment(this.filterConfiguration.fromDate).format('DD-MM-YYYY');
    }
    if (this.filterConfiguration.toDate) {
      filters.toDate = moment(this.filterConfiguration.toDate).format('DD-MM-YYYY');
    }
    if (this.filterConfiguration.selectedCountry?.length) {
      filters.countryIds = this.filterConfiguration.selectedCountry.map(r => r.id);
    }
    if (this.filterConfiguration.searchText) {
      filters.searchText = this.filterConfiguration.searchText.trim();
    }

    const tabFilters: any = this.getTabStatus() || {};

    if (this.selectedTab !== this.ALL) {
      if (filters.status) {
        delete filters.status;
      }
    }
    if (isExport && this.selectedExportColumns.length) {
      filters.columns = this.selectedExportColumns;
    }

    const finalFilters = { ...filters, ...tabFilters };
    if (this.isClearingAll) {
      this.filterApplied = false;
      this.isClearingAll = false;

      if (isExport) {
        this.getDownload(finalFilters);
        return;
      }
      this.getDsrRequestsList(pageNo, finalFilters, sortBy, sortDirection, onInit);
      return;
    }
    const { columns, ...uiFilters } = filters;

    const userHasFilterKeys = Object.keys(uiFilters).length > 0;
    const searchOnly =
      userHasFilterKeys &&
      Object.keys(uiFilters).length === 1 &&
      !!uiFilters.searchText;
    this.filterApplied = userHasFilterKeys && !searchOnly;

    if (isExport) {
      this.getDownload(finalFilters);
      return;
    }

    this.getDsrRequestsList(pageNo, finalFilters, sortBy, sortDirection, onInit);
  }


  get showStatusFilter() {
    return this.filterConfiguration.statusList?.length;
  }

  get showDataSubjectTypeFilter() {
    return this.filterConfiguration.dataSubjectList?.length;
  }

  get showAssignedTo() {
    return this.filterConfiguration.assignedToList?.length;
  }

  get showThroughList() {
    return this.filterConfiguration.through?.length;
  }

  get showChannelList() {
    return this.filterConfiguration.channelList?.length;
  }

  get showRequestType() {
    return this.filterConfiguration.requestTypeList?.length;
  }

  get showCountryList() {
    return this.filterConfiguration.countryList?.length;
  }

  get selectedCountryName() {
    return this.filterConfiguration.selectedCountry[0]?.name ?? ''
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

  setCurrentRequestList() {
    let reqRidList: any = [];
    this.requestManagementList.map((item) => {
      reqRidList.push({ requestRid: item.id });
    });
    this.requestManagementService.setDsrRequestRid(reqRidList);
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
    if (this.selectedTab == DRAFTS) {
      return { isDraft: true, status: DRAFTS };
    }
    return;
  }

  get allTabSelected(): boolean {
    return this.selectedTab === ALL
  }

  setRequestTabCount(res: any, params: any) {
    let totalItems = 0;
    this.tabHeaderDetails.map((tabHeader, index) => {
      if (tabHeader.key == DRAFTS) {
        if (this.selectedTab == DRAFTS) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.draftItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      else if (tabHeader.key == PRIORITY) {
        if (this.selectedTab == PRIORITY) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.priorityItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }

      }
      else if (tabHeader.key == OPEN) {
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
    const searchText = this.filterConfiguration.searchText?.trim() || '';
    const filterData = { ...params, searchText };
    this.storeRequestFilter(filterData);
    this.storeRequestListingFilter(filterData);

  }

  get showRequestList() {
    return this.requestManagementList?.length || this.pageNo >= 1;
  }

  get isEmptyRequest() {
    return this.requestManagementList?.length ? false : true
  }

  syncTempDate(type: 'from' | 'to') {
    if (type === 'from') {
      this.filterConfiguration.tempFromDate = this.filterConfiguration.fromDate;
    } else {
      this.filterConfiguration.tempToDate = this.filterConfiguration.toDate;
    }
  }

  async onCountryChange(event: MatSelectChange) {
    await this.getCoutryConfiguration();
  }

  async getCoutryConfiguration() {
    const param = {
      countryId: this.filterConfiguration.tempSelectedCountry.map(r => r.id)
    };
    if (param.countryId?.length) {
      const res = await this.configApiHelperService.getCountryConfiguration(param);
      this.filterConfiguration.requestTypeList = (res?.dataSubjectRights ?? []);
      this.filterConfiguration.tempSelectedRequestType = [];
    }
    else {
      this.filterConfiguration.requestTypeList = []
      this.filterConfiguration.tempSelectedRequestType = [];
    }
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

  getDisplayName(assignedTo: User) {
    if (!assignedTo) {
      return ''
    }
    return `${assignedTo.displayName ? assignedTo.displayName : `${assignedTo.firstName} ${assignedTo.lastName ?? ''}`}`;
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
    id: 'id',
    name: 'firstPartyFirstName',   // backend field
    requestedOn: 'createdAt',    // backend field
    requestRightId: 'requestedByType',
    status: 'status',
    state: 'state',
    channel: 'channel',
  };

  storeRequestListingFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.requestManagementService.storeRequestListingFilter(filterData);
  }

  storeRequestFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.requestManagementService.storeRequestFilter(filterData);
  }

  storeTabFilter() {
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab };
    this.requestManagementService.storeRequestListingFilter(filterData)
  }

  setRequestFilter() {
    const filters = this.requestManagementService.getRequestFilter();
    if (filters?.selectedTab) {
      this.selectedTab = filters?.selectedTab;
    }
    if (filters?.page) {
      this.pageNo = filters?.page;
    }
    if (filters?.filterConfiguration) {
      this.filterConfiguration = { ...filters.filterConfiguration }
    }
  }

  isRequestIsLocked(row: DsrRequest) {
    return row.isLocked ? true : false
  }

  getRequestLockMessage(row: DsrRequest) {
    return row.isLocked ? requestLockMessage(row) : ``;
  }

  setUserPermissions() {
    this.createDsrRequest = this.rolePermissionService.createDsrRequest || this.rolePermissionService.fullAccessDsrRequest;
    this.editDsrRequest = this.rolePermissionService.editDsrRequest || this.rolePermissionService.fullAccessDsrRequest;
    this.viewDsrFeature = this.rolePermissionService.viewDsrFeature || this.rolePermissionService.fullAccessDsrRequest;
    this.dsrExport = this.rolePermissionService.dsrExport || this.rolePermissionService.fullAccessDsrRequest;
  }

  get errorTitle(): string {
    const isDraftTab = this.selectedTab === DRAFTS;
    const isPriorityTab = this.selectedTab === PRIORITY;
    const isOpenTab = this.selectedTab === OPEN;

    if (this.filterConfiguration?.searchText) {
      return isDraftTab
        ? 'No draft requests match your search criteria'
        : 'No requests match your search criteria';
    }

    if (this.filterApplied) {
      return isDraftTab
        ? 'No draft requests match the selected view'
        : 'No requests match the selected view';
    }

    if (!this.initialListIsEmpty) {
      return ''; // 👈 always return string
    }

    return isDraftTab
      ? 'No draft requests are available'
      : isPriorityTab
        ? 'No prioritized requests are available'
        : isOpenTab
          ? 'No open requests are available'
          : 'No requests have been created yet';
  }

}
