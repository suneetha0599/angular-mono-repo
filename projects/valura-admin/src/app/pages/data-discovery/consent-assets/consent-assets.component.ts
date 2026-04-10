import { AfterViewInit, Component, ElementRef, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { Router } from '@angular/router';
import { ItemNotFoundComponent } from "@valura-lib/components/item-not-found/item-not-found.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDrawer, MatDrawerContainer, MatSidenav } from "@angular/material/sidenav";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { formatStatus, statusColors, statusTextColors } from '../../request-management/request-utils';
import { DsrRequest } from '@admin-core/models/request-management/DsrRequest';
import { routes as routeConstants } from '@admin-core/constants/routes';
import {
  ALL, ASSET_HEADER, ASSET_TYPE, DRAFTS, FIRST_PAGE, HEADER_ACTION, HEADER_DATE, HEADER_DESCRIPTION, HEADER_HOSTING_TYPE, HEADER_NAME, HEADER_SYSTEM_OWNER, HEADER_STATUS, OPEN, PAGE_SIZE, PRIORITY,
  TAB_HEADER_DETAILS,
} from './constant';
import { Assets } from '@admin-core/models/request-management/Assets';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AssetDrawerComponent } from './asset-drawer/asset-drawer.component';
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { firstValueFrom } from 'rxjs';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { AssetService } from '@admin-core/services/asset/asset.service';
import { AssetFilterConfiguration } from '@admin-core/models/data-inventory/AssetFilterConfiguaration';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
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
  selector: 'app-consent-assets',
  imports: [CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule, MatMenuModule, MatButtonModule, MatTabsModule, MatTooltipModule,
    NgClass, EllipsisTooltipDirective, LoadingButtonComponent, AssetDrawerComponent, FormsModule, ItemNotFoundComponent, MatCheckbox,
    MatDrawer, MatDrawerContainer, NgModelDebounceChangeDirective, MatFormFieldModule, MatInputModule, MatSlideToggleModule, ErrorLoadingItemsComponent],
  templateUrl: './consent-assets.component.html',
  styleUrl: './consent-assets.component.scss'
})
export class ConsentAssetsComponent {
  showSearch: boolean = false;
  sortByField: string = '';
  sortDirection: string = '';
  dialogRef: MatDialogRef<any> | null = null;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  isActive: boolean = false;
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE
  HEADER_ACTION = HEADER_ACTION
  HEADER_DESCRIPTION = HEADER_DESCRIPTION
  HEADER_HOSTING_TYPE = HEADER_HOSTING_TYPE
  HEADER_SYSTEM_OWNER = HEADER_SYSTEM_OWNER
  ALL = ALL
  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  selectedTab: string = ALL
  currentPath: string = '';
  dataSource = new MatTableDataSource<any>();
  assetsList: Assets[] = []
  filteredDataSource: Assets[] = []
  selectedTabIndex = 0;
  filterConfiguration: AssetFilterConfiguration = new AssetFilterConfiguration({})
  STATUS = "STATUS";
  ASSIGNED_TO = "ASSIGNED_TO"
  DATA_SUBJECT_TYPE = "DATA_SUBJECT_TYPE"
  tabHeaderDetails = TAB_HEADER_DETAILS
  filterApplied: boolean = false;
  requestLoading: boolean = true;
  isLoading: boolean = true;
  ASSET_NAME = 'ASSET_NAME';
  ASSET_TYPE = 'ASSET_TYPE';
  DEPARTMENT = 'DEPARTMENT';
  ASSET_CATEGORY = 'ASSET_CATEGORY';
  assetTypes = ASSET_TYPE
  selectedAsset: Asset | null = null;
  hasApiError: boolean = false;
  initialListIsEmpty: boolean = false;
  shimmerDataSource = Array(4).fill({});

  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('toggleDialog') toggleDialogTemplate !: TemplateRef<any>;

  private assetService = inject(AssetService)
  private apiHelperService = inject(ApiHelperService);

  constructor(private router: Router, private dialog: MatDialog) {
    this.filterConfiguration = new AssetFilterConfiguration({
      assetTypeList: ASSET_TYPE,
    });
  }

  ngOnInit() {
    this.onInitPage()
    this.assetService.clearAssetNavigationState()
    // this.updateTabCounts();
    this.setTableInfo()
  }

  ngAfterViewInit() {
    this.setTablePaginator()
    this.dataSource.sort = this.sort;
    Promise.resolve().then(() => {
      this.restoreSavedFilters();
    });


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
    // this.resetAllFilter()
    // this.setTableInfo()
    this.prepareFilters(this.FIRST_PAGE, this.sortByField, this.sortDirection);
    this.scrollToTop()
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    // this.getFilterConfiguration()
  }

  onClickName(request: any) {
    const assetId = this.isDraftSelected ? request.requestId : request.assetId;
    this.storeTabFilter()
    this.setCurrentRequestList()

    if (this.selectedTab == DRAFTS) {
      this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`], {
        queryParams: { requestRid: assetId }
      })
      return
    }
    this.router.navigate([`${this.currentPath}/${routeConstants.ASSETS_DETAILS}/${assetId}`])
  }

  onCreateRequest() {
    this.storeTabFilter()
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_REQUEST_MANAGEMENT}`])
  }
  storeAssetFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page };
    this.assetService.storeAssetFilter(filterData);
  }

  storeAssetListingFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.assetService.storeAssetListingFilter(filterData);
  }

  storeTabFilter() {
    const filterData = { total: this.totalItems, page: this.pageNo, selectedTab: this.selectedTab };
    this.assetService.storeAssetListingFilter(filterData)
  }

  async setTableInfo() {
    this.tableHeaders = ASSET_HEADER;
    this.dataSource = new MatTableDataSource<DsrRequest>;
    // await this.getAssetsList();
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
  }

  get isDraftSelected(): boolean {
    return this.selectedTab === DRAFTS
  }

  async getAssetsList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = this.sortByField, sortDirection: string = this.sortDirection, onInit: boolean = false) {
    const tabStatusFilters = this.getTabStatus()
    let params: any = {
      page: pageNo,
      size: this.pageSize,
      ...tabStatusFilters
    }

    if (filters) {
      params = { ...params, ...filters }
    }
    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }
    this.hasApiError = false;
    this.requestLoading = true
    this.isLoading = true;
    let res;
    try {
      if (this.isDraftSelected) {
        res = await this.apiHelperService.getDraftManualRequests({
          key: 'MANUAL_ASSET_REQUEST',
          page: pageNo,
          size: this.pageSize,
          ...filters
        });
      }
      else {
        res = await this.apiHelperService.getAssetList(params);
      }
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo
      if (res) {
        if (this.isDraftSelected) {
          this.assetsList = (res?.content ?? []).map((item: any, index: number) => ({
            assetId: ((pageNo - 1) * this.pageSize) + index + 1,
            requestId: item.id ?? '',
            name: item.formData?.name ?? '',
            description: item.formData?.description ?? '',
            assetType: item.formData?.assetType ?? '',
            assetCategory: item.formData?.assetCategoryId?.name ?? '',
            departmentName: item.formData?.departmentId?.name ?? '',
            systemOwnerName: item.formData?.systemOwner ?? '',
            hostingType: (item.formData?.hostingDetails ?? [])
              .map((h: any) => h.site)
              .join(', '),
            vendorName: item.formData?.vendorId?.name ?? '',
            status: item.formData?.status ?? '',
            createdAt: item.formData?.createdAt ?? '',
            needsAction: item.formData?.needsAction ?? false,
          }));
        } else {
          this.assetsList = (res?.assets ?? []).map((item: any) => ({
            ...item,
            hostingType: (item.hostingSite ?? []).join(', '),
          }));
        }
        this.dataSource = new MatTableDataSource(this.assetsList);
        this.filteredDataSource = this.assetsList;
        this.totalItems = res?.totalFilteredItemsCount ?? 0;
        this.paginator.length = Number(res?.totalFilteredItemsCount ?? 0);
        this.paginator.pageIndex = this.pageNo - 1;
        this.paginator.pageSize = this.pageSize;
        this.setRequestTabCount(res, params);
        if (pageNo === FIRST_PAGE) {
          if (!this.initialListIsEmpty) {
            if (onInit && (!Object.keys(filters)?.length) && (!this.assetsList?.length)) {
              this.initialListIsEmpty = true;
            }
          }
        }
      }
      else {
        this.hasApiError = true;
      }
    }
    catch (e) {
      console.error(e)
      this.hasApiError = true;
    }
    finally {
      this.requestLoading = false
      this.isLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
      this.scrollToTop();
    }
  }
  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  searchFilter() {
    this.rightDrawer.open()
  }

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  async getFilterConfiguration() {
    await Promise.all([
      this.getCategorises(),
      this.getdepartments()
    ]);
  }

  async getCategorises() {

    const res = await this.apiHelperService.getCategorises();
    if (res) {
      this.filterConfiguration.assetCategoryList = res.assetCategories ?? [];
    }
    return
  }

  async getdepartments() {

    const res = await this.assetService.getDepartmentList();
    if (res) {
      this.filterConfiguration.departmentNameList = res ?? [];
    }
    return
  }

  resetAllFilter() {
    if (!this.filterApplied) {
      return
    }

    this.filterConfiguration.selectedAssetCategory = [];
    this.filterConfiguration.selectedAssetType = [];
    this.filterConfiguration.selectedDepartment = [];


    this.filterConfiguration.tempselectedAssetCategory = [];
    this.filterConfiguration.tempselectedAssetType = [];
    this.filterConfiguration.tempselectedDepartment = [];

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
    this.resetTopFilters(type);

    if (menuTrigger) {
      menuTrigger.closeMenu()
    }
    this.prepareFilters()
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
      this.resetTopFilters('DEPARTMENT');
    }

    this.prepareFilters();
  }

  async restoreSavedFilters() {
    await this.getFilterConfiguration()
    const filters = this.assetService.getAssetListingFilter();
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

      fc.selectedAssetType = fc.assetTypeList.filter(item =>
        saved.selectedAssetType?.some((s: any) => s.key === item.key)
      );

      fc.selectedAssetCategory = fc.assetCategoryList.filter(item =>
        saved.selectedAssetCategory?.some((s: any) => s.id === item.id)
      );

      fc.selectedDepartment = fc.departmentNameList.filter(item =>
        saved.selectedDepartment?.some((s: any) => s.id === item.id)
      );


      fc.searchText = saved.searchText ?? '';
      this.openSearchIfTextExists()
      this.resetTopFilters();

      this.prepareFilters(
        filters.page ?? 1,
        this.sortByField,
        this.sortDirection
      );

      setTimeout(() => this.assetService.clearAssetFilters());
      return

    }
    this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
    setTimeout(() => this.assetService.clearAssetListingFilters());
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

  stopDefaultBehaviour(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onCloseMenu(type: string) {
    this.resetTopFilters(type)
  }

  resetTopFilters(type: string = "") {
    if (type == this.DEPARTMENT || !type) {
      this.filterConfiguration.tempselectedDepartment = [...this.filterConfiguration.selectedDepartment]
      this.filterConfiguration.departmentNameList.map(ds => {
        let checked = this.filterConfiguration.tempselectedDepartment.includes(ds)
        ds.selected = checked
      })
    }
    if (type == this.ASSET_CATEGORY || !type) {
      this.filterConfiguration.tempselectedAssetCategory = [...this.filterConfiguration.selectedAssetCategory]
      this.filterConfiguration.assetCategoryList.map(assignedTo => {
        let checked = this.filterConfiguration.tempselectedAssetCategory.includes(assignedTo)
        assignedTo.selected = checked
      })
    }
    if (type == this.ASSET_TYPE || !type) {
      this.filterConfiguration.tempselectedAssetType = [...this.filterConfiguration.selectedAssetType]
      this.filterConfiguration.assetTypeList.map(assignedTo => {
        let checked = this.filterConfiguration.tempselectedAssetType.includes(assignedTo)
        assignedTo.selected = checked
      })
    }
  }

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {};

    if (this.filterConfiguration.selectedAssetCategory?.length) {
      filters['assetCategoryIds'] = this.filterConfiguration.selectedAssetCategory.map((item) => item.id);
    }

    if (this.filterConfiguration.selectedDepartment?.length) {
      filters['departmentIds'] = this.filterConfiguration.selectedDepartment.map((item) => item.id);
    }

    if (this.filterConfiguration.selectedAssetType?.length) {
      filters['assetType'] = this.filterConfiguration.selectedAssetType.map(item => item.key);
    }

    if (this.filterConfiguration.searchText) {
      filters['searchText'] = this.filterConfiguration.searchText.trim();
    }

    this.filterApplied = true;
    if (!Object.keys(filters).length || this.filterConfiguration.searchText) {
      this.filterApplied = false;
    }
    this.getAssetsList(pageNo, filters, sortBy, sortDirection, onInit);
  }

  setCurrentRequestList() {
    let reqRidList: any = [];
    this.assetsList.map((item) => {
      reqRidList.push({ 'assetId': item.assetId, 'assetName': item.name })
    })
    this.assetService.setDsrRequestRid(reqRidList);
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
          const totalItems = +(res?.draftRequestsCount ?? 0);
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

    const searchText = this.filterConfiguration.searchText?.trim() || '';
    const filterData = { ...params, total: this.totalItems, page: params.page, searchText }
    this.storeAssetFilter(filterData);
    this.storeAssetListingFilter(filterData);

  }

  get showRequestList() {
    return this.assetsList?.length || this.pageNo > 1
  }

  get isEmptyRequest() {
    return this.assetsList?.length ? false : true
  }

  createAsset() {
    this.storeTabFilter()
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_ASSETS}`])

  }

  get allTabSelected(): boolean {
    return this.selectedTab === ALL
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

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    if (backendField) {
      this.sortByField = backendField;
      this.sortDirection = event.direction;
      this.prepareFilters(this.FIRST_PAGE, backendField, event.direction);
    }
  }

  private sortFieldMapping: any = {
    assetId: 'id',
    name: 'name',
    description: 'description',
    systemOwnerName: 'systemOwner',
    assetType: 'type',
  };

  get selectedDepartment() {
    return this.filterConfiguration.selectedDepartment?.length ?? 0;
  }

  get selectedAssetType() {
    return this.filterConfiguration.selectedAssetType?.length ?? 0;
  }

  get selectedAssetCategory() {
    return this.filterConfiguration.selectedAssetCategory?.length ?? 0;
  }

  get showdepartmentNameList() {
    return this.filterConfiguration.departmentNameList?.length;
  }

  get showassetType() {
    return this.filterConfiguration.assetTypeList?.length;
  }

  get showassetCategory() {
    return this.filterConfiguration.assetCategoryList?.length;
  }

  async onCancel(): Promise<void> {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }


  async onSave(): Promise<void> {
    if (!this.selectedAsset) return;
    const payload = { status: this.isActive ? 'ACTIVE' : 'IN_ACTIVE' };
    try {
      const data = await firstValueFrom(
        this.apiHelperService.onPatchAssetData(payload, +this.selectedAsset.assetId)
      );
      if (data) {
        this.selectedAsset.status = payload.status;
        this.dataSource.data = [...this.assetsList];
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      if (this.dialogRef) {
        this.dialogRef.close();
      }
    }
  }

  async toggleStatus(row: Asset) {
    const previousStatus = row.status;
    const newStatus = row.status === 'ACTIVE' ? 'IN_ACTIVE' : 'ACTIVE';
    const payload = { status: newStatus };

    try {
      const data = await firstValueFrom(
        this.apiHelperService.onPatchAssetData(payload, +row.assetId)
      );

      if (data) {

        const index = this.assetsList.findIndex(a => +(a.assetId) === +(row.assetId));
        if (index !== -1) {
          this.assetsList[index].status = newStatus;
        }
        this.dataSource.data = [...this.assetsList];
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      row.status = previousStatus;
    }
  }



  async togglePopUp(asset: Asset) {
    this.selectedAsset = asset;
    this.isActive = asset.status === 'ACTIVE';

    this.dialogRef = this.dialog.open(this.toggleDialogTemplate, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      panelClass: 'dialog-wrapper'
    });

  }


  onEdit(data: any) {
    const id = data?.assetId;
    this.router.navigate(
      ['/user/data-discovery/assets/create'],
      { queryParams: { assetId: id, mode: 'edit' } }
    );
  }

  get warningMessage() {
    return `Incomplete asset details!`
  }

  get errorTitle() {
    return (this.filterConfiguration.searchText ? 'No assets match your search criteria' :
      this.filterApplied
        ? `No assets match the selected view`
        : this.selectedTabIndex == 0
          && this.assetsList?.length === 0 ? `No assets have been created yet`
          : `There are no draft assets available`)
  }

}
