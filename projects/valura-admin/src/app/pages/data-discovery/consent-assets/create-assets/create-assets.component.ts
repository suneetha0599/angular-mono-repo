import { ChangeDetectorRef, Component, ElementRef, HostListener, inject, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BPA_DETAIL_HEADER, CREATE_ASSET_STEP2_HEADER, CREATE_ASSET_STEP2_TAB, HEADER_ACTION, HEADER_NAME, HOSTING_SITE, mockBpaData, PDElementsData } from '../constant';
import { MatSortModule } from '@angular/material/sort';
import { BusinessProcess, CreateAssetRequest, PDElements } from '@admin-core/models/DataDiscovery/Asset';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatTooltip } from '@angular/material/tooltip';
import { DSR_ATTACHMENT, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ETAG } from '@admin-core/constants/api-constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ConfigService } from '@admin-core/services/config.service';
import { MatDatepicker, MatDatepickerInput, MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { USER_TYPES } from '@admin-core/constants/constants';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatAutocompleteModule, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatChipsModule } from '@angular/material/chips';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { UserService } from '@admin-core/services/user/user.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { AssetService } from '@admin-core/services/asset/asset.service';
import { AddCategoryDialogComponent } from '../../data-discovery-dialog/add-category-dialog/add-category-dialog.component';
import { CreateAssetService } from '@admin-core/services/asset/create-asset.service';
import { v4 as uuid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CountryService } from '@admin-core/services/country/country.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

const { USER, DATA_DISCOVERY, BPA, ASSESSMENTS, ASSESSMENT, CREATE_DPIA_ASSESSMENT, CONSENT_ASSETS } = routeConstants
@Component({
  selector: 'app-create-assets',
  imports: [MatStepperModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, CommonModule,
    MatIconModule, MatOptionModule, MatRadioModule, MatSelectModule, MatTabsModule, MatTableModule, MatMenuModule,
    MatCheckboxModule, CustomMatErrorComponent, CustomMatTextareaComponent, MatSortModule, MatTooltip, MatNativeDateModule, MatDatepickerModule, MatAutocompleteModule, MatChipsModule, LoadingButtonComponent],
  templateUrl: './create-assets.component.html',
  styleUrl: './create-assets.component.scss'
})
export class CreateAssetsComponent {
  selectedTabIndex = 0
  categoryList: any
  showTable: boolean = false;
  selectedStep2Tab: string = '';
  step2Tabs = CREATE_ASSET_STEP2_TAB
  filterApplied: boolean = false;
  HEADER_NAME = HEADER_NAME;
  HEADER_ACTION = HEADER_ACTION
  tableHeaders: any = [];
  displayedHeaders = [];
  tooltip = "Data Usage\n  This data is collected solely for identification purpose"
  recipientDataSource = new MatTableDataSource<PDElements>();
  businessProcessDataSource = new MatTableDataSource<BusinessProcess>([]);
  pDElementsList: PDElements[] = []
  tenureOptions: string[] = ['1 Year', '2 Years', '3 Years'];
  isSubmitLoading = false;
  securityControlList: any[] = [];
  searchTerm = '';
  filteredSecurityControlList: any[] = [];
  filteredCategoryList: any[] = [];
  catSearchTerm = '';
  departmentSearchTerm = '';
  filteredDepartmentList: any[] = [];
  tableType = {
    PD_ELE: "PD_ELE",
    BPA: "BPA",
  }
  steps = {
    step2: 2,
    step3: 3
  }
  pageTitle = 'Create Asset';

  uploadedFiles: any[] = [];
  departmentList: any;
  newCategory: any;
  systemOwners: any[] = [];
  HOSTING_SITE = HOSTING_SITE;

  private apiHelperService = inject(ApiHelperService);
  private httpService = inject(HttpService);
  private snackbarService = inject(SnackbarService);
  private configService = inject(ConfigService);
  private countryService = inject(CountryService)
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private userService = inject(UserService);
  private securityControlService = inject(SecurityControlService);
  private assetService = inject(AssetService)
  private createAssetService = inject(CreateAssetService)
  private assessmentService = inject(AssessmentService);

  @ViewChild('stepper') stepper!: MatStepper;

  assetForm!: FormGroup;
  assetId: number = 0;
  manualDraftAssetId: string = '';
  draftAssetId: string = '';
  editMode: boolean = false;
  isDraftLoading = false;
  bpaAssetDetails: any;
  deleteDraftLoading = false;
  filteredVendors: any[] = [];
  vendorSearch: string = '';
  vendorList: any[] = [];
  newDepartmentList: any = []
  page = 1;
  pageSize = 10;
  hasMore = true;
  loadingVendors = false;
  newVendorList: any[] = []
  isDraft = false
  locationMasterList: any[] = [];
  editDetailMode = false;
  filteredLocationList: { id: number; name: string }[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  isFinalSaved: boolean = false;

  get nameControl(): FormControl {
    return this.assetForm.get('name') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,

  ) {
    this.route.queryParams.subscribe(params => {
      const assetId = params['assetId'];
      const manualDraftAssetId = params['requestRid'];
      const draftAssetId = params['requestRid'];
      this.assetId = +(assetId);
      const mode = params['mode'];
      this.manualDraftAssetId = (manualDraftAssetId);
      this.draftAssetId = (draftAssetId);

      if (mode === 'edit' && this.assetId) {
        this.editDetailMode = true;
        this.pageTitle = "Edit Asset";
      } else {
        if (this.manualDraftAssetId || this.draftAssetId) {
          this.pageTitle = "Create Asset"
          this.editMode = (this.manualDraftAssetId || this.draftAssetId ? true : false);
          this.isDraft = true
        }
      }

    });
  }

  async ngOnInit() {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      assetType: ['INTERNAL'],
      assetUrl: [''],
      assetCategoryId: [null],
      departmentId: [null],
      systemOwner: [''],
      vendorDetail: [null],
      effectiveDate: [''],
      startDate: [''],
      tenurePeriod: [''],
      contractDocuments: this.fb.array([]),
      hostingDetails: this.fb.array([]),
      securityMeasures: this.fb.control([]),
      newDepartmentList: [''],
      newVendorList: [''],
      newSecurityControlList: [''],
    });

    await Promise.all([
      this.loadUserList(),
      this.loadCategories(),
      this.loadDepartments(),
      this.getSecurityControlList(),
      this.getVendorList(),
      this.getInitialConfiguration()
    ]);


    if (this.assetId) {
      await this.getAssetDetailsEditMode();
    } else if (this.manualDraftAssetId) {
      await this.getManualDraftRequestDetails();
    }
  }

  get contractDocuments(): FormArray {
    return this.assetForm.get('contractDocuments') as FormArray;
  }

  get hostingDetails(): FormArray {
    return this.assetForm.get('hostingDetails') as FormArray;
  }

  get securityControl(): FormControl {
    return this.assetForm.get('securityMeasures') as FormControl;
  }

  bpaOptions = [
    'Employee onboarding',
    'Storage & compute',
    'Hiring workflows',
    'Payroll',
    'Finance reporting'
  ];

  openCreateBpaDialog() {
  }

  businessProcessDisplayedColumns: string[] = [
    'name',
    'risk',
    'owner',
    'department',
    'dsInvolved',
    'actions'
  ];



  @ViewChild(MatAutocompleteTrigger) vendorAutoTrigger!: MatAutocompleteTrigger;


  onVendorPanelOpen() {
    setTimeout(() => {
      const panel = document.querySelector('.cdk-overlay-pane .mat-mdc-autocomplete-panel');
      if (panel) {
        panel.addEventListener('scroll', () => this.onScrollVendorPanel(panel as HTMLElement));
      }
    });
  }



  onScrollVendorPanel(panel: HTMLElement) {
    const { scrollTop, scrollHeight, clientHeight } = panel;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 20;

    if (atBottom && !this.loadingVendors && this.hasMore) {
      this.page++;
      this.getVendorList(true);
    }
  }


  fetchBpaDetails() {
    this.setTableInfo(this.tableType.BPA)
    this.showTable = true;
  }

  async getManualDraftRequestDetails() {
    if (!this.manualDraftAssetId) {
      return
    }
    const data = await this.dataInventoryApiHelperService.getBpaDraftRequestDetails(this.manualDraftAssetId);
    if (data) {
      this.bpaAssetDetails = data.formData;
      this.patchRequestForm()
    }
  }

  async getAssetDetailsEditMode() {
    const data = await this.apiHelperService.getAssetDetails(this.assetId);
    if (data) {
      this.bpaAssetDetails = {
        ...data.overview,
        securityMeasures: data.securityMeasures
      };

      this.patchRequestForm()
    }
  }


  async getInitialConfiguration() {
    const res = await this.countryService.getCountryMasterList();
    if (res) {
      this.locationMasterList = res || [];
      this.filteredLocationList = [...this.locationMasterList];
    }
    return;
  }

  async patchRequestForm() {
    if (!this.bpaAssetDetails) return;


    // const securityControls = (this.bpaAssetDetails.securityMeasures || [])
    //   .map((id: number) => this.securityControlList.find((ctrl: any) => ctrl.id === id))
    //   .filter((ctrl: any) => !!ctrl);

    if (this.isDraft) {

      const category = this.categoryList?.find(
        (c: any) => c.id === this.bpaAssetDetails.assetCategoryId?.id
      );

      this.newDepartmentList = this.bpaAssetDetails.newDepartmentList
      this.filteredDepartmentList = [...this.departmentList, ...this.newDepartmentList]
      this.departmentList = [...this.departmentList, ...this.newDepartmentList]

      this.newVendorList = this.bpaAssetDetails.newVendorList || [];
      this.filteredVendors = [...this.vendorList, ...this.newVendorList]
      this.vendorList = [...this.vendorList, ...this.newVendorList]
      const list = this.bpaAssetDetails?.securityMeasures || this.bpaAssetDetails?.securityMeasures.map(
        (item: any) => item?.name
      );
      this.securityControlList = [...this.securityControlList, ...list]
      this.securityControlList = Array.from(new Set(this.securityControlList));
      this.filteredSecurityControlList = this.securityControlList
      const department = this.departmentList?.find(
        (d: any) => d.id === this.bpaAssetDetails.departmentId?.id
      );

      const vendor = this.vendorList?.find(
        (v: any) => v.vendorId === this.bpaAssetDetails.vendorDetail?.vendorId
      );
      this.assetForm.patchValue({
        name: this.bpaAssetDetails.name ?? '',
        description: this.bpaAssetDetails.description ?? '',
        assetType: this.bpaAssetDetails.assetType ?? 'INTERNAL',
        assetUrl: this.bpaAssetDetails.url ?? '',
        assetCategoryId: category ?? null,
        departmentId: department ?? null,
        vendorDetail: vendor ?? null,
        systemOwner: this.bpaAssetDetails?.systemOwner ?? '',
        securityMeasures: list ?? [],

      });

      if (Array.isArray(this.bpaAssetDetails.hostingDetails) && this.bpaAssetDetails.hostingDetails.length) {
        this.hostingDetails.clear();
        for (const h of this.bpaAssetDetails.hostingDetails) {
          const group = this.createHostingDetail();

          group.patchValue({
            site: h.hostingSite ?? '',
            name: h.name ?? '',
            location: h.location ?? null,
            id: h.hostingId ?? 0
          });

          this.hostingDetails.push(group);
        }
      }
    }
    else {
      const category = this.categoryList?.find(
        (c: any) => c.id === this.bpaAssetDetails.category?.categoryId
      );
      const department = this.departmentList?.find(
        (d: any) => d.id === this.bpaAssetDetails.departmentId
      );
      const vendor = this.vendorList?.find(
        (v: any) => (v.vendorId || v.id) === this.bpaAssetDetails.vendorDetails?.vendorId
      );
      const selectedSecurityObjects =
        (this.bpaAssetDetails.securityMeasures || [])
          .map((id: any) =>
            this.securityControlList.find(ctrl => String(ctrl.id) === String(id))
          )
          .filter((ctrl: any) => !!ctrl);

      this.assetForm.patchValue({
        name: this.bpaAssetDetails.name ?? '',
        description: this.bpaAssetDetails.description ?? '',
        assetType: this.bpaAssetDetails.type ?? 'INTERNAL',
        assetUrl: this.bpaAssetDetails.url ?? '',
        assetCategoryId: category ?? null,
        departmentId: department ?? null,
        vendorDetail: vendor ?? null,
        systemOwner: this.bpaAssetDetails.systemOwner ?? '',
        securityMeasures: selectedSecurityObjects ?? []
      });


      if (Array.isArray(this.bpaAssetDetails.hostingDetails) && this.bpaAssetDetails.hostingDetails.length) {
        this.hostingDetails.clear();
        for (const h of this.bpaAssetDetails.hostingDetails) {
          const group = this.createHostingDetail();

          // Find location object from master list
          const locationObj = this.locationMasterList.find(
            (loc: any) => loc.id === h.location
          );

          group.patchValue({
            site: h.hostingSite ?? '',
            name: h.name ?? '',
            location: locationObj ?? null,
            id: h.hostingId ?? 0
          });

          this.hostingDetails.push(group);
        }
      }
    }


    // if (this.bpaAssetDetails.assetCategoryId) {
    //   const category = this.categoryList.find(
    //     (c: any) => c.id === this.bpaAssetDetails.assetCategoryId
    //   );
    //   if (category) {
    //     this.assetForm.get('assetCategoryId')?.setValue(category);
    //   }
    // }
  }





  onTabChange(event: MatTabChangeEvent) {
    const index = event.index
    this.selectedStep2Tab = this.step2Tabs[index].key;
  }

  onStepperChange(event: StepperSelectionEvent) {
    const step = (event.selectedIndex + 1);
    if (step == this.steps.step2) {
      this.setTableInfo(this.tableType.PD_ELE)
    }
    else if (step == this.steps.step3) {
      if (this.showTable) {
        this.setTableInfo(this.tableType.BPA)
      }
    }
  }


  async setTableInfo(type: string = this.tableType.PD_ELE) {
    if (type == this.tableType.PD_ELE) {
      this.tableHeaders = CREATE_ASSET_STEP2_HEADER;
      this.recipientDataSource = new MatTableDataSource<PDElements>;
      this.pDElementsList = PDElementsData
      this.recipientDataSource = new MatTableDataSource(this.pDElementsList);
      if (this.tableHeaders?.length)
        this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    }
    else if (type == this.tableType.BPA) {
      this.tableHeaders = BPA_DETAIL_HEADER;
      this.businessProcessDataSource = new MatTableDataSource<BusinessProcess>;
      this.businessProcessDataSource = new MatTableDataSource(mockBpaData);
      if (this.tableHeaders?.length)
        this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    }
  }

  onFileDropped(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.onFileChange(fileList[i]);
    }
  }

  onFileBrowse(event: any) {
    if (event.target.files && event.target.files.length) {
      for (let i = 0; i < event.target.files.length; i++) {
        this.onFileChange(event.target.files[i]);
      }
    }
  }

  onFileChange(file: File) {
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.snackbarService.openSnack(`File size exceeds 5MB`);
      return;
    }
    if (this.uploadedFiles.some(f => f.fileName === file.name)) {
      this.snackbarService.openSnack(`${file.name} already added`);
      return;
    }
    this.uploadPresignedUrl(file);
  }

  async uploadPresignedUrl(file: File) {
    const params = {
      fileName: file.name,
      contentType: file.type,
      purpose: DSR_ATTACHMENT
    };

    try {
      const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
      if (imageInfo) {
        const attachmentData = { ...imageInfo, file: file, fileName: file.name };
        this.uploadedFiles = [...this.uploadedFiles, attachmentData];
        this.contractDocuments.push(
          this.fb.group({
            fileName: [attachmentData.fileName],
            file: [attachmentData.file],
            fileKey: [attachmentData.fileKey],
            presignedUrl: [attachmentData.presignedUrl]
          })
        );
        this.snackbarService.openSnack(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error(error);
      this.snackbarService.openSnack(`${file.name} upload failed!`);
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
    this.contractDocuments.removeAt(index);
  }


  async getPresignedUrl(file: File) {
    const params = {
      "fileKey": file.name,
    }
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
  }

  async getImageEtag(file: File, presignedUrl: string) {
    let res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
    if (res && this.httpService.isHttpSuccess(res?.status)) {
      return res
    }
    return null
  }


  async processAttachmentData() {
    const attachments = this.assetForm.get('contractDocuments')?.value;
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedAttachments: any[] = [];

    for (const att of attachments) {
      let res: any = await this.getImageEtag(att.file, att.presignedUrl);
      if (res) {
        processedAttachments.push({
          filePath: att.fileKey,
          eTag: res.headers.get(ETAG),
          fileName: att.file.name
        });
      } else {
        this.snackbarService.openSnack(`Failed to fetch eTag for ${att.file.name}`);
        return null;
      }
    }
    // this.step1Form.get('contractDocuments')?.setValue(processedAttachments);
    return processedAttachments;
  }

  onclick(event: any) {
    event.target.value = ''
  }

  async loadDepartments() {
    this.departmentList = await this.assetService.getDepartmentList() || [];
    this.filteredDepartmentList = [...this.departmentList];
  }

  async loadUserList() {
    try {
      const res = await this.userService.getAllUserMasterList(false, USER_TYPES);
      if (res) {
        this.systemOwners = res;
      } else {
        this.systemOwners = [];
      }
    } catch (e) {
      console.error('Error loading users:', e);
      this.systemOwners = [];
    }
  }


  async loadCategories() {
    const res = await this.apiHelperService.getCategorises();
    if (res) {
      this.categoryList = res.assetCategories || [];
      this.filteredCategoryList = [...this.categoryList];
      return;
    }
  }



  onSearchCategory(value: string) {
    this.catSearchTerm = value;
    const filterValue = value.toString().toLowerCase();
    this.filteredCategoryList = this.categoryList.filter((control: { name: string; }) =>
      control.name.toString().toLowerCase().includes(filterValue)
    );
  }

  onAddCategory(event: any, name: string) {
    if (event.isUserInput) {
      this.addNewCategory(name)
    }
  }


  async addNewCategory(name: string) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) return;

    try {
      const newControl = await this.apiHelperService.addCategory({ name: trimmed });
      if (newControl) {

        this.categoryList = [...this.categoryList, newControl];
        this.filteredCategoryList = [...this.categoryList];
        this.assetForm.get('assetCategoryId')?.setValue(newControl);
        this.catSearchTerm = '';
      }

      this.searchTerm = '';
    } catch (e) {
      console.error('Error while adding category', e);
    }
  }

  removeCategory(category: any) {
    const control = this.assetForm.get('category');
    const updated = control?.value.filter((p: any) => p.id !== category.id);
    control?.setValue(updated);
  }


  isExistingCategory(name: string): boolean {
    return this.categoryList.some((p: any) => p.name === name);
  }


  selectCategory(category: any) {
    if (!category) return;


    this.assetForm.get('assetCategoryId')?.setValue(category);
    this.catSearchTerm = category.name;
    this.filteredCategoryList = [...this.categoryList];
  }


  onSearchDepartment(value: string) {
    this.departmentSearchTerm = value;
    const filterValue = value.toString().toLowerCase();
    this.filteredDepartmentList = this.departmentList.filter((dep: any) =>
      dep.name.toString().toLowerCase().includes(filterValue)
    );
  }

  selectDepartment(department: any) {
    if (!department) return;
    this.assetForm.get('departmentId')?.setValue(department);
    this.departmentSearchTerm = department.name;
    this.filteredDepartmentList = [...this.departmentList];
  }

  async onAddDepartment(event: any, name: string) {
    if (!event.isUserInput) return;
    const newDep = await this.apiHelperService.addDepartment({ name, description: '' });
    if (newDep) {
      this.departmentList.push(newDep);
      this.assetForm.get('departmentId')?.setValue(newDep);
      this.departmentSearchTerm = newDep.name;
      this.filteredDepartmentList = [...this.departmentList];
    }
  }


  get departmentControl(): FormControl {
    return this.assetForm.get('departmentId') as FormControl;
  }

  get categoryControl(): FormControl {
    return this.assetForm.get('assetCategoryId') as FormControl;
  }

  isExistingDepartment(name: string): boolean {
    return this.departmentList?.some((dep: any) => dep.name.toString().toLowerCase() === name.toString().toLowerCase()) || false;
  }

  // async addDepartment() {
  //   if (!this.newDepartment.name.trim()) return;

  //   try {
  //     const res = await this.apiHelperService.addDepartment(this.newDepartment);
  //     this.departmentList.push(res);
  //     this.newDepartment = { name: '', description: '' };
  //   } catch (err) {
  //     console.error('Error adding department:', err);
  //   }
  // }




  addHostingDetail() {
    this.hostingDetails.push(this.createHostingDetail());
  }

  removeHostingDetail(index: number) {
    const control = this.hostingDetails.at(index);

    if (control.get('id')?.value) {
      control.get('isDeleted')?.setValue(true);
    } else {
      this.hostingDetails.removeAt(index);
    }
  }


  createHostingDetail(): FormGroup {
    return this.fb.group({
      id: 0,
      site: [''],
      name: [''],
      location: [''],
      isDeleted: [false]
    });
  }


  async onSubmit() {
    this.isSubmitLoading = true;

    const processedAttachments = await this.processAttachmentData();
    if (processedAttachments === null) return;

    const formValue = this.assetForm.value;
    const hostingDetails = this.editDetailMode
      ? (formValue.hostingDetails || []).map((h: any) => ({
        hostingId: h.id ?? 0,
        site: h.site || null,
        name: h.name || '',
        location: h.location?.id || null,
        isDeleted: h.isDeleted ?? false
      }))
      : (formValue.hostingDetails || []).map((h: any) => ({
        site: h.site || null,
        name: h.name || '',
        location: h.location?.id || null
      }));

    const payload: CreateAssetRequest = {
      name: formValue.name,
      description: formValue.description,
      assetType: formValue.assetType,
      assetUrl: formValue.assetUrl,
      assetCategoryId: formValue.assetCategoryId?.id ?? 0,
      departmentId: formValue.departmentId?.id ?? 0,
      systemOwner: formValue.systemOwner ? formValue.systemOwner : null,
      vendorId: formValue.vendorDetail?.vendorId || formValue.vendorDetail?.id || 0,
      status: 'ACTIVE',
      // newDepartment: formValue.newDepartmentList,
      // newVendor: formValue.newVendorList,
      newDepartment: formValue.departmentId
        ? Array.isArray(formValue.departmentId)
          ? formValue.departmentId[formValue.departmentId.length - 1] || null
          : formValue.departmentId
        : null,

      newVendor: formValue.vendorDetail && !formValue.vendorDetail.vendorId && !formValue.vendorDetail.id
        ? {
          id: 0,
          name: formValue.vendorDetail.name || '',
          description: formValue.vendorDetail.description || ''
        }
        : null,
      securityMeasures: (formValue.securityMeasures || []).map((x: any) => x.id),
      hostingDetails: hostingDetails,
      newSecurityMeasures: (formValue.newSecurityControlList || []).filter((item: any) => item && item.id)
        .map((item: any) => ({
          securityMeasureId: item.id,
          name: item.name
        }))


    };
    const request$ = this.editDetailMode
      ? this.apiHelperService.onPatchAssetData(payload, this.assetId)
      : this.apiHelperService.createAsset(payload);
    request$.subscribe({
      next: (res) => {
        this.isSubmitLoading = false;
        this.navigateToBack(res?.id ?? 0);
        this.onPostSaveAsset(res?.assetId ?? 0);

        if (!this.editDetailMode) {
          this.assetForm.reset();
          this.uploadedFiles = [];
        }

        if (this.manualDraftAssetId) {
          try {
            this.dataInventoryApiHelperService.deleteManualDraftRequest(
              this.manualDraftAssetId
            );
          } catch (err) {
            console.error('Failed to delete draft', err);
          }
        }
        this.isFinalSaved = true;

        // this.router.navigate([`${USER}/${DATA_DISCOVERY}/${CONSENT_ASSETS}`]);
      },
      error: (err: any) => {
        console.error(err);
        this.isSubmitLoading = false;
        this.snackbarService.openSnack(
          this.editDetailMode ? 'Failed to update asset' : 'Failed to create asset'
        );
      },
    });
  }


  async onPostSaveAsset(bpaId: number) {
    this.createAssetService.startDbSync();
    this.createAssetService.syncDepartment();
  }


  formatDate = (date: string | Date): string | null => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };



  goBack() {
    this.router.navigate([`${USER}/${DATA_DISCOVERY}/${CONSENT_ASSETS}`]);
  }
  securityControlInput = new FormControl('');



  async getSecurityControlList(): Promise<void> {
    try {
      const securityControlList = await this.securityControlService.getSecurityControlMasterList();

      if (securityControlList) {
        this.securityControlList = securityControlList
        this.filteredSecurityControlList = this.securityControlList;
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }



  onSearchControl(value: string) {
    const q = (value ?? '').toString().trim().toLowerCase();
    this.searchTerm = q;

    if (!q) {
      this.filteredSecurityControlList = [...this.securityControlList];
      return;
    }

    this.filteredSecurityControlList = this.securityControlList.filter((control: any) =>
      (control?.name ?? '').toString().toLowerCase().includes(q)
    );
  }


  add(event: any) {
    const input = event.input;
    const value = event.value?.trim();

    if (!value) return;

    const existing = this.securityControlList.find(
      (x: any) => x.name.toLowerCase() === value.toLowerCase()
    );

    if (existing) return;

    const newObj = { id: uuid(), name: value };
    const currentList = this.assetForm.get('newSecurityControlList')?.value || [];
    this.assetForm.get('newSecurityControlList')?.setValue([...currentList, newObj]);
    this.securityControlList = [...this.securityControlList, newObj];
    this.filteredSecurityControlList = [...this.securityControlList];
    this.selectControl(newObj);
    this.createAssetService.onCreateOrUpdateSecurityControl(newObj);
    if (input) input.value = '';
    this.searchTerm = '';
  }



  selectControl(obj: any) {
    const control = this.assetForm.get('securityMeasures');
    const current = control?.value || [];

    if (!current.some((x: any) => x.id === obj.id)) {
      control?.setValue([...current, obj]);
    }
    this.filteredSecurityControlList = [...this.securityControlList];


    this.searchTerm = '';
  }




  removeControl(obj: any) {
    const control = this.assetForm.get('securityMeasures');
    control?.setValue((control?.value || []).filter((x: any) => x.id !== obj.id));
  }


  onAddOption(event: any, name: string) {
    if (event.isUserInput) {
      this.addNewSecurityControl(name)
    }
  }

  async addNewSecurityControl(name: string) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) return;

    try {
      const newControl = await this.configApiHelperService.addSecurityControls({ name: trimmed });
      if (newControl) {
        this.securityControlList = [...this.securityControlList, newControl];
        this.filteredSecurityControlList = [...this.securityControlList];
        await this.securityControlService.addSecurityControl(newControl)
        const control = this.securityControl;
        const current = control?.value || [];
        const SecurityControl = current.filter((p: any) => typeof p === 'object' && p?.id);
        control?.setValue([...SecurityControl, newControl]);
      }

      this.searchTerm = '';
    } catch (e) {
      console.error('Error while adding security control', e);
    }
  }




  isExistingControl(name: string): boolean {
    return this.securityControlList.some((p: any) => p.name === name);
  }

  displaySecurityName(security: any): string {
    return security?.name || '';
  }
  displayCategoryName(category: any): string {
    return category?.name || '';
  }
  displayDepartmentName(department: any): string {
    return department?.name || '';
  }
  displayVendorName(vendor: any): string {
    return vendor?.name || '';
  }





  async getVendorList(loadMore = false, searchQuery: string = ''): Promise<void> {
    if (this.loadingVendors || (!this.hasMore && loadMore)) return;

    this.loadingVendors = true;

    const params: any = {
      page: this.page,
      size: this.pageSize,
      status: 'ACTIVE',
    };

    if (searchQuery) {
      params.searchQuery = searchQuery;
      loadMore = false;
    }

    try {
      const response = await this.apiHelperService.getVendorList(params);
      const vendors = response?.vendors || [];

      if (vendors.length < this.pageSize) this.hasMore = false;

      this.vendorList = loadMore ? [...this.vendorList, ...vendors] : vendors;
      this.filteredVendors = [...this.vendorList];
    } finally {
      this.loadingVendors = false;
    }
  }

  clearVendorSearch() {
    this.assetForm.get('vendorDetail')?.setValue('');
    this.getVendorList();
  }

  async filterVendors() {
    const filterValue = this.vendorSearch.toLowerCase();
    if (!filterValue) {
      this.getVendorList()
      return;
    }
    this.filteredVendors = this.vendorList.filter(v =>
      v.name.toLowerCase().includes(filterValue)
    );
    if (this.filteredVendors.length > 0) return;
    await this.getVendorList(false, this.vendorSearch);
    this.filteredVendors = [...this.vendorList];
  }


  onVendorSelected(vendor: any) {
    if (!vendor) return;
    this.assetForm.get('vendorDetail')?.setValue(vendor);
    this.vendorSearch = '';
    this.filteredVendors = [...this.vendorList];
  }

  // onLocationSelected(location:string){
  //   this.filteredLocationList = [...this.locationMasterList];
  // }


  async onAddVendorOptionSelected(event: any, name: string) {
    if (!event.isUserInput || !name) return;

    try {

      const newVendor = await this.apiHelperService.addVendor({ name, status: 'ACTIVE' });

      if (newVendor) {
        this.vendorList.push(newVendor.vendorDetail);
        this.filteredVendors = [...this.vendorList];
        this.assetForm.get('vendorDetail')?.setValue(newVendor.vendorDetail);
        this.vendorSearch = newVendor.vendorDetail.name;

      }
    } catch (e) {
      console.error('Error adding vendor', e);
    }
  }


  isVendorExist(name: string): boolean {
    return this.vendorList.some(v => v.name.toLowerCase() === name.toLowerCase());
  }

  saveAsDraft() {

    // if (this.createBpaForm.invalid) {
    //   this.snackbarService.openSnack(`Please fill the required details!`);
    //   return
    // }
    if (!this.assetForm.get('name')?.value) {
      this.snackbarService.openSnack(`Asset Name is required to save Draft!`);
      return;
    }

    const formDataWithDate = {
      ...this.assetForm.value,
      createdAt: new Date().toISOString(),
      status: 'IN_ACTIVE'
    };
    const body = this.manualDraftAssetId ?
      {
        "formData": formDataWithDate,
      } :
      {
        "key": 'MANUAL_ASSET_REQUEST',
        "formData": formDataWithDate
      }

    this.isDraftLoading = true
    if (this.manualDraftAssetId) {
      this.dataInventoryApiHelperService.bpaSaveManualDraft(body, this.manualDraftAssetId)
        .subscribe({
          next: async (res) => {
            this.goBack();
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
            this.goBack();
            this.isDraftLoading = false;
          },
          error: (e: Error) => {
            console.error(e.message);
            this.isDraftLoading = false
          },
        });
    }

  }


  async onDeleteDraft() {
    if (this.deleteDraftLoading) {
      return
    }

    this.deleteDraftLoading = true
    try {
      const response = await this.dataInventoryApiHelperService.deleteManualDraftRequest(this.manualDraftAssetId);
      if (response) {
        this.goBack();
      }
    } catch (error) {
      this.snackbarService.openSnack('Error deleting draft');
      console.error('Error:', error);
    }
    this.deleteDraftLoading = false
  }


  async onDeleteVendor(vendor: any) {
    const res = await this.dataInventoryApiHelperService.deleteVendor(vendor.vendorId);
    if (res) {
      this.vendorList = this.vendorList.filter(v => v.vendorId !== vendor.vendorId);
      this.filteredVendors = [...this.vendorList];
    }
  }

  async onDeleteDepartment(department: any) {
    const res = await this.dataInventoryApiHelperService.deleteDepartment(department.id);
    if (res) {
      this.cdr.detectChanges()
      this.departmentList = this.departmentList.filter((d: { id: any; }) => d.id !== department.id);
      this.filteredDepartmentList = [...this.departmentList];
    }
  }

  async onDeleteCategory(category: any) {
    const res = await this.dataInventoryApiHelperService.deleteCategory(category.id);
    if (res) {
      this.categoryList = this.categoryList.filter((d: { id: any; }) => d.id !== category.id);
      this.filteredCategoryList = [...this.categoryList];
      this.removeCategory(category)
      this.cdr.detectChanges()
    }
  }

  async onDeleteSecurityControl(security: any) {
    const securityId = security.id
    const res = await this.configApiHelperService.deleteSecurityControl(securityId);
    if (res) {
      this.securityControlList = this.securityControlList.filter(s => s.id !== securityId);
      this.filteredSecurityControlList = [...this.securityControlList];
      this.removeControl(security);
      await this.securityControlService.deleteSecurityControl(securityId)
      this.cdr.detectChanges()
    }
  }

  filterLocations(search: string) {
    if (!search) {
      this.filteredLocationList = [...this.locationMasterList];
      return;
    }

    const lowerSearch = search.toLowerCase();
    this.filteredLocationList = this.locationMasterList.filter(loc =>
      loc.name.toLowerCase().includes(lowerSearch)
    );
  }


  displayLocationName(location?: { id: number; name: string }): string {
    return location ? location.name : '';
  }


  openAddDialog(type: 'vendor' | 'assetDepartment' | 'securityControl', initialName: string): void {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      panelClass: 'dialog-wrapper',

      data: { type }
    });

    dialogRef.componentInstance.form.patchValue({ name: initialName });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        if (type === 'assetDepartment') {
          this.departmentSearchTerm = '';
          this.filteredDepartmentList = [...this.departmentList, ...this.assetForm.get('newDepartmentList')?.value];
          return;
        }
        else if (type === 'vendor') {
          this.vendorSearch = ''
          this.filteredVendors = this.filteredVendors = [
            ...this.vendorList,
            ...this.assetForm.get('newVendorList')?.value
          ];
          return;
        }
        else if (type === 'securityControl') {
          this.filteredSecurityControlList = this.securityControlList;
          this.searchTerm = '';
          return;
        }
      }



      if (type === 'vendor') {

        const newVendorList = this.assetForm.get('newVendorList')?.value || [];
        this.assetForm.get('newVendorList')?.setValue([...newVendorList, result]);
        this.filteredVendors = [
          ...this.vendorList,
          ...this.assetForm.get('newVendorList')?.value
        ];
        this.vendorList = [
          ...this.vendorList,
          ...this.assetForm.get('newVendorList')?.value
        ];
        this.assetForm.get('vendorDetail')?.setValue(result);
        this.vendorSearch = result.name;
      }

      else if (type === 'assetDepartment') {
        const newDeptList = this.assetForm.get('newDepartmentList')?.value || [];
        this.assetForm.get('newDepartmentList')?.setValue([...newDeptList, result]);
        this.filteredDepartmentList = [
          ...this.departmentList,
          ...this.assetForm.get('newDepartmentList')?.value
        ];

        this.departmentList = [
          ...this.departmentList,
          ...this.assetForm.get('newDepartmentList')?.value
        ];
        this.assetForm.get('departmentId')?.setValue(result);
        this.departmentSearchTerm = result.name;
      }

      else if (type === 'securityControl') {
        const existingControls = this.assetForm.get('securityMeasures')?.value || [];
        const updatedList = [...existingControls, result.name];
        this.assetForm.get('securityMeasures')?.setValue(updatedList);
        this.securityControlList = [...this.securityControlList, result.name];
        this.securityControlList = Array.from(new Set(this.securityControlList));

        this.filteredSecurityControlList = [...this.securityControlList];

        this.securityControlInput.setValue('');
        this.searchTerm = '';
      }
    });
  }

  navigateToBack(assetId: number) {

    const fromAssessment = this.assessmentService.routeDetails;
    const isCreate = !this.assetId;

    if (fromAssessment && isCreate) {

      const assetDetails = {
        asset: {
          assetId,
          name: this.assetForm.get('name')?.value,
        },
        disabled: false
      };

      this.assessmentService.setBpaDetails(assetDetails);
      this.assessmentService.clearRouteDetails();

      this.router.navigate(
        [`${USER}/${ASSESSMENTS}/${ASSESSMENT}/${CREATE_DPIA_ASSESSMENT}`],
        { queryParams: { source: 'asset' } }
      );

      return;
    }

    this.router.navigate([`${USER}/${DATA_DISCOVERY}/${CONSENT_ASSETS}`]);
  }

}
