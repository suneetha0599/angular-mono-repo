import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from "@angular/material/form-field";
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { FormsModule } from '@angular/forms';
import { MatSidenav, MatDrawerContainer, MatSidenavModule } from '@angular/material/sidenav';
import { COLLECTION_TYPE, FIRST_PAGE } from '../consent-assets/constant';
import { MatMenuTrigger, MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { CollectionDrawerComponent } from "./collection-drawer/collection-drawer.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { MatTabsModule } from '@angular/material/tabs';
import { CollectionPointService } from '@admin-core/services/collection-point/collection-point.service';
import { CollectionPointFilterConfiguration } from '@admin-core/models/data-inventory/collectionPointFilterConfiguration';
import { ALL } from './constants';
import { MatDialog } from '@angular/material/dialog';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';

interface CollectionPoint {
  collectionPointID: string;
  id: number
  collectionPointName: string;
  type: string;
  linkedBpa: number;
  pdElements: number;
  status: string;
}

@Component({
  selector: 'app-collection-point',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    MatDrawerContainer,
    MatSidenavModule,
    MatInputModule,
    NgModelDebounceChangeDirective,
    CollectionDrawerComponent,
    MatMenuModule,
    MatCheckboxModule,
    LoadingButtonComponent,
    MatTabsModule,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './collection-point.component.html',
  styleUrl: './collection-point.component.scss'
})
export class CollectionPointComponent implements OnInit, AfterViewInit {
  currentPath: string = '';
  displayedColumns: string[] = ['collectionPointID', 'collectionPointName', 'type', 'linkedBpa', 'pdElements', 'status'];
  dataSource = new MatTableDataSource<CollectionPoint>([]);
  filteredDataSource: CollectionPoint[] = [];
  pageSize: number = 10;
  totalItems: number = 0;
  currentPage: number = 0;
  isLoading: boolean = true;
  filterApplied: boolean = false;
  showFilters: boolean = false;
  showSearch: boolean = false;
  sortByField: string = '';
  sortDirection: string = 'asc';
  collectionTypes = COLLECTION_TYPE;
  selectedTab: string = ALL
  selectedTabIndex = 0;
  initialListIsEmpty: boolean = false;

  tabHeaderDetails = [
    { name: 'All Collection Point', count: 0, key: ALL },

  ];
  filterConfiguration: CollectionPointFilterConfiguration = new CollectionPointFilterConfiguration({})
  pageNo: number = FIRST_PAGE;

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    collectionPointID: '',
    collectionPointName: '',
    type: '',
    linkedBpa: '',
    pdElements: 0
  }));
  hasApiError: boolean = false
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef


  constructor(
    private router: Router,
    private apiHelper: ApiHelperService,
    private collectionPointService: CollectionPointService,
    public dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<CollectionPoint>([]);
    this.filterConfiguration = new CollectionPointFilterConfiguration({
      collectionTypeList: COLLECTION_TYPE,
    });

  }

  ngOnInit(): void {
    this.onInitPage();
    // this.loadCollectionPoints();
  }

  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }



  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
      setTimeout(() => {
        this.restoreSavedFilters();
      });
    }
  }


  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }
  async restoreSavedFilters() {
    const filters = this.collectionPointService.getCollectionPointFilter();
    if (!filters) {
      this.prepareFilters();
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

      fc.selectedCollectionType = fc.collectionTypeList.filter(item =>
        saved.selectedCollectionType?.some((s: any) => s.key === item.key)
      );


      fc.searchText = saved.searchText ?? '';
      this.openSearchIfTextExists()
      this.resetTopFilters();

      this.prepareFilters(
        filters.page ?? 1,
        this.sortByField,
        this.sortDirection
      );

      setTimeout(() => this.collectionPointService.clearCollectionPointFilter(), 100);
      return;
    }
    this.prepareFilters(filters.page ?? 1,
      this.sortByField,
      this.sortDirection);
    setTimeout(() => this.collectionPointService.clearCollectionPointFilter());
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

  originalDataSource: any[] = [];

  get errorTitle() {
    return this.filterConfiguration.searchText ? `No collection points match your search criteria`
      : this.filterApplied ? 'No collection points match the selected view' :
        `No collection points have been added yet`
  }

  async loadCollectionPoints(
    pageNo: number = this.currentPage + 1,
    filters: any = null,
    sortBy: string = this.sortByField,
    sortDirection: string = this.sortDirection
  ): Promise<void> {
    this.isLoading = true;
    this.hasApiError = false;
    try {
      let params: any = {
        page: pageNo,
        size: this.pageSize
      };

      if (filters) params = { ...params, ...filters };

      if (sortBy && sortDirection) {
        params['sortBy'] = sortBy;
        params['sortDirection'] = sortDirection.toUpperCase();
      }

      const res = await this.apiHelper.getCollectionPoints(params);
      if (!res || res.success == false) {
        this.hasApiError = true;
        return
      }
      this.pageNo = pageNo;
      if (res && res.sourceListing) {
        const collectionPoints: CollectionPoint[] = res.sourceListing.map((item: any, index: number) => ({
          id: item.id,
          collectionPointID: ((pageNo - 1) * this.pageSize) + index + 1,
          collectionPointName: item.sourceName || 'N/A',
          type: item.type || 'N/A',
          linkedBpa: item.sourceBpaMappingsCount || 0,
          pdElements: item.pdMappingsCount || 0,
          bpa_mappings: item.bpa_mappings || [],
          pd_mappings: item.pd_mappings || [],
          created_at: item.created_at || null,
          status: item.status ?? '-',
        }));

        this.originalDataSource = collectionPoints;

        this.dataSource = new MatTableDataSource(collectionPoints);
        this.filteredDataSource = collectionPoints;
        this.totalItems = +(res.totalFilteredItemsCount) || 0;

        if (pageNo === FIRST_PAGE && this.paginator) {
          this.setRequestTabCount(res, params)
          this.paginator.firstPage();
        }
        if (!this.initialListIsEmpty) {
          if ((!Object.keys(filters)?.length) && (!this.originalDataSource?.length)) {
            this.initialListIsEmpty = true;
          }
        }
      } else {
        this.dataSource.data = [];
        this.totalItems = 0;
      }

    } catch (error) {
      console.error('Error loading collection points:', error);
      this.dataSource.data = [];
      this.totalItems = 0;
      this.hasApiError = true;
    } finally {
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    }
  }

  setRequestTabCount(res: any, params: any) {
    let totalItems = 0;
    this.tabHeaderDetails.map((tabHeader, index) => {

      if (this.allTabSelected) {
        totalItems = +(res?.totalFilteredItemsCount ?? 0);
        this.tabHeaderDetails[index].count = totalItems;
      }

      this.totalItems = +totalItems;
    });
    const searchVal = this.filterConfiguration.searchText?.trim() || '';
    this.storeBpaFilter({ ...params, searchQuery: searchVal, searchText: searchVal });
  }


  get allTabSelected(): boolean {
    return this.selectedTab === ALL
  }

  applyTabFilter(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    // this.resetAllFilter();
    this.prepareFilters(FIRST_PAGE, this.sortByField, this.sortDirection);
    this.scrollToTop()

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

  searchFilter() {
    this.rightDrawer.open()
  }
  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    if (backendField) {
      this.sortByField = backendField;
      this.sortDirection = event.direction;
      this.prepareFilters(FIRST_PAGE, backendField, event.direction);
    }
  }

  private sortFieldMapping: any = {
    collectionPointID: 'id',
    collectionPointName: 'sourceName',
    description: 'description',
    systemOwnerName: 'systemOwner',
    type: 'type',
  };

  onPageChange(event: PageEvent): void {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize ?? this.pageSize;
      this.currentPage = event.pageIndex;
      this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
      this.scrollToTop()

    }
  }

  private formatBpaMappings(bpaMappings: any[]): string {
    if (!bpaMappings || bpaMappings.length === 0) {
      return 'No BPA linked';
    }


    const uniqueBpas = [...new Set(bpaMappings.map(bpa => bpa.name))];

    if (uniqueBpas.length === 1) {
      return uniqueBpas[0];
    } else {
      return `${uniqueBpas[0]} +${uniqueBpas.length - 1} more`;
    }
  }

  setCurrentCollectionPointList() {
    let reqRidList: any = [];
    this.filteredDataSource.map((item) => {
      reqRidList.push({ 'id': item.id, })
    })
    this.collectionPointService.setCOLLPOINTRequestRid(reqRidList);
  }

  viewCollectionPointDetails(collectionPoint: CollectionPoint): void {
    this.storeTabFilter()
    this.setCurrentCollectionPointList();
    this.router.navigate([`${this.currentPath}/details/${collectionPoint.id}`], {
      state: { collectionPoint }
    });
  }

  resetAllFilter() {
    if (!this.filterApplied) {
      return
    }

    this.filterConfiguration.selectedCollectionType = [];
    this.filterConfiguration.tempselectedCollectionType = [];

    this.resetTopFilters()
    this.prepareFilters()
  }

  toggleSelection(filterKey: string, value: any) {
    value.selected = !value.selected

    if (filterKey == 'COLLECTION_TYPE') {
      const index = this.filterConfiguration.tempselectedCollectionType.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempselectedCollectionType.push(value);
      } else {
        this.filterConfiguration.tempselectedCollectionType.splice(index, 1);
      }
    }

  }



  applyFilterFromDrawer() {

    this.filterConfiguration.selectedCollectionType = [
      ...this.filterConfiguration.tempselectedCollectionType,
    ];
    this.resetTopFilters();
    this.prepareFilters();

  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == 'COLLECTION_TYPE') {
      this.filterConfiguration.selectedCollectionType = [...this.filterConfiguration.tempselectedCollectionType]
    }
    this.resetTopFilters(type);

    if (menuTrigger) {
      menuTrigger.closeMenu()
    }
    this.prepareFilters()
  }

  clearSelection(filterKey: 'selectedCollectionType') {

    if (filterKey === 'selectedCollectionType') {
      if (!this.filterConfiguration.selectedCollectionType?.length) return;
      this.filterConfiguration.selectedCollectionType = [];
      this.resetTopFilters('COLLECTION_TYPE');
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

    if (type == 'COLLECTION_TYPE' || !type) {
      this.filterConfiguration.tempselectedCollectionType = [...this.filterConfiguration.selectedCollectionType]
      this.filterConfiguration.collectionTypeList.map(assignedTo => {
        let checked = this.filterConfiguration.tempselectedCollectionType.includes(assignedTo)
        assignedTo.selected = checked
      })
    }
  }


  storeBpaFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.collectionPointService.storeCollectionPointFilter(filterData);
  }

  storeTabFilter() {
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab };
    this.collectionPointService.storeCollectionPointFilter(filterData)
  }
  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '') {
    let filters: any = {};

    if (this.filterConfiguration.selectedCollectionType?.length) {
      filters['type'] = this.filterConfiguration.selectedCollectionType.map(item => item.key);
    }

    if (this.filterConfiguration.searchText) {
      filters['searchQuery'] = this.filterConfiguration.searchText.trim();
    }

    this.filterApplied = true;
    if (!Object.keys(filters).length || this.filterConfiguration.searchText) {
      this.filterApplied = false;
    }
    this.loadCollectionPoints(pageNo, filters, sortBy, sortDirection);
  }

  get selectedCollectionType() {
    return this.filterConfiguration.selectedCollectionType?.length ?? 0;
  }

  get showCollectionType() {
    return this.filterConfiguration.collectionTypeList?.length;
  }

  get showRequestList() {
    return this.filteredDataSource?.length || this.pageNo > 1
  }
}