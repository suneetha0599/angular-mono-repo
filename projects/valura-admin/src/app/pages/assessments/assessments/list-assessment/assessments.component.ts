import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { ALL, ASSESSMENT_HEADER, DRAFTS, FIRST_PAGE, HEADER_ACTION, HEADER_DATE, HEADER_DESCRIPTION, HEADER_HOSTING_TYPE, HEADER_NAME, HEADER_STATUS, HEADER_TRIGGER, OPEN, PAGE_SIZE, PRIORITY, BPA_NAME, OWNER_NAME, ASSESSMENT_DRAFT_HEADER, ASSESSMENT_MODE, formatStatus, HEADER_AGE, ASSESSMENT_DOWNLOAD_COLUMNS, VENDOR_DOWNLOAD_COLUMNS } from "../constants";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from "@angular/core";
import { ApiHelperService } from "@admin-core/services/network/api-helper.service";
import { routes as routeConstants } from '@admin-core/constants/routes';
import { FilterConfiguration } from "@admin-core/models/request-management/FilterConfiguration";
import { MatDrawer, MatDrawerContainer, MatSidenav } from "@angular/material/sidenav";
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ItemNotFoundComponent } from "@valura-lib/components//item-not-found/item-not-found.component";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Assessment } from "@admin-core/models/assessment/assessment";
import { ASSESSMENT_MANUAL_DRAFT_KEY, MANUAL_VENDOR_ASSESSMENT_REQUEST } from "@admin-core/constants/constants";
import { NgModelDebounceChangeDirective } from "@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive";
import { EllipsisTooltipDirective } from "@valura-lib/directives/ellipsis-tooltip.directive";
import { AssessmentService } from "@admin-core/services/assessment/assessment.service";
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { ErrorLoadingItemsComponent } from "@valura-lib/components//error-loading-items/error-loading-items.component";
import { buildDeleteAssessmentCommand, statusColors, statusTextColors } from "../assessment-utils";
import { GLOBAL_DIALOG_DEFAULTS } from "@admin-core/constants/constants";
import { PopupDialogComponent, PopupDialogData } from "@valura-lib/components//popup-dialog/popup-dialog.component";
import { SnackbarService } from "@valura-lib/service/snackbar/snackbar.service";
import { assessmentDeleteMessage } from '@admin-core/utils/error-message/assessment-error-message-util';
import { RolePermissionService } from "@admin-core/services/permission/role-permission.service";
import { ExportDrawerComponent } from "@valura-lib/components//export-drawer/export-drawer.component";
import { AuthService } from "@admin-core/services/auth.service";


export interface Asset {
  assetId: string;
  assetName: string;
  hostingType: string;
  type: string;
  hostingLocation: string;
  owner: string;
  vendorName: string;
  lastSync: string;
  numberOfPDEs: number;
  linkedBPA: string;
  status: string;
}

@Component({
  selector: 'app-assessments',
  imports: [CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTabsModule,
    NgModelDebounceChangeDirective,
    EllipsisTooltipDirective,
    MatTooltipModule, MatDrawerContainer, MatDrawer, ItemNotFoundComponent, MatInputModule, ReactiveFormsModule, FormsModule, LoadingButtonComponent, ErrorLoadingItemsComponent, ExportDrawerComponent],
  templateUrl: './assessments.component.html',
  styleUrl: './assessments.component.scss',
})
export class AssessmentsComponent {

  @Input() bpaId: number = 0;
  @Output() onCreateNewAssessment = new EventEmitter<any>();

  showSearch: boolean = false;
  createAssessmentInstance: boolean = false;
  editAssessmentInstance: boolean = false;
  viewAssessmentInstance: boolean = false;
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME
  HEADER_TRIGGER = HEADER_TRIGGER
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE
  HEADER_ACTION = HEADER_ACTION
  HEADER_DESCRIPTION = HEADER_DESCRIPTION
  HEADER_HOSTING_TYPE = HEADER_HOSTING_TYPE
  HEADER_AGE = HEADER_AGE
  BPA_NAME = BPA_NAME
  OWNER_NAME = OWNER_NAME
  ALL = ALL
  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  selectedTab: string = ALL
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>();
  assesmentList: Assessment[] = []
  filteredDataSource: Assessment[] = []
  selectedTabIndex = 0;
  totalFilteredItemsCount = 0
  filterConfiguration: FilterConfiguration = new FilterConfiguration({})
  STATUS = "STATUS";
  ASSIGNED_TO = "ASSIGNED_TO"
  DATA_SUBJECT_TYPE = "DATA_SUBJECT_TYPE"
  _allTab = { name: "All Assessments", count: 0, key: ALL };
  tabHeaderDetails = [this._allTab];
  filterApplied: boolean = false;
  requestLoading: boolean = true;
  ASSET_NAME = 'ASSET_NAME';
  ASSET_TYPE = 'ASSET_TYPE';
  DEPARTMENT = 'DEPARTMENT';
  ASSET_CATEGORY = 'ASSET_CATEGORY';
  assetTypes = this.ASSET_TYPE;
  deleteIsLoading: boolean = false;
  ASSESSMENT_MODE = ASSESSMENT_MODE
  shimmerDataSource = Array(4).fill({});
  initialListIsEmpty: boolean = true;
  hasApiError: boolean = false;
  isVendorContext: boolean = false;
  drawerView: string = '';
  downloadColumns: any[] = [];

  private apiHelperService = inject(ApiHelperService);
  private rolePermissionService = inject(RolePermissionService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private assessmentService = inject(AssessmentService);
  private snackbarService = inject(SnackbarService);
  private authService = inject(AuthService);


  constructor(private router: Router, private dialog: MatDialog) { }

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef

  ngOnInit() {
    this.onInitPage()
    // this.updateTabCounts();
  }

  ngAfterViewInit() {
    this.setTablePaginator()
    this.dataSource.sort = this.sort;

    setTimeout(() => {
      this.restoreSavedFilters();
    });

  }


  restoreSavedFilters() {
    const saved = this.assessmentService.getRequestListingFilter(this.isVendorContext);

    this.pageNo = saved?.page ?? FIRST_PAGE;
    this.pageSize = saved?.size ?? PAGE_SIZE;
    this.totalItems = saved?.total ?? 0;

    this.filterConfiguration.searchText = saved?.searchQuery || '';
    this.openSearchIfTextExists()
    this.resetTopFilters();
    this.dataSource = new MatTableDataSource<Assessment>();
    this.prepareFilters(this.pageNo, '', '', true);
    setTimeout(() => this.assessmentService.clearRequestFilters(), 0);
    return;
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
      }, 0);
    }
  }


  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status)
  }

  getStatusText(status: string): string {
    return formatStatus(status)
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.resetAllFilter()
    this.updateDisplayedHeaders();
    this.prepareFilters()
    this.scrollToTop()
  }

  onInitPage() {
    this.setTabDetails();
    this.assessmentService.clearRouteDetails();
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.isVendorContext = this.router.url.includes(routeConstants.VENDORS);
    this.setUserPermissions();
    this.setTableInfo()
    const columns = this.isVendorContext ? VENDOR_DOWNLOAD_COLUMNS : ASSESSMENT_DOWNLOAD_COLUMNS;
    this.downloadColumns = columns.map(c => ({ ...c, selected: true }));
  }

  onClickName(request: any, mode: string = ASSESSMENT_MODE.EDIT) {
    this.setCurrentRequestList();
    const assessmentId = this.isDraftSelected ? request.draftId : request.id;
    const approverType = request?.approver;
    if (this.selectedTab == DRAFTS) {
      if (!this.editAssessmentInstance) {
        this.snackbarService.openSnack("You do not have permission to edit this assessment.")
        return
      }
      this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`], { queryParams: { manualDraftAssessmentId: assessmentId } });
      return;
    }

    if (mode === ASSESSMENT_MODE.EDIT) {
      const currentPath = this.bpaId ? `${routeConstants.USER}/${routeConstants.ASSESSMENTS}/${routeConstants.ASSESSMENT}` : this.currentPath;
      this.router.navigate([`${currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`], { queryParams: { assessmentId: assessmentId, mode: ASSESSMENT_MODE.EDIT } });
      return;
    }

    if (approverType) {
      this.router.navigate([`${this.currentPath}/${routeConstants.MITIGATION_APPROVE}/${assessmentId}`]);
    }
    else {
      if (!this.viewAssessmentInstance) {
        this.snackbarService.openSnack("You do not have permission to view this assessment.")
        return
      }
      const currentPath = this.bpaId ? `${routeConstants.USER}/${routeConstants.ASSESSMENTS}/${routeConstants.ASSESSMENT}` : this.currentPath;
      this.router.navigate([`${currentPath}/${routeConstants.ASSETS_DETAILS}/${assessmentId}`]);
    }
  }

  setCurrentRequestList() {
    let reqRidList: any = [];
    this.assesmentList.map((item) => {
      reqRidList.push({ requestRid: item.id });
    });
    this.assessmentService.setAssessmentRid(reqRidList);
  }

  onCreateRequest() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`])
  }

  async setTableInfo() {
    this.updateDisplayedHeaders();
    this.dataSource = new MatTableDataSource<any>([]);
    // await this.getAssesmentList();

  }

  get isDraftSelected(): boolean {
    return this.selectedTab === DRAFTS
  }

  async getAssesmentList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    const tabStatusFilters = this.getTabStatus();

    let params: any = {
      page: pageNo,
      size: this.pageSize,
      ...tabStatusFilters,
    };

    if (filters) {
      params = { ...params, ...filters };
    }
    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }
    if (this.bpaId) {
      params['bpaIds'] = [this.bpaId]
    }
    this.hasApiError = false;
    this.requestLoading = true;
    let res;
    try {
      if (this.isDraftSelected) {
        const draftKey = this.isVendorContext ? MANUAL_VENDOR_ASSESSMENT_REQUEST : ASSESSMENT_MANUAL_DRAFT_KEY;
        res = await this.apiHelperService.getDraftManualRequests({ key: draftKey, ...params });
      } else if (this.isVendorContext) {
        res = await this.assessmentApiHelperService.getVendorAssessments(params);
      } else {
        res = await this.apiHelperService.getAssesmentList(params);
      }
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo;

      if (res) {
        if (this.isDraftSelected) {
          this.assesmentList = this.assessmentService.prepareAssessmentListForDraft((res?.content ?? []), pageNo, this.pageSize);
        }
        else {
          this.assesmentList = await this.assessmentService.prepareAssessmentList(res?.assessments ?? []);
        }

        this.dataSource = new MatTableDataSource<any>(this.assesmentList);
        this.filteredDataSource = this.assesmentList;
        this.paginator.length = Number(res?.totalFilteredItemsCount ?? 0);
        this.paginator.pageIndex = this.pageNo - 1;
        this.paginator.pageSize = this.pageSize;
        this.setRequestTabCount(res, params);
        if (pageNo === FIRST_PAGE) {
          //   this.setRequestTabCount(res, params);
          //   if (this.paginator) {
          //     this.paginator.firstPage();
          //   }
          if (!this.initialListIsEmpty) {
            if (onInit && (!Object.keys(filters)?.length) && (!this.assesmentList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
    } catch (e) {
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.prepareFilters(
        this.pageNo,
        this.currentSortField,
        this.currentSortDirection
      );
      this.scrollToTop();
    }
  }

  exportReport() {
    this.drawerView = 'EXPORT';
    this.rightDrawer.open();
  }

  onDownloadApply(event: { type: 'NORMAL' | 'CUSTOM'; columns: string[] }) {
    this.rightDrawer.close();

    const isDefault = event.type === 'NORMAL' || event.columns.length === 0;
    const body = {
      columns: isDefault ? [] : event.columns,
      isDefault
    };

    this.getDownload(body);
  }

  async getDownload(body: any) {
    const tabStatusFilters = this.getTabStatus();
    const filters: any = {};

    if (this.filterConfiguration.searchText) {
      filters['searchQuery'] = this.filterConfiguration.searchText.trim();
    }

    const params = { ...tabStatusFilters, ...filters };
    const exportFn = this.isVendorContext
      ? this.assessmentApiHelperService.getVendorAssessmentDownloadResponse(params, body)
      : this.assessmentApiHelperService.getAssessmentDownloadResponse(params, body);

    const res = await exportFn;

    if (res?.requestId) {
      this.snackbarService.openSnack('The export has been initiated.');
      // const reportPath = this.currentPath.split('/').slice(0, -1).join('/') + '/' + routeConstants.DOWNLOAD;
      // this.router.navigate([reportPath]);
    }
  }

  searchFilter() {
    this.rightDrawer.open()
  }

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  resetAllFilter() {
    if (!this.filterApplied) {
      return
    }
    this.resetTopFilters()
    this.prepareFilters()
  }

  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected
    if (filterKey == this.DEPARTMENT) {
      const index = this.filterConfiguration.tempselectedDepartment.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempselectedDepartment.push(value);
      } else {
        this.filterConfiguration.tempselectedDepartment.splice(index, 1);
      }
    }
    else if (filterKey == this.ASSET_TYPE) {
      const index = this.filterConfiguration.tempselectedAssetType.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempselectedAssetType.push(value);
      } else {
        this.filterConfiguration.tempselectedAssetType.splice(index, 1);
      }
    }
    else if (filterKey == this.ASSET_CATEGORY) {
      const index = this.filterConfiguration.tempselectedAssetCategory.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempselectedAssetCategory.push(value);
      } else {
        this.filterConfiguration.tempselectedAssetCategory.splice(index, 1);
      }
    }
  }

  clearSelection(filterKey: 'selectedAssetCategory' | 'selectedAssetType' | 'selectedDepartment') {
    if (filterKey === 'selectedAssetCategory') {
      if (!this.filterConfiguration.selectedAssetCategory?.length) return;
      this.filterConfiguration.selectedAssetCategory = [];
      this.resetTopFilters('ASSET_CATEGORY');
    }

    if (filterKey === 'selectedAssetType') {
      if (!this.filterConfiguration.selectedAssetType?.length) return;
      this.filterConfiguration.selectedAssetType = [];
      this.resetTopFilters('ASSET_TYPE');
    }

    if (filterKey === 'selectedDepartment') {
      if (!this.filterConfiguration.selectedDepartment?.length) return;
      this.filterConfiguration.selectedDepartment = [];
      this.resetTopFilters('DEPARTMENT_NAME');
    }
    this.prepareFilters();
  }


  applyFilterFromDrawer() {
    this.filterConfiguration.selectedAssetCategory = [
      ...this.filterConfiguration.tempselectedAssetCategory,
    ];

    this.filterConfiguration.selectedAssetType = [
      ...this.filterConfiguration.tempselectedAssetType,
    ];

    this.filterConfiguration.selectedDepartment = [
      ...this.filterConfiguration.tempselectedDepartment,
    ];
    this.resetTopFilters();
    this.prepareFilters();

  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == this.DEPARTMENT) {
      this.filterConfiguration.selectedDepartment = [...this.filterConfiguration.tempselectedDepartment]
    }
    else if (type == this.ASSET_CATEGORY) {
      this.filterConfiguration.selectedAssetCategory = [...this.filterConfiguration.tempselectedAssetCategory]
    }
    else if (type == this.ASSET_TYPE) {
      this.filterConfiguration.selectedAssetType = [...this.filterConfiguration.tempselectedAssetType]
    }

    if (menuTrigger) {
      menuTrigger.closeMenu()
    }
    this.prepareFilters()
  }

  stopDefaultBehaviour(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onCloseMenu(type: string) {
    this.resetTopFilters(type)
  }

  resetTopFilters(type: string = "") {
    // if (type == this.DEPARTMENT || !type) {
    //   this.filterConfiguration.tempselectedDepartment = [...this.filterConfiguration.selectedDepartment]
    //   this.filterConfiguration.departmentNameList.map(ds => {
    //     let checked = this.filterConfiguration.tempselectedDepartment.includes(ds)
    //     ds.selected = checked
    //   })
    // }
    // if (type == this.ASSET_CATEGORY || !type) {
    //   this.filterConfiguration.tempselectedAssetCategory = [...this.filterConfiguration.selectedAssetCategory]
    //   this.filterConfiguration.assetCategoryList.map(assignedTo => {
    //     let checked = this.filterConfiguration.tempselectedAssetCategory.includes(assignedTo)
    //     assignedTo.selected = checked
    //   })
    // }
    // if (type == this.ASSET_TYPE || !type) {
    //   this.filterConfiguration.tempselectedAssetType = [...this.filterConfiguration.selectedAssetType]
    //   this.filterConfiguration.assetTypeList.map(assignedTo => {
    //     let checked = this.filterConfiguration.tempselectedAssetType.includes(assignedTo)
    //     assignedTo.selected = checked
    //   })
    // }
  }

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {};

    const searchText = this.filterConfiguration.searchText?.trim() || '';
    if (searchText) {
      filters['searchQuery'] = searchText;
    }

    this.filterApplied = true;
    if (!Object.keys(filters).length || this.filterConfiguration.searchText) {
      this.filterApplied = false;
    }

    this.getAssesmentList(pageNo, filters, sortBy, sortDirection, onInit);
  }

  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
  }

  getTabStatus() {
    if (this.selectedTab == PRIORITY) {
      return { isPriority: true }
    }
    if (this.selectedTab == OPEN) {
      return { isOpen: true }
    }
    if (this.selectedTab == DRAFTS) {
      return { isDraft: true }
    }
    return
  }

  setRequestTabCount(res: any, params: any) {
    let totalItems = 0;
    this.tabHeaderDetails.map((tabHeader, index) => {

      if (tabHeader.key == DRAFTS) {
        if (this.selectedTab == DRAFTS) {
          totalItems = +(res?.totalItems ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.draftItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      else {
        if (this.allTabSelected) {
          totalItems = +(res?.totalFilteredItemsCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      this.totalItems = +totalItems;
    });
    const searchQuery = this.filterConfiguration.searchText?.trim() || '';
    const filterData = { ...params, total: this.totalItems, page: params.page, searchQuery }
    // setItem(LSK_ASSESSMENT_REQ_FILTER, filterData);
    this.storeRequestFilter(filterData);
    this.storeRequestListingFilter(filterData);
  }

  storeRequestFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.assessmentService.storeRequestFilter(params);
  }

  storeRequestListingFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.assessmentService.storeRequestListingFilter(params, this.isVendorContext);
  }

  get showRequestList() {
    return this.assesmentList?.length || this.pageNo > 1
  }

  onCreateNew() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_DPIA_ASSESSMENT}`]);
  }

  get allTabSelected(): boolean {
    return this.selectedTab === this.ALL
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

  onSearchChange() {
    this.filterConfiguration.searchText =
      this.filterConfiguration.searchText.trimStart();
    this.prepareFilters();
  }

  clearSearch() {
    this.filterConfiguration.searchText = '';
  }

  currentSortField: string = '';
  currentSortDirection: string = ''

  onSortChange(event: Sort) {
    const backendField = this.selectedTab === DRAFTS
      ? this.sortFieldMappingByDraft[event.active]
      : this.sortFieldMapping[event.active];

    if (backendField) {
      this.currentSortField = backendField;
      this.currentSortDirection = event.direction;
      this.prepareFilters(this.FIRST_PAGE, this.currentSortField, this.currentSortDirection);
    }
  }

  private sortFieldMapping: any = {
    id: 'id',
    name: 'title',
    bpaName: 'bpaName',
    status: 'status',
    createdOn: 'createdAt',
    trigger: 'trigger',
    dueDate: 'dueDate',
    assessmentAge: 'createdAt'
  };

  private sortFieldMappingByDraft: any = {
    name: 'title',
    status: 'status',
    createdOn: 'createdAt',
    trigger: 'trigger',
    owner: 'author',
    dueDate: 'completeBy',
    processingFor: 'processingFor',
    assessmentAge: 'completeBy'
  };

  // updateDisplayedHeaders() {
  //   if (this.selectedTab === DRAFTS) {
  //     this.displayedHeaders = this.tableHeaders.map((h: { columnDef: any; }) => h.columnDef);
  //   } else {
  //     this.displayedHeaders = this.tableHeaders
  //       .filter((h: { key: string; }) => h.key !== HEADER_ACTION)
  //       .map((h: { columnDef: any; }) => h.columnDef);
  //   }
  // }

  updateDisplayedHeaders() {
    let headers = this.isDraftSelected ? ASSESSMENT_DRAFT_HEADER : ASSESSMENT_HEADER;
    if (!this.editAssessmentInstance) {
      headers = headers.filter(h => h.key !== HEADER_ACTION);
    }
    if (!this.isDraftSelected && this.selectedTabIndex === 0) {
      headers = headers.map(h => {
        if (h.key === 'ACCESS_THE_RECORD' || h.key === OWNER_NAME) {
          return { ...h, sortable: false };
        }
        return h;
      });
    }

    this.tableHeaders = headers;
    this.displayedHeaders = this.tableHeaders.map((h: any) => h.columnDef);
  }

  async deleteAssessment(assessment: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Assessment?',
        confirmationDetail: assessment?.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      if (this.deleteIsLoading) return;

      const draftId = assessment?.draftId;
      const assessmentId = assessment?.assessmentId || assessment?.id;

      if (!draftId && !assessmentId) return;

      this.deleteIsLoading = true;

      try {
        let response;

        if (draftId) {
          response = await this.assessmentApiHelperService.deleteManualDraftRequest(draftId);
        } else if (assessmentId) {
          const payload = buildDeleteAssessmentCommand(assessmentId)
          response = await this.assessmentApiHelperService.updateAssessmentDetails(assessmentId, payload, false);
        }
        this.snackbarService.openSnack(assessmentDeleteMessage());
        if (response) {
          this.prepareFilters();
        }
      } catch (error) {
        console.error("Delete error:", error);
      }

      this.deleteIsLoading = false;
    });
  }


  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  setUserPermissions() {
    if (this.isVendorContext) {
      this.createAssessmentInstance = this.rolePermissionService.createVendorAssessment || this.rolePermissionService.fullAccessVendorAssessment || this.rolePermissionService.fullAccessVendor;
      this.editAssessmentInstance = this.rolePermissionService.editVendorAssessment || this.rolePermissionService.fullAccessVendorAssessment || this.rolePermissionService.fullAccessVendor;
      this.viewAssessmentInstance = this.rolePermissionService.viewVendorAssessment || this.rolePermissionService.fullAccessVendorAssessment || this.rolePermissionService.fullAccessVendor || this.rolePermissionService.approveVendorAssessment;
    }
    else {
      this.createAssessmentInstance = this.rolePermissionService.createAssessmentInstance || this.rolePermissionService.fullAccessAssessmentInstance || this.rolePermissionService.fullAccessAssessment;
      this.editAssessmentInstance = this.rolePermissionService.editAssessmentInstance || this.rolePermissionService.fullAccessAssessmentInstance || this.rolePermissionService.fullAccessAssessment;
      this.viewAssessmentInstance = this.rolePermissionService.viewAssessmentInstance || this.rolePermissionService.fullAccessAssessmentInstance || this.rolePermissionService.fullAccessAssessment || this.rolePermissionService.approveAssessmentInstance;
    }
  }

  needsAction(row: any) {
    return row.needsAction ? true : false
  }

  get actionToolTipMessage() {
    return `Action needed!`
  }

  get errorTitle() {
    return this.filterConfiguration.searchText ? `No assessments match your search criteria` :
      (this.filterApplied) ? `No assessments match the selected view` :
        (this.selectedTabIndex === 0) ?
          `No assessments have been created yet` : `There are no draft assessments available`;
  }

  get isEmptyRequest() {
    return this.assesmentList?.length ? false : true
  }

  get hasAssessments(): boolean {
    return this.dataSource?.data?.length > 0;
  }

  onCreateAssessment() {
    this.onCreateNewAssessment.emit(true)
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  setTabDetails() {
    if (this.isInternalOrExternalUser) {
      return
    }
    this.tabHeaderDetails = [this._allTab, { name: "Drafts", count: 0, key: DRAFTS }]
  }

  disableAction(status: string) {
    return this.assessmentService.assessmentApproved(status) || this.assessmentService.assessmentCompleted(status) || this.assessmentService.assessmentCancelled(status) ? true : false;
  }
}
