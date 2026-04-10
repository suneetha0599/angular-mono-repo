import { ChangeDetectorRef, Component, HostListener, inject, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { CommonModule, Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { buildBpaCreateForm, buildDataSubjectMapping, buildPdElementsForm, buildSourceForm, getPdElementMasterList, prepareBpaPayload, buildAssetForm, buildRecipientForm, findPdElementIndexInAnySource, prepareUpdateBpaPayload } from '../bpa-utils';
import { BPA_EXTERNAL_WINDOW, BPA_MODE, CREATE_BPA_STAGES, CreateBpaTabKey, CreatItemType, DrawerMode, FORM_ERROR_LABELS, SOURCE_CATEGORY } from '../constants';
import { DataManagementScreenComponent } from './data-management-screen/data-management-screen.component';
import { OverviewTabComponent } from '../tab-content/overview-tab/overview-tab.component';
import { SecurityControlsTabComponent } from '../tab-content/security-controls-tab/security-controls-tab.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { AssetPdElementMapping, BpaDataSubject, BpaDepartment, DataSubjectPdElemementMapping, PdElementMapping, Purpose, RecipientPdElementMapping, SourcetPdElementMapping } from '@admin-core/models/data-inventory/BPA';
import { BpaDrawerDataElementsComponent } from '../bpa-drawer-data-elements/bpa-drawer-data-elements.component';
import { v1 as uuidv1 } from 'uuid';
import { BusinessProcessingActivitiesComponent } from '../business-processing-activities/business-processing-activities.component';
import { RiskSummaryPageComponent } from './risk-summary-screen/risk-summary-page.component';
import { Risk } from './risk-summary-screen/models/risk-summary-model';
import { BPA_MANUAL_DRAFT_KEY, BPA_WORKER, BPA_DRAFT_KEY, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { externalWindowRoute, routes as routeConstants } from '@admin-core/constants/routes';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { Subscription } from 'rxjs';
import { RiskMitigationDrawerComponent } from '../risk-mitigation-drawer/risk-mitigation-drawer.component';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@admin-core/services/auth.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { CountryService } from '@admin-core/services/country/country.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';

const { USER, DATA_DISCOVERY, BPA, ASSESSMENTS, ASSESSMENT, CREATE_DPIA_ASSESSMENT } = routeConstants

@Component({
  selector: 'app-create-bpa',
  imports: [MatStepperModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, CommonModule, MatIconModule, MatOptionModule, MatRadioModule, MatSelectModule,
    MatTabsModule, MatTableModule, MatMenuModule, MatCheckboxModule, MatListModule, MatSidenavModule, MatPaginatorModule, OverviewTabComponent,
    SecurityControlsTabComponent, BpaDrawerDataElementsComponent, DataManagementScreenComponent, BusinessProcessingActivitiesComponent, RiskSummaryPageComponent, LoadingButtonComponent
    , RiskMitigationDrawerComponent, ErrorLoadingItemsComponent],
  templateUrl: './create-bpa.component.html',
  styleUrl: './create-bpa.component.scss',
})
export class CreateBpaComponent {

  pageTitle: string = "Create Processing Activity";
  createBpaForm!: FormGroup;
  selectedTabIndex = 0;
  purposeList: any[] = []
  showTable: boolean = false;
  tabHeaderDetails = CREATE_BPA_STAGES;
  dataSource = new MatTableDataSource<any>();
  CreateBpaTabKey = CreateBpaTabKey;
  selectedTab: string = CreateBpaTabKey.OVERVIEW;
  legalBasesMap: { [regulationId: number]: any[] } = {};
  departments: any[] = [];
  countryMasterList: any[] = [];
  dataSubjectUserTypesList: any[] = [];
  drawerType: string = ''
  deletedPdElement?: PdElementMapping;
  selectedDataSubjectMapping!: DataSubjectPdElemementMapping;
  dataUpdated: string = '';
  pdElementsMappingList: PdElementMapping[] = []
  selectedDataSubjectIndex: number = -1;
  viewType: any;
  actsWithLegalBasis: any[] = [];
  sourceToView: any = null;
  isPdElementsEditMode = false;
  drawerMode: string = DrawerMode.MAPPING;
  selectedAssetIndex: number = -1;
  selectedSourceIndex: number = -1;
  selectedRecepientIndex: number = -1;
  isDraftLoading: boolean = false;
  isSubmitLoading: boolean = false;
  bpaRequestId: number = 0;
  bpaManualDraftRequestId: string = '';
  bpaDraftRequestId: string = '';
  bpaRequestDetails: any;
  selectedRecipients: any[] = [];
  thirdPartyList: any;
  vendorList: any;
  riskList: Risk[] = [];
  formIsUpdated: boolean = false
  BPA_MODE = BPA_MODE;
  bpaMode: string = BPA_MODE.EDIT;
  securityControlList: any[] = [];
  isViewMode: boolean = false;
  currentPath: string = '';
  legalBasesList: any[] = []
  currentRequestDetails = {
    bpaRequestId: 0,
    index: 0,
  };
  isLoading = true
  hasApiError: boolean = false;
  bpaIds: number[] = [];
  currentIndex: number = 0;
  isCollectionPointNavigation: boolean = false;
  showEditButton: boolean = false;
  isFinalSaved: boolean = false;

  private navigationDirection: 'prev' | 'next' | null = null;
  private bpaDraftWorker!: Worker;
  private bpaFormSubscription!: Subscription;
  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private assessmentService = inject(AssessmentService);
  private bpaService = inject(BpaService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private securityControlService = inject(SecurityControlService);
  private createBpaService = inject(CreateBpaService);
  private authService = inject(AuthService);
  private departmentService = inject(DepartmentService);
  private dataSubjectService = inject(DataSubjectService);
  private countryService = inject(CountryService);
  private rolePermissionService = inject(RolePermissionService);

  private location = inject(Location);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('rightDrawer') rightDrawer!: MatDrawer;
  showBackButton: boolean = false;
  fromCollectionPoint: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, public dialog: MatDialog) { }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.formIsUpdated && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): boolean {
    if (this.formIsUpdated) {
      return false
    }
    return true;
  }

  async ngOnInit() {
    this.createBpaService.clearAllList()
    this.route.queryParams.subscribe(async params => {
      const bpaRequestId = params['bpaRequestId'];
      const bpaManualDraftRequestId = params['bpaManualDraftRequestId'];
      const bpaDraftRequestId = params['bpaDraftRequestId'];
      const mode = params['mode'];
      this.bpaRequestId = +(bpaRequestId);
      this.bpaManualDraftRequestId = (bpaManualDraftRequestId);
      this.bpaDraftRequestId = (bpaDraftRequestId);

      if (this.bpaRequestId || this.bpaManualDraftRequestId || this.bpaDraftRequestId) {
        this.pageTitle = "Processing Activities Details"
      }
      this.updateBpaMode(mode)
      await this.updateCurrentRequestIndex();
      this.resetPageState();
      await this.initPage();

    });

    const navState = history.state;
    if (navState?.fromCollectionPoint) {
      this.showBackButton = true;
      this.isCollectionPointNavigation = true;
      this.fromCollectionPoint = true;

      this.bpaIds = navState.bpaIds || [];
      this.currentIndex = navState.currentIndex ?? 0;
    }
  }

  resetPageState() {
    this.createBpaForm?.reset();
    this.dataSource.data = [];
    this.formIsUpdated = false;
    this.selectedTabIndex = 0;
  }


  async initPage() {
    this.setUserPermissions()
    this.isLoading = true
    this.initiateWorker();

    this.bpaService.formTouched = false;
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.createBpaForm = buildBpaCreateForm(this.fb)
    await this.loadInitialData()
    await this.getCountryMasterList()
    await this.getRegulationsList()
    await this.getPurposeList()
    await this.getdataSubjectUserTypesList()
    await this.getThirdPartyList()
    await this.getVendorList()
    await this.getSecurityControlList();
    await this.getLegalBasesList()

    if (this.bpaDraftRequestId) {
      this.getDraftRequestDetails()
      return
    }
    if (this.bpaManualDraftRequestId) {
      this.getManualDraftRequestDetails();
      return
    }
    if (this.bpaRequestId) {
      this.getBpaRequestDetails();
      return
    }
    if (this.isCreateNew) {
      this.isLoading = false
      this.initFormSubscription()
    }
  }

  ngOnDestroy(): void {
    if (this.bpaDraftWorker) {
      this.bpaDraftWorker.postMessage(BPA_WORKER.STOP);
      this.bpaDraftWorker.terminate();
    }
    this.bpaFormSubscription?.unsubscribe();
  }

  initiateWorker() {
    return //As per Thejaswini's request disabling now
    if (this.bpaRequestId || this.bpaManualDraftRequestId) {
      return
    }
    if (typeof Worker !== 'undefined') {
      this.bpaDraftWorker = new Worker(new URL('./workers/bpa-draft.worker', import.meta.url), { type: 'module' });

      this.bpaDraftWorker.onmessage = ({ data }) => {
        if (data.type === BPA_WORKER.SAVE_BPA && this.formIsUpdated) {
          this.saveDraftData();
        }
      };

      this.bpaDraftWorker.postMessage(BPA_WORKER.INIT);
    } else {
      console.error('Web Workers are not supported in this environment!');
    }
  }

  initFormSubscription() {
    this.bpaFormSubscription = this.createBpaForm.valueChanges.subscribe(val => {
      if (val && !this.formIsUpdated && this.isEditMode) {
        this.formIsUpdated = true
      }
    });
  }

  goBack(): void {

    this.location.back();
  }

  onTabChange(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    const prevIndex = (index - 1);
    const prevTabKey = this.tabHeaderDetails[prevIndex]?.key;

    this.selectedTab = tabKey;
    this.drawerType = tabKey;
    if (prevTabKey == CreateBpaTabKey.OVERVIEW) {
      this.setDataSubjectMapping()
    }
    if (this.selectedTab == CreateBpaTabKey.SOURCES) {
      this.selectedSourceIndex = -1
    }
    else if (this.selectedTab == CreateBpaTabKey.ASSETS) {
      this.selectedAssetIndex = -1
    }
    else if (this.selectedTab == CreateBpaTabKey.RECIPIENTS) {
      this.selectedRecepientIndex = -1
    }


  }

  setDataSubjectMapping() {
    if (this.selectedTab == CreateBpaTabKey.DATA_ELEMENTS) {
      let dataSubjectList = this.dataSubjectList.value;
      let dataSubjectPdElementMappingList = this.dataSubjectPdElementMapping.value;
      // if (dataSubjectList?.length !== dataSubjectPdElementMappingList?.length) {
      if (this.dataSubjectPdElementMapping.value?.length) {
        const dSPdElementMapping = this.dataSubjectPdElementMapping.value?.[0];
        this.onDataSubjectTabChange(dSPdElementMapping, 0)
      }
      // }
    }
  }
  private ensureDataSubjectIsSelected() {
    if (!this.selectedDataSubjectMapping && this.dataSubjectPdElementMapping.length > 0) {
      const firstDsGroup = this.dataSubjectPdElementMapping.at(0) as FormGroup;
      this.selectedDataSubjectMapping = firstDsGroup.value;
      this.selectedDataSubjectIndex = 0;
    }
  }

  handleOpenViewDrawer(event: { mode: string, sourceData: any, selectedAssetIndex: number, selectedSourceIndex: number, selectedRecepientIndex: number }) {
    if (!this.selectedDataSubjectMapping) {
      this.ensureDataSubjectIsSelected();
    }

    if (!this.selectedDataSubjectMapping) {
      this.snackbarService.openSnack("No Data Subject found. Please add one in the Overview.");
      return;
    }
    if (this.selectedTab === CreateBpaTabKey.SOURCES) {
      this.selectedSourceIndex = -1
      this.drawerMode = DrawerMode.PD_MAPPING
      this.selectedSourceIndex = event.selectedSourceIndex
    }
    else if (this.selectedTab === CreateBpaTabKey.ASSETS) {
      this.selectedAssetIndex = -1
      this.drawerMode = DrawerMode.PD_MAPPING
      this.selectedAssetIndex = event.selectedAssetIndex
    }
    else if (this.selectedTab === CreateBpaTabKey.RECIPIENTS) {
      this.selectedRecepientIndex = -1
      this.drawerMode = DrawerMode.PD_MAPPING
      this.selectedRecepientIndex = event.selectedRecepientIndex
    }
    this.rightDrawer.open();
  }



  async updateCurrentRequestIndex() {
    const requestList = await this.bpaService.getDsrRequestRid() || [];
    const nodeIndex = requestList.findIndex(
      (r: any) => Number(r.bpaId) === Number(this.bpaRequestId)
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

    if (this.bpaService.getPrevRequestShifted()) {
      const tempRequestList = this.bpaService.getPrevRequestRid();
      this.bpaService.setDsrRequestRid(tempRequestList);
      const currentRequestSize = this.bpaService.getDsrRequestRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.bpaService.setPrevRequestShifted('false');
      this.bpaService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.bpaService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(+(currentRequest.bpaId));


    }
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.bpaService.getNextRequestShifted()) {
      const tempNextRequestList = this.bpaService.getNextRequestRid();
      this.bpaService.setDsrRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.bpaService.setNextRequestShifted('false');
      this.bpaService.setNextRequestPage(0, true);
    }
    const currentRequest = this.bpaService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(+(currentRequest.bpaId));

    }
  }
  openNextRequest(requestRid: number) {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(
        ['/user/data-discovery/bpa/create'],
        {
          queryParams: {
            bpaRequestId: requestRid,
            mode: this.bpaMode,
          },
        }
      );
    });


  }


  async loadPrevRequestList() {
    const tempRequestList = this.bpaService.getDsrRequestRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.bpaService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.bpaService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.bpaService.setPrevRequestPage(newPageNo);
      const requestList: any[] = await this.bpaService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.bpaService.setPrevRequestShifted('true');
        this.bpaService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.bpaService.setPrevRequestRid(tempRequestList);
    this.bpaService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.bpaService.getDsrRequestRid();
    const currentSize = this.bpaService.getDsrRequestRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.bpaService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.bpaService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.bpaService.setNextRequestPage(newPageNo);
      const requestList: any[] = await this.bpaService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.bpaService.setNextRequestShifted('true');
        this.bpaService.setNextRequestRid(requestList);
        return;
      }
    }

    this.bpaService.setNextRequestRid(tempRequestList);
    this.bpaService.setNextRequestShifted('false');
  }




  get disablePrevBtn() {
    return this.bpaService.getPrevRequestRid()?.length == 0;
  }

  get getPrevRequestRid() {
    return this.bpaService.getPrevRequestRid()?.length;
  }


  get disableNextBtn() {
    return this.bpaService.getNextRequestRid()?.length == 0;
  }


  handleItemSelectorData(event: { pdElemementMappingList: any[] }) {


    // PROCESS EXACTLY LIKE DRAWER DATA
    if (event.pdElemementMappingList) {
      this.onApplyChangesToDataElements(event.pdElemementMappingList);
    }
  }


  onCreateNewDataElement(event: any) {
    // console.log(' Create new data element from ItemSelector:', event);

  }


  previewDetails() {
    this.router.navigate(['/user/data-discovery/bpa-details']);
  }

  get overviewForm(): FormGroup {
    return this.createBpaForm?.get('overview') as FormGroup;
  }

  get bpaName(): FormGroup {
    return this.overviewForm?.get('name') as FormGroup;
  }

  get owner() {
    return this.overviewForm?.get('owner') as FormControl;
  }

  get securityControlForm(): FormGroup {
    return this.createBpaForm?.get('securityMeasures') as FormGroup;
  }

  get dataElements(): FormGroup {
    return this.createBpaForm?.get('dataElements') as FormGroup;
  }

  get processPurpose(): FormArray {
    return this.overviewForm?.get('purposePurpose') as FormArray;
  }

  get processPurposeList() {
    return this.processPurpose?.value ?? []
  }

  get assetPdElementsMapping(): FormArray {
    return this.asset.get('assetElementsMapping') as FormArray;
  }

  get assetPdElementsMappingList() {
    return this.assetPdElementsMapping?.value ?? []
  }

  get dataSubjectList(): FormArray {
    return this.overviewForm.get('dataSubjectList') as FormArray;
  }

  get dataSubjectPdElementMapping(): FormArray {
    return this.dataElements.get('dataSubjectPdElementMapping') as FormArray;
  }

  getPdElementMappingList(index: number): FormArray {
    return this.dataSubjectPdElementMapping.at(index).get('pdElementMappingList') as FormArray;
  }

  get dataSubjectPdElementList(): DataSubjectPdElemementMapping[] {
    return this.dataSubjectPdElementMapping?.value ?? []
  }

  get source(): FormGroup {
    return this.createBpaForm?.get('source') as FormGroup;
  }

  get asset(): FormGroup {
    return this.createBpaForm?.get('asset') as FormGroup;
  }

  get sourcePdElementsMapping(): FormArray {
    return this.source?.get('sourcePdElementsMapping') as FormArray;
  }

  get sourcePdElementsMappingList() {
    return this.sourcePdElementsMapping?.value ?? []
  }

  get regulations() {
    return this.overviewForm.get('regulations') as FormControl;
  }

  get allPdElementsMappingList(): PdElementMapping[] {
    const allPdElements: PdElementMapping[] = [];

    if (this.dataSubjectPdElementMapping?.value) {
      for (const dataSubject of this.dataSubjectPdElementMapping.value) {
        if (dataSubject.pdElementMappingList) {
          allPdElements.push(...dataSubject.pdElementMappingList);
        }
      }
    }

    return allPdElements;
  }

  get recipients(): FormGroup {
    return this.createBpaForm?.get('recipients') as FormGroup;
  }

  get recipientsPdElementsMapping(): FormArray {
    return this.recipients?.get('recipientsPdElementsMapping') as FormArray;
  }

  get recipientsPdElementsMappingList() {
    return this.recipientsPdElementsMapping?.value ?? [];
  }

  getSourcePdElementMappingList(index: number): FormArray {
    return this.sourcePdElementsMapping.at(index).get('pdElementMappingList') as FormArray;
  }

  getAssetMappingList(index: number): FormArray {
    return this.assetPdElementsMapping.at(index).get('pdElementMappingList') as FormArray;
  }

  getRecepientMappingList(index: number): FormArray {
    return this.recipientsPdElementsMapping.at(index).get('pdElementMappingList') as FormArray;
  }

  goToNextTab() {
    const nextIndex = this.selectedTabIndex + 1;
    this.selectedTabIndex = nextIndex
    const selectedTab = this.tabHeaderDetails[nextIndex]?.key;
    this.selectedTab = selectedTab;
  }

  async loadInitialData(): Promise<void> {
    try {
      const departments = await this.departmentService.getDepartmentMasterList();
      if (departments) {
        this.departments = departments || [];
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    }
  }

  async getVendorList(): Promise<void> {
    try {
      const vendorList = await this.apiHelperService.getVendorList()
      if (vendorList) {
        this.vendorList = vendorList.vendorDetails || [];
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    }
  }

  async getThirdPartyList(): Promise<void> {
    try {
      const thirdPartyList = await this.configApiHelperService.getThirdPartyList()
      if (thirdPartyList) {
        this.thirdPartyList = thirdPartyList.thirdParties || [];
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    }
  }

  async getSecurityControlList(): Promise<void> {
    try {
      const securityControlList = await this.securityControlService.getSecurityControlMasterList()
      if (securityControlList) {
        this.securityControlList = securityControlList || [];
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.snackbarService.openSnack('Failed to load initial data');
    }
  }

  async getCountryMasterList() {
    const res = await this.countryService.getCountryMasterList();
    if (res) {
      this.countryMasterList = res || [];
    }
    return;
  }

  async getdataSubjectUserTypesList() {
    const res = await this.dataSubjectService.getDatasubjectMasterList();
    if (res) {
      this.dataSubjectUserTypesList = res || [];
    }
  }


  closeDrawer() {
    this.rightDrawer.close();
    this.isViewMode = false;
    this.isPdElementsEditMode = false;
    this.sourceToView = null;
  }

  addSelectedAssets() {

  }

  async getRegulationsList() {
    const res = await this.bpaService.getRegulationList();
    if (res) {
      this.actsWithLegalBasis = res?.acts ?? []
    }
    return;
  }


  async getLegalBasesList() {
    const res = await this.bpaService.getLegalBasisList();
    if (res) {
      this.legalBasesList = res || [];
    }

    return;
  }

  openDrawer() {
    if (this.selectedTab === CreateBpaTabKey.DATA_ELEMENTS) {
      if (!this.selectedDataSubjectMapping) {
        return;
      }
    }
    this.isViewMode = false;
    this.isPdElementsEditMode = false;
    this.sourceToView = null;
    this.drawerMode = DrawerMode.MAPPING
    this.rightDrawer.open();
  }

  onPdElementsUpdated(data: any) {
    if (data.recipientMapping) {
      this.updateRecipientPdElements(data);
      this.isPdElementsEditMode = false;
    }
    this.closeDrawer();
    this.isPdElementsEditMode = false;
    this.selectedRecipients = [];
  }

  private updateRecipientPdElements(data: any) {
    if (data.recipientMapping) {

      const recipientIndex = this.recipientsPdElementsMapping.controls.findIndex(
        (ctrl: any) =>
          ctrl.value.recipient?.id === data.recipientMapping.recipient?.id &&
          ctrl.value.type === data.recipientMapping.type
      );

      if (recipientIndex !== -1) {
        const recipientFormGroup = this.recipientsPdElementsMapping.at(recipientIndex) as FormGroup;
        recipientFormGroup.patchValue({
          ...data.recipientMapping
        });

        const pdElementsArray = recipientFormGroup.get('pdElementMappingList') as FormArray;
        while (pdElementsArray.length > 0) {
          pdElementsArray.removeAt(0);
        }
        data.recipientMapping.pdElementMappingList.forEach((pdElement: any) => {
          const pdFormGroup = buildPdElementsForm(this.fb, pdElement);
          pdElementsArray.push(pdFormGroup);
        });
      } else {
        const formGroup = buildRecipientForm(this.fb, data.recipientMapping);
        this.recipientsPdElementsMapping.push(formGroup);

      }
    }
  }

  onApplyChanges(dataPdElemementMapping: any) {
    this.closeDrawer()
    if (this.selectedTab === CreateBpaTabKey.DATA_ELEMENTS) {
      this.onApplyChangesToDataElements(dataPdElemementMapping)
    }
    else if (this.selectedTab === CreateBpaTabKey.SOURCES) {
      this.onApplyChangesFromSource(dataPdElemementMapping)
    }
    else if (this.selectedTab === CreateBpaTabKey.ASSETS) {
      this.onApplyChangesFromAsset(dataPdElemementMapping)

    }
    else if (this.selectedTab === CreateBpaTabKey.RECIPIENTS) {
      this.onApplyChangesFromRecipients(dataPdElemementMapping)
    }
  }

  onApplyChangesToDataElements(pdElementMappingList: PdElementMapping[]) {

    if (pdElementMappingList?.length) {
      for (const pdMapping of pdElementMappingList) {
        if (!pdMapping.selected) continue;
        const formGroup = buildPdElementsForm(this.fb, pdMapping, true);
        this.getPdElementMappingList(this.selectedDataSubjectIndex).push(formGroup);
      }
      this.dataUpdated = uuidv1(); // ← This refreshes the UI
    }
  }


  onApplyChangesFromSource(event: any) {
    const drawerMode = event.drawerMode;
    if (drawerMode == DrawerMode.PD_MAPPING) {
      const sourcePdElementList = event.sourcePdElementList as PdElementMapping[];
      const dsPdElementMappingList = event.dsPdElementMappingList;
      const deletedPdElementMappingList = event?.deletedPdElementMappingList ?? [];

      // const newPdElementData = event.newPdElementList as PdElementMapping[];
      const sourcePdElementMapping = this.sourcePdElementsMapping.at(this.selectedSourceIndex) as FormGroup
      const sourcedElementsMappingValue = { ...sourcePdElementMapping.value, pdElementMappingList: sourcePdElementList };

      const formGroup = buildSourceForm(this.fb, sourcedElementsMappingValue);
      this.sourcePdElementsMapping.setControl(this.selectedSourceIndex, formGroup);
      this.patchDataSubjectMapping(dsPdElementMappingList);
      if (deletedPdElementMappingList?.length) {
        for (const pdElementMapping of deletedPdElementMappingList) {
          this.createBpaService.onDeleteSourcePdElementMapping(sourcePdElementMapping.value, pdElementMapping);
        }
      }
      this.selectedSourceIndex = -1
      this.dataUpdated = uuidv1();
      return
    }
  }

  onApplyChangesFromRecipients(event: any) {
    const drawerMode = event.drawerMode;
    if (drawerMode == DrawerMode.PD_MAPPING) {
      const recepientPdElementList = event.recepientPdElementList as PdElementMapping[];
      const dsPdElementMappingList = event.dsPdElementMappingList;
      const deletedPdElementMappingList = event?.deletedPdElementMappingList ?? [];

      const recepientPdElementMapping = this.recipientsPdElementsMapping.at(this.selectedRecepientIndex) as FormGroup
      const sourcedElementsMappingValue = { ...recepientPdElementMapping.value, pdElementMappingList: recepientPdElementList };

      const formGroup = buildRecipientForm(this.fb, sourcedElementsMappingValue);
      this.recipientsPdElementsMapping.setControl(this.selectedRecepientIndex, formGroup);
      this.patchDataSubjectMapping(dsPdElementMappingList);
      if (deletedPdElementMappingList?.length) {
        for (const pdElementMapping of deletedPdElementMappingList) {
          this.createBpaService.onDeleteRecepientPdElementMapping(recepientPdElementMapping.value, pdElementMapping);
        }
      }
      this.selectedRecepientIndex = -1
      this.dataUpdated = uuidv1();
      return
    }
  }

  onApplyChangesFromAsset(event: any) {
    const drawerMode = event.drawerMode;
    if (drawerMode == DrawerMode.PD_MAPPING) {
      const assetPdElementList = event.assetPdElementList as PdElementMapping[];
      const dsPdElementMappingList = event.dsPdElementMappingList;
      const deletedPdElementMappingList = event?.deletedPdElementMappingList ?? [];

      const assetPdElementMapping = this.assetPdElementsMapping.at(this.selectedAssetIndex) as FormGroup
      const assetdElementsMappingValue = { ...assetPdElementMapping.value, pdElementMappingList: assetPdElementList };

      const formGroup = buildAssetForm(this.fb, assetdElementsMappingValue);
      this.assetPdElementsMapping.setControl(this.selectedAssetIndex, formGroup);
      this.patchDataSubjectMapping(dsPdElementMappingList);
      if (deletedPdElementMappingList?.length) {
        for (const pdElementMapping of deletedPdElementMappingList) {
          this.createBpaService.onDeleteAssetPdElementMapping(assetPdElementMapping.value, pdElementMapping);
        }
      }
      this.selectedAssetIndex = -1
      this.dataUpdated = uuidv1();
      return
    }
  }

  onNewItemAdded(event: any) {
    let addedCount = 0;

    if (event.type === CreatItemType.DATA_ELEMENTS) {
      const dataMappingList = event.pdElementsMappingList;
      if (dataMappingList?.length) {
        const dataSubject = this.selectedDataSubjectMapping?.dataSubjectType;

        for (const pdElementMapping of dataMappingList) {
          const findPdElements = this.dataSubjectPdElementList[this.selectedDataSubjectIndex]?.pdElementMappingList.find(
            (pdEle: any) => pdEle.pdElement?.id === pdElementMapping?.id
          );


          if (findPdElements) {
            continue;
          }
          const purposeList = this.processPurposeList?.length == 1 ? this.processPurposeList : []
          const newPdMapping = new PdElementMapping({
            pdElement: { ...pdElementMapping },
            purpose: pdElementMapping?.purpose ? pdElementMapping.purpose : purposeList,
            selected: false,
            newItemId: pdElementMapping.id,
            newAdded: true
          });
          newPdMapping.dataSubject = new BpaDataSubject({ ...dataSubject });
          const formGroup = buildPdElementsForm(this.fb, newPdMapping);
          this.getPdElementMappingList(this.selectedDataSubjectIndex).push(formGroup);

          addedCount++;
        }

        this.dataUpdated = uuidv1();


        if (addedCount > 0) {
          this.snackbarService.openSnack(`${addedCount} data element${addedCount > 1 ? 's' : ''} added successfully`);
        } else {
          this.snackbarService.openSnack('All selected data elements already exist');
        }
      }
    }
    else if (event.type === CreatItemType.SOURCE) {
      const dataMappingList = event.sourcePdElementsMappingList;
      if (dataMappingList?.length) {
        for (const sourcePdElementMapping of dataMappingList) {
          const findSource = this.sourcePdElementsMappingList.find(
            (sourceMap: SourcetPdElementMapping) => sourceMap?.source?.id === sourcePdElementMapping?.id
          );
          if (findSource) {
            continue;
          }
          const _source = { ...sourcePdElementMapping };
          const _assetId = _source?.id ?? 0;
          const tempSourceId = sourcePdElementMapping?.category == SOURCE_CATEGORY.ASSET ? _source?.tempSourceId ? _source.tempSourceId : typeof _assetId === "string" ? null : uuidv1() : null
          const newSourceMapping = new SourcetPdElementMapping({
            source: { ...sourcePdElementMapping, tempSourceId: tempSourceId },
            type: sourcePdElementMapping?.type,
            pdElementMappingList: []
          });
          const formGroup = buildSourceForm(this.fb, newSourceMapping);
          this.sourcePdElementsMapping.push(formGroup);

          if (sourcePdElementMapping?.category == SOURCE_CATEGORY.ASSET && sourcePdElementMapping?.isLocal) {
            this.createBpaService.onCreateOrUpdateSource({ ..._source, addedBySource: true, tempSourceId: tempSourceId });
          }
          addedCount++;
        }

        this.dataUpdated = uuidv1();


        if (addedCount > 0) {
          this.snackbarService.openSnack(`${addedCount} source${addedCount > 1 ? 's' : ''} added successfully`);
        } else {
          this.snackbarService.openSnack('All selected sources already exist');
        }
      }
    }
    else if (event.type === CreatItemType.ASSET) {
      const dataMappingList = event.assetPdElementsMappingList;
      if (dataMappingList?.length) {
        for (const assetPdElementMapping of dataMappingList) {
          const findAsset = this.assetPdElementsMappingList.find(
            (assetMap: AssetPdElementMapping) => assetMap?.asset?.id === assetPdElementMapping?.id
          );


          if (findAsset) {
            continue;
          }

          const newAssetMapping = new AssetPdElementMapping({
            asset: { ...assetPdElementMapping },
            pdElementMappingList: []
          });
          const formGroup = buildAssetForm(this.fb, newAssetMapping);
          this.assetPdElementsMapping.push(formGroup);

          addedCount++;
        }

        this.dataUpdated = uuidv1();


        if (addedCount > 0) {
          this.snackbarService.openSnack(`${addedCount} asset${addedCount > 1 ? 's' : ''} added successfully`);
        } else {
          this.snackbarService.openSnack('All selected assets already exist');
        }
      }
    }
    else if (event.type === CreatItemType.RECEPIENT) {
      const dataMappingList = event.recepientPdElementsMappingList;
      if (dataMappingList?.length) {
        for (const recepientPdElementMapping of dataMappingList) {
          const findRecepient = this.recipientsPdElementsMappingList.find(
            (recepientMap: RecipientPdElementMapping) => recepientMap?.recipient?.id === recepientPdElementMapping?.id
          );


          if (findRecepient) {
            continue;
          }

          const newRecepientMapping = new RecipientPdElementMapping({
            recipient: { ...recepientPdElementMapping },
            type: recepientPdElementMapping.category,
            purpose: recepientPdElementMapping.purpose,
            numberOfPersonHavingAccess: recepientPdElementMapping.count,
            pdElementMappingList: []
          });
          const formGroup = buildRecipientForm(this.fb, newRecepientMapping);
          this.recipientsPdElementsMapping.push(formGroup);

          addedCount++;
        }

        this.dataUpdated = uuidv1();


        if (addedCount > 0) {
          this.snackbarService.openSnack(`${addedCount} recipient${addedCount > 1 ? 's' : ''} added successfully`);
        } else {
          this.snackbarService.openSnack('All selected recipients already exist');
        }
      }
    }
  }


  async getPurposeList() {
    const res = await this.apiHelperService.getPurposeList();
    if (res) {
      this.purposeList = res.purposes || [];
    }
    return;
  }

  handleDeleteRow(deletedPd: PdElementMapping, index: number) {
    // console.log('Deleting:', index, deletedPd);

    // if (index >= 0 && index < this.pdElementsMapping.length) {
    //   this.pdElementsMapping.removeAt(index);
    // }

    // this.deletedPdElement = deletedPd;
  }

  onDataSubjectTabChange(selectedDs: DataSubjectPdElemementMapping, index: number) {
    this.selectedDataSubjectMapping = selectedDs;
    this.selectedDataSubjectIndex = index;
  }

  buildDataSubjectForm() {
    const dataSubjectPdElementMappingList = this.dataSubjectPdElementMapping.value;

    if (this.dataSubjectList?.value?.length)
      for (const ds of this.dataSubjectList.value) {
        const dtataSubjectMapping = dataSubjectPdElementMappingList.find((dsMap: DataSubjectPdElemementMapping) => dsMap?.dataSubjectType?.id == ds.id);
        if (dtataSubjectMapping) {
          continue
        }
        const dataSubject = new DataSubjectPdElemementMapping({ pdElementMappingList: dtataSubjectMapping?.pdElementMappingList?.length ? dtataSubjectMapping?.pdElementMappingList : [] })
        dataSubject.dataSubjectType = { id: ds.id, name: ds.name, dsBpaMappingId: (ds?.dsBpaMappingId ?? 0) }
        const formGroup = buildDataSubjectMapping(this.fb, dataSubject);
        this.dataSubjectPdElementMapping.push(formGroup);
      }
  }

  onCloseDrawer() {
    this.rightDrawer.toggle();
    if (this.selectedTab == CreateBpaTabKey.SOURCES) {
      this.selectedSourceIndex = -1
    }
    else if (this.selectedTab == CreateBpaTabKey.ASSETS) {
      this.selectedAssetIndex = -1
    }
    else if (this.selectedTab == CreateBpaTabKey.RECIPIENTS) {
      this.selectedRecepientIndex = -1
    }
  }

  saveAsDraft() {

    // if (this.createBpaForm.invalid) {
    //   this.snackbarService.openSnack(`Please fill the required details!`);
    //   return
    // }

    const formValue = { ...this.createBpaForm.value };
    if (formValue.securityMeasures) {
      const days = formValue.securityMeasures.days;
      const period = formValue.securityMeasures.retentionPeriod;


      if (days && period) {
        formValue.securityMeasures.retentionPeriod = `${days} ${period}`;
      }
    }
    const newLocalData = this.createBpaService.preparePayloadForNewItems();
    const formDataWithDate = {
      ...formValue,
      ...newLocalData,
      createdAt: new Date().toISOString(),
    };

    const body = this.bpaManualDraftRequestId ?
      {
        "formData": formDataWithDate,
      } :
      {
        "key": BPA_MANUAL_DRAFT_KEY,
        "formData": formDataWithDate
      }

    this.isDraftLoading = true
    if (this.bpaManualDraftRequestId) {
      this.dataInventoryApiHelperService.bpaSaveManualDraft(body, this.bpaManualDraftRequestId)
        .subscribe({
          next: async (res) => {
            this.goToBpaListing();
            this.isDraftLoading = false;
          },
          error: (e: Error) => {
            console.error(e.message);
            this.isDraftLoading = false
          },
        });
    }
    else {
      this.dataInventoryApiHelperService.bpaSaveManualDraftNew(body)
        .subscribe({
          next: async (res) => {
            this.deleteDraftRequest(this.bpaDraftRequestId)
            this.goToBpaListing();
            this.isDraftLoading = false;
            this.createBpaService.clearAllList();
          },
          error: (e: Error) => {
            console.error(e.message);
            this.isDraftLoading = false
          },
        });
    }
  }

  goToBpaListing() {
    this.formIsUpdated = false
    this.router.navigate([`${USER}/${DATA_DISCOVERY}/${BPA}`]);
  }

  private getInvalidRequiredFields(
    form: FormGroup | FormArray,
    parentPath: string = ''
  ): string[] {
    const errors: string[] = [];

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      const controlPath = parentPath ? `${parentPath}.${key}` : key;

      if (!control) return;
      if (controlPath.startsWith('overview')) return;

      if (control instanceof FormGroup || control instanceof FormArray) {
        errors.push(...this.getInvalidRequiredFields(control, controlPath));
      } else {
        if (control.hasError('required')) {
          const genericPath = controlPath.replace(/\.\d+\./g, '.*.');
          let newName = FORM_ERROR_LABELS[genericPath] || FORM_ERROR_LABELS[controlPath] || key;
          if (controlPath.includes('sourcePdElementsMapping')) {
            const pathParts = controlPath.split('.');
            const index = pathParts[2];
            const sourceGroup = this.sourcePdElementsMapping.at(+index) as FormGroup;
            const sourceName = sourceGroup?.value?.source?.name || 'Unknown Source';
            newName = `${newName} (Source: ${sourceName})`;
          }
          errors.push(newName);
        }
      }
    });

    return errors;
  }


  onSave() {
    // if (this.createBpaForm.invalid) {
    //   this.showTabErrors()
    //   this.bpaService.formTouched = true;
    //   this.snackbarService.openSnack(`Please fill the required details!`);
    //   return
    // };
    if (this.createBpaForm.invalid) {
      this.showTabErrors();
      this.bpaService.formTouched = true;

      const missingFields = this.getInvalidRequiredFields(this.createBpaForm);

      const message =
        missingFields.length > 0
          ? `Please fill the required details! :${[...new Set(missingFields)].join(',')}`
          : 'Please fill the required details!';

      this.snackbarService.openSnack(message);
      return;
    }

    this.isSubmitLoading = true;
    if (this.bpaRequestId) {
      const bpaFormData = {
        ...this.createBpaForm.value,
        originalRegions: this.bpaRequestDetails.overview?.dataSubjectRegion || [],
        originalDataSubjects: this.bpaRequestDetails.overview?.dataSubjectList || [],
        originalPurposes: this.bpaRequestDetails.overview?.bpaPurpose || [],
        deletedSourcePdMappingList: this.createBpaService.deletedSourcePdMappingList,
        deletedAssetPdMappingList: this.createBpaService.deletedAssetPdMappingList,
        deletedRecipientPdMappingList: this.createBpaService.deletedRecipientPdMappingList,
        originalBpaLegalBasisData: (this.bpaRequestDetails.overview.legalBases ?? []),
      }
      const body = prepareUpdateBpaPayload(bpaFormData, this.bpaRequestId);
      const newLocalData = this.createBpaService.preparePayloadForNewItems(true);

      const finalBody = this.createBpaService.preparePayloadForDeletedItems({ ...body, ...newLocalData });
      // console.log(finalBody); return
      this.dataInventoryApiHelperService.onUpdateBpa(finalBody, this.bpaRequestId)
        .subscribe({
          next: async (res) => {
            this.onPostSaveBpa(res?.bpaId ?? 0);
            this.isFinalSaved = true;
          },
          error: (e: Error) => {
            console.error(e.message);
            this.isSubmitLoading = false
          },
        });
    }
    else {
      const body = prepareBpaPayload(this.createBpaForm.value, this.bpaRequestId);
      const newLocalData = this.createBpaService.preparePayloadForNewItems(true);
      const finalBody = { ...body, ...newLocalData };
      // console.log(finalBody); return
      this.dataInventoryApiHelperService.onSaveBpa(finalBody)
        .subscribe({
          next: async (res) => {
            this.onPostSaveBpa(res?.bpaId ?? 0);
            this.isFinalSaved = true;
          },
          error: (e: Error) => {
            console.error(e.message);
            this.isSubmitLoading = false
          },
        });
    }
  }

  async onPostSaveBpa(bpaId: number) {
    this.createBpaService.startDbSync()
    await this.deleteDraftRequests()
    this.navigateToBack(bpaId);
    this.isSubmitLoading = false;
    if (this.createBpaService.deletedAssociatedDepartment?.length || this.createBpaService.newAssociatedDepartment?.length) {
      this.createBpaService.syncDepartment();
    }
    this.createBpaService.clearAllList();
  }

  navigateToBack(bpaId: number) {
    this.formIsUpdated = false;
    const fromAssessment = this.assessmentService.routeDetails;
    const isCreate = !this.bpaRequestId;

    if (fromAssessment && isCreate) {

      const bpaDetails = {
        bpa: {
          bpaId,
          name: this.bpaName.value,
        },
        regulation: this.regulations?.value,
        processOwner: this.owner?.value,
        disabled: false
      };
      this.assessmentService.setBpaDetails(bpaDetails);
      this.assessmentService.clearRouteDetails();

      this.router.navigate(
        [`${USER}/${ASSESSMENTS}/${ASSESSMENT}/${CREATE_DPIA_ASSESSMENT}`],
        { queryParams: { source: 'bpa' } }
      );

      return;
    }

    this.router.navigate([`${USER}/${DATA_DISCOVERY}/${BPA}`]);
  }


  onCancel() {
    this.formIsUpdated = false;
    if (this.assessmentService.routeDetails) {
      this.router.navigate([`${USER}/${ASSESSMENTS}/${ASSESSMENT}/${CREATE_DPIA_ASSESSMENT}`]);
      return
    }
    this.goToBpaListing();
  }

  async getBpaRequestDetails() {
    this.isLoading = true
    this.hasApiError = false
    if (!this.bpaRequestId) {
      this.isLoading = false
      return
    }
    try {
      const data = await this.dataInventoryApiHelperService.getBpaRequestDetails(this.bpaRequestId);
      if (Object.keys(data).length === 0) {
        this.hasApiError = true; return
      }
      if (data) {
        this.bpaRequestDetails = data;
        this.patchDraftRequestForm()
        if (!this.isEditMode) {
          this.createBpaForm.disable()
        }
      }
    } catch (error) {
      console.error('Error fetching BPA request details:', error);
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  async getManualDraftRequestDetails() {
    this.isLoading = true
    this.hasApiError = false
    if (!this.bpaManualDraftRequestId) {
      this.isLoading = false
      return
    }
    try {
      const data = await this.dataInventoryApiHelperService.getBpaDraftRequestDetails(this.bpaManualDraftRequestId);
      if (Object.keys(data).length === 0) { this.hasApiError = true; return }
      if (data) {
        this.bpaRequestDetails = data.formData;
        this.createBpaService.patchCreateBpaServiceDetails(this.bpaRequestDetails)
        this.patchDraftRequestForm(true);
      }
    } catch (error) {
      console.error('Error fetching BPA request details:', error);
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }


  async getDraftRequestDetails() {
    this.isLoading = true
    this.hasApiError = false
    if (!this.bpaDraftRequestId) {
      this.isLoading = false
      return
    }
    try {
      const data = await this.dataInventoryApiHelperService.getBpaDraftDetails(this.bpaDraftRequestId);
      if (Object.keys(data).length === 0) { this.hasApiError = true; return }
      if (data) {
        this.bpaRequestDetails = data;
        this.createBpaService.patchCreateBpaServiceDetails(this.bpaRequestDetails)
        this.patchDraftRequestForm(true);
      }
    } catch (error) {
      console.error('Error fetching BPA request details:', error);
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }


  async patchDraftRequestForm(isDraft: boolean = false) {
    try {
      this.createBpaForm.patchValue(this.bpaRequestDetails);
      /* Datasubject patch  */
      let dataSubjectList: any = ''
      if (isDraft) {
        dataSubjectList = this.bpaRequestDetails.overview.dataSubjectList?.length ?
          this.bpaRequestDetails.overview.dataSubjectList.map((ds: BpaDataSubject) => {
            return {
              id: ds?.id ?? 0,
              name: ds?.name ?? '',
              dsBpaMappingId: ds?.dsBpaMappingId ?? 0,
            };
          }) : ''
      }
      else {
        dataSubjectList = await this.createBpaService.prepareDataSubjectList(this.bpaRequestDetails.overview?.dataSubjectList);
      }
      this.overviewForm.setControl('dataSubjectList', new FormControl(dataSubjectList));

      /* Department patch  */
      let deptObj: any = ''
      if (isDraft) {
        deptObj = this.bpaRequestDetails.overview.departmentId
      }
      else {
        deptObj = await this.departmentService.getDepartmentById((this.bpaRequestDetails?.overview?.departmentId ?? 0));
      }
      this.overviewForm.setControl('departmentId', new FormControl(deptObj ?? null));

      if (isDraft) {
        this.overviewForm.setControl('minValue', new FormControl(this.bpaRequestDetails.overview?.minValue ?? null));
        this.overviewForm.setControl('maxValue', new FormControl(this.bpaRequestDetails.overview?.maxValue ?? null));
      }
      else {
        const volume = this.bpaRequestDetails.overview.volumeOfPersonalData;
        if (volume && volume.includes('-')) {
          const [min, max] = volume.split('-').map((v: string) => Number(v.trim()));
          this.overviewForm.setControl('minValue', new FormControl(min ?? null));
          this.overviewForm.setControl('maxValue', new FormControl(max ?? null));
        }
      }

      let legalBasisData;
      if (isDraft) {
        legalBasisData = this.bpaRequestDetails.overview.legalBasis ? [this.bpaRequestDetails.overview.legalBasis] : [];
      }
      else {
        legalBasisData = this.bpaRequestDetails.overview.legalBases;
      }
      const legalBasis = legalBasisData?.length ? await Promise.all(
        legalBasisData?.map(async (legalBases: any) => {
          const legalBasisDetails = await this.createBpaService.prepareLegalBasis(legalBases);
          return legalBasisDetails;
        }) ?? []) : []
      const tempLegalBasis = legalBasis?.length ? legalBasis[0] : '';
      this.overviewForm.setControl('legalBasis', new FormControl(tempLegalBasis));

      const actId = legalBasis?.length ? legalBasis[0]?.actId : 0;
      const regulationObj = actId ? await this.createBpaService.prepareRegulation(actId) : null;
      this.overviewForm.setControl('regulations', new FormControl(regulationObj));

      const regions = this.bpaRequestDetails.overview.dataSubjectRegion?.length
        ? await Promise.all(
          this.bpaRequestDetails.overview.dataSubjectRegion.map(async (r: any) => {
            const countryDetails = await this.createBpaService.prepareCountry(r);
            return {
              ...countryDetails,
              dsRegionBpaMappingId: r?.dsRegionBpaMappingId ?? 0,
            };
          })
        )
        : [];

      this.overviewForm.setControl('dataSubjectRegion', new FormControl(regions));

      const mappings = this.bpaRequestDetails.overview.controllerMappings || [];
      const setArray = (key: string) => {
        const arr = this.overviewForm.get(key) as FormArray;
        arr.clear();
        mappings
          .filter((m: any) => m.type === key)
          .forEach((m: any) => arr.push(new FormControl(m.name)));
      };
      ['controller', 'processor', 'jointController', 'subProcessor', 'importer', 'exporter']
        .forEach(type => setArray(type));

      if (this.bpaRequestDetails.overview?.bpaPurpose?.length) {
        const purposes = this.bpaRequestDetails.overview.bpaPurpose.map((p: any) => ({
          id: p.id,
          purposeName: p.purposeName,
          bpaPurposeMappingId: (p?.bpaPurposeMappingId ?? 0)
        }));

        this.overviewForm.get('purposePurpose')?.setValue(purposes);
      }
      // Process owner patch
      if (!isDraft) {
        const userData = this.bpaRequestDetails.overview?.owner
        const user = await this.createBpaService.prepareProcessOwnerData(userData)
        this.overviewForm.get('owner')?.setValue(user);
      }
      //Data Subject mapping
      if (this.bpaRequestDetails.dataElements?.dataSubjectPdElementMapping?.length) {
        for (const ds of this.bpaRequestDetails.dataElements.dataSubjectPdElementMapping) {
          if (isDraft) {
            const dataSubject = new DataSubjectPdElemementMapping({ ...ds })
            const formGroup = buildDataSubjectMapping(this.fb, dataSubject);
            this.dataSubjectPdElementMapping.push(formGroup);
          }
          else {
            const formGroup = await this.createBpaService.prepareDataSubjectMappingForm(ds, this.isEditMode);
            this.dataSubjectPdElementMapping.push(formGroup);
          }
        }
      }

      if (this.bpaRequestDetails.source?.sourcePdElementsMapping?.length) {
        for (const sourcePdElemementMapping of this.bpaRequestDetails.source.sourcePdElementsMapping) {
          if (!isDraft) {
            const pdElementList = await this.createBpaService.preparePdMappingList(sourcePdElemementMapping.pdElementMappingList);
            sourcePdElemementMapping.pdElementMappingList = [...pdElementList];
            sourcePdElemementMapping.source.sourceType = sourcePdElemementMapping.source.type;
          }
          const formGroup = buildSourceForm(this.fb, sourcePdElemementMapping);
          this.sourcePdElementsMapping.push(formGroup);
        }
      }

      if (this.bpaRequestDetails.asset?.assetElementsMapping?.length) {
        for (const assetPdElementMapping of this.bpaRequestDetails.asset.assetElementsMapping) {
          if (!isDraft) {
            const pdElementList = await this.createBpaService.preparePdMappingList(assetPdElementMapping.pdElementMappingList);
            assetPdElementMapping.pdElementMappingList = [...pdElementList]
          }
          const formGroup = buildAssetForm(this.fb, assetPdElementMapping);
          this.assetPdElementsMapping.push(formGroup);
        }
      }

      if (this.bpaRequestDetails.recipients?.recipientsPdElementsMapping?.length) {
        for (const recipientsPdElementsMapping of this.bpaRequestDetails.recipients.recipientsPdElementsMapping) {
          if (!isDraft) {
            const pdElementList = await this.createBpaService.preparePdMappingList(recipientsPdElementsMapping.pdElementMappingList);
            recipientsPdElementsMapping.pdElementMappingList = [...pdElementList]
            recipientsPdElementsMapping.type = (recipientsPdElementsMapping.recipient?.entityType ?? '');
            recipientsPdElementsMapping.recepient = await this.createBpaService.prepareDepartmentList(recipientsPdElementsMapping.recipient);
          }
          const formGroup = buildRecipientForm(this.fb, recipientsPdElementsMapping);
          this.recipientsPdElementsMapping.push(formGroup);
        }
      }

      const securityMeasures = isDraft ? this.bpaRequestDetails.securityMeasures?.securityControl : (this.bpaRequestDetails.securityMeasures?.securityControl || [])
        .map((id: any) =>
          this.securityControlList.find(ctrl => String(ctrl.id) === String(id))).filter((ctrl: any) => !!ctrl);
      if (isDraft) {
        this.securityControlList = [...this.securityControlList, ...this.bpaRequestDetails.newSecurityControlList || []];
      }
      if (this.bpaRequestDetails.securityMeasures?.retentionPeriod) {
        const [days, period] = this.bpaRequestDetails.securityMeasures.retentionPeriod.split(' ');
        this.createBpaForm.get('securityMeasures')?.patchValue({
          days: days || '',
          retentionPeriod: (period || '').trim(),
          securityControl: securityMeasures || []
        });
      }
      this.dataUpdated = uuidv1();
      this.initFormSubscription();
    }
    finally {
      this.isLoading = false
    }
  }




  get showFooterButtons() {
    return this.selectedTab == CreateBpaTabKey.RISK_SUMMARY ? false : true
  }

  saveDraftData() {
    const formData = this.createBpaForm.value;
    if (this.isFormValueEmpty(formData)) {
      return
    }
    const newLocalData = this.createBpaService.preparePayloadForNewItems();
    const formDataWithDate = {
      ...this.createBpaForm.value,
      ...newLocalData,
      createdAt: new Date().toISOString(),
    };
    const body =
    {
      "key": BPA_DRAFT_KEY,
      "formData": formDataWithDate
    }
    this.dataInventoryApiHelperService.saveBpaDrafts(body)
      .subscribe({
        next: async (res) => {

        },
        error: (e: Error) => {
          console.error(e.message);
        },
      });
  }

  isFormValueEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0 || value.every(v => this.isFormValueEmpty(v));
    if (typeof value === 'object') return Object.values(value).every(v => this.isFormValueEmpty(v));
    return false
  }

  async deleteDraftRequests() {
    if (this.bpaDraftRequestId) {
      await this.deleteDraftRequest(this.bpaDraftRequestId)
      return
    }
    if (this.bpaManualDraftRequestId) {
      await this.deleteManualDraftRequest();
      return
    }
  }

  async deleteManualDraftRequest() {
    try {
      const response = await this.dataInventoryApiHelperService.deleteManualDraftRequest(this.bpaManualDraftRequestId);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async deleteDraftRequest(bpaDraftRequestId: string) {
    if (!bpaDraftRequestId) {
      return
    }
    try {
      const response = await this.dataInventoryApiHelperService.deleteDraftRequest(bpaDraftRequestId);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  get isEditMode() {
    return this.bpaMode == BPA_MODE.EDIT
  }

  get isCreateNew() {
    return (this.bpaDraftRequestId || this.bpaRequestId || this.bpaManualDraftRequestId) ? false : true
  }

  get isViewModeType() {
    return this.bpaMode == BPA_MODE.VIEW
  }


  updateBpaMode(mode: string) {
    this.bpaMode = (mode === BPA_MODE.VIEW ? BPA_MODE.VIEW : BPA_MODE.EDIT);
    const _mode = this.bpaMode === BPA_MODE.EDIT;
    this.bpaService.updateBpaMode(_mode);
  }

  onEditBpaDetail() {
    this.formIsUpdated = false
    const queryParams = { bpaRequestId: this.bpaRequestId, mode: BPA_MODE.EDIT };
    this.router.navigate([`${this.currentPath}/${routeConstants.BPA_CREATE}`], {
      queryParams: queryParams,
    });
    this.createBpaForm.enable()
  }

  showTabErrors() {
    setTimeout(() => {
      if (this.overviewForm?.invalid) {
        this.selectedTabIndex = CREATE_BPA_STAGES[0].position
        this.overviewForm?.markAllAsTouched()
        return
      }
      else if (this.dataElements?.invalid) {
        this.selectedTabIndex = CREATE_BPA_STAGES[1].position
        this.dataElements?.markAllAsTouched()
        return
      }
      else if (this.source?.invalid) {
        this.selectedTabIndex = CREATE_BPA_STAGES[2].position
        this.source?.markAllAsTouched()
        return
      }
      else if (this.recipients?.invalid) {
        this.selectedTabIndex = CREATE_BPA_STAGES[4].position
        this.recipients?.markAllAsTouched()
        return
      }
    }, 300);
  }

  tabHasError(key: string) {
    switch (key) {
      case CREATE_BPA_STAGES[0].key:
        return this.overviewForm?.invalid && this.bpaService.formTouched
      case CREATE_BPA_STAGES[1].key:
        return this.dataElements?.invalid && this.bpaService.formTouched
      case CREATE_BPA_STAGES[2].key:
        return this.source?.invalid && this.bpaService.formTouched
      case CREATE_BPA_STAGES[4].key:
        return this.recipients?.invalid && this.bpaService.formTouched
      default:
        return false
    }
  }

  onOpenExternalWindow(type: string) {
    if (type == BPA_EXTERNAL_WINDOW.SOURCE_ELEMENT_PD || type == BPA_EXTERNAL_WINDOW.ASSET_ELEMENT_PD) {
      this.bpaService.setDataSubject(this.dataSubjectList?.value);
    }
    const popup = window.open(`/${externalWindowRoute.DATA_INVENTORY_POP_UP}?type=${type}`, `${type}`, 'width=500,height=400,top=100,left=100');
  }

  onAddNewDataElements(pdElemementMapping: PdElementMapping) {
    if (pdElemementMapping) {
      const formGroup = buildPdElementsForm(this.fb, pdElemementMapping, true);
      const dsIndex = this.dataSubjectPdElementList.findIndex(ds => (ds.dataSubjectType?.id == pdElemementMapping.dataSubject?.id));
      if (dsIndex > -1) {
        const findPdElements = this.dataSubjectPdElementList[dsIndex]?.pdElementMappingList.find(pdEle => pdEle.pdElement?.id == pdElemementMapping.pdElement?.id); //Avoid duplicate pd elements mapping
        if (!findPdElements) {
          this.getPdElementMappingList(dsIndex).push(formGroup);
        }
      }
    }
  }

  onCreateNewAssessment(event: any) {
    if (!event) {
      return
    }
    // const _bpaDetails = {
    //   bpa: {
    //     bpaId: this.bpaRequestId,
    //     name: this.bpaName.value,
    //   },
    //   regulation: this.regulations?.value,
    //   processOwner: this.owner?.value,
    //   disabled: true
    // }

    // this.assessmentService.setBpaDetails(_bpaDetails);
    this.formIsUpdated = false
    this.router.navigate([`${USER}/${ASSESSMENTS}/${ASSESSMENT}/${CREATE_DPIA_ASSESSMENT}`], {
      queryParams: { bpaId: this.bpaRequestId }
    });
  }

  get showDraftButton(): boolean {
    return !(this.bpaRequestId)
  }

  patchDataSubjectMapping(dsPdElementMappingList: any[]) {
    if (dsPdElementMappingList?.length)
      for (const dataSubject of dsPdElementMappingList) {
        const dsIndex = dataSubject.index;
        for (const pdElementMapping of dataSubject.pdElementMappingList) {
          const findPdElements = this.dataSubjectPdElementList[dsIndex]?.pdElementMappingList.find(pdEle => pdEle.pdElement?.id == pdElementMapping.pdElement?.id); //Avoid duplicate pd elements mapping
          if (!findPdElements) {
            const _pdElementMapping = { ...pdElementMapping, selected: false }
            const formGroup = buildPdElementsForm(this.fb, _pdElementMapping, true, this.isEditMode);
            this.getPdElementMappingList(dsIndex).push(formGroup);
          }
        }
      }
  }

  onUpdatePdElements(event: { type: string, selectedDataSubjectIndex: number, pdElementMapping: PdElementMapping }) {
    const dsIndex = event.selectedDataSubjectIndex;
    const pdElementMapping = event.pdElementMapping;
    if (dsIndex > -1) {
      if (event.type == 'edit') {
        const pdElementIndex = this.dataSubjectPdElementList[dsIndex]?.pdElementMappingList.findIndex(pdEle => pdEle.pdElement?.id == pdElementMapping.pdElement?.id); //Avoid duplicate pd elements mapping
        if (pdElementIndex > -1) {
          const _pdElementMapping = { ...pdElementMapping, selected: false };
          const formGroup = buildPdElementsForm(this.fb, _pdElementMapping);
          this.getPdElementMappingList(dsIndex).setControl(pdElementIndex, formGroup)
        }
      }
      else if (event.type == 'delete') {
        const pdElementIndex = this.dataSubjectPdElementList[dsIndex]?.pdElementMappingList.findIndex(pdEle => pdEle.pdElement?.id == pdElementMapping.pdElement?.id); //Avoid duplicate pd elements mapping
        if (pdElementIndex > -1) {
          this.getPdElementMappingList(dsIndex).removeAt(pdElementIndex);
          this.deleteMappedPdElements(pdElementMapping)
        }
      }
    }
  }

  onPdElementsDeleted(event: any) {
    this.deleteMappedPdElements(event.deletedItems)
  }

  deleteMappedPdElements(pdElementMapping: PdElementMapping) {
    // Source
    let sourceType = 'source'
    const sourceIndexDataList = findPdElementIndexInAnySource(this.createBpaForm.value, sourceType, pdElementMapping);
    if (sourceIndexDataList?.length) {
      for (let indexData of sourceIndexDataList) {
        if (indexData?.parentIndex > -1 && indexData?.index > -1) {
          const sourcePdElemementMapping: SourcetPdElementMapping = this.sourcePdElementsMappingList[indexData.parentIndex];
          const pdElemementMapping = sourcePdElemementMapping.pdElementMappingList[indexData.index];
          this.createBpaService.onDeleteSourcePdElementMapping(sourcePdElemementMapping, pdElemementMapping);
          this.getSourcePdElementMappingList(indexData.parentIndex).removeAt(indexData.index);
        }
      }
    }

    // Asset
    let assetType = 'asset'
    const assetIndexDataList = findPdElementIndexInAnySource(this.createBpaForm.value, assetType, pdElementMapping);
    if (assetIndexDataList?.length) {
      for (let indexData of assetIndexDataList) {
        if (indexData?.parentIndex > -1 && indexData?.index > -1) {
          const assetPdElementsMapping: AssetPdElementMapping = this.assetPdElementsMappingList[indexData.parentIndex];
          const pdElemementMapping = assetPdElementsMapping.pdElementMappingList[indexData.index];
          this.createBpaService.onDeleteAssetPdElementMapping(assetPdElementsMapping, pdElemementMapping);
          this.getAssetMappingList(indexData.parentIndex).removeAt(indexData.index);
        }
      }
    }

    // Recipient
    let recipientType = 'recipient'
    const recipientIndexDataList = findPdElementIndexInAnySource(this.createBpaForm.value, recipientType, pdElementMapping);
    if (recipientIndexDataList?.length) {
      for (let indexData of recipientIndexDataList) {
        if (indexData?.parentIndex > -1 && indexData?.index > -1) {
          const recipientsPdElementsMapping: RecipientPdElementMapping = this.recipientsPdElementsMappingList[indexData.parentIndex];
          const pdElemementMapping = recipientsPdElementsMapping.pdElementMappingList[indexData.index];
          this.createBpaService.onDeleteRecepientPdElementMapping(recipientsPdElementsMapping, pdElemementMapping);
          this.getRecepientMappingList(indexData.parentIndex).removeAt(indexData.index);
        }
      }
    }
  }

  onDataSubjectChange(event: any) {
    if (event.type == 'add') {
      this.buildDataSubjectForm()
    }
    else if (event.type == 'delete') {
      const dataSubjectType = event.dataSubjectType;
      this.onRemoveDataSubjectMapping(dataSubjectType)
    }
  }

  onRemoveDataSubjectMapping(dataSubjectType: BpaDataSubject) {
    if (!dataSubjectType) {
      return
    }
    const dataSubjectPdElementMappingList: DataSubjectPdElemementMapping[] = this.dataSubjectPdElementMapping.value;
    const dtataSubjectMappingIndex = dataSubjectPdElementMappingList.findIndex((dsMap: DataSubjectPdElemementMapping) => dsMap?.dataSubjectType?.id == dataSubjectType.id);
    if (dtataSubjectMappingIndex > -1) {
      const dataSubjectMapping = dataSubjectPdElementMappingList[dtataSubjectMappingIndex];
      this.dataSubjectPdElementMapping.removeAt(dtataSubjectMappingIndex);
      const dataSubject: any = dataSubjectMapping.dataSubjectType;

      for (const pdElementMapping of dataSubjectMapping.pdElementMappingList) {
        this.createBpaService.onDeletePdElement(dataSubject, pdElementMapping);
        this.deleteMappedPdElements(pdElementMapping)
      }
    }
  }

  onRemovePurpose(purpose: Purpose) {
    let hasDeletedPurpose: boolean = false
    const dataSubjectPdElementMappingList: DataSubjectPdElemementMapping[] = this.dataSubjectPdElementMapping.value;
    for (const dsPdElementMapping of dataSubjectPdElementMappingList) {
      const pdElementMappingList = dsPdElementMapping.pdElementMappingList;
      for (const pdElementMapping of pdElementMappingList) {
        let findPurpose = pdElementMapping.purpose?.length ? pdElementMapping.purpose.find(_purpose => _purpose.id == purpose.id) : null;
        if (findPurpose) {
          hasDeletedPurpose = true
          continue
        }
      }
    }
    if (hasDeletedPurpose) {
      let message = `Are you sure you want to delete the purpose "${purpose.purposeName}"? This action cannot be undone.`
      this.openConfirmationDialog(purpose.purposeName, message, 'purpose', purpose)
      return
    }
    this.deletePurpose(purpose)
  }

  deletePurpose(purpose: Purpose) {
    const control = this.processPurpose
    const updated = control?.value.filter((p: any) => p.id !== purpose.id);
    control?.setValue(updated);
    this.deletePurposeFromDataSubject(purpose)
    this.createBpaService.onDeletePurpose(purpose)
  }

  deletePurposeFromDataSubject(purpose: Purpose) {
    const dataSubjectPdElementMappingList: DataSubjectPdElemementMapping[] = this.dataSubjectPdElementMapping.value;
    for (const [dsIndex, dsPdElementMapping] of dataSubjectPdElementMappingList.entries()) {
      const pdElementMappingList = dsPdElementMapping.pdElementMappingList;
      for (const [pdIndex, pdElementMapping] of pdElementMappingList.entries()) {
        const purposeFormControl = this.getPdElementMappingList(dsIndex).at(pdIndex)?.get('purpose') as FormControl;
        let findIndex = pdElementMapping.purpose?.length ? pdElementMapping.purpose.findIndex(_purpose => _purpose.id == purpose.id) : -1;
        if (findIndex > -1) {
          const updated = pdElementMapping.purpose.filter((p: any) => p.id !== purpose.id)
          purposeFormControl?.setValue(updated);
        }
      }
    }
  }

  openConfirmationDialog(itemName: string, content: string, dialogType: string, dialogContent: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: `${content}`,
        confirmationDetail: itemName,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        if (dialogType == 'purpose') {
          this.deletePurpose(dialogContent);
        }
      }
    });
  }

  get disablePrevBtnCP(): boolean {
    return !this.bpaIds || this.bpaIds.length <= 1 || this.currentIndex === 0;
  }

  get disableNextBtnCP(): boolean {
    return !this.bpaIds || this.bpaIds.length <= 1 || this.currentIndex === this.bpaIds.length - 1;
  }

  goNextAsset() {
    if (this.currentIndex < this.bpaIds.length - 1) {
      this.currentIndex++;
      const nextId = this.bpaIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${routeConstants.BPA_DETAILS}`], {
        queryParams: {
          bpaRequestId: nextId,
          mode: 'VIEW'
        },
        state: {
          assetIds: this.bpaIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }
  goPrevAsset() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevId = this.bpaIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${routeConstants.BPA_DETAILS}`], {
        queryParams: {
          bpaRequestId: prevId,
          mode: 'VIEW'
        },
        state: {
          assetIds: this.bpaIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }

  setUserPermissions() {
    this.showEditButton = this.rolePermissionService.editBpa || this.rolePermissionService.fullAccessBpa;
  }

  get _showEditButton() {
    return (!this.isEditMode && !(this.selectedTab === CreateBpaTabKey.RISK_SUMMARY)) && this.showEditButton
  }
}
