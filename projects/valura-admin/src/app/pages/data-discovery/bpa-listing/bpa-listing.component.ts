import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { Router } from '@angular/router';
import { ItemNotFoundComponent } from "@valura-lib/components/item-not-found/item-not-found.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDrawer, MatDrawerContainer, MatSidenav } from "@angular/material/sidenav";
import { DRAFTS, HEADER_NAME, HEADER_ACTION, HEADER_STATUS, HEADER_DATE, PAGE_SIZE, ALL, FIRST_PAGE, BPA_LISTING_HEADER, BPA_LISTING_DRAFT_HEADER, Status, BPA_MODE, STATUS, FREQUENCIES } from './constants';
import { DsrRequest } from '@admin-core/models/request-management/DsrRequest';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { ConfigService } from '@admin-core/services/config.service';
import { MatDialog } from '@angular/material/dialog';
import { statusColors, statusTextColors } from '../../request-management/request-utils';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { DsrConfiguration } from '@admin-core/models/DsrConfiguration';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';
import { BpaActivities } from '@admin-core/models/DataDiscovery/BpaActivities';
import { displayStatusText } from './bpa-utils';
import { ADMIN_USER, BPA_DRAFT_KEY, INTERNAL_USER } from '@admin-core/constants/constants';
import { UserService } from '@admin-core/services/user/user.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { BpaDrawerComponent } from './bpa-drawer/bpa-drawer.component';
import { Country } from '@admin-core/models/DsrConfiguration';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { BpaFilterConfiguration } from '@admin-core/models/data-inventory/BpaFilterConfiguration';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { BPA_HIDE_WARNING } from '@admin-core/constants/local-storage-constants';

@Component({
  selector: 'app-bpa-listing',
  imports: [MatInputModule, FormsModule, BpaDrawerComponent, CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule, MatMenuModule, MatButtonModule, MatTabsModule, NgClass, LoadingButtonComponent,
    ItemNotFoundComponent, MatCheckbox, MatDrawer, MatDrawerContainer, ErrorLoadingItemsComponent
  ],
  templateUrl: './bpa-listing.component.html',
  styleUrl: './bpa-listing.component.scss',
  providers: [CreateBpaService]
})
export class BpaListingComponent {

  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE
  HEADER_ACTION = HEADER_ACTION
  ALL = ALL
  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  selectedTab: string = ALL
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>();
  bpaActivityList: BpaActivities[] = []
  filteredDataSource: BpaActivities[] = []
  selectedTabIndex = 0;
  filterConfiguration: BpaFilterConfiguration = new BpaFilterConfiguration({})
  STATUS = "STATUS";
  ASSIGNED_TO = "ASSIGNED_TO"
  DATA_SUBJECT_TYPE = "DATA_SUBJECT_TYPE"
  DEPARTMENT = "DEPARTMENT"
  FREQUENCY = "FREQUENCY"
  COUNTRY = 'COUNTRY'
  tabHeaderDetails = [
    { name: "Processing Activities", count: 0, key: ALL },
    { name: "Drafts", count: 0, key: DRAFTS }
  ];
  filterApplied: boolean = false;
  requestLoading: boolean = true;
  draftCount: boolean = false;
  showWarningMessage: boolean = false;
  deleteIsLoading: boolean = false;
  BPA_MODE = BPA_MODE
  createBpa: boolean = false;
  editBpa: boolean = false;
  viewBpa: boolean = false;
  sortByField: string = '';
  sortDirection: string = '';
  ownersList: any[] = [];
  statusList = STATUS;
  frequencies = FREQUENCIES;
  initialListIsEmpty: boolean = false;
  showSearch: boolean = false;
  hasApiError: boolean = false;
  shimmerDataSource = Array(4).fill({});
  isLoading: boolean = true;

  private apiHelperService = inject(ApiHelperService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private assessmentService = inject(AssessmentService);
  private configService = inject(ConfigService);
  private userService = inject(UserService);
  private createBpaService = inject(CreateBpaService);
  private bpaService = inject(BpaService)
  private departmentService = inject(DepartmentService)
  private rolePermissionService = inject(RolePermissionService);
  private snackbarService = inject(SnackbarService);

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private router: Router, private dialog: MatDialog) { }

  searchSubject = new Subject<string>();

  ngOnInit() {
    this.bpaService.clearAssetNavigationState()
    this.handleSearch();
    this.onInitPage();
    this.getBpaDraftCount();
    // this.updateTabCounts();
    this.setTableInfo();
    this.setShowWarningMessage()
  }

  ngAfterViewInit() {
    this.getOwnerList()
    this.setTablePaginator()
    this.dataSource.sort = this.sort;
    Promise.resolve().then(() => {
      this.restoreSavedFilters();
    });
  }

  async restoreSavedFilters() {
    await this.getFilterConfiguration()
    const filters = this.bpaService.getBpaListingFilter();
    if (!filters) {
      this.prepareFilters(FIRST_PAGE, '', '', true);
      return;
    }


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

      fc.selectedStatus = fc.statusList.filter((item: { key: any; }) =>
        saved.selectedStatus?.some((s: any) => s.key === item.key)
      );

      fc.selectedCountries = fc.countryList.filter(item =>
        saved.selectedCountries?.some((s: any) => s.id === item.id)
      );

      fc.selectedDepartment = fc.departmentNameList.filter(item =>
        saved.selectedDepartment?.some((s: any) => s.id === item.id)
      );

      fc.selectedFrequency = fc.frequencies.filter(item =>
        saved.selectedFrequency?.some((s: any) => s.id === item.id)
      );
      fc.selectedDataSubject = fc.dataSubjectList.filter(item =>
        saved.selectedDataSubject?.some((s: any) => s.id === item.id)
      );

      fc.searchText = saved.searchText ?? '';
      this.openSearchIfTextExists()

      this.resetTopFilters();

      this.prepareFilters(
        filters.page,
        this.sortByField,
        this.sortDirection
      );

      setTimeout(() => this.bpaService.clearBpaListingFilters());
      return
    }

    this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
    setTimeout(() => this.bpaService.clearBpaFilters());
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


  async getOwnerList() {
    try {
      const data = await this.userService.getAllUserMasterList(false, [ADMIN_USER, INTERNAL_USER]);
      this.ownersList = data;
    }
    catch (e) {
      console.error('Error loading owners', e);
    }
  }

  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status)
  }

  getStatusText(status: string): string {
    return displayStatusText(status)
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.resetAllFilter()
    this.setTableInfo()
  }

  onSortChange(event: Sort) {
    const mapping = this.isDraftSelected
      ? this.draftSortFieldMapping
      : this.sortFieldMapping;

    const backendField = mapping[event.active];

    if (backendField) {
      this.sortByField = backendField;
      this.sortDirection = event.direction;
      this.prepareFilters(this.FIRST_PAGE, backendField, event.direction);
    }
  }

  private sortFieldMapping: any = {
    bpaId: 'id',
    name: 'name',
    description: 'description',
    dsInvolved: 'dsVolume',
    owner: 'bpaOwner',
    status: 'status',
    createdAt: 'createdAt'
  };

  private draftSortFieldMapping: any = {
    Name: 'name',
    owner: 'bpaOwner',
    createdAt: 'createdAt',
    status: 'status'
  };

  onInitPage() {
    this.clearServiceData()
    this.setUserPermissions()
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.getFilterConfiguration()
  }

  onClickName(request: any, mode: string = BPA_MODE.EDIT) {
    const bpaRequestId = this.isDraftSelected ? request.id : request.bpaId
    this.setCurrentRequestList()
    const queryParams = this.isDraftSelected ? { bpaManualDraftRequestId: bpaRequestId } : { bpaRequestId: bpaRequestId, mode: mode };
    if (mode == BPA_MODE.EDIT) {
      if (!this.editBpa) {
        this.snackbarService.openSnack("You do not have permission to edit this activity.")
        return
      }
      this.router.navigate([`${this.currentPath}/${routeConstants.BPA_CREATE}`], { queryParams: queryParams, })
    }
    else {
      if (!this.viewBpa) {
        this.snackbarService.openSnack("You do not have permission to view this activity.")
        return
      }
      this.router.navigate([`${this.currentPath}/${routeConstants.BPA_DETAILS}`], { queryParams: queryParams, })
    }
  }

  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }


  clearSearch() {
    this.filterConfiguration.searchText = '';
    this.pageNo = FIRST_PAGE;
    this.prepareFilters(FIRST_PAGE);
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.clearSearch();
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

  onSearchChange(value: string) {
    this.filterConfiguration.searchText = value.trimStart();
    this.searchSubject.next(this.filterConfiguration.searchText);
  }

  handleSearch() {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageNo = FIRST_PAGE;
        this.prepareFilters(FIRST_PAGE);
      });
  }

  createBPA() {
    this.storeTabFilter()
    this.router.navigate([`${this.currentPath}/${routeConstants.BPA_CREATE}`])
  }

  async setTableInfo() {
    this.dataSource = new MatTableDataSource<DsrRequest>;
    this.tableHeaders = this.isDraftSelected ? BPA_LISTING_DRAFT_HEADER : BPA_LISTING_HEADER;
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    // await this.getBpaActivityList()
  }

  private refreshCurrentPageData(): void {
    this.prepareFilters()
  }

  async getBpaActivityList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = this.sortByField, sortDirection: string = this.sortDirection, onInit: boolean = false) {
    let params: any = {
      page: pageNo,
      size: this.pageSize,
      ...this.getTabStatus()
    };

    if (filters) {
      params = { ...params, ...filters };
    }

    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }

    this.requestLoading = true;
    this.isLoading = true;
    this.hasApiError = false

    try {

      let res;
      if (this.isDraftSelected) {
        res = await this.apiHelperService.getDraftManualRequests({
          key: 'MANUAL_BPA_REQUEST',
          page: pageNo,
          size: this.pageSize,
          ...filters,
          sortBy: sortBy,
          sortDirection: sortDirection.toUpperCase(),
        });
      } else {
        res = await this.apiHelperService.getBpaActivityList(params);
      }
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo;

      if (res) {
        if (this.isDraftSelected) {
          const content = res?.content ?? [];

          this.bpaActivityList = await Promise.all(
            content.map(async (item: any) => {
              return {
                ...item,
                name: item.formData?.overview?.name ?? '',
                owner: item.formData.overview.owner?.displayName ?? '',
                department: item.formData?.overview?.departmentId?.name ?? '',
                createdAt: item.formData?.createdAt ?? '',
                asset: item.formData?.asset?.assetElementsMapping?.length ?? 0,
                status: Status.OPEN
              };
            })
          );
        }


        else {
          const data = res?.listingBPA ?? [];

          this.bpaActivityList = await Promise.all(
            data.map(async (item: any) => {
              const owner = item?.owner
                ? (await this.userService.getUserById(item.owner.userId))?.displayName ?? '-'
                : '-';
              return {
                ...item,
                owner
              };
            })
          );

        }


        this.dataSource = new MatTableDataSource(this.bpaActivityList);
        this.filteredDataSource = this.bpaActivityList;
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
            if (onInit && (!Object.keys(filters)?.length) && (!this.bpaActivityList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
    } catch (e) {
      this.hasApiError = true
    } finally {
      this.requestLoading = false;
      this.isLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection)
      this.scrollToTop()
    }
  }

  setCurrentRequestList() {
    let reqRidList: any = [];
    this.bpaActivityList.map((item) => {
      reqRidList.push({ 'bpaId': item.bpaId, })
    })
    this.bpaService.setDsrRequestRid(reqRidList);
  }

  exportReport() {

  }

  searchFilter() {
    this.rightDrawer.open()
  }

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  async getFilterConfiguration() {
    const dsrConfiguration: DsrConfiguration = await this.configService.getDsrConfiguration()
    if (dsrConfiguration) {

      this.filterConfiguration = new BpaFilterConfiguration({});
      this.filterConfiguration.countryList = (dsrConfiguration?.countryList) ?? []
      this.filterConfiguration.dataSubjectList = (dsrConfiguration?.dataSubjectRequestUserTypeList) ?? []
      this.filterConfiguration.frequencies = this.frequencies
    }
    this.filterConfiguration.statusList = STATUS
    await this.getdepartments()
  }

  async getdepartments() {
    const res = await this.departmentService.getDepartmentMasterList();

    if (res) {
      this.filterConfiguration.departmentNameList = res;
    }
    return;
  }

  resetAllFilter() {
    this.filterConfiguration.selectedDepartment = [];
    this.filterConfiguration.selectedDataSubject = [];
    this.filterConfiguration.selectedStatus = [];
    this.filterConfiguration.selectedCountries = [];
    this.filterConfiguration.selectedFrequency = [];

    this.filterConfiguration.tempselectedDepartment = [];
    this.filterConfiguration.tempSelectedDataSubject = [];
    this.filterConfiguration.tempSelectedStatus = [];
    this.filterConfiguration.tempSelectedFrequencies = [];
    this.filterConfiguration.tempSelectedCountry = [];
    this.filterConfiguration.tempselectedDepartment = [];
    this.filterConfiguration.tempSelectedDataSubject = [];
    this.filterConfiguration.tempSelectedStatus = [];
    this.filterConfiguration.tempSelectedFrequencies = [];
    this.filterConfiguration.tempSelectedCountry = [];

    this.filterConfiguration.searchText = '';
    this.filterConfiguration.searchText = '';

    this.filterApplied = false;
    this.pageNo = FIRST_PAGE;
    this.filterApplied = false;
    this.pageNo = FIRST_PAGE;

    this.bpaService.clearBpaFilters();

    this.prepareFilters(FIRST_PAGE);
  }



  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected
    if (filterKey == this.STATUS) {
      const index = this.filterConfiguration.tempSelectedStatus.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedStatus.push(value);
      } else {
        this.filterConfiguration.tempSelectedStatus.splice(index, 1);
      }
    }
    else if (filterKey == this.DATA_SUBJECT_TYPE) {
      const index = this.filterConfiguration.tempSelectedDataSubject.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedDataSubject.push(value);
      } else {
        this.filterConfiguration.tempSelectedDataSubject.splice(index, 1);
      }
    }
    else if (filterKey == this.DEPARTMENT) {
      const index = this.filterConfiguration.tempselectedDepartment.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempselectedDepartment.push(value);
      } else {
        this.filterConfiguration.tempselectedDepartment.splice(index, 1);
      }
    }
    else if (filterKey == this.FREQUENCY) {
      const index = this.filterConfiguration.tempSelectedFrequencies.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedFrequencies.push(value);
      } else {
        this.filterConfiguration.tempSelectedFrequencies.splice(index, 1);
      }
    }
    else if (filterKey == this.COUNTRY) {
      const index = this.filterConfiguration.tempSelectedCountry.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedCountry.push(value);
      } else {
        this.filterConfiguration.tempSelectedCountry.splice(index, 1);
      }
    }
  }

  clearSelection(filterKey: 'status' | 'dataSubjectType' | 'departmentIds' | 'frequency' | 'region') {
    if (filterKey == 'status') {
      if (this.filterConfiguration.selectedStatus.length == 0) {
        return
      }
      this.filterConfiguration.selectedStatus = [];
      this.resetTopFilters(this.STATUS)
    }
    if (filterKey == 'dataSubjectType') {
      if (this.filterConfiguration.selectedDataSubject.length == 0) {
        return
      }
      this.filterConfiguration.selectedDataSubject = [];
      this.resetTopFilters(this.DATA_SUBJECT_TYPE)
    }
    if (filterKey == 'departmentIds') {
      if (this.filterConfiguration.selectedDepartment.length == 0) {
        return
      }
      this.filterConfiguration.selectedDepartment = [];
      this.resetTopFilters(this.DEPARTMENT)
    }
    if (filterKey == 'frequency') {
      if (this.filterConfiguration.selectedFrequency.length == 0) {
        return
      }
      this.filterConfiguration.selectedFrequency = [];
      this.resetTopFilters(this.FREQUENCY)
    }
    if (filterKey == 'region') {
      if (this.filterConfiguration.selectedCountries.length == 0) {
        return
      }
      this.filterConfiguration.selectedCountries = [];
      this.resetTopFilters(this.COUNTRY)
    }
    this.prepareFilters()
  }

  get selectedStatus() {
    return this.filterConfiguration.selectedStatus?.length ?? 0
  }

  get selectedRequestDataSubject() {
    return this.filterConfiguration.selectedDataSubject?.length ?? 0
  }

  get selectedRequestDepartments() {
    return this.filterConfiguration.selectedDepartment?.length ?? 0;
  }

  get selectedRequestFrequency() {
    return this.filterConfiguration.selectedFrequency?.length ?? 0;
  }

  get selectedRequestCountry() {
    return this.filterConfiguration.selectedCountries?.length ?? 0;
  }



  applyFilterFromDrawer() {
    this.filterConfiguration.selectedDepartment = [...(this.filterConfiguration.tempselectedDepartment ?? [])]
    this.filterConfiguration.selectedDataSubject = [...(this.filterConfiguration.tempSelectedDataSubject ?? [])]
    this.filterConfiguration.selectedStatus = [...(this.filterConfiguration.tempSelectedStatus ?? [])]
    this.filterConfiguration.selectedFrequency = [...(this.filterConfiguration.tempSelectedFrequencies ?? [])]
    this.filterConfiguration.selectedCountries = [...(this.filterConfiguration.tempSelectedCountry ?? [])]
    this.resetTopFilters()
    this.prepareFilters()
  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == this.STATUS) {
      this.filterConfiguration.selectedStatus = [...this.filterConfiguration.tempSelectedStatus]
    }
    else if (type == this.DATA_SUBJECT_TYPE) {
      this.filterConfiguration.selectedDataSubject = [...this.filterConfiguration.tempSelectedDataSubject]
    }
    else if (type == this.DEPARTMENT) {
      this.filterConfiguration.selectedDepartment = [...this.filterConfiguration.tempselectedDepartment]
    }
    else if (type == this.FREQUENCY) {
      this.filterConfiguration.selectedFrequency = [...this.filterConfiguration.tempSelectedFrequencies]
    }

    else if (type == this.COUNTRY) {
      this.filterConfiguration.selectedCountries = [...this.filterConfiguration.tempSelectedCountry]
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
    if (type == this.STATUS || !type) {
      this.filterConfiguration.tempSelectedStatus = [...(this.filterConfiguration.selectedStatus ?? [])]
      this.filterConfiguration.statusList.map((ds) => {
        let checked = this.filterConfiguration.tempSelectedStatus.includes(ds)
        ds.selected = checked
      })
    }
    if (type == this.DATA_SUBJECT_TYPE || !type) {
      this.filterConfiguration.tempSelectedDataSubject = [...(this.filterConfiguration.selectedDataSubject ?? [])]
      this.filterConfiguration.dataSubjectList.map(ds => {
        let checked = this.filterConfiguration.tempSelectedDataSubject.includes(ds)
        ds.selected = checked
      })
    }
    if (type == this.DEPARTMENT || !type) {
      this.filterConfiguration.tempselectedDepartment = [...(this.filterConfiguration.selectedDepartment ?? [])]
      this.filterConfiguration.departmentNameList.map(ds => {
        let checked = this.filterConfiguration.tempselectedDepartment.includes(ds)
        ds.selected = checked
      })
    }
    if (type == this.FREQUENCY || !type) {
      this.filterConfiguration.tempSelectedFrequencies = [...(this.filterConfiguration.selectedFrequency ?? [])]
      this.filterConfiguration.frequencies.map(ds => {
        let checked = this.filterConfiguration.tempSelectedFrequencies.includes(ds)
        ds.selected = checked
      })
    }
    if (type == this.COUNTRY || !type) {
      this.filterConfiguration.tempSelectedCountry = [...(this.filterConfiguration.selectedCountries ?? [])]
      this.filterConfiguration.countryList.map(ds => {
        let checked = this.filterConfiguration.tempSelectedCountry.includes(ds)
        ds.selected = checked
      })
    }
  }


  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {}

    if (this.selectedTab === ALL) {

      if (this.filterConfiguration.searchText?.trim()) {
        filters['searchText'] = this.filterConfiguration.searchText.trim();
      }
    }
    else {
      if (this.filterConfiguration.searchText?.trim()) {
        filters['searchQuery'] = this.filterConfiguration.searchText.trim();
      }
    }
    if (this.filterConfiguration.selectedStatus?.length) {
      filters['status'] = this.filterConfiguration.selectedStatus.map(status => status.key)
    }
    if (this.filterConfiguration.selectedDepartment?.length) {
      filters['departmentIds'] = this.filterConfiguration.selectedDepartment.map(department => department.id)
    }
    if (this.filterConfiguration.selectedDataSubject?.length) {
      filters['dataSubjectType'] = this.filterConfiguration.selectedDataSubject.map(dataSubject => dataSubject.id)
    }
    if (this.filterConfiguration.selectedFrequency?.length) {
      filters['frequency'] = this.filterConfiguration.selectedFrequency.map(frequency => frequency.name)
    }
    if (this.filterConfiguration.selectedCountries?.length) {
      filters['region'] = this.filterConfiguration.selectedCountries.map(
        (country: Country) => country.id
      );
    }


    const userHasFilterKeys = Object.keys(filters).length > 0;
    const searchOnly = userHasFilterKeys && Object.keys(filters).length === 1 && (!!filters.searchText || !!filters.searchQuery);

    this.filterApplied = userHasFilterKeys && !searchOnly;

    if (!Object.keys(filters).length) {
      this.filterApplied = false
    }


    this.getBpaActivityList(pageNo, filters, sortBy, sortDirection, onInit)
  }

  get showStatusFilter() {
    return this.filterConfiguration.statusList?.length
  }

  get showDataSubjectTypeFilter() {
    return this.filterConfiguration.dataSubjectList?.length
  }

  get showDepartmentFilter() {
    return this.filterConfiguration.departmentNameList?.length
  }

  get showFrequencyFilter() {
    return this.filterConfiguration.frequencies?.length
  }

  get showCountryFilter() {
    return this.filterConfiguration.countryList?.length
  }



  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
  }

  getTabStatus() {
    if (this.isDraftSelected) {
      return { isDraft: true }
    }
    return
  }

  get allTabSelected(): boolean {
    return this.selectedTab === ALL
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
    const searchVal = this.filterConfiguration.searchText?.trim() || '';
    const filterDataWithSearch = { ...params, searchQuery: searchVal, searchText: searchVal };
    this.storeBpaFilter(filterDataWithSearch)
    this.storeBpaListingFilter(filterDataWithSearch)
  }



  storeBpaFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page };
    this.bpaService.storeBpaFilter(filterData);
  }

  storeBpaListingFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.bpaService.storeBpaListingFilter(filterData);
  }


  storeTabFilter() {
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab };
    this.bpaService.storeBpaListingFilter(filterData)
  }
  get showRequestList() {
    return this.bpaActivityList?.length || this.pageNo > 1
  }

  requestIsCompleted(request: DsrRequest) {
    return false
  }

  async getBpaDraftCount() {
    return //As per Thejaswini's request disabling now
    const res = await this.dataInventoryApiHelperService.getDraftCount(BPA_DRAFT_KEY);
    if (res?.count) {
      this.draftCount = res.count
    }
  }

  openDraftRequestDetails() {
    const queryParams = { bpaDraftRequestId: BPA_DRAFT_KEY }
    this.router.navigate([`${this.currentPath}/${routeConstants.BPA_CREATE}`], {
      queryParams: queryParams,
    })
    // this.hideWarningMessage()
  }

  get warningMessage() {
    return `You have an unsaved draft request. Please proceed!`;
  }

  hideWarningMessage() {
    this.showWarningMessage = false;
    setItem(BPA_HIDE_WARNING, 'true')
  }

  setShowWarningMessage() {
    const hideWarning = !!getItem(BPA_HIDE_WARNING);
    this.showWarningMessage = !hideWarning
  }

  get isDraftSelected(): boolean {
    return this.selectedTab === DRAFTS
  }

  async deleteManualDraftRequest(request: any) {
    if (this.deleteIsLoading) {
      return
    }

    const bpaRequestId = request.id;
    if (!bpaRequestId) {
      return
    }
    this.deleteIsLoading = true
    try {
      const response = await this.dataInventoryApiHelperService.deleteManualDraftRequest(bpaRequestId, true);
      if (response) {
        this.prepareFilters()
      }
    } catch (error) {
      console.error('Error:', error);
    }
    this.deleteIsLoading = false
  }

  setUserPermissions() {
    this.createBpa = this.rolePermissionService.createBpa || this.rolePermissionService.fullAccessBpa;
    this.editBpa = this.rolePermissionService.editBpa || this.rolePermissionService.fullAccessBpa;
    this.viewBpa = this.rolePermissionService.viewBpa || this.rolePermissionService.fullAccessBpa;
  }

  clearServiceData() {
    this.assessmentService.clearRouteDetails();
    this.createBpaService.clearAllList()
  }

  get errorTitle() {
    return (this.filterConfiguration.searchText ? 'No processing activities match your search criteria' :
      this.filterApplied
        ? `No processing activities match the selected view`
        : this.selectedTabIndex == 0
          && this.bpaActivityList ? `No processing activities have been created yet`
          : `There are no draft processing activity available`)
  }

  get isEmptyRequest() {
    return this.bpaActivityList?.length ? false : true
  }
}
