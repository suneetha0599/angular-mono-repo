import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ALL, DRAFTS, FIRST_PAGE, PAGE_SIZE, HEADER_NAME, HEADER_STATUS, HEADER_DATE, HEADER_ACTION, TEMPLATE_MODE, TemplateStatus, TEMPLAE_DRAFT_HEADERS, TEMPLAE_HEADERS, HEADER_DESCRIPTION, HEADER_LINKED_ASSESSMENTS, HEADER_CLONE_STATUS, CLONE, Status, TAB_HEADER_DETAILS, HEADER_CREATED_BY } from '../constants';
import { MatTabLabel } from '@angular/material/tabs';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import {
  MatDrawer,
  MatDrawerContainer,
  MatSidenav,
} from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { ViewChild } from '@angular/core';
import moment from 'moment';
import { MatButtonModule } from '@angular/material/button';
import { DsrDrawerContentComponent } from '../../../request-management/dsr-drawer-content/dsr-drawer-content.component';
import { MatMenu } from '@angular/material/menu';
import { MatMenuTrigger, MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { ItemNotFoundComponent } from '@valura-lib/components/item-not-found/item-not-found.component';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { buildDraftFromTemplateDetails, statusColors, statusTextColors } from '../template-utils';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { inject } from '@angular/core';
import { TemplateRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { GLOBAL_DIALOG_DEFAULTS, MANUAL_VENDOR_TEMPLATE_REQUEST, TEMPLATE_MANUAL_DRAFT_KEY } from '@admin-core/constants/constants';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { AssessmentTypeService } from '@admin-core/services/assessment-type/assessment-type.service';
import { MatCheckboxModule } from "@angular/material/checkbox";
import { TemplateDrawerComponent } from "../template-drawer/template-drawer.component";
import { templateFilterConFiguration } from '@admin-core/models/assessment/templateFilterConfiguration';
import { TemplateService } from '@admin-core/services/template/template.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { TemplateDuplicateProgressComponent } from './template-duplicate-progress/template-duplicate-progress.component';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { AuthService } from '@admin-core/services/auth.service';
import { templateDeleteMessage, templateStatusUpdateMessage } from '@admin-core/utils/error-message/template-error-message-util';
import { TemplatePreviewStateService } from '../template-preview-state.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { AssessemntSource } from '../../assessments/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
@Component({
  selector: 'app-list-template',
  imports: [
    MatTabLabel,
    MatTabsModule,
    CommonModule,
    MatDrawer,
    MatDrawerContainer,
    MatIconModule,
    MatButtonModule,
    MatMenu,
    MatMenuTrigger,
    MatMenuModule,
    MatPaginator,
    ItemNotFoundComponent,
    MatSortModule,
    MatTableModule,
    MatSlideToggleModule,
    LoadingButtonComponent,
    MatTooltipModule,
    FormsModule,
    MatInputModule,
    NgModelDebounceChangeDirective,
    EllipsisTooltipDirective,
    MatCheckboxModule,
    TemplateDrawerComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './list-template.component.html',
  styleUrl: './list-template.component.scss',
})
export class ListTemplateComponent {

  templateList: any[] = [];
  dataSource = new MatTableDataSource<any>();
  tableHeaders: any = [];
  displayedHeaders = [];
  TEMPLATE_MODE = TEMPLATE_MODE
  selectedTabIndex: number = 0;
  currentPath: string = '';
  ALL = ALL;
  DRAFTS = DRAFTS;
  filterApplied: boolean = false;
  isDelete: boolean = false;
  filterConfiguration: templateFilterConFiguration = new templateFilterConFiguration({});
  STATUS = 'STATUS';
  TEMPLATE_TYPE = 'TEMPLATE_TYPE';
  DATA_SUBJECT_TYPE = 'DATA_SUBJECT_TYPE';
  ASSIGNED_TO = 'ASSIGNED_TO';
  pageNo: number = FIRST_PAGE;
  templateLoading: Boolean = true;
  pageSize: number = PAGE_SIZE;
  totalItems: number = 0;
  assessmemntTypeList: any[] = [];
  drawerOpened = false;
  initialListIsEmpty: boolean = false;
  HEADER_NAME = HEADER_NAME;
  HEADER_STATUS = HEADER_STATUS;
  HEADER_DATE = HEADER_DATE;
  HEADER_ACTION = HEADER_ACTION;
  HEADER_DESCRIPTION = HEADER_DESCRIPTION;
  HEADER_LINKED_ASSESSMENTS = HEADER_LINKED_ASSESSMENTS;
  HEADER_CLONE_STATUS = HEADER_CLONE_STATUS;
  HEADER_CREATED_BY = HEADER_CREATED_BY;
  CLONE = CLONE;
  requestLoading: boolean = true;
  shimmerDataSource = Array(4).fill({});
  isActive: boolean = false;
  selectedTemplate: any = null;
  selectedTab: string = ALL
  deleteIsLoading: boolean = false;
  tabHeaderDetails = TAB_HEADER_DETAILS
  sortByField: string = '';
  sortDirection: SortDirection = '';
  sortByFieldBackend: string = '';
  sortDirectionBackend: string = '';
  showSearch: boolean = false;
  hasApiError: boolean = false;
  createAssessmentTemplate: boolean = false;
  editAssessmentTemplate: boolean = false;
  viewAssessmentTemplate: boolean = false;
  assessmentSource: string = AssessemntSource.GENERAL
  statusToggleLoading: boolean = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  @ViewChild('toggleDialog') toggleDialogTemplate !: TemplateRef<any>;
  @ViewChild('searchInput') searchInput!: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef

  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private assessmentTypeService = inject(AssessmentTypeService);
  private templateService = inject(TemplateService)
  private authService = inject(AuthService)
  private templatePreviewStateService = inject(TemplatePreviewStateService);
  private rolePermissionService = inject(RolePermissionService);

  private fb = inject(FormBuilder);
  dialogRef: MatDialogRef<any> | null = null;

  async ngOnInit(): Promise<void> {
    await this.onInitPage();

  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.disableClear = false;
      this.dataSource.sort = this.sort;
    }
    setTimeout(() => {
      this.restoreSavedFilters();
    });
  }



  async restoreSavedFilters() {
    await this.initializeFilterConfiguration()
    const filters = this.templateService.getTemplateRequestListingFilter();
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
      fc.tempSelectedStatus = fc.statusList.filter(item =>
        saved.selectedStatus?.some((s: any) => s.id === item.id)
      );
      fc.tempSelectedTemplateType = fc.templateTypeList.filter(item =>
        saved.selectedTemplateType?.some((s: any) => s.id === item.id)
      );
      fc.selectedStatus = fc.statusList.filter(item =>
        saved.selectedStatus?.some((s: any) => s.id === item.id)
      );
      fc.selectedTemplateType = fc.templateTypeList.filter(item =>
        saved.selectedTemplateType?.some((s: any) => s.id === item.id)
      );
      fc.searchText = saved.searchText ?? '';

      this.resetTopFilters();
      this.openSearchIfTextExists();
      this.prepareFilters(filters.page ?? 1, this.sortByField, this.sortDirection);
      setTimeout(() => this.templateService.clearTemplateFilters(), 100);
      return
    }
    this.prepareFilters(FIRST_PAGE, this.sortByField, this.sortDirection)
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
  constructor(private router: Router, public dialog: MatDialog) { }

  async onInitPage() {
    if (this.router.url.includes(routeConstants.VENDORS)) {
      this.assessmentSource = AssessemntSource.VENDOR;
    }
    this.setUserPermissions();
    this.clearFormState();
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.setTableInfo();
    await this.initializeFilterConfiguration()
  }

  onTabChange(event: any) {
    this.selectedTab = event.index === 1 ? DRAFTS : ALL;
    this.pageNo = FIRST_PAGE;
    this.resetSort();
    this.resetPaginator();
    this.setTableInfo();
    this.storeTabFilter();
    this.prepareFilters(this.pageNo, this.sortByField, this.sortDirection);
    this.scrollToTop()
  }

  private scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  applyTabFilter(index: number) {
    let filtered;

    if (index === 1) {
      filtered = this.templateList.filter((item) => item.status === 'Draft');
    } else {
      filtered = [...this.templateList];
    }

    const templates = filtered.map((t) => ({
      ...t,
      createdOn: t.createdOn
        ? moment(t.createdOn, 'DD.MM.YYYY').toDate()
        : null,
    }));

    this.dataSource.data = templates;
    this.totalItems = templates.length;
    this.dataSource.sort = this.sort;
  }

  createTemplate() {
    this.storeTabFilter()
    this.router.navigate([
      `${this.currentPath}/${routeConstants.CREATE_ASSESSMENT}`,
    ]);
  }

  resetAllFilter() {
    if (!this.filterApplied) {
      return;
    }
    this.filterConfiguration.searchText = '';
    this.filterConfiguration.tempSearchText = '';
    if (this.selectedTabIndex === 0) {
      this.filterConfiguration.selectedStatus = [];
      this.filterConfiguration.tempSelectedStatus = [];
      this.filterConfiguration.selectedTemplateType = [];
      this.filterConfiguration.tempSelectedTemplateType = [];
      this.filterConfiguration.selectedClone = [];
      this.filterConfiguration.tempSelectedClone = [];
    } else {
      this.filterConfiguration.selectedTemplateType = [];
      this.filterConfiguration.tempSelectedTemplateType = [];
    }
    this.pageNo = FIRST_PAGE;
    this.resetPaginator();
    this.prepareFilters(FIRST_PAGE, this.sortByFieldBackend, this.sortDirectionBackend);
  }

  prepareFilters(pageNo: number = FIRST_PAGE, sortBy: string = '', sortDirection: string = '', onInit: boolean = false) {
    let filters: any = {};
    if (this.filterConfiguration.searchText?.trim()) {
      filters['searchQuery'] = this.filterConfiguration.searchText.trim();
    }
    if (this.selectedTabIndex === 0) {
      if (this.filterConfiguration.selectedTemplateType?.length) {
        filters['type'] = this.filterConfiguration.selectedTemplateType.map(
          (type) => type.id
        );
      }
    } else {
      if (this.filterConfiguration.selectedTemplateType?.length) {
        filters['templateTypes'] = this.filterConfiguration.selectedTemplateType.map(
          (type) => type.name
        );
      }
    }

    if (this.filterConfiguration.selectedStatus?.length) {
      filters['status'] = this.filterConfiguration.selectedStatus.map(
        (status) => status.value
      );
    }

    if (this.filterConfiguration.selectedClone?.length) {
      filters['isCloned'] = this.filterConfiguration.selectedClone.map(
        (clone) => clone.value
      );
    }

    this.filterApplied = (this.selectedTabIndex === 0 && this.filterConfiguration.selectedStatus.length > 0 || this.filterConfiguration.selectedTemplateType.length > 0) || (
      this.selectedTabIndex === 1 && this.filterConfiguration.selectedTemplateType.length > 0
    );

    this.getTemplateList(pageNo, filters, sortBy, sortDirection, onInit);
  }

  searchFilter() {
    this.rightDrawer.open();
  }

  onSortChange(event: Sort): void {
    this.sortByField = event.active;
    this.sortDirection = event.direction;

    if (!event.direction) {
      this.sortByFieldBackend = '';
      this.sortDirectionBackend = '';
      this.dataSource.sort = this.sort;
      this.pageNo = FIRST_PAGE;
      this.resetPaginator();
      this.prepareFilters(FIRST_PAGE, '', '');
      return;
    }

    const backendField = this.sortFieldMapping[event.active];
    if (!backendField) {
      console.warn(`No backend mapping found for field: ${event.active}`);
      return;
    }
    const backendDirection = this.convertSortDirection(event.direction);
    this.sortByFieldBackend = backendField;
    this.sortDirectionBackend = backendDirection;
    this.pageNo = FIRST_PAGE;
    this.resetPaginator();
    this.prepareFilters(FIRST_PAGE, backendField, backendDirection);
  }

  private convertSortDirection(direction: SortDirection): string {
    if (!direction) return '';
    return direction.toUpperCase();
  }

  private resetSort(): void {
    this.sortByField = '';
    this.sortDirection = '';
    this.sortByFieldBackend = '';
    this.sortDirectionBackend = '';

    if (this.sort) {
      this.sort.active = '';
      this.sort.direction = '';
    }
  }

  private resetPaginator(): void {
    this.pageNo = FIRST_PAGE;
  }

  private sortFieldMapping: Record<string, string> = {
    templateId: 'id',
    name: 'name',
    type: 'type',
    status: 'status',
    createdOn: 'createdAt',
    linkedAssessmentsCount: 'linkedAssessmentsCount',
    cloneStatus: 'isCloned',
  };

  private clientSortFieldMapping: Record<string, string> = {
    templateId: 'templateId',
    name: 'name',
    type: 'type',
    status: 'status',
    createdOn: 'createdOn',
    linkedAssessmentsCount: 'linkedAssessmentsCount',
    cloneStatus: 'isCloned',
  };

  private sortData(data: any[], field: string, direction: SortDirection): any[] {
    if (!data || data.length <= 1 || !direction || !field) return data;

    const dataField = this.clientSortFieldMapping[field] || field;

    return data.sort((a, b) => {
      let valA = a[dataField];
      let valB = b[dataField];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
      }
      if (typeof valB === 'string') {
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return comparison * (direction === 'asc' ? 1 : -1);
    });
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 0);
    } else {
      this.filterConfiguration.searchText = '';
      this.pageNo = FIRST_PAGE;
      this.resetPaginator();
      this.prepareFilters(FIRST_PAGE, this.sortByFieldBackend, this.sortDirectionBackend);
    }
  }

  onSearchChange() {
    this.filterConfiguration.searchText =
      this.filterConfiguration.searchText.trimStart();
    this.pageNo = FIRST_PAGE;
    this.resetPaginator();
    this.prepareFilters(FIRST_PAGE, this.sortByFieldBackend, this.sortDirectionBackend);
  }

  clearSearch() {
    this.filterConfiguration.searchText = '';
    this.pageNo = FIRST_PAGE;
    this.resetPaginator();
    this.prepareFilters(FIRST_PAGE, this.sortByFieldBackend, this.sortDirectionBackend);
  }

  isTemplateTypeSelected(cat: any): boolean {
    return this.filterConfiguration.tempSelectedTemplateType?.some(
      (item: any) => item.id === cat.id
    );
  }

  async getTemplateList(pageNo: number = FIRST_PAGE, filters: any = null, sortBy: string = '', sortDirection: string = '', onInit: boolean = false): Promise<void> {
    this.templateList = [];
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

    let res;
    try {
      if (this.isDraftSelected) {
        const draftParams = {
          key: this.isVendorContext ? MANUAL_VENDOR_TEMPLATE_REQUEST : TEMPLATE_MANUAL_DRAFT_KEY,
          page: pageNo,
          size: this.pageSize,
          ...filters
        };
        if (sortBy && sortDirection) {
          draftParams['sortBy'] = sortBy;
          draftParams['sortDirection'] = sortDirection.toUpperCase();
        }
        res = await this.apiHelperService.getDraftManualRequests(draftParams);
        if (!res || res.success == false) {
          this.hasApiError = true;
          return
        }
        this.templateList = await this.templateService.prepareTemplateListForDraft(res?.content ?? []);
        this.totalItems = res?.totalItems ?? 0;
      }
      else {
        const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
        res = await this.assessmentApiHelperService.getTemplateList(params, _url);
        if (!res || res.success === false) {
          this.hasApiError = true;
          return;
        }
        this.templateList = await this.templateService.prepareTemplateList(res?.templates ?? []);
        this.totalItems = res?.totalItems ?? 0;
      }

      this.pageNo = pageNo;
      this.dataSource = new MatTableDataSource(this.templateList);
      if (sortBy && sortDirection) {
        this.dataSource.sort = null;
      } else {
        this.dataSource.sort = this.sort;
      }
      if (this.paginator) {
        this.paginator.length = this.totalItems;
        this.paginator.pageIndex = this.pageNo - 1;
        this.paginator.pageSize = this.pageSize;
      }

      this.setRequestTabCount(res, params);
      if (pageNo === FIRST_PAGE) {

        if (!this.initialListIsEmpty) {
          if (onInit && (!Object.keys(filters)?.length) && (!this.templateList?.length)) {
            this.initialListIsEmpty = true;
          }
        }
      }


    } catch (e) { this.hasApiError = true; }
    finally {
      this.requestLoading = false;
    }
  }

  get isEmptyRequest() {
    return this.templateList?.length ? false : true
  }

  getTabStatus() {
    if (this.isDraftSelected) {
      return { isDraft: true }
    }
    return
  }

  onPageChange(event: PageEvent): void {
    this.pageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize ?? this.pageSize;
    this.prepareFilters(this.pageNo, this.sortByFieldBackend, this.sortDirectionBackend);
    this.scrollToTop()
  }

  onClickName(template: any, mode: string = TEMPLATE_MODE.EDIT) {
    if (!this.viewAssessmentTemplate) {
      this.snackbarService.openSnack("You do not have permission to edit this template.")
      return
    }
    this.storeTabFilter()
    this.setCurrentRequestList();
    const templateId = this.isDraftSelected ? template.id : template.templateId
    const queryParams = this.isDraftSelected ? { manualDraftTemplateId: templateId } : { templateId: templateId, mode: mode };
    // if (this.isDraftSelected) {
    //   this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_TEMPLATE}`], {
    //     queryParams: queryParams,
    //   })
    // }
    // else {
    this.router.navigate([`${this.currentPath}/${routeConstants.TEMPLATE_DETAILS}`], {
      queryParams: queryParams,
    })
    // }
  }

  openEditTemplate(template: any) {
    if (this.isDraftSelected) {
      const templateId = template.id;
      let queryParams = { manualDraftTemplateId: templateId, mode: 'EDIT' };
      this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_TEMPLATE}`], {
        queryParams: queryParams,
      })
    }
  }

  setCurrentRequestList() {
    let reqRidList: any = [];
    this.templateList.map((item) => {
      reqRidList.push({ requestRid: item.templateId });
    });
    this.templateService.setTemplateRid(reqRidList);
  }

  get isDraftSelected(): boolean {
    return this.selectedTab === DRAFTS;
  }

  resetTopFilters(type: string = "") {
    if (type == this.STATUS || !type) {
      this.filterConfiguration.tempSelectedStatus = [
        ...this.filterConfiguration.selectedStatus,
      ];
    } else if (type == this.CLONE || !type) {
      this.filterConfiguration.tempSelectedClone = [
        ...this.filterConfiguration.selectedClone,
      ];
    }
    else if (type == this.TEMPLATE_TYPE || !type) {
      this.filterConfiguration.tempSelectedTemplateType = [
        ...this.filterConfiguration.selectedTemplateType,
      ];

    }
  }

  get selectedStatus() {
    return this.filterConfiguration.selectedStatus?.length;
  }

  get selectedTemplateType() {
    return this.filterConfiguration.selectedTemplateType?.length;
  }

  get showTemplateTypeFilter() {
    return this.filterConfiguration.templateTypeList?.length;
  }

  get showStatusFilter() {
    return this.filterConfiguration.statusList?.length;
  }



  onCloseMenu(type: string) {
    this.resetTopFilters(type);
  }

  stopDefaultBehaviour(event: any) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  onApplyOptionFilter(type: string, menuTrigger: MatMenuTrigger) {
    if (type == this.STATUS) {
      this.filterConfiguration.selectedStatus = [
        ...this.filterConfiguration.tempSelectedStatus,
      ];
    }
    else if (type == this.TEMPLATE_TYPE) {
      this.filterConfiguration.selectedTemplateType = [
        ...this.filterConfiguration.tempSelectedTemplateType,
      ];

    } else if (type == this.CLONE) {
      this.filterConfiguration.selectedClone = [
        ...this.filterConfiguration.tempSelectedClone,
      ];
    }
    this.resetTopFilters(type);
    if (menuTrigger) {
      menuTrigger.closeMenu();
    }
    this.prepareFilters();
  }

  onApplyDrawerFilter(event: any) {
    this.rightDrawer.close();
    this.applyFilterFromDrawer()
  }

  applyFilterFromDrawer() {

    this.filterConfiguration.selectedTemplateType = [
      ...this.filterConfiguration.tempSelectedTemplateType,
    ];

    this.filterConfiguration.selectedStatus = [
      ...this.filterConfiguration.tempSelectedStatus,
    ];

    // this.filterConfiguration.selectedDepartment = [
    //   ...this.filterConfiguration.tempselectedDepartment,
    // ];
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
    } else if (filterKey == this.CLONE) {
      const index = this.filterConfiguration.tempSelectedClone.indexOf(value);
      if (index === -1) {
        this.filterConfiguration.tempSelectedClone.push(value);
      } else {
        this.filterConfiguration.tempSelectedClone.splice(index, 1);
      }
    }

    else if (filterKey == this.TEMPLATE_TYPE) {
      this.filterConfiguration.tempSelectedTemplateType =
        this.updateSelectionArray(
          this.filterConfiguration.tempSelectedTemplateType || [],
          value
        );
    }
  }

  private updateSelectionArray(array: any[], value: any) {
    const index = array.findIndex(item => item.id === value.id);
    if (index === -1) {
      return [...array, value];
    } else {
      return array.filter(item => item.id !== value.id);
    }
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  getStatusText(status: string): string {
    if (!status) return '';

    const normalized = status.toUpperCase();

    if (normalized === Status.ACTIVE) return 'Active';
    if (normalized === Status.INACTIVE) return 'In active';

    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }

  async togglePopUp(template: any) {
    this.selectedTemplate = template
    this.isActive = template.status === Status.ACTIVE;

    this.dialogRef = this.dialog.open(this.toggleDialogTemplate, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      panelClass: 'dialog-wrapper'
    });

  }

  toggleStatus(row: any) {
    const newStatus = row.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;
    this.updateTemplateStatus(row, newStatus);
  }

  async updateTemplateStatus(row: any, newStatus: Status.ACTIVE | Status.INACTIVE) {
    if (row.status === newStatus) return;
    const data = {
      commands: [
        {
          type: "updateTemplateStatus",
          status: newStatus
        }
      ],
    }
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    this.assessmentApiHelperService.updateTemplateDetails(row.templateId, data, _url, false)
      .subscribe({
        next: async (res) => {
          row.status = newStatus;
          this.snackbarService.openSnack(templateStatusUpdateMessage());
        },
        error: (e: Error) => {
          console.error(e.message);
          this.closeAllDialog();
          this.statusToggleLoading = false;
        },
      });
  }


  async onCancel(): Promise<void> {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async onSave(): Promise<void> {
    if (!this.selectedTemplate) return;
    this.statusToggleLoading = true;
    const templateId = this.selectedTemplate.templateId;
    const status = this.isActive ? Status.ACTIVE : Status.INACTIVE;
    const data = {
      commands: [
        {
          type: "updateTemplateStatus",
          status: status
        }
      ],
    }
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;

    this.assessmentApiHelperService.updateTemplateDetails(templateId, data, _url, false)
      .subscribe({
        next: async (res) => {
          this.selectedTemplate.status = status;
          this.dataSource.data = [...this.dataSource.data];
          this.closeAllDialog()
          this.statusToggleLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.closeAllDialog();
          this.statusToggleLoading = false;
        },
      });
  }

  closeAllDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
      this.selectedTemplate = null;
    }
  }

  async setTableInfo() {
    this.dataSource = new MatTableDataSource<any>([]);
    this.tableHeaders = this.isDraftSelected ? TEMPLAE_DRAFT_HEADERS : TEMPLAE_HEADERS;
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);

    this.initializeFilterConfiguration();
    this.filterApplied = false;

    // await this.getTemplateList(FIRST_PAGE)
  }

  async initializeFilterConfiguration() {
    this.hasApiError = false;

    try {
      this.assessmemntTypeList = await this.assessmentTypeService.getAssessmentTypeMasterList();
      this.filterConfiguration.statusList = [
        { id: 1, name: 'Active', value: Status.ACTIVE, selected: false, disabled: false },
        { id: 2, name: 'Inactive', value: Status.INACTIVE, selected: false, disabled: false }
      ];

      this.filterConfiguration.templateTypeList = this.assessmemntTypeList

      this.filterConfiguration.cloneList = [
        { id: 1, name: 'Original', value: 'false', selected: false, disabled: false },
        { id: 2, name: 'Cloned', value: 'true', selected: false, disabled: false }
      ];

    }
    catch (error) {
      this.hasApiError = true;
    }
  }

  async deleteManualDraftRequest(template: any) {
    if (this.deleteIsLoading) {
      return
    }
    const templateId = template.id;
    if (!templateId) {
      return
    }
    this.deleteIsLoading = true
    try {
      const response = await this.assessmentApiHelperService.deleteManualDraftRequest(templateId);
      if (response) {
        this.prepareFilters(this.pageNo, this.sortByFieldBackend, this.sortDirectionBackend);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    this.deleteIsLoading = false
  }

  get allTabSelected(): boolean {
    return this.selectedTab === this.ALL
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
          const totalItems = +(res?.totalDraftTemplatesCount ?? 0);
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      else {
        if (this.allTabSelected) {
          const hasFilters = params && (params.searchQuery || params.type || params.status);
          if (hasFilters) {
            totalItems = +(res?.totalFilteredItemsCount ?? 0);
          } else {
            totalItems = +(res?.totalItems ?? 0);
          }
          this.tabHeaderDetails[index].count = totalItems;
        }
      }
      this.totalItems = +totalItems;
    });
    const searchVal = this.filterConfiguration.searchText?.trim() || '';
    const filterDataWithSearch = { ...params, searchQuery: searchVal, searchText: searchVal };
    this.storeVendorFilter(filterDataWithSearch);
    this.storeRequestListingFilter(filterDataWithSearch);
  }

  storeRequestListingFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.templateService.storeRequestTemplateListingFilter(filterData);
  }

  storeVendorFilter(params: any) {
    const filterData = { ...params, total: this.totalItems, page: params.page, filterConfiguration: this.filterConfiguration };
    this.templateService.storeTemplateFilter(filterData);
  }

  storeTabFilter() {
    const filterData = { page: this.pageNo, selectedTab: this.selectedTab };
    this.templateService.storeRequestTemplateListingFilter(filterData)
  }

  getCloneStatusIcon(row: any): string {
    return row.isCloned ? 'content_copy' : 'star';
  }

  getCloneStatusLabel(row: any): string {
    return row.isCloned ? 'Cloned' : 'Original';
  }

  get selectedClone() {
    return this.filterConfiguration.selectedClone?.length;
  }

  get showCloneFilter() {
    return this.filterConfiguration.cloneList?.length > 0;
  }

  clearSelection(filterKey: 'selectedStatus' | 'selectedTemplateType') {
    if (filterKey === 'selectedStatus') {
      if (!this.filterConfiguration.selectedStatus?.length) return;
      this.filterConfiguration.selectedStatus = [];
      this.resetTopFilters('STATUS');
    }

    if (filterKey === 'selectedTemplateType') {
      if (!this.filterConfiguration.selectedTemplateType?.length) return;
      this.filterConfiguration.selectedTemplateType = [];
      this.resetTopFilters('TEMPLATE_TYPE');
    }
    this.prepareFilters();
  }

  onDelete(data: any): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this template?',
        confirmationDetail: data?.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      if (this.isDraftSelected) {
        await this.assessmentApiHelperService.deleteManualDraftRequest(data.id);
        this.getTemplateList(this.pageNo, {}, this.sortByFieldBackend, this.sortDirectionBackend);
      }
      else {
        const templateId = data.templateId;
        const deleteCommand = {
          commands: [
            {
              type: "deleteTemplate",
              templateId: templateId
            }
          ],
        }
        const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
        this.assessmentApiHelperService.updateTemplateDetails(templateId, deleteCommand, _url, false)
          .subscribe({
            next: async (res) => {
              this.snackbarService.openSnack(templateDeleteMessage());
              this.getTemplateList(this.pageNo, {}, this.sortByFieldBackend, this.sortDirectionBackend);
            },
            error: (e: Error) => {
              console.error(e.message);
              this.closeAllDialog();
              this.statusToggleLoading = false;
            },
          });
      }
    });
  }


  get errorTitle() {
    return this.filterConfiguration.searchText ? `No templates match your search criteria` :
      (this.filterApplied) ? `No templates match the selected view` :
        (this.selectedTabIndex === 0) ?
          `No templates have been created yet` : `There are no draft templates available`;
  }


  async duplicateTemplate(template: any) {
    const dialogRef = this.dialog.open(TemplateDuplicateProgressComponent, {
      disableClose: true,
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
    });

    const dialogInstance = dialogRef.componentInstance;

    try {
      dialogInstance.progress = 20;
      const url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const templateDetails = await this.assessmentApiHelperService.getTemplateDetails(template.templateId, null, url);
      if (!templateDetails) {
        throw new Error('Template not found');
      }
      dialogInstance.progress = 40;
      const typeDetails = await this.assessmentTypeService.getAssessmentTypeById(templateDetails.template.type);
      const userData = this.authService.getUserInfo();
      const userId = userData?.applicationUserId;

      dialogInstance.progress = 60;
      templateDetails.template.templateType = { id: typeDetails?.id, name: typeDetails?.name, };
      let currentName = templateDetails.template.name;
      let finalTemplateName = currentName;
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const res = await this.assessmentApiHelperService.duplicateTemplate({ templateName: currentName }, _url);

      if (res?.data?.templateNameExists) {
        finalTemplateName = res.data.newTemplateName || `${currentName} v2`;
      }
      templateDetails.template.templateName = finalTemplateName;
      const draftForm = buildDraftFromTemplateDetails(this.fb, templateDetails);
      dialogInstance.progress = 80;

      const rawValue = draftForm.getRawValue();

      const body = {
        key: this.isVendorContext ? MANUAL_VENDOR_TEMPLATE_REQUEST : TEMPLATE_MANUAL_DRAFT_KEY,
        formData: {
          ...rawValue,
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      };

      await firstValueFrom(this.assessmentApiHelperService.saveManualDraft(body, ''));

      dialogInstance.progress = 100;

      setTimeout(() => {
        dialogRef.close();
        this.snackbarService.openSnack('Template duplicated as draft successfully');

        this.getTemplateList(
          this.pageNo,
          {},
          this.sortByFieldBackend,
          this.sortDirectionBackend
        );
      }, 400);
    } catch (error) {
      console.error(error);
      dialogRef.close();
      this.snackbarService.openSnack('Failed to duplicate template', 'error');
    }
  }

  clearFormState() {
    this.templatePreviewStateService.clearSnapshot();
    this.templatePreviewStateService.updateFormState(false);
  }

  setUserPermissions() {
    this.createAssessmentTemplate = this.rolePermissionService.createAssessmentTemplate || this.rolePermissionService.fullAccessAssessmentTemplate || this.rolePermissionService.fullAccessAssessment;
    this.editAssessmentTemplate = this.rolePermissionService.editAssessmentTemplate || this.rolePermissionService.fullAccessAssessmentTemplate || this.rolePermissionService.fullAccessAssessment;
    this.viewAssessmentTemplate = this.rolePermissionService.viewAssessmentTemplate || this.rolePermissionService.fullAccessAssessmentTemplate || this.rolePermissionService.fullAccessAssessment;
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }
}
