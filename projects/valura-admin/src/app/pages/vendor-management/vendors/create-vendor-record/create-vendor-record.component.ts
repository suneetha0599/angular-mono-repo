import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOption, MatSelect, MatSelectModule, MatSelectTrigger } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatMenuModule } from '@angular/material/menu';
import { DocumentUpload } from '@admin-core/models/task-management/RequestTask';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ConfigService } from '@admin-core/services/config.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { VendorService } from '@admin-core/services/vendor/vendor.service';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { VendorPageRequest } from '@admin-core/models/DataDiscovery/Vendor';
import { statusColors, statusTextColors } from '../vender-utils';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { v1 as uuidv1 } from 'uuid';
import { AuthService } from '@admin-core/services/auth.service';
import { Subscription } from 'rxjs';
import { CountryService } from '@admin-core/services/country/country.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

const { USER, ASSESSMENT, CREATE_DPIA_ASSESSMENT, VENDORS } = routeConstants

@Component({
  selector: 'app-create-vendor-record',
  imports: [
    LoadingButtonComponent, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatNativeDateModule, MatSelectModule, FormsModule, MatTabsModule, MatPaginatorModule,
    CommonModule, MatSlideToggleModule, MatAutocompleteModule, MatMenuModule, MatTooltipModule,
    CustomMatErrorComponent, MatSelectTrigger, MatOption, MatButtonModule,
    ErrorLoadingItemsComponent, CustomEditorComponent
  ],
  templateUrl: './create-vendor-record.component.html',
  styleUrl: './create-vendor-record.component.scss'
})
export class CreateVendorRecordComponent {

  currentPath: string = '';
  isCreateMode: boolean = true;
  currentRequestDetails = {
    vendorId: 0,
    index: 0,
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  VendorRequestId: number = 0;
  hasApiError: boolean = false;
  assetdata: any;

  countryMasterList: any = [];
  filteredCountryList: any;
  selectedCountry: any;
  defaultCountry: number = 0;
  isloading: boolean = false;

  vendorForm!: FormGroup;
  isEditMode = false;
  vendorId!: number;
  vendorDetails: any;

  contractDocuments = [
    { key: "DPA_PRIVACY_AGREEMENT", label: "DPA/privacy agreement" },
    { key: "NDA", label: "NDA" },
    { key: "COMPLIANCE_CERTIFICATE", label: "Compliance certificate" },
    { key: "CLIENT_POLICY", label: "Client policy" },
    { key: "INSURANCE_CERTIFICATES", label: "insurance certificates" }
  ];

  isDraftMode = false;
  isDraftLoading = false;
  deleteDraftLoading = false;
  manualDraftVendorId!: string;

  searchThirdPartyTypeText: string = '';
  filteredThirdPartyTypes: any[] = [];
  thirdPartyTypes: any[] = [];
  newThirdPartyTypes: any[] = [];

  searchServiceTypeText: string = '';
  filteredServiceTypes: any[] = [];
  serviceTypes: any[] = [];
  newServiceTypes: any[] = [];
  formIsUpdated: boolean = false;
  private createTemplateFormSubscription!: Subscription;

  selectedCountryLocation: any;
  masterLocationList: any[] = [];
  filteredLocationList: any[] = [];

  private location = inject(Location);
  private fb = inject(FormBuilder);
  private apiHelper = inject(ApiHelperService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);
  private configService = inject(ConfigService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private vendorService = inject(VendorService);
  private authService = inject(AuthService);
  private countryService = inject(CountryService);
  private rolePermissionService = inject(RolePermissionService);
  private assessmentService = inject(AssessmentService);

  canCreateVendor: boolean = false;
  canEditVendor: boolean = false;
  isFinalSaved: boolean = false;

  constructor(private dialog: MatDialog, private cdRef: ChangeDetectorRef) { }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.formIsUpdated && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  async ngOnInit() {
    this.setUserPermissions();
    this.vendorForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      serviceType: [''],
      vendorType: [''],
      pointOfContact: [''],
      externalEmail: ['', [Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      address: [''],
      location: [''],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      businessSpocName: [''],
      internalEmail: ['', [Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      status: [true],
    });
    this.route.queryParams.subscribe((params: any) => {
      const mode = params['mode'];
      this.vendorId = params['vendorId'];
      this.isEditMode = mode === 'edit';
      this.isDraftMode = mode === 'draft';
      this.isCreateMode = mode === 'add';

      const manualDraftVendorId = params['vendorId'];
      this.manualDraftVendorId = (manualDraftVendorId);
      this.VendorRequestId = this.vendorId ? +(this.vendorId) : 0

      if (this.isDraftMode && this.manualDraftVendorId) {
        this.getDraftDetails();
      }
      else if (this.isEditMode) {
        this.getVendorDetails(this.vendorId);
      }
      else {
        this.initFormSubscription();
      }
    });
    this.onInitPage()
    await this.getInitialConfiguration();
    await this.getServiceTypeDetails();
    await this.getThirdPartyTypeDetails();
    await this.getCounteryList();

    this.vendorForm.get('location')?.valueChanges.subscribe(selectedId => {
      const location = this.masterLocationList.find(l => l.id === selectedId);
      if (location) {
        const matchedCountry = this.countryMasterList.find(
          (c: any) => c.countryPhoneCode === location.countryPhoneCode
        );
        if (matchedCountry) {
          this.selectedCountry = matchedCountry;
        }
      }
    });
  }

  ngOnDestroy() {
    this.createTemplateFormSubscription?.unsubscribe();
  }

  initFormSubscription() {
    this.createTemplateFormSubscription = this.vendorForm.valueChanges.subscribe(val => {
      if (val && this.vendorForm.dirty && !this.formIsUpdated) {
        this.formIsUpdated = true;
      }
    });
  }

  canDeactivate(): boolean {
    if (this.formIsUpdated) return false;
    return true;
  }

  async getVendorDetails(id: number) {
    this.hasApiError = false;

    try {
      const res = await this.apiHelper.getVendorsDetails(null, id);
      if (!res || res?.success === false) {
        this.hasApiError = true;
        return;
      }
      if (res?.vendorDetails) {
        this.vendorDetails = res.vendorDetails;
        this.patchVendorForm(res.vendorDetails, res.asset);
      }
      this.assetdata = res.asset
    } catch (err) {
      this.hasApiError = true;
      console.error('Error fetching vendor details:', err);
    } finally {
      this.isloading = false;
    }
  }

  async getServiceTypeDetails() {
    try {
      const res = await this.apiHelper.getServiceTypeDetails();
      if (!res || res?.success === false) {
        return;
      }

      if (res?.data) {
        this.serviceTypes = res.data.serviceTypes;
        this.filteredServiceTypes = this.serviceTypes;
      }
    } catch (err) {
      console.error('Error fetching service type details:', err);
    }
  }

  async getThirdPartyTypeDetails() {
    try {
      const res = await this.apiHelper.getThirdPartyTypeDetails();
      if (!res || res?.success === false) {
        return;
      }

      if (res?.data) {
        this.thirdPartyTypes = res.data.thirdPartyVendorTypes;
        this.filteredThirdPartyTypes = this.thirdPartyTypes;
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
    }
  }

  async saveChanges() {
    if (this.vendorForm.invalid) {
      if (this.name.invalid) {
        this.name.markAsTouched();
        this.snackbarService.openSnack('Vendor name is mandatory');
      } else if (this.phone.invalid) {
        this.snackbarService.openSnack('Please enter a valid 10-digit phone number');
      } else {
        this.snackbarService.openSnack('Please fill the required details!');
      }
      return;
    }
    const formValue = this.vendorForm.getRawValue();

    let value: string | null = null;
    const phoneNumber = this.phone.value?.trim();
    const countryCode = this.selectedCountry?.countryPhoneCode || '';
    value = phoneNumber ? (countryCode ? `${countryCode} ${phoneNumber}` : phoneNumber) : '';

    // const existingContracts = (formValue.contract || [])
    //   .filter((c: any) => {
    //     return (
    //       (c.documents && c.documents.length > 0) ||
    //       c.startDate ||
    //       c.endDate
    //     );
    //   })
    //   .map((c: any) => ({
    //     contractId: c.contractId ? Number(c.contractId) : 0,
    //     documentType: c.documentType || '',
    //     contractDocuments: (c.documents || []).map((f: any) => f.fileKey || f),
    //     startDate: c.startDate ? this.formatDate(c.startDate) : '',
    //     endDate: c.endDate ? this.formatDate(c.endDate) : '',
    //     isDeleted: false
    //   }));

    const payload = {
      name: formValue?.name,
      description: formValue?.description || '',
      vendorContactExternal: {
        name: formValue?.pointOfContact || '',
        email: formValue?.externalEmail || '',
        address: formValue?.address || '',
        location: formValue?.location || null,
        phone: value || null,
      },
      vendorContactInternal: {
        businessSPOCName: formValue?.businessSpocName || '',
        email: formValue?.internalEmail || '',
      },
      vendorType: {
        id: formValue?.vendorType?.id || 0,
        name: formValue?.vendorType?.name || '',
      },
      serviceType: {
        id: formValue?.serviceType?.id || 0,
        name: formValue?.serviceType?.name || ''
      }
    };

    try {
      this.isloading = true;
      if (this.vendorId && !this.isDraftMode) {
        const commands = this.vendorService.buildUpdateCommands(formValue, this.vendorDetails, this.selectedCountry);
        if (!commands.length) {
          this.snackbarService.openSnack('No changes to save');
          return;
        }

        const updatePayload = {
          commandId: uuidv1(),
          commands
        };
        const res = await this.apiHelper.editVendorDetails(updatePayload, this.vendorId);
        this.onPostVendorSave();
        if (res) {
          this.isFinalSaved = true;
        }
      }
      else {
        const res = await this.apiHelper.addVendor(payload);
        if (this.manualDraftVendorId) {
          try {
            await this.dataInventoryApiHelperService.deleteManualDraftRequest(this.manualDraftVendorId);

          } catch (err) {
            console.error('Failed to delete vendor draft:', err);
          }
        }
        this.onPostVendorSave()
        if (res) {
          this.isFinalSaved = true;
        }
      }
    } catch (error) {
      this.isFinalSaved = false;
      console.error(error);
    } finally {
      this.isloading = false;
    }
  }

  onPostVendorSave() {
    this.formIsUpdated = false;
    this.vendorService.moveToAllTab();
    this.navigateToBack(this.vendorId)
  }

  resetForm() {
    if (this.vendorId) {
      this.getVendorDetails(this.vendorId);
    } else {
      this.vendorForm.reset();
    }
  }

  goBack(): void {
    this.formIsUpdated = false;
    this.location.back()
  }

  onclick(event: any) {
    event.target.value = '';
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  onDocNameClick(doc: DocumentUpload) {
    if (!doc?.fileKey) {
      console.error("No fileKey found for document", doc);
      return;
    }
    this.viewDocument(doc.fileKey, doc.fileKey);
  }

  async viewDocument(file: any, fileName: string) {
    const params = {
      "fileKey": file,
    }
    let imageInfo = await this.apiHelper.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(fileName) || '',
          isTaskView: true
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe(result => {
      });
    }
    else {
      console.error('Failed to get presigned URL');
    }
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }

  allowNumbersOnly(event: KeyboardEvent) {
    const charCode = event.key;
    if (!/[0-9]/.test(charCode)) {
      event.preventDefault();
    }
  }

  async getInitialConfiguration() {
    const res = await this.configService.getDsrConfiguration();
    if (res) {
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

  setUserPermissions() {
    this.canCreateVendor = this.rolePermissionService.createVendor || this.rolePermissionService.fullAccessVendor;
    this.canEditVendor = this.rolePermissionService.editVendor || this.rolePermissionService.fullAccessVendor;
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

  saveAsDraft() {
    const payload = this.prepareVendorPayload();
    if (!payload) return;

    const body = this.manualDraftVendorId
      ? { "formData": payload }
      : { "key": 'MANUAL_VENDOR_REQUEST', "formData": payload }

    this.isDraftLoading = true;

    const draftSave$ = this.manualDraftVendorId
      ? this.dataInventoryApiHelperService.bpaSaveManualDraft(body, this.manualDraftVendorId)
      : this.dataInventoryApiHelperService.bpaSaveManualDraftNew(body);

    draftSave$.subscribe({
      next: () => {
        this.goBack();
        this.isDraftLoading = false;
      },
      error: (e: Error) => {
        console.error(e.message);
        this.isDraftLoading = false;
      }
    });
  }

  async onDeleteDraft() {
    if (!this.manualDraftVendorId || this.deleteDraftLoading) return;
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
    });
  }

  async getDraftDetails() {
    if (!this.manualDraftVendorId) return;

    try {
      const res = await this.dataInventoryApiHelperService.getBpaDraftRequestDetails(this.manualDraftVendorId);
      if (res?.formData) {
        this.vendorDetails = res.formData;
        this.patchVendorForm(res.formData, res.asset);
      }
    } catch (err) {
      console.error('Error fetching draft details:', err);
    }
  }

  private prepareVendorPayload(): any | null {
    if (this.vendorForm.invalid) {
      if (this.name.invalid) {
        this.snackbarService.openSnack('Vendor name is mandatory');
      } else if (this.phone.invalid) {
        this.snackbarService.openSnack('Please enter a valid 10-digit phone number');
      } else {
        this.snackbarService.openSnack('Please fill the required details!');
      }
      return;
    }
    const formValue = this.vendorForm.getRawValue();

    let value: string | null = null;
    const phoneNumber = this.phone.value?.trim();
    const countryCode = this.selectedCountry?.countryPhoneCode || '';
    value = phoneNumber ? (countryCode ? `${countryCode} ${phoneNumber}` : phoneNumber) : '';

    return {
      name: formValue.name,
      description: formValue.description || '',
      vendorContactExternal: {
        name: formValue.pointOfContact || '',
        email: formValue.externalEmail || '',
        address: formValue.address || '',
        location: formValue.location || '',
        phone: value || null,
      },
      vendorContactInternal: {
        businessSPOCName: formValue.businessSpocName || '',
        email: formValue.internalEmail || '',
      },
      vendorType: {
        id: formValue.vendorType.id || '',
        name: formValue.vendorType.name || '',
      },
      serviceType: {
        id: formValue.serviceType.id || '',
        name: formValue.serviceType.name || ''
      },
      newServiceTypes: this.newServiceTypes || null,
      newThirdPartyTypes: this.newThirdPartyTypes || null,
      createdAt: this.vendorDetails?.createdAt ? this.vendorDetails.createdAt : new Date().toISOString(),
    };
  }

  private async patchVendorForm(vendor: any, assetData: any) {
    const rawPhone = vendor.vendorContactExternal.phone?.trim() || '';
    let countryCode = '';
    let phoneNumber = '';

    if (rawPhone.includes('-')) {
      const phoneParts = rawPhone.split('-');
      countryCode = phoneParts[0];
      phoneNumber = phoneParts.slice(1).join(' ');
    }
    else if (rawPhone.includes(' ')) {
      const phoneParts = rawPhone.split(' ');
      countryCode = phoneParts[0];
      phoneNumber = phoneParts.slice(1).join(' ')
    }

    else if (rawPhone.startsWith('+')) {
      countryCode = rawPhone;
    } else {
      phoneNumber = rawPhone;
    }
    this.selectedCountry =
      this.countryMasterList.find((c: any) => c.countryPhoneCode === countryCode) ||
      this.countryMasterList[0] || null;

    if (vendor.newServiceTypes?.length) {
      vendor.newServiceTypes.forEach((newType: any) => {
        const exists = this.serviceTypes.some(
          s => s.name.toLowerCase() === newType.name.toLowerCase()
        );

        if (!exists) {
          this.serviceTypes.push({
            ...newType
          });
        }
      });

      this.newServiceTypes = vendor.newServiceTypes;
    }
    this.filteredServiceTypes = [...this.serviceTypes];

    if (vendor.newThirdPartyTypes?.length) {
      vendor.newThirdPartyTypes.forEach((newType: any) => {
        const exists = this.thirdPartyTypes.some(
          t => t.name.toLowerCase() === newType.name.toLowerCase()
        );

        if (!exists) {
          this.thirdPartyTypes.push({
            ...newType
          });
        }
      });

      this.newThirdPartyTypes = vendor.newThirdPartyTypes;
    }
    this.filteredThirdPartyTypes = [...this.thirdPartyTypes];

    this.vendorForm.patchValue({
      name: vendor.name,
      description: vendor.description || '',
      serviceType: vendor.serviceType,
      vendorType: vendor.vendorType,
      pointOfContact: vendor.vendorContactExternal.name,
      externalEmail: vendor.vendorContactExternal.email,
      address: vendor.vendorContactExternal.address,
      location: vendor.vendorContactExternal.location,
      phone: phoneNumber ?? null,
      businessSpocName: vendor.vendorContactInternal.businessSPOCName,
      internalEmail: vendor.vendorContactInternal.email,
      status: vendor.status === "ACTIVE" ? true : false
    });
    this.initFormSubscription();
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
    let nodeIndex = requestList.findIndex((request: VendorPageRequest) => request.vendorId == this.VendorRequestId);
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
        entityId: this.VendorRequestId,
        audit_log_module: AUDIT_LOG_MODULE.DATA_DISCOVERY,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.VENDOR
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
  }

  displayType(type: any): string {
    return type?.name || '';
  }

  onSearchServiceType(search: string) {
    this.searchServiceTypeText = search;

    if (!search) {
      this.filteredServiceTypes = this.serviceTypes;
      return;
    }

    this.filteredServiceTypes = this.serviceTypes.filter(type =>
      type.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  selectServiceType(selected: any) {
    this.vendorForm.get('serviceType')?.setValue(selected);
  }

  addNewServiceType(event: any) {
    if (!event.isUserInput) return;

    const search = this.searchServiceTypeText?.trim();
    if (!search) return;

    const newItem = {
      id: uuidv1(),
      name: search
    };

    const exists = this.serviceTypes.some(
      type => type.name.toLowerCase() === search.toLowerCase()
    );

    if (exists) {
      this.snackbarService.openSnack('Given service type already exists.');
      return;
    }

    this.serviceTypes.push(newItem);
    this.newServiceTypes.push(newItem);

    this.filteredServiceTypes = [...this.serviceTypes];
    this.searchServiceTypeText = '';

    this.snackbarService.openSnack('Service type added sucessfully.');
    this.selectServiceType(newItem);
  }

  onSearchThirdPartyType(search: string) {
    this.searchThirdPartyTypeText = search;

    if (!search) {
      this.filteredThirdPartyTypes = this.thirdPartyTypes;
      return;
    }

    this.filteredThirdPartyTypes = this.thirdPartyTypes.filter(type =>
      type.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  selectThirdPartyType(selected: any) {
    this.vendorForm.get('vendorType')?.setValue(selected);
  }

  addNewThirdPartyType(event: any) {
    if (!event.isUserInput) return;

    const search = this.searchThirdPartyTypeText?.trim();
    if (!search) return;

    const newItem = {
      id: uuidv1(),
      name: search
    };

    const exists = this.thirdPartyTypes.some(
      type => type.name.toLowerCase() === search.toLowerCase()
    );

    if (exists) {
      this.snackbarService.openSnack('Given third party type already exists.');
      return;
    }

    this.thirdPartyTypes.push(newItem);
    this.newThirdPartyTypes.push(newItem);

    this.filteredThirdPartyTypes = [...this.thirdPartyTypes];
    this.searchThirdPartyTypeText = '';

    this.snackbarService.openSnack('Third party type added sucessfully.');
    this.selectThirdPartyType(newItem);
  }

  async getCounteryList() {
    const countryList = await this.countryService.getCountryMasterList();
    this.masterLocationList.push(...countryList) ?? [];
    this.filteredLocationList.push(...countryList) ?? [];
  }

  filterLocation(searchText: any) {
    const value = searchText.toLowerCase();
    this.filteredLocationList = this.masterLocationList.filter(
      country => country.name.toLowerCase().includes(value)
    );
  }

  onCountryChange() {
    const selectedId = this.vendorForm.get('location')?.value;
    this.selectedCountryLocation = this.masterLocationList.find((c: { id: any; }) => c.id === selectedId);

    if (this.selectedCountryLocation) {
      const matchedCountry = this.filteredCountryList.find(
        (country: any) =>
          country.countryPhoneCode === this.selectedCountryLocation.countryPhoneCode
      );

      if (matchedCountry) {
        this.selectedCountry = matchedCountry;
      }
    }
  }

  clearLocationSearch(input: HTMLInputElement) {
    input.value = '';
    this.filteredLocationList = this.masterLocationList;
  }

  get displayPhone(): string {
    const phone = this.vendorForm.get('phone')?.value?.trim();
    const code = this.selectedCountry?.countryPhoneCode || '';
    if (!phone) return 'N/A';
    return code ? `${code} ${phone}` : phone;
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  onDescriptionChange(data: { content: string, edited: boolean }) {
    this.vendorForm.patchValue({ description: data.content }, { emitEvent: false });
    if (!this.formIsUpdated && data.edited) {
      this.formIsUpdated = true;
    }
  }

  get vendorCreationBtnLabel() {
    return this.isEditMode ? `Save` : `Create Vendor`
  }

  get phone() {
    return this.vendorForm.get('phone') as FormControl
  }

  get name() {
    return this.vendorForm.get('name') as FormControl
  }

  get externalEmail(): FormControl {
    return this.vendorForm.get('externalEmail') as FormControl;
  }

  get internalEmail(): FormControl {
    return this.vendorForm.get('internalEmail') as FormControl;
  }

  onSelectOpen(isOpen: boolean, select: MatSelect) {
    if (isOpen) {
      select.close();
    }
  }

  navigateToBack(vendorId: number) {

    const fromAssessment = this.assessmentService.routeDetails;
    const isCreate = !this.vendorId;

    if (fromAssessment && isCreate) {

      const vendorDetails = {
        vendor: {
          vendorId,
          name: this.vendorForm.get('name')?.value,
        },
        disabled: false
      };

      this.assessmentService.setBpaDetails(vendorDetails);
      this.assessmentService.clearRouteDetails();

      this.router.navigate(
        [`${USER}/${VENDORS}/${ASSESSMENT}/${CREATE_DPIA_ASSESSMENT}`],
        { queryParams: { source: 'vendor' } }
      );

      return;
    }

    this.router.navigate([`${this.currentPath}/${routeConstants.VENDORS_LIST}`]);
  }

}
