import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatMiniFabButton } from '@angular/material/button';
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { AssetService } from '@admin-core/services/asset/asset.service';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { AUDIT_LOG_MODULE, AUDIT_LOG_ENTITY_TYPE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatDialog, } from '@angular/material/dialog';
import { ConfigService } from '@admin-core/services/config.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@admin-core/services/user/user.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { displayStatusText, statusColors, statusTextColors } from '@admin-page/request-management/request-utils';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { NGXLogger } from 'ngx-logger';

interface DataElement {
  dataElement: string;
  dataCategory: string;
  dataSubjectName: string;
}

interface LinkedBPA {
  id: string;
  processName: string;
  bpaOwner: string;

}

@Component({
  selector: 'app-assets-details',
  imports: [CommonModule, ReactiveFormsModule, MatTabsModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, RouterModule, MatTableModule, MatMenuModule, MatMiniFabButton, LoadingButtonComponent, CdkAccordionModule, MatTooltipModule,
    ItemNotFoundComponent, ErrorLoadingItemsComponent, EllipsisTooltipDirective],
  templateUrl: './assets-details.component.html',
  styleUrl: './assets-details.component.scss',

})

export class AssetsDetailsComponent {

  step4Form!: FormGroup;
  assetRId = 0;
  asset: any;
  assetId: any
  dataElementsTotalItems = 0;
  selectedTabIndex = 0;
  dataSubjects: any = []
  dataSubjectList: any = [];
  dataElementsColumns: string[] = ['dataElement', 'dataCategory', 'dataSubjectName'];
  linkedBpaColumns: string[] = ['id', 'processName', 'bpaOwner', 'department', 'dsInvolved', 'status'];
  linkedBpaTotalItems = 0;
  detailList: string[] = [];
  selectedCategory = 'Employee';
  locationMasterList: any = []
  securityControlList: any[] = [];
  currentPath: string = '';
  displayedColumns: string[] = ['dataElement', 'dataCategory', 'source'];
  dataElementsDataSource = new MatTableDataSource<DataElement>([]);
  linkedBpaDataSource = new MatTableDataSource<LinkedBPA>([]);
  currentRequestDetails = {
    assetRId: 0,
    index: 0,
  };
  isLoading = true
  currentAssetName = ''
  securityMeasuresDisplayedColumns: string[] = ['measure', 'type', 'status', 'lastUpdated', 'actions'];
  securityMeasuresDataSource = new MatTableDataSource([
    { measure: 'Data Encryption', type: 'Technical', status: 'Active', lastUpdated: '2025-06-10' },
    { measure: 'Access Control', type: 'Administrative', status: 'Active', lastUpdated: '2025-06-01' },
    { measure: 'Firewall', type: 'Technical', status: 'Inactive', lastUpdated: '2025-05-20' },
    { measure: 'Two-factor Authentication', type: 'Technical', status: 'Active', lastUpdated: '2025-07-01' },
  ]);
  securityMeasuresEntries: any
  private navigationDirection: 'prev' | 'next' | null = null;
  loading: boolean = false;
  hasApiError: boolean = false;

  private apiHelperService = inject(ApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private securityControlService = inject(SecurityControlService);
  private assetService = inject(AssetService);
  private configService = inject(ConfigService);
  private userService = inject(UserService);
  private logger = inject(NGXLogger)
  private departmentService = inject(DepartmentService)
  private location = inject(Location);
  showBackButton: boolean = false;
  assetIds: any;
  currentIndex: number = 0;
  isVendorNavigation: boolean = false;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, public dialog: MatDialog,) { }

  async ngOnInit(): Promise<void> {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');

    if (history.state.fromVendor) {
      this.showBackButton = true;
      this.isVendorNavigation = true;
      this.assetIds = history.state.assetIds;
      this.currentIndex = history.state.currentIndex
    }

    this.route.paramMap.subscribe({
      next: async params => {
        this.assetId = params.get('assetId');
        this.assetRId = this.assetId ? +this.assetId : 0;
        const assetList = this.assetService.getDsrRequestRid();
        const current = assetList?.find((r: { id: any; }) => r.id === this.assetId);
        this.currentAssetName = current?.name || '';
        this.onInitPage()
        await this.getInitialConfiguration();
        await this.getSecurityControlList();
        await this.getAssetDetails();

      }
    });


  }

  onInitPage() {
    this.updateCurrentRequestIndex();
  }
  async getInitialConfiguration() {
    const res = await this.configService.getDsrConfiguration();
    if (res) {
      this.locationMasterList = res.countryList || [];
    }
    return;
  }

  async getSecurityControlList() {
    const response = await this.securityControlService.getSecurityControlMasterList();
    this.securityControlList = response || [];
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
  }

  async getAssetDetails() {
    this.isLoading = true;
    this.hasApiError = false;
    try {
      const data = await this.apiHelperService.getAssetDetails(this.assetRId);
      if (!data) { this.hasApiError = true; return }
      const allMeasuresResponse = await this.securityControlService.getSecurityControlMasterList();
      const allMeasures = allMeasuresResponse || [];
      const mappedHostingDetails = (data.overview.hostingDetails || []).map((host: any) => {
        const locationName = this.locationMasterList.find(
          (loc: any) => loc.id === host.location
        )?.name || 'N/A';

        return {
          ...host,
          locationName
        };
      });


      const securityMeasures = (data.securityMeasures || [])
        .map((id: any) =>
          this.securityControlList.find(ctrl => String(ctrl.id) === String(id))).filter((ctrl: any) => !!ctrl);
      if (data) {
        this.asset = {
          ...data.overview,
          securityMeasures,
          hostingDetails: mappedHostingDetails,
        };


        const linkedBPA: LinkedBPA[] = await Promise.all(
          (data?.bpa || []).map(async (bpa: any) => ({
            id: bpa.bpaId?.toString() || 'N/A',
            processName: bpa.bpaName || 'Unknown Process',
            dsInvolved: bpa.dsInvolved,
            department: (
              await this.departmentService.getDepartmentById(bpa.departmentId)
            )?.name || 'N/A',

            bpaOwner: (await this.userService.getUserById(bpa?.owner?.userId ?? 0))?.displayName || 'N/A'
          }))


        );

        this.linkedBpaDataSource.data = linkedBPA;

        this.dataSubjects = await Promise.all(
          (data.dataSubjects || []).map(async (ds: any) => {

            const dsRecord = await this.assetService.getDataSubjectList(false, ds.dsId);
            const dsInfo = Array.isArray(dsRecord) ? dsRecord[0] : dsRecord;
            const dsName = dsInfo?.name || `Data Subject ${ds.dsId}`;

            const pdElements = await Promise.all(
              (ds.pdElements || []).map(async (pd: any) => {
                const pdRecord = await this.assetService.getPDElementsList(false, pd.pdId);
                const pdInfo = Array.isArray(pdRecord) ? pdRecord[0] : pdRecord;
                const categoryNames = (pdInfo?.categoryMappings || [])
                  .map((category: any) => category.categoryName)
                  .join(', ');
                const classificationNames = (pdInfo?.classificationMappings || [])
                  .map((category: any) => category.classificationName)
                  .join(', ');
                return {
                  pdId: pdInfo?.id || pd.pdId,
                  pdName: pdInfo?.name || `PD ${pd.pdId}`,
                  categoryNames: categoryNames || 'N/A',
                  classificationNames: classificationNames || 'N/A',
                  sources: pd.sources || []
                };
              })
            );

            return {
              dsId: ds.dsId,
              dsName,
              expanded: false,
              pdElements,
              dataSource: new MatTableDataSource(pdElements)
            };
          })
        );

      }
    }
    catch (e) {
      this.logger.error(e);
      this.hasApiError = true;
    }
    finally {
      this.isLoading = false
    }
  }

  async updateCurrentRequestIndex() {
    const requestList = this.assetService.getDsrRequestRid() || [];

    const nodeIndex = requestList.findIndex(
      (r: any) => Number(r.assetId) === Number(this.assetRId)
    );

    if (nodeIndex === -1) {
      console.warn('Current asset not found in request list');
      return;
    }

    this.currentRequestDetails.index = nodeIndex;
    await this.loadPrevRequestList();
    await this.loadNextRequestList();
  }



  async goToPrevRequest() {
    this.currentRequestDetails.index--;
    this.navigationDirection = 'prev';

    if (this.assetService.getPrevRequestShifted()) {
      const tempRequestList = this.assetService.getPrevRequestRid();
      this.assetService.setDsrRequestRid(tempRequestList);
      const currentRequestSize = this.assetService.getDsrRequestRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.assetService.setPrevRequestShifted('false');
      this.assetService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.assetService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(+(currentRequest.assetId));


    }
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.assetService.getNextRequestShifted()) {
      const tempNextRequestList = this.assetService.getNextRequestRid();
      this.assetService.setDsrRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.assetService.setNextRequestShifted('false');
      this.assetService.setNextRequestPage(0, true);
    }
    const currentRequest = this.assetService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(+(currentRequest.assetId));

    }
  }




  openNextRequest(requestRid: number) {
    this.router.navigate([`${this.currentPath}/${requestRid}`])
  }



  async loadPrevRequestList() {
    const tempRequestList = this.assetService.getDsrRequestRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.assetService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.assetService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.assetService.setPrevRequestPage(newPageNo);
      const requestList: any[] = await this.assetService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.assetService.setPrevRequestShifted('true');
        this.assetService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.assetService.setPrevRequestRid(tempRequestList);
    this.assetService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.assetService.getDsrRequestRid();
    const currentSize = this.assetService.getDsrRequestRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.assetService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.assetService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.assetService.setNextRequestPage(newPageNo);
      const requestList: any[] = await this.assetService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.assetService.setNextRequestShifted('true');
        this.assetService.setNextRequestRid(requestList);
        return;
      }
    }

    this.assetService.setNextRequestRid(tempRequestList);
    this.assetService.setNextRequestShifted('false');
  }




  get disablePrevBtn() {
    return this.assetService.getPrevRequestRid()?.length == 0 || this.isLoading;
  }

  get getPrevRequestRid() {
    return this.assetService.getPrevRequestRid()?.length;
  }


  get disableNextBtn() {
    return this.assetService.getNextRequestRid()?.length == 0 || this.isLoading;
  }



  onViewDetails(event: any, type: string) {
    if (type == 'bpa') {
      const bpaId = `${event.id}`
      this.router.navigate(
        ['/user/data-discovery/bpa/create'],
        { queryParams: { bpaRequestId: bpaId, mode: 'EDIT' } }
      );
    }

    else if (type == 'vendor') {
      const vendorId = `${event.vendorId}`
      const mode = 'view'
      this.router.navigate(['user/data-discovery/vendors/vendors-details'], {
        queryParams: { vendorId, mode },
      })
    }



  }
  onEdit(id: any) {
    this.router.navigate(
      ['/user/data-discovery/assets/create'],
      { queryParams: { assetId: id, mode: 'edit' } }
    );
  }

  onClickUrl(url: any) {
    window.open(url, '_blank')
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      height: 'fit-content',
      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        entityId: this.assetId,
        audit_log_module: AUDIT_LOG_MODULE.ASSET,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.ASSET
      }
    });

  }

  get warningMessage() {
    return `Incomplete asset details!`
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


  goBack(): void {
    this.location.back();
  }

  goNextAsset() {
    if (this.currentIndex < this.assetIds.length - 1) {
      this.currentIndex++;
      const nextId = this.assetIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${nextId}`], {
        state: {
          assetIds: this.assetIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }
  goPrevAsset() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevId = this.assetIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${prevId}`], {
        state: {
          assetIds: this.assetIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }
  get disablePrevBtnV(): boolean {
    return !this.assetIds || this.assetIds.length <= 1 || this.currentIndex === 0;
  }

  get disableNextBtnV(): boolean {
    return !this.assetIds || this.assetIds.length <= 1 || this.currentIndex === this.assetIds.length - 1;
  }

}
