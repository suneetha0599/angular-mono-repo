import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ConfigService } from '@admin-core/services/config.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { VendorService } from '@admin-core/services/vendor/vendor.service';
import { VendorPageRequest } from '@admin-core/models/DataDiscovery/Vendor';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { statusColors, statusTextColors } from '../vender-utils';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { VendorDetailsKey, TAB_HEADER_DETAILS } from '../constant';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { PageEvent } from '@angular/material/paginator';
import { VendorDocUploadComponent } from '../vendor-drawer/vendor-doc-upload/vendor-doc-upload.component';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { VendorDocumentComponent } from './vendor-document/vendor-document.component';
import { SafeHtmlPipe } from "@valura-lib/components/safe-html.pipe";
import { UserService } from '@admin-core/services/user/user.service';
import { v1 as uuidv1 } from 'uuid';
import { CountryService } from '@admin-core/services/country/country.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';

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
  selector: 'app-vendor-details',
  imports: [
    LoadingButtonComponent, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatNativeDateModule,
    MatDatepickerModule, MatSelectModule, FormsModule, MatTabsModule, MatPaginatorModule, MatTableModule, CommonModule,
    MatSlideToggleModule, MatAutocompleteModule, MatMenuModule, MatTooltipModule, MatButtonModule, ErrorLoadingItemsComponent,
    EllipsisTooltipDirective, ItemNotFoundComponent, VendorDocUploadComponent, MatDrawer, MatDrawerContainer, VendorDocumentComponent, SafeHtmlPipe
  ],
  templateUrl: './vendor-details.component.html',
  styleUrl: './vendor-details.component.scss',
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }],
})
export class VendorDetailsComponent implements OnInit {


  countryMasterList: any = [];
  filteredCountryList: any;
  selectedCountry: any;
  locationName: string = '-';
  defaultCountry: number = 0;
  emailRegex: any;
  isloading: boolean = false;
  currentPath: string = '';
  currentRequestDetails = {
    vendorId: 0,
    index: 0,
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  hasApiError: boolean = false;
  assetdata: any;
  documentData: any[] = [];
  documentDataSource = new MatTableDataSource<any>(this.documentData);
  selectedDocument: any = null;
  vendorId!: number;
  vendorDetails: any;
  tenureOptions: string[] = ['1 Year', '2 Years', '3 Years'];

  contractDocuments = [
    { key: "DPA_PRIVACY_AGREEMENT", label: "DPA/privacy agreement" },
    { key: "NDA", label: "NDA" },
    { key: "COMPLIANCE_CERTIFICATE", label: "Compliance certificate" },
    { key: "CLIENT_POLICY", label: "Client policy" },
    { key: "INSURANCE_CERTIFICATES", label: "insurance certificates" }

  ];
  HEADER_HOSTING_DETAILS = "HEADER_HOSTING_DETAILS"
  ASSET_DETAILS = "ASSET_DETAILS"
  STATUS = "STATUS"

  tableHeaders = [
    { columnDef: 'assetId', header: 'Asset ID' },
    { key: this.ASSET_DETAILS, columnDef: 'name', header: 'Asset Name' },
    { columnDef: 'assetType', header: 'Asset Type' },
    { columnDef: 'assetCategory', header: 'Asset Category' },
    { columnDef: 'departmentName', header: 'Department' },
    { columnDef: 'systemOwnerName', header: 'Asset Owner' },
    { key: this.HEADER_HOSTING_DETAILS, columnDef: 'hostingSite', header: 'Hosting Type' },
    { key: this.STATUS, columnDef: 'status', header: 'Status' }
  ];
  displayedHeaders = this.tableHeaders.map(h => h.columnDef);
  dataSource = new MatTableDataSource<any>();
  detailList: string[] = [];
  VendorDetailsKey = VendorDetailsKey;
  tabHeaderDetails = TAB_HEADER_DETAILS;
  selectedTabIndex: number = 0;
  selectedTab: string = VendorDetailsKey.DETAILS;
  isDraftLoading = false;
  deleteDraftLoading = false;
  manualDraftVendorId!: string;
  bpaDataSource!: MatTableDataSource<any>;
  assessmentDataSource: any = [];
  VendorDataSource: any = [];
  assetDataSource: any = [];
  expandedSection: string | null = 'assessment'; // default open
  requestLoading = false;
  pageSize = 10;
  totalItems = 3;
  canEditVendor: boolean = false;
  assessmentColumns: string[] = [
    'assessmentId',
    'title',
    'status',
    'author',
    'assessRecords',
    'completeBy'
  ];
  shimmerDataSource = Array(5).fill({});
  vendorColumns = ['vendorId', 'vendor', 'asset', 'bpa', 'poc'];
  assetColumns: string[] = [
    'assetId',
    'name',
    'type',
    'linkedBpas',
    'status',
    'processOwner'
  ];

  bpaColumns: string[] = [
    'bpaId',
    'bpaName',
    'status',
    'processOwner',
    'department',
    'linkedAsset'
  ];
  viewMode: boolean = false;

  @ViewChild('uploadDrawer') uploadDrawer!: MatDrawer;

  private location = inject(Location);
  private fb = inject(FormBuilder);
  private apiHelper = inject(ApiHelperService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);
  private configService = inject(ConfigService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private vendorService = inject(VendorService);
  private countryService = inject(CountryService);
  private departmentService = inject(DepartmentService);
  private rolePermissionService = inject(RolePermissionService);
  constructor(public dialog: MatDialog, private cdRef: ChangeDetectorRef
  ) { }

  setUserPermissions() {
    this.canEditVendor = this.rolePermissionService.editVendor || this.rolePermissionService.fullAccessVendor;
  }

  handleAssessmentNavigation(assessId: string) {
    this.router.navigate([
      routeConstants.USER,
      routeConstants.VENDORS,
      routeConstants.ASSESSMENT,
      routeConstants.ASSESSMENT_DETAILS,
      assessId
    ]);
  }

  handleBPANavigation(bpaId: number) {
    this.router.navigate(
      [
        routeConstants.USER,
        routeConstants.DATA_DISCOVERY,
        routeConstants.BPA,
        routeConstants.BPA_DETAILS
      ],
      {
        queryParams: {
          bpaRequestId: bpaId,
          mode: 'VIEW'
        }
      }
    );
  }

  handleAssetNavigation(assetId: number) {
    this.router.navigate([
      routeConstants.USER,
      routeConstants.DATA_DISCOVERY,
      routeConstants.CONSENT_ASSETS,
      routeConstants.ASSETS_DETAILS,
      assetId
    ]);

  }

  ngOnInit(): void {
    this.setUserPermissions();
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      this.vendorId = params['vendorId']
      this.getVendorDetails(this.vendorId);
      this.onInitPage()
    });

    this.getInitialConfiguration()

    this.requestLoading = true;

    if (this.vendorId) {
      this.getVendorRelatedComponents(this.vendorId);
    }
  }

  async getVendorDetails(id: number) {
    this.hasApiError = false;
    this.isloading = true;

    try {
      const res = await this.apiHelper.getVendorsDetails(null, id);
      if (!res || res?.success === false) {
        this.hasApiError = true;
        return;
      }
      if (res?.vendorDetails) {
        this.vendorDetails = res.vendorDetails;
        this.documentData = (res?.documents || []).map((doc: any) => ({
          documentName: doc.documentName,
          fileKey: doc.fileKey,
          documentType: doc.documentType,
          description: doc.description,
          effectiveDate: doc.effectiveDate,
          expiryDate: doc.expiryDate,
          documentId: doc.documentId,
          attachmentUrl: (doc.attachments || []).map((f: any) => ({
            fileName: f.fileName,
            fileUrl: f.fileKey
          }))
        }));

        this.documentDataSource = new MatTableDataSource(this.documentData);
      }
      this.assetdata = res.asset;

      const locationId = res?.vendorDetails?.vendorContactExternal?.location;
      if (locationId) {
        const country = await this.countryService.getCountryById(locationId);
        this.locationName = country?.name || '-';
      }
    } catch (err) {
      this.hasApiError = true;
      console.error('Error fetching vendor details:', err);
    } finally {
      this.isloading = false;
    }
  }

  goBack(): void {
    this.location.back()
  }

  getHostingLocation(hostingSite: string[]) {
    return `${hostingSite?.length ? `${hostingSite?.[0]} ${hostingSite.length > 1 ? `(+${hostingSite.length - 1})` : ``}` : ``}`;
  }

  showDetail(detailList: any[]) {
    return detailList?.length > 1 ? true : false;
  }

  showHostingLocationDetail(hostingSiteList: string[]) {
    this.detailList = []
    if (this.showDetail(hostingSiteList)) {
      this.detailList = (hostingSiteList ?? []).map(hs => hs)
      return
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  async getInitialConfiguration() {
    const res = await this.configService.getDsrConfiguration();
    if (res) {
      this.emailRegex = res.emailRegex;
      this.countryMasterList = res.countryList;
      this.filteredCountryList = [...this.countryMasterList];
      this.selectedCountry = this.countryMasterList[0]
      this.cdRef.detectChanges();

    }
    return
  }


  filterCountries(search: string) {
    const value = search.toLowerCase();
    if (!value) {
      this.filteredCountryList = [...this.countryMasterList];
      return;
    }
    this.filteredCountryList = this.countryMasterList.filter(
      (c: { name: string; countryPhoneCode: string; id: any }) => {
        const matchesSearch =
          c.name.toLowerCase().includes(value) ||
          c.countryPhoneCode.toLowerCase().includes(value);
        const isSelected = this.selectedCountry?.id === c.id;
        return matchesSearch || isSelected;
      }
    );
    if (this.filteredCountryList.length === 0) {
      this.filteredCountryList = [this.countryMasterList.find(
        (c: { id: number }) => c.id === this.defaultCountry
      )!];
      this.selectedCountry = this.filteredCountryList[0];
    }
  }

  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.filteredCountryList = this.countryMasterList;
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.updateCurrentRequestIndex()
  }


  edit() {
    if (!this.vendorId) return;
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_VENDOR_RECORD}`], {
      queryParams: { mode: 'edit', vendorId: this.vendorId },
      queryParamsHandling: 'merge',
    });
  }


  delete() {
    if (!this.vendorId) return;
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Vendor?',
        confirmationDetail: this.vendorDetails?.name ?? '',
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
        await this.apiHelper.deletevendor(this.vendorId);
        this.snackbarService.openSnack('Vendor deleted successfully');
        this.goBack();
      } catch (err) {
        console.error('Error deleting vendor:', err);
        this.snackbarService.openSnack('Error deleting vendor');
      }
    });
  }



  async onDeleteDraft() {
    if (!this.manualDraftVendorId || this.deleteDraftLoading) return;

    this.deleteDraftLoading = true;
    try {
      const response = await this.dataInventoryApiHelperService.deleteManualDraftRequest(this.manualDraftVendorId);
      if (response) {
        this.snackbarService.openSnack('Draft deleted successfully');
        this.goBack();
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      this.snackbarService.openSnack('Error deleting draft');
    } finally {
      this.deleteDraftLoading = false;
    }
  }


  get errorTitle(): string {
    if (!this.dataSource?.data?.length) {
      return 'No assets have been linked to this vendor.';
    }
    return '';
  }

  async goToPrevRequest() {
    this.currentRequestDetails.index--;
    this.navigationDirection = 'prev';

    if (this.vendorService.getPrevRequestShifted()) {
      const tempRequestList = this.vendorService.getPrevRequestRid();
      this.vendorService.setVendorRequestRid(tempRequestList);
      const currentRequestSize = this.vendorService.getVendorRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.vendorService.setPrevRequestShifted('false');
      this.vendorService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.vendorService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.vendorId);
    }
    this.getVendorRelatedComponents(this.vendorId);
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.vendorService.getNextRequestShifted()) {
      const tempNextRequestList = this.vendorService.getNextRequestRid();
      this.vendorService.setVendorRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.vendorService.setNextRequestShifted('false');
      this.vendorService.setNextRequestPage(0, true);
    }
    const currentRequest = this.vendorService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.vendorId);
    }
    this.getVendorRelatedComponents(this.vendorId);
  }

  get disablePrevBtn() {
    return this.vendorService.getPrevRequestRid()?.length == 0;

  }

  get getPrevRequestRid() {
    return this.vendorService.getPrevRequestRid()?.length;
  }

  get disableNextBtn() {
    return this.vendorService.getNextRequestRid()?.length == 0;
  }

  openNextRequest(requestRid: number) {
    this.router.navigate([`${this.currentPath}/${routeConstants.VENDORS_DETAILS}`],
      {
        queryParams: {
          vendorId: requestRid,
          mode: 'view'
        }
      }
    )
  }

  async loadPrevRequestList() {
    const tempRequestList = this.vendorService.getVendorRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.vendorService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.vendorService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.vendorService.setPrevRequestPage(newPageNo);
      const requestList: VendorPageRequest[] = await this.vendorService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.vendorService.setPrevRequestShifted('true');
        this.vendorService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.vendorService.setPrevRequestRid(tempRequestList);
    this.vendorService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.vendorService.getVendorRid();

    const currentSize = this.vendorService.getVendorRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.vendorService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.vendorService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.vendorService.setNextRequestPage(newPageNo);
      const requestList: VendorPageRequest[] = await this.vendorService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.vendorService.setNextRequestShifted('true');
        this.vendorService.setNextRequestRid(requestList);
        return;
      }
    }

    this.vendorService.setNextRequestRid(tempRequestList);
    this.vendorService.setNextRequestShifted('false');
  }

  async updateCurrentRequestIndex() {
    let requestList = this.vendorService.getVendorRid();
    let nodeIndex = requestList.findIndex((request: VendorPageRequest) => request.vendorId == this.vendorId);
    if (nodeIndex > -1) {
      this.currentRequestDetails.index = nodeIndex;
      await this.loadPrevRequestList();
      await this.loadNextRequestList();
    }
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        entityId: this.vendorId,
        audit_log_module: AUDIT_LOG_MODULE.DATA_DISCOVERY,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.VENDOR
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
  }

  viewAssetDetails(row: any, index: number) {
    let path = this.currentPath.split('/').slice(0, -1).join('/')
    const assetId = row.assetId;
    this.router.navigate([`${path}/${routeConstants.CONSENT_ASSETS}/${routeConstants.ASSETS_DETAILS}/${assetId}`], {
      state: {
        assetIds: this.assetdata.map((a: any) => a.assetId),
        currentIndex: index,
        fromVendor: true,
      }
    })

  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  expandedSections: string[] = [];

  navigateToRelatedSection(section: string) {
    const relatedTabIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === VendorDetailsKey.RELATED_COMPONENTS
    );
    if (relatedTabIndex > -1) {
      this.selectedTabIndex = relatedTabIndex;
      this.selectedTab = VendorDetailsKey.RELATED_COMPONENTS;
      if (!this.expandedSections.includes(section)) {
        this.expandedSections = [];
        this.expandedSections.push(section);
      }
    }
  }

  toggleSection(section: string) {
    const index = this.expandedSections.indexOf(section);

    if (index > -1) {
      this.expandedSections.splice(index, 1);
    } else {
      this.expandedSections.push(section);
    }
  }

  isExpanded(section: string): boolean {
    return this.expandedSections.includes(section);
  }

  getStatusStyle(status: string) {
    return {
      'background-color': status === 'NOT_STARTED' ? '#E5F2FA' : '#E6F4EA',
      'color': status === 'NOT_STARTED' ? '#2563EB' : '#000000'
    };
  }

  getStatusStyles(status: string) {
    return {
      'background-color': status === 'ACTIVE' ? '#E5F2FA' : '#cfdaa9',
      'color': status === 'ACTIVE' ? '#2563EB' : '#000000'
    };
  }

  getStatus(status: string): string {
    return status
      ?.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
  }

  onOpenDrawer() {
    this.uploadDrawer.open();
    this.selectedDocument = null;
  }

  onEditDocument(row: any) {
    this.viewMode = false;
    this.selectedDocument = { ...row };
    this.uploadDrawer.open();
  }

  onDrawerClose() {
    this.viewMode = false;
    this.uploadDrawer.close();
    this.selectedDocument = null;
  }

  onViewDocument(row: any) {
    this.viewMode = true;
    this.selectedDocument = { ...row };
    this.uploadDrawer.open();
  }

  async deleteDocument(row: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Document?',
        confirmationDetail: row.documentName,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      if (!row?.documentId) return;

      const payload = {
        commandId: uuidv1(),
        commands: [
          { removeDocumentId: row.documentId }
        ]
      };

      try {
        this.isloading = true;

        await this.apiHelper.updateVendor(payload, this.vendorId);

        this.documentDataSource.data = this.documentDataSource.data.filter(
          (doc: any) => doc.documentId !== row.documentId
        );

        this.snackbarService.openSnack('Document deleted successfully');
        this.uploadDrawer.close();
      } catch (error) {
        console.error('Delete failed:', error);
        this.snackbarService.openSnack('Failed to delete document');
      } finally {
        this.isloading = false;
      }
    });
  }

  formatDateTime(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('.')[0];
  }

  normalizeDateOnly(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; //only date
  }

  onUploadSuccess() {
    this.getVendorDetails(this.vendorId)
  }

  removedFilesFromDrawer: string[] = [];

  handleRemovedFiles(removedFiles: string[]) {
    this.removedFilesFromDrawer = removedFiles;
  }

  async getVendorRelatedComponents(vendorId: number) {
    this.requestLoading = true;
    this.hasApiError = false;

    try {
      const res: any =
        await this.dataInventoryApiHelperService.getVendorRelatedComponents(vendorId);

      const data = res;

      const authorIds = (data?.assessments || [])
        .map((a: any) => a.authorId);

      const bpaProcessOwnerIds = (data?.bpas || [])
        .map((b: any) => b.processOwnerId);

      const assetProcessOwnerIds = (data?.assets || [])
        .map((a: any) => a.processOwnerId);

      const allUserIds = [
        ...new Set([
          ...authorIds,
          ...bpaProcessOwnerIds,
          ...assetProcessOwnerIds
        ])
      ].filter(Boolean);

      const userMap = new Map<number, string>();

      await Promise.all(
        allUserIds.map(async (id: number) => {
          const user = await this.userService.getUserById(id);
          const userName = this.userService.getDisplayName(user);
          userMap.set(id, userName || '-');
        })
      );

      const departmentIds: number[] = (data?.bpas || [])
        .map((b: any) => b.departmentId)
        .filter((id: any): id is number => typeof id === 'number');

      const allDepartmentIds: number[] = [...new Set(departmentIds)];

      const departmentMap = new Map<number, string>();

      await Promise.all(
        allDepartmentIds.map(async (id) => {
          const dept = await this.departmentService.getDepartmentById(id);
          departmentMap.set(id, dept?.name || '-');
        })
      );

      this.assessmentDataSource = new MatTableDataSource(
        (data?.assessments || []).map((a: any) => ({
          assessmentId: a.assessmentId,
          title: a.title,
          status: a.status,
          author: userMap.get(a.authorId) || '-',
          assessRecords: [
            ...new Set<number>(
              (a.linkedRecords ?? []).map((record: any) => record.id as number)
            )
          ]
            .map((id) => `A${id}`)
            .join(', '),
          completeBy: a.completeBy
        }))
      );

      const dataset = data?.bpas || [];

      this.bpaDataSource = new MatTableDataSource(
        dataset.map((b: any) => ({
          bpaId: b.bpaId,
          bpaName: b.name,
          status: b.status,
          processOwner: userMap.get(b.processOwnerId) || '-',
          department: departmentMap.get(b.departmentId) || '-',
          linkedAsset: b.linkedAssets
            ?.map((la: any) => la.assetName)
            .join(', ')
        }))
      );

      const datasetAsset = data?.assets || [];

      this.assetDataSource = new MatTableDataSource(
        datasetAsset.map((asset: any) => ({
          assetId: asset.assetId,
          name: asset.name,
          type: asset.type,
          linkedBpas: asset.linkedRecords
            ?.map((la: any) => la.name)
            .join(', '),
          status: asset.status,
          processOwner: userMap.get(asset.processOwnerId) || '-'
        }))
      );

    } catch (error) {
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
    }
  }
  onSelectionChange(index: any) {
    this.selectedTab = this.tabHeaderDetails[index].key;
  }



}
