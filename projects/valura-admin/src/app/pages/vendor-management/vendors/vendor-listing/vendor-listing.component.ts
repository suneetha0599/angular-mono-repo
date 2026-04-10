import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';

import { MatPaginator, MatPaginatorModule, PageEvent, } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule, NgModel } from '@angular/forms';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ALL, FIRST_PAGE, PAGE_SIZE, OPEN, PRIORITY, DRAFTS } from '@admin-page/data-discovery/bpa-listing/constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HEADER_ACTION, HEADER_DATE, HEADER_ASSETS, HEADER_NAME, HEADER_VENDOR_STATUS, POINT_OF_CONTACT, VENDOR_ID, VENDOR_LISTING_HEADER, STATUS, HEADER_BPA, HEADER_CREATED_ON, VENDOR_LISTING_HEADER_DRAFT, Status } from '../constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AuthService } from '@admin-core/services/auth.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { Vendor } from '@admin-core/models/DataDiscovery/Vendor';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ActiveStaus, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { statusColors, statusTextColors } from '../vender-utils';
import { MatDividerModule } from '@angular/material/divider';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { VendorDrawerComponent } from '../vendor-drawer/vendor-drawer.component';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { buildVendorStatusUpdateCommand, VendorService } from '@admin-core/services/vendor/vendor.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { vendorStatusUpdateMessage } from '@admin-core/utils/error-message/vendor-error-message-util';

const { VENDORS_DETAILS, VENDORS } = routeConstants
@Component({
  selector: 'app-vendor-listing',
  imports: [EllipsisTooltipDirective, CommonModule, MatButtonModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatTabsModule, MatIconModule, MatSortModule, MatCheckboxModule,
    MatPaginatorModule, MatMenuModule, LoadingButtonComponent, MatSidenavModule, MatButtonToggleModule, FormsModule, MatSlideToggleModule,
    MatInputModule, MatDividerModule, VendorDrawerComponent, NgModelDebounceChangeDirective, ItemNotFoundComponent, MatTooltipModule, ErrorLoadingItemsComponent],
  templateUrl: './vendor-listing.component.html',
  styleUrl: './vendor-listing.component.scss'
})

export class VendorListingComponent {

  dataSource = new MatTableDataSource<any>();
  SEGMENT_TASK = 'TASK';
  SEGMENT_CLARIFICATION = 'CLARIFICATION';
  selectedSegment?: string = this.SEGMENT_TASK;
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME;
  HEADER_VENDOR_STATUS = HEADER_VENDOR_STATUS;
  HEADER_ASSETS = HEADER_ASSETS;
  HEADER_DATE = HEADER_DATE;
  HEADER_ACTION = HEADER_ACTION;
  HEADER_CONTACT_PERSON_NAME = POINT_OF_CONTACT;
  VENDOR_ID = VENDOR_ID;
  HEADER_BPA = HEADER_BPA;
  HEADER_CREATED_ON = HEADER_CREATED_ON;
  ALL = ALL;
  pageSize: number = PAGE_SIZE;
  FIRST_PAGE = FIRST_PAGE;
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE;
  selectedTab: string = ALL;
  currentPath: string = '';
  selectedTabIndex = 0;
  STATUS = 'STATUS';
  POINT_CONTACT = 'POINT_CONTACT';
  POINT_DESIGNATION = 'POINT_DESIGNATION';
  tabHeaderDetails = [
    { name: 'All Vendors', count: 0, key: ALL },
    { name: 'Drafts', count: 0, key: DRAFTS },
  ];
  isLoading = true;
  shimmerDataSource = Array(4).fill({});

  filterApplied: boolean = false;
  requestLoading: boolean = true;
  assigned: boolean = false;

  vendorList: Vendor[] = [];
  status = STATUS;
  initialListIsEmpty: boolean = false;
  tabFilterIsRestored: boolean = false;

  private apiHelperService = inject(ApiHelperService);
  private authService = inject(AuthService);
  private vendorService = inject(VendorService);
  private rolePermissionService = inject(RolePermissionService);
  canCreateVendor: boolean = false;
  canEditVendor: boolean = false;
  canViewVendor: boolean = false;


  private snackbarService = inject(SnackbarService);
  private requestManagementService = inject(RequestManagementService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('fromDate') fromDate!: NgModel;
  @ViewChild('toDate') toDate!: NgModel;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef

  private searchSubject = new Subject<string>();
  maxDateFilter = new Date();
  minToDateFilter = new Date();
  filterConfiguration: FilterConfiguration = new FilterConfiguration({})
  sortByField: string = '';
  sortDirection: string = '';
  showSearch: boolean = false;
  filteredDataSource: Vendor[] = [];
  hasApiError: boolean = false;

  constructor(private router: Router, private dialog: MatDialog) {
    let today = new Date();
    today.setHours(23, 59, 9);
    this.maxDateFilter = today;
  }

  ngOnInit() {
    this.setUserPermissions();
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
    this.setTableInfo()
  }

  getAssetsDisplay(row: any): string {
    if (!row || row.length === 0) {
      return '-';
    }
    const [first, ...rest] = row;
    return rest.length ? `${first} +${rest.length}` : first;
  }

  getAssetsTooltip(row: any): string {
    if (!row || row.length === 0) {
      return '-';
    }
    return row.join(', ');
  }

  ngAfterViewInit() {
    this.setTablePaginator();
    this.dataSource.sort = this.sort;
    setTimeout(() => {
      this.restoreSavedFilters();
    });
  }
  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  async restoreSavedFilters() {
    const filters = this.vendorService.getVendorFilter();
    if (!filters) {
      this.prepareFilters(FIRST_PAGE, '', '', true);
      return;
    }


    if (filters?.selectedTab) {
      this.tabFilterIsRestored = true;
      this.selectedTab = filters.selectedTab;
      const idx = this.tabHeaderDetails.findIndex(t => t.key === filters.selectedTab);
      if (idx !== -1) this.selectedTabIndex = idx;
    }
    const allVendorCount = filters?.allVendorCount;
    if (allVendorCount && this.isDraftSelected) {
      const allTab = this.tabHeaderDetails.find(tab => tab.key == ALL);
      if (allTab) {
        allTab.count = allVendorCount;
      }
    }
    if (filters?.page) {
      this.pageNo = filters.page ?? this.pageNo;
      this.pageSize = filters.size ?? this.pageSize;
      if (this.paginator) this.paginator.pageIndex = filters.page - 1;
    }
    if (filters?.filterConfiguration) {
      const saved = filters.filterConfiguration;
      const fc = this.filterConfiguration;

      fc.vendorselectedStatus = fc.vendorstatusList.filter(item =>
        saved.vendorselectedStatus?.some((s: any) => s.key === item.key)
      );
      fc.searchText = saved.searchText ?? '';
      this.openSearchIfTextExists()
    }
    this.resetTopFilters();
    this.prepareFilters(filters.page ?? 1, this.sortByField, this.sortDirection);
    setTimeout(() => this.vendorService.clearVendorFilters(), 100);

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


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.setTableInfo();
    // this.resetAllFilter();
    if (!this.tabFilterIsRestored) {
      this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
    }
    this.scrollToTop()

  }

  searchFilter() {
    this.rightDrawer.open();
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

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
      this.scrollToTop()
    }
  }

  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = 'Rows per page:';
  }

  get allTabSelected(): boolean {
    return this.selectedTab === ALL
  }

  get showRequestList() {
    return this.vendorList?.length || this.pageNo > 1;
  }

  get isEmptyRequest() {
    return this.vendorList?.length ? false : true
  }

  async setTableInfo() {
    this.tableHeaders = this.isDraftSelected ? VENDOR_LISTING_HEADER_DRAFT : VENDOR_LISTING_HEADER;
    this.dataSource = new MatTableDataSource<Vendor>;
    // await this.getVendorList()
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  getStatusText(status: string): string {
    if (status == ActiveStaus.IN_ACTIVE) {
      return 'In Active';
    }
    return 'Active';
  }

  getTabStatus() {
    if (this.selectedTab == VENDORS) {
      return { isOpen: true }
    }
    if (this.selectedTab == DRAFTS) {
      return { isDraft: true }
    }
    return
  }

  get isDraftSelected(): boolean {
    return this.selectedTab === DRAFTS
  }

  setRequestTabCount(res: any, params: any) {
    let totalItems = 0;
    this.tabHeaderDetails.map((tabHeader, index) => {

      if (tabHeader.key == DRAFTS) {
        if (this.isDraftSelected) {
          totalItems = +(res?.totalItems ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
        else if (this.allTabSelected) {
          const totalItems = +(res?.totalDraftCount ?? 0);
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
    this.storeVendorFilter({ ...params, searchQuery: searchVal, searchText: searchVal });
  }

  storeVendorFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.vendorService.storeVendorFilter(filterData);
  }

  storeTabFilter() {
    const allTab = this.tabHeaderDetails.find(tab => tab.key == ALL);
    const allVendorCount = this.isDraftSelected ? allTab?.count ?? 0 : 0;
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab, allVendorCount: allVendorCount };
    this.vendorService.storeVendorFilter(filterData)
  }

  async getVendorList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = this.sortByField, sortDirection: string = this.sortDirection, onInit: boolean = false) {
    const tabStatusFilters = this.getTabStatus()

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
      params['sortDirection'] =
        this.selectedTabIndex === 0
          ? sortDirection
          : sortDirection.toUpperCase();
    }

    this.requestLoading = true;
    this.isLoading = true;
    let res;
    this.hasApiError = false;
    try {
      if (this.isDraftSelected) {
        res = await this.apiHelperService.getDraftManualRequests({
          key: 'MANUAL_VENDOR_REQUEST',
          ...params
        });
      }
      else {
        res = await this.apiHelperService.getVendorList(params);
      }

      if (!res) {
        this.hasApiError = true;
        return
      }

      this.pageNo = pageNo;
      if (res) {
        if (this.isDraftSelected) {
          this.vendorList = (res?.content ?? []).map((item: any, index: number) => ({
            // vendorId: ((pageNo - 1) * this.pageSize) + index + 1,
            id: item.id ?? '',
            name: item.formData?.name,
            description: item.formData?.description || '',
            serviceType: item.formData?.serviceType || '',
            thirdPartyType: item.formData?.vendorType?.name || item.formData?.vendorType?.label,
            pointOfContact: item.formData?.pointOfContact || '',
            externalEmail: item.formData?.externalEmail || '',
            address: item.formData?.address || '',
            location: item.formData?.location || '',
            phone: item.formData?.phone ?? null,
            businessSpocName: item.formData?.businessSpocName || '',
            internalEmail: item.formData?.internalEmail || '',
            status: item.formData?.status === "ACTIVE" ? true : false,
            createdOn: item.formData?.createdAt,
          }));
        } else {
          this.vendorList = res?.vendors ?? [];
        }
        this.dataSource = new MatTableDataSource(this.vendorList);
        this.filteredDataSource = this.vendorList;
        this.totalItems = +(res?.totalFilteredItemsCount ?? 0)

        if (pageNo === FIRST_PAGE) {
          this.setRequestTabCount(res, params)
          if (this.paginator) {
            this.paginator.firstPage();
          }
          if (!this.initialListIsEmpty) {
            if (onInit && (!Object.keys(filters)?.length) && (!this.vendorList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
    } catch (error) {
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
      this.isLoading = false;
      this.tabFilterIsRestored = false;
    }
  }


  setCurrentVendorList() {
    let reqRidList: any = [];
    this.vendorList.map((item) => {
      reqRidList.push({ 'vendorId': item.id, })
    })
    this.vendorService.setVendorRequestRid(reqRidList);
  }

  details(row: any, mode: 'view' | 'edit' = 'edit') {
    this.storeTabFilter()
    this.setCurrentVendorList();
    if (this.isDraftSelected) {
      const vendorId = row.id;
      if (!vendorId) {
        this.snackbarService.openSnack("Invalid vendor id!");
        return
      }
      this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_VENDOR_RECORD}`], {
        queryParams: { vendorId, mode: 'draft' },
      });
    } else {
      const vendorId = row.id;
      if (!vendorId) return;
      if (mode == 'edit') {
        this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_VENDOR_RECORD}`], {
          queryParams: { vendorId, mode: mode },
        });
      }
      else {
        this.router.navigate([`${this.currentPath}/${routeConstants.VENDORS_DETAILS}`], {
          queryParams: { vendorId, mode },
        })
      }


    }
  }


  addVendor() {
    this.storeTabFilter()
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_VENDOR_RECORD}`], {
      queryParams: { mode: 'add' }
    });
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.getFilterConfiguration()
  }

  setUserPermissions() {
    this.canCreateVendor = this.rolePermissionService.createVendor || this.rolePermissionService.fullAccessVendor;
    this.canEditVendor = this.rolePermissionService.editVendor || this.rolePermissionService.fullAccessVendor;
    this.canViewVendor = this.rolePermissionService.viewVendor || this.rolePermissionService.fullAccessVendor;
  }


  async getFilterConfiguration() {
    this.filterConfiguration = new FilterConfiguration({});
    this.filterConfiguration.vendorstatusList = STATUS;
  }

  onDelete(row: any) {
    if (row.loading) {
      return
    }
    const vendorId = row.id;
    if (!vendorId) {
      this.snackbarService.openSnack("Invalid vendor id!");
      return
    }
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this vendor?',
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
        row.loading = true
        if (this.isDraftSelected) {
          await this.dataInventoryApiHelperService.deleteManualDraftRequest(vendorId, true);
        }
        else {
          await this.apiHelperService.deletevendor(vendorId);
        }

        this.getVendorList();

      } catch (error) {
        console.error('Failed to delete vendor:', error);
      }
    });
  }

  toggleStatus(row: any) {
    const newStatus = row.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;
    this.updateVendorStatus(row, newStatus);
  }

  async updateVendorStatus(row: any, newStatus: Status.ACTIVE | Status.INACTIVE) {
    try {
      if (row.status === newStatus) return;
      const vendorId = row.id;
      const data = buildVendorStatusUpdateCommand(newStatus)
      await this.apiHelperService.editVendorDetails(data, vendorId, false);
      row.status = newStatus;
      this.snackbarService.openSnack(vendorStatusUpdateMessage());
    } catch (err) {
      console.error('Failed to update template status:', err);
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
    name: 'name',
    thirdPartyType: 'thirdPartyType',
    assetsLinked: 'assetsLinked',
    bpaLinked: 'bpaLinked',
    documentsLinked: 'documentsLinked',
    status: 'status',
    createdOn: 'createdOn'
  };

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {};

    if (this.filterConfiguration.vendorselectedStatus?.length) {
      filters['status'] = this.filterConfiguration.vendorselectedStatus.map((status) => status.key);
    }


    if (this.filterConfiguration.searchText) {
      filters['searchQuery'] = this.filterConfiguration.searchText.trim();
    }

    this.filterApplied = true;
    if (!Object.keys(filters).length || this.filterConfiguration.searchText) {
      this.filterApplied = false;
    }
    this.getVendorList(pageNo, filters, sortBy, sortDirection, onInit);
  }

  resetAllFilter() {
    if (!this.filterApplied) {
      return
    }

    this.filterConfiguration.vendorselectedStatus = [];


    this.filterConfiguration.vendortempSelectedStatus = [];

    // this.getFilterConfiguration();

    this.resetTopFilters()
    this.prepareFilters()
  }

  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected
    if (filterKey == this.STATUS) {
      const index = this.filterConfiguration.vendortempSelectedStatus.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.vendortempSelectedStatus.push(value);
      } else {
        this.filterConfiguration.vendortempSelectedStatus.splice(index, 1);
      }
    }
  }



  applyFilterFromDrawer() {

    this.filterConfiguration.vendorselectedStatus = [
      ...this.filterConfiguration.vendortempSelectedStatus,
    ];

    this.resetTopFilters();
    this.prepareFilters();

  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == this.STATUS) {
      this.filterConfiguration.vendorselectedStatus = [...this.filterConfiguration.vendortempSelectedStatus];
    }
    this.resetTopFilters(type);

    if (menuTrigger) {
      menuTrigger.closeMenu()
    }
    this.prepareFilters()
  }

  clearSelection(filterKey: 'status' | 'pointOfContact' | 'pointOfContactDesignation') {
    if (filterKey == 'status') {
      if (this.filterConfiguration.vendorselectedStatus.length == 0) {
        return;
      }
      this.filterConfiguration.vendorselectedStatus = [];
      this.resetTopFilters(this.STATUS);
    }

    this.prepareFilters();
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
      this.filterConfiguration.vendortempSelectedStatus = [...this.filterConfiguration.vendorselectedStatus]
      this.filterConfiguration.vendorstatusList.map(ds => {
        let checked = this.filterConfiguration.vendortempSelectedStatus.includes(ds)
        ds.selected = checked
      })
    }
  }

  get selectedStatus() {
    return this.filterConfiguration.vendorselectedStatus?.length ?? 0;
  }

  get showStatusFilter() {
    return this.filterConfiguration.vendorselectedStatus?.length;
  }

  get errorTitle() {
    return (this.filterConfiguration.searchText ? 'No vendors match your search criteria' :
      this.filterApplied
        ? `No vendors match the selected view`
        : this.selectedTabIndex == 0
          && this.vendorList ? `No vendors have been added yet`
          : `There are no draft vendors available`)
  }

  getDisplayValue(value: any): string {
    if (value === null || value === undefined) return '0';
    return value;
  }
}
