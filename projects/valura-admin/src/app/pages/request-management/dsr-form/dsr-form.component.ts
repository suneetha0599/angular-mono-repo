import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatOptgroup, MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ETAG } from '@admin-core/constants/api-constants';
import { firstValueFrom } from 'rxjs';
import { RequestFormViewType, THIRD_PARTY, WEB_FORM } from '../constant';
import { ActivatedRoute, Router } from '@angular/router';
import { DSR_ATTACHMENT, DSR_THIRD_PARTY_VERIFICATION } from '@admin-core/constants/constants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomMatErrorComponent } from '@valura-lib/components/custom-mat-error/custom-mat-error.component';
import { Attachment, CreateDsrRequestPayload, DraftRequestDetails } from '@admin-core/models/request-management/DsrRequest';
import { MatCheckbox } from '@angular/material/checkbox';
import { FILE_UPLOAD_ACCEPT, FILE_UPLOAD_SUPPORTED_TEXT } from '@admin-core/constants/file-upload.constants';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { FormConfigurationService } from '@admin-core/services/form-configuration.service';
import { ICON_MAPPING } from '../../configuration/configuration/icon-picker-menu/icon-picker-menu.component';
import { NGXLogger } from 'ngx-logger';
import { LogClickDirective } from '@valura-lib/directives/log-click/log-click.directive';
import { CustomFileUploadComponent } from '@valura-lib/components//custom-file-upload/custom-file-upload.component';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'dsr-form',
  imports: [ReactiveFormsModule, NgClass, MatIcon, MatTooltipModule, MatFormFieldModule, LogClickDirective,
    MatInputModule, MatSelect, CustomMatTextareaComponent, MatOption, MatLabel, CustomMatErrorComponent, FormsModule,
    LoadingButtonComponent, MatTooltipModule, MatCheckbox, MatOptgroup, MatSelectTrigger, CustomFileUploadComponent],
  templateUrl: './dsr-form.component.html',
  styleUrl: './dsr-form.component.scss'
})
export class DsrFormComponent {

  @Input() formConfiguration: FormConfigurationData = new FormConfigurationData();
  @Input() viewType: string = RequestFormViewType.DSR;

  private apiHelperService = inject(ApiHelperService);
  private httpService = inject(HttpService);
  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private formConfigurationService = inject(FormConfigurationService);
  private logger = inject(NGXLogger);

  selectedCountry: any;
  form: FormGroup;
  fileUploadInProgress = false;
  submitLoading = false;
  requestAttachments: any[] = [];
  uploadedRequestAttachments: any[] = [];
  thirdPartyRequestAttachments: any[] = [];
  tooltip = "If the request is raised by a third party, upload a supporting document such as an authorization letter or power of attorney."
  THIRD_PARTY = THIRD_PARTY;
  requestRid: number = 0;
  dsrRequestDetails!: DraftRequestDetails
  pageTitle: string = 'Create Request'
  emailRegex = ''
  generalDeclarations: any;
  defaultCountry: number = 0;
  draftLoading = false;
  selectedThirdPartyCountry: any;
  selectedDataSubjectCountry: any;
  deleteDraftLoading = false;
  isEditMode: boolean = false;
  selectedRightDeclarations: string[] = []
  selectedRight: any = null;
  WEB_FORM = WEB_FORM;
  // File upload constants
  readonly fileUploadAccept = FILE_UPLOAD_ACCEPT;
  readonly fileUploadSupportedText = FILE_UPLOAD_SUPPORTED_TEXT;
  isFinalSaved: boolean = false;
  DSR_THIRD_PARTY_VERIFICATION_PURPOSE = DSR_THIRD_PARTY_VERIFICATION
  DSR_ATTACHMENT_PURPOSE = DSR_ATTACHMENT;

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private requestService: RequestManagementService) {
    this.form = this.fb.group({
      formId: [0],
      requesterType: ['', Validators.required],
      category: [null, Validators.required],
      thirdPartyFirstName: [''],
      thirdPartyLastName: [''],
      thirdPartyRole: [''],
      thirdPartyPhoneNumber: [''],
      thirdPartyEmail: [''],
      countryId: [null, Validators.required],
      requestTypeId: [null, Validators.required],
      platform: [null, Validators.required],
      firstPartyFirstName: ['', Validators.required],
      firstPartyLastName: ['',],
      email: [''],
      phone: [''],
      attachments: [[]],
      status: [''],
      channel: ['', Validators.required],
      requestDescription: [null],
      formUserId: [null],
      declarations: this.fb.array([]),
      thirdPartyVerificationDocuments: [[]],
      shouldLock: [false, Validators.required]
    });
    this.applySwitchingValidators('email', 'phone');
    this.applySwitchingValidators('thirdPartyEmail', 'thirdPartyPhoneNumber', true);
  }

  async ngOnInit() {

    this.route.queryParams.subscribe(params => {
      const requestRid = params['requestRid'];
      this.requestRid = +(requestRid);
      if (this.requestRid) {
        this.pageTitle = "Request details"
        this.isEditMode = true;
      }
    });

    if (this.requestRid) {
      this.getDsrRequestsDetails()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formConfiguration']) {
      this.getInitialConfiguration();
    }
  }

  applySwitchingValidators(email: string, phone: string, isThirdPartyControl: boolean = false): void {
    const emailCtrl = this.form.get(email) as FormControl;
    const phoneCtrl = this.form.get(phone) as FormControl;

    emailCtrl?.valueChanges.subscribe(value => {
      this.logger.trace(`Value change detected in ${email}: ${value}`);
      this.clearPhoneNumberValidator(phoneCtrl, value, isThirdPartyControl)
    });

    phoneCtrl?.valueChanges.subscribe(value => {
      this.clearEmailValidator(emailCtrl, value, isThirdPartyControl)
    });
  }

  clearPhoneNumberValidator(phoneCtrl: FormControl, value: string, isThirdPartyControl: boolean = false) {
    if (value && value.trim().length > 0) {
      phoneCtrl?.clearValidators();
    } else {
      const setValidators = isThirdPartyControl ? (this.isThirdPartyRequest) : (this.isThirdPartyRequest ? false : true)
      if (setValidators) {
        phoneCtrl?.setValidators([Validators.required]);
      }
    }
    phoneCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  clearEmailValidator(emailCtrl: FormControl, value: string, isThirdPartyControl: boolean = false) {
    if (value && value.trim().length > 0) {
      emailCtrl?.clearValidators();
      emailCtrl?.setErrors(null);
      emailCtrl?.setValidators([Validators.pattern(this.emailRegex)]);
    } else {
      const setValidators = isThirdPartyControl ? (this.isThirdPartyRequest) : (this.isThirdPartyRequest ? false : true)
      if (setValidators) {
        emailCtrl?.setValidators([Validators.required, Validators.pattern(this.emailRegex)]);
      }
    }
    emailCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  get category() {
    return this.form.get('category') as FormControl
  }

  get thirdPartyFirstName() {
    return this.form.get('thirdPartyFirstName') as FormControl
  }

  get thirdPartyLastName() {
    return this.form.get('thirdPartyLastName') as FormControl
  }

  get thirdPartyPhoneNumber() {
    return this.form.get('thirdPartyPhoneNumber') as FormControl
  }

  get thirdPartyEmail() {
    return this.form.get('thirdPartyEmail') as FormControl
  }

  get thirdPartyRole() {
    return this.form.get('thirdPartyRole') as FormControl
  }

  get requestTypeId() {
    return this.form.get('requestTypeId') as FormControl
  }

  get firstPartyFirstName() {
    return this.form.get('firstPartyFirstName') as FormControl
  }

  get firstPartyLastName() {
    return this.form.get('firstPartyLastName') as FormControl
  }

  get email() {
    return this.form.get('email') as FormControl
  }

  get phone() {
    return this.form.get('phone') as FormControl
  }

  get platform() {
    return this.form.get('platform') as FormControl
  }

  get channel() {
    return this.form.get('channel') as FormControl
  }

  get countryId() {
    return this.form.get('countryId') as FormControl
  }

  get requestDescription() {
    return this.form.get('requestDescription') as FormControl
  }

  get declarationsArray(): FormArray {
    return this.form.get('declarations') as FormArray;
  }

  getDeclarationControl(index: number, controlName: string): FormControl {
    return this.declarationsArray.at(index).get(controlName) as FormControl;
  }

  async getInitialConfiguration() {
    this.emailRegex = this.formConfiguration.emailRegex;
    this.defaultCountry = this.formConfiguration.defaultCountry;

    this.selectedThirdPartyCountry = this.formConfiguration.countryMasterList[0]
    this.selectedDataSubjectCountry = this.formConfiguration.countryMasterList[0]
    this.setOrClearControlValidator('email', true, true, this.emailRegex)
    this.setOrClearControlValidator('thirdPartyEmail', true, true, this.emailRegex)

    const platformControl = this.form.get('platform');
    if (this.formConfiguration.organizationList.length) {
      platformControl?.setValidators(Validators.required);
    } else {
      platformControl?.clearValidators();
    }
    platformControl?.updateValueAndValidity();
  }

  async getImageEtag(file: File, presignedUrl: string) {
    let res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
    if (res && this.httpService.isHttpSuccess(res?.status)) {
      return res
    }
    return null
  }


  async processAttachmentData(): Promise<Attachment[] | null> {
    const attachments = this.requestAttachments;
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedFiles: Attachment[] = [];

    for (const att of attachments) {
      if (att.eTag && att.filePath) {
        processedFiles.push(new Attachment({
          filePath: att.filePath,
          eTag: att.eTag,
          fileName: att.fileName,
        }));
        continue;
      }

      if (att.file && att.presignedUrl && att.fileKey) {
        const res: any = await this.getImageEtag(att.file, att.presignedUrl);
        if (res) {
          processedFiles.push(new Attachment({
            filePath: att.fileKey,
            eTag: res.headers.get(ETAG),
            fileName: att.fileName || att.file.name,
          }));
        } else {
          this.submitLoading = false;
          return null;
        }
      }
    }

    return processedFiles;
  }


  async processThirdPartyAttachmentData(): Promise<Attachment[] | null> {
    const attachments = this.thirdPartyRequestAttachments;
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedFiles: Attachment[] = [];

    for (const att of attachments) {
      if (att.eTag && att.filePath) {
        processedFiles.push(new Attachment({
          filePath: att.filePath,
          eTag: att.eTag,
          fileName: att.fileName,
        }));
        continue;
      }

      if (att.file && att.presignedUrl && att.fileKey) {
        const res: any = await this.getImageEtag(att.file, att.presignedUrl);
        if (res) {
          processedFiles.push(new Attachment({
            filePath: att.fileKey,
            eTag: res.headers.get(ETAG),
            fileName: att.fileName || att.file.name,
          }));
        } else {
          this.submitLoading = false;
          return null;
        }
      }
    }

    return processedFiles;
  }

  onclick(event: any) {
    event.target.value = ''
  }


  onCountryChange() {
    const selectedId = this.form.get('countryId')?.value;
    this.selectedCountry = this.formConfiguration.countryMasterList.find((c: { id: any; }) => c.id === selectedId);
    this.selectedDataSubjectCountry = this.selectedCountry;
    this.resetSelectedRight();
    this.getCoutryConfiguration()
  }

  resetSelectedRight() {
    this.selectedRight = null;
    this.generalDeclarations = [];
    this.selectedRightDeclarations = [];
  }

  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.formConfiguration.filteredCountryList = this.formConfiguration.countryMasterList;
    this.formConfiguration.filteredThirdPartyCountryList = this.formConfiguration.countryMasterList;
    this.formConfiguration.filteredDataSubjectPhoneList = this.formConfiguration.countryMasterList;
  }

  async getCoutryConfiguration() {
    const countryId = this.form.get('countryId')?.value ?? 0
    if (this.viewType == RequestFormViewType.DSR) {
      const param = {
        countryId: [countryId]
      }
      const res = await this.configApiHelperService.getCountryConfiguration(param);
      if (res) {
        this.formConfiguration.dataSubjectRightsMasterList = res.dataSubjectRights;
        this.generalDeclarations = res.generalDeclarations;
        if (!this.requestTypeId.value) {
          this.form.get('requestTypeId')?.reset();
        }
      }
    }
    else if (this.viewType == RequestFormViewType.FORM_CONFIGURATION) {
      const { rightsMasterList, generalDeclarationList } = this.formConfigurationService.prepareCountryConfiguration(this.formConfiguration.countryMasterList, countryId);
      this.formConfiguration.dataSubjectRightsMasterList = rightsMasterList;
      this.generalDeclarations = generalDeclarationList;
    }
    this.initDeclarations()
  }

  onSelectRight(requestTypeId: number) {
    this.form.patchValue({ requestTypeId: requestTypeId });
    this.selectedRight = this.formConfiguration.dataSubjectRightsMasterList.find((r: any) => r.id === this.requestTypeId.value);
    if (this.viewType == RequestFormViewType.DSR) {
      this.selectedRightDeclarations = this.selectedRight?.declarations || [];
    }
    else if (this.viewType == RequestFormViewType.FORM_CONFIGURATION) {
      const { rightSpecificDeclarationList } = this.formConfigurationService.prepareRightConfiguration(this.selectedCountry, requestTypeId);
      this.selectedRightDeclarations = rightSpecificDeclarationList || [];
    }
    this.initDeclarations();
  }

  initDeclarations(savedDeclarations: any[] = []) {
    const declarationsArray = this.declarationsArray;
    declarationsArray.clear();
    const allDeclarations = [
      ...(this.selectedRightDeclarations ?? []),
      ...(this.generalDeclarations ?? [])
    ];

    allDeclarations.forEach(dec => {
      const savedDec = savedDeclarations.find(d => d.declaration === dec);

      declarationsArray.push(this.fb.group({
        declaration: [dec],
        checked: [!!savedDec],
        declarationTimestamp: [savedDec ? savedDec.declarationTimestamp : null]
      }));
    });
  }

  async onSubmit(isDraft: boolean) {
    if (!isDraft && (this.form.invalid || this.fileUploadInProgress)) {
      this.logger.warn("Form submission blocked: Invalid form or upload in progress", this.form.value);
      this.form.markAllAsTouched()
      this.snackbarService.openSnack('Please fill in all required fields');
      return;
    }

    let fullThirdPartyPhone = '';
    const email = this.form.get('email')?.value;
    const phone = this.form.get('phone')?.value;

    const thirdPartyEmail = this.form.get('thirdPartyEmail')?.value;
    const thirdPartyPhoneNumber = this.form.get('thirdPartyPhoneNumber')?.value;

    const phoneNumber = this.form.get('phone')?.value;
    const countryCode = this.selectedDataSubjectCountry?.countryPhoneCode || '';
    const fullPhone = (countryCode && phoneNumber ? (countryCode + ' ' + phoneNumber) : phoneNumber);
    if (this.isThirdPartyRequest) {
      const thirdPartyCode = this.selectedThirdPartyCountry?.countryPhoneCode || '';
      fullThirdPartyPhone = (thirdPartyCode && thirdPartyPhoneNumber ? (thirdPartyCode + ' ' + thirdPartyPhoneNumber) : thirdPartyPhoneNumber);
    }

    let pid = '';
    let pidType = '';
    if (this.isThirdPartyRequest) { // for third party request
      if ((!thirdPartyEmail && !thirdPartyPhoneNumber)) {
        this.snackbarService.openSnack('Please enter email or phone');
        return
      }
      pid = thirdPartyEmail ? thirdPartyEmail : fullThirdPartyPhone;
      pidType = thirdPartyEmail ? 'email' : 'phone';
    }
    else {
      if ((!email && !phone)) {
        this.snackbarService.openSnack('Please enter email or phone');
        return
      }
      pid = email ? email : fullPhone;
      pidType = email ? 'email' : 'phone';
    }

    if (!isDraft) {
      this.submitLoading = true;
    }
    else {
      this.draftLoading = true
    }
    try {
      let processedAttachments: any[] = [];
      let processedThirdPartyAttachments: any[] = []
      if (this.requestAttachments) {
        const processed = await this.processAttachmentData();
        if (processed) {
          processedAttachments = processed
        } else {
          this.submitLoading = false;
          this.draftLoading = false;
          return;
        }
      }
      if (this.thirdPartyRequestAttachments && this.isThirdPartyRequest) {
        const processedThirdParty = await this.processThirdPartyAttachmentData();
        if (processedThirdParty) {
          processedThirdPartyAttachments = processedThirdParty;
        }
        else {
          return
        }
      }
      let formUserId = this.form.get('formUserId')?.value;
      if (!formUserId) {
        const res: any = await firstValueFrom(await this.apiHelperService.getFormUserID({ pid, pidType }));
        formUserId = res?.formUserId;
      }
      if (!formUserId) {
        this.snackbarService.openSnack('Form user ID not received');
        return;
      }
      const processedDeclarations = this.declarationsArray.controls
        .filter(ctrl => ctrl.get('checked')?.value)
        .map(ctrl => ({
          declaration: ctrl.get('declaration')?.value,
          declarationTimestamp: this.formatDate(new Date())
        }));
      this.form.get('attachments')?.setValue(this.requestAttachments);
      this.form.get('thirdPartyVerificationDocuments')?.setValue(this.thirdPartyRequestAttachments);
      const requestBody: CreateDsrRequestPayload = {
        isDraft: isDraft,
        formId: this.form.value.formId,
        formUserId: formUserId,
        requestedByType: this.form.get('category')?.value,
        platform: this.form.get('platform')?.value || '',
        thirdPartyFirstName: this.isThirdPartyRequest ? this.form.get('thirdPartyFirstName')?.value : '',
        thirdPartyLastName: this.isThirdPartyRequest ? this.form.get('thirdPartyLastName')?.value : '',
        thirdPartyRole: this.isThirdPartyRequest ? this.form.get('thirdPartyRole')?.value : '',
        thirdPartyEmail: this.isThirdPartyRequest ? this.form.get('thirdPartyEmail')?.value : '',
        thirdPartyPhoneNumber: this.isThirdPartyRequest ? fullThirdPartyPhone : '',
        countryId: this.form.get('countryId')?.value,
        dataSubjectTypeId: this.form.get('requesterType')?.value,
        firstPartyFirstName: this.form.get('firstPartyFirstName')?.value,
        firstPartyLastName: this.form.get('firstPartyLastName')?.value,
        firstPartyEmail: email || '',
        firstPartyPhoneNumber: fullPhone || '',
        channel: this.form.get('channel')?.value,
        requestRightId: this.form.get('requestTypeId')?.value,
        requestDescription: this.form.get('requestDescription')?.value,
        attachments: processedAttachments || [],
        declarations: processedDeclarations || [],
        thirdPartyVerificationDocuments: processedThirdPartyAttachments || [],
        shouldLock: this.form.get('shouldLock')?.value
      };
      this.logger.info(`Attempting to ${isDraft ? 'save draft' : 'submit request'}`);
      const createRes: any = await firstValueFrom(await this.apiHelperService.createRequest(requestBody));
      this.logger.info("Request created successfully", createRes);
      this.form.reset();
      this.requestAttachments = [];
      this.form.get('attachments')?.setValue([]);
      this.formConfiguration.dataSubjectRightsMasterList = [];
      this.declarationsArray.clear();
      this.router.navigate(['/user/dsrr/request']);
      this.isFinalSaved = true;
    } catch (err) {
      this.isFinalSaved = false;
      this.logger.error("Critical error during request submission", err);
    } finally {
      this.submitLoading = false;
      this.draftLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/user/dsrr/request']);
  }


  async getDsrRequestsDetails() {
    const params = { isDraft: true }
    const data = await this.apiHelperService.getDsrRequestDetails(this.requestRid, params);
    if (data) {
      this.dsrRequestDetails = data;
      this.patchRequestForm()
    }
  }

  async patchRequestForm() {
    this.form.patchValue({
      formId: this.dsrRequestDetails.id,
      requesterType: this.dsrRequestDetails.dataSubjectTypeId,
      category: this.dsrRequestDetails.requestedByType,
      thirdPartyFirstName: this.dsrRequestDetails.thirdPartyFirstName,
      thirdPartyLastName: this.dsrRequestDetails.thirdPartyLastName,
      thirdPartyRole: this.dsrRequestDetails.thirdPartyRole,
      thirdPartyEmail: this.dsrRequestDetails.thirdPartyEmail,
      countryId: this.dsrRequestDetails.countryId,
      requestTypeId: this.dsrRequestDetails.requestTypeId,
      platform: this.dsrRequestDetails.platform,
      firstPartyFirstName: this.dsrRequestDetails.firstPartyFirstName,
      firstPartyLastName: this.dsrRequestDetails.firstPartyLastName,
      email: this.dsrRequestDetails.firstPartyEmail,
      phone: this.dsrRequestDetails.firstPartyPhoneNumber,
      attachments: this.dsrRequestDetails.attachments,
      channel: this.dsrRequestDetails.channel,
      requestDescription: this.dsrRequestDetails.requestDescription,
      formUserId: this.dsrRequestDetails.formUserId,
      thirdPartyVerificationDocuments: this.dsrRequestDetails.thirdPartyAttachments || [],
      shouldLock: this.dsrRequestDetails.shouldLock || false
    });
    if (this.dsrRequestDetails.thirdPartyPhoneNumber) {
      const tpPhone = this.dsrRequestDetails.thirdPartyPhoneNumber.trim();
      const matches = tpPhone.match(/^(\+\d+)\s*(.*)$/);
      if (matches) {
        const code = matches[1];
        const number = matches[2];
        this.selectedThirdPartyCountry = this.formConfiguration.countryMasterList.find(
          (c: any) => c.countryPhoneCode === code
        ) || this.formConfiguration.countryMasterList[0];
        this.form.get('thirdPartyPhoneNumber')?.setValue(number);
      } else {
        this.form.get('thirdPartyPhoneNumber')?.setValue(tpPhone);
      }
    }


    if (this.dsrRequestDetails.firstPartyPhoneNumber) {
      const fpPhone = this.dsrRequestDetails.firstPartyPhoneNumber.trim();
      const matches = fpPhone.match(/^(\+\d+)\s*(.*)$/);
      if (matches) {
        const code = matches[1];
        const number = matches[2];
        this.selectedDataSubjectCountry = this.formConfiguration.countryMasterList.find(
          (c: any) => c.countryPhoneCode === code
        ) || this.formConfiguration.countryMasterList[0];
        this.form.get('phone')?.setValue(number);
      } else {
        this.form.get('phone')?.setValue(fpPhone);
      }
    }

    if (this.dsrRequestDetails.countryId) {
      await this.getCoutryConfiguration();
      this.selectedRight = this.formConfiguration.dataSubjectRightsMasterList
        .find((r: any) => r.id === this.dsrRequestDetails.requestTypeId);
      this.selectedRightDeclarations = this.selectedRight?.declarations || [];
    }

    this.requestAttachments = [...this.dsrRequestDetails.attachments];
    this.uploadedRequestAttachments = [...this.requestAttachments]
    this.initDeclarations(this.dsrRequestDetails.declarations);
    this.form.get('attachments')?.setValue(this.requestAttachments);

    this.thirdPartyRequestAttachments = [...(this.dsrRequestDetails.thirdPartyAttachments || [])];
    this.form.get('thirdPartyVerificationDocuments')?.setValue(this.thirdPartyRequestAttachments);
    if (this.category?.value == THIRD_PARTY) {
      this.selectCategory('', false);
      this.applySwitchingValidators('thirdPartyEmail', 'thirdPartyPhoneNumber', true);
    }
    else {
      this.setOrClearControlValidator('thirdPartyFirstName', false);
      this.setOrClearControlValidator('thirdPartyRole', false);
      this.setOrClearControlValidator('thirdPartyEmail', false, true, this.emailRegex);
      this.setOrClearControlValidator('thirdPartyPhoneNumber', false);
    }
  }


  onDeclarationChange(index: number) {
    const control = this.declarationsArray.at(index);
    if (control.get('checked')?.value) {
      control.get('declarationTimestamp')?.setValue(new Date().toISOString());
    } else {
      control.get('declarationTimestamp')?.setValue(null);
    }
  }

  openReadMore() {
    window.open('https://google.com', '_blank');
  }

  formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds())
    );
  }

  selectCategory(key: string = '', clearValue: boolean = true) {
    if (this.category.value === key) {
      return;
    }
    if (key) {
      this.form.patchValue({ category: key });
    }

    if (key === this.THIRD_PARTY) {
      this.setOrClearControlValidator('thirdPartyFirstName', true, false)
      this.setOrClearControlValidator('thirdPartyRole', true, false)
      this.setOrClearControlValidator('thirdPartyEmail', true, false, this.emailRegex,)
      this.setOrClearControlValidator('thirdPartyPhoneNumber', true, false);
      this.setOrClearControlValidator('email', false, false)
      this.setOrClearControlValidator('phone', false, false)
      this.clearEmailValidator(this.thirdPartyEmail, this.thirdPartyPhoneNumber.value, true);
      this.clearPhoneNumberValidator(this.thirdPartyPhoneNumber, this.thirdPartyEmail.value, true);
    }
    else {
      this.setOrClearControlValidator('email', true, false)
      this.setOrClearControlValidator('phone', true, false)
      this.setOrClearControlValidator('thirdPartyFirstName', false, false)
      this.setOrClearControlValidator('thirdPartyRole', false, false)
      this.setOrClearControlValidator('thirdPartyEmail', false, false, this.emailRegex)
      this.setOrClearControlValidator('thirdPartyPhoneNumber', false, false);
      this.clearEmailValidator(this.email, this.phone.value);
      this.clearPhoneNumberValidator(this.phone, this.email.value);
    }

  }

  setOrClearControlValidator(controlName: string, setValidators: boolean = false, clearValue = false, regex: string = '') {
    if (clearValue) {
      this.form.get(controlName)?.reset();
    }
    if (setValidators) {
      const validators = [Validators.required];
      if (regex) {
        validators.push(Validators.pattern(new RegExp(regex)));
      }

      this.form.get(controlName)?.setValidators(validators);

    } else {
      this.form.get(controlName)?.clearValidators();
      const validators = [];
      if (regex) {
        validators.push(Validators.pattern(new RegExp(regex)));
      }
      this.form.get(controlName)?.setValidators(validators);
    }
    this.form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
  }

  filterCountries(search: string) {
    const value = search.toLowerCase();
    this.formConfiguration.filteredCountryList = this.formConfiguration.countryMasterList.filter((c: { name: string; countryPhoneCode: string; id: number; }) => {
      return c.name.toLowerCase().includes(value);
    });
  }


  filterThirdPartyCountries(search: string) {
    const value = search.toLowerCase();
    if (!value) {
      this.formConfiguration.filteredThirdPartyCountryList = [...this.formConfiguration.countryMasterList];
      return;
    }
    this.formConfiguration.filteredThirdPartyCountryList = this.formConfiguration.countryMasterList.filter(
      (c: { name: string; countryPhoneCode: string; id: any }) => {
        const matchesSearch =
          c.name.toLowerCase().includes(value) ||
          c.countryPhoneCode.toLowerCase().includes(value);
        const isSelected = this.selectedThirdPartyCountry?.id === c.id;
        return matchesSearch || isSelected;
      }
    );
    if (this.formConfiguration.filteredThirdPartyCountryList.length === 0) {
      this.formConfiguration.filteredThirdPartyCountryList = [this.formConfiguration.countryMasterList.find(
        (c: { id: number }) => c.id === this.defaultCountry
      )!];
      this.selectedThirdPartyCountry = this.formConfiguration.filteredThirdPartyCountryList[0];
    }
  }


  filterDataSubjectPhoneCountry(search: string) {
    const value = search.toLowerCase();
    if (!value) {
      this.formConfiguration.filteredDataSubjectPhoneList = [...this.formConfiguration.countryMasterList];
      return;
    }
    this.formConfiguration.filteredDataSubjectPhoneList = this.formConfiguration.countryMasterList.filter(
      (c: { name: string; countryPhoneCode: string; id: any }) => {
        const matchesSearch =
          c.name.toLowerCase().includes(value) ||
          c.countryPhoneCode.toLowerCase().includes(value);
        const isSelected = this.selectedCountry?.id === c.id;
        return matchesSearch || isSelected;
      }
    );
    if (this.formConfiguration.filteredDataSubjectPhoneList.length === 0) {
      this.formConfiguration.filteredDataSubjectPhoneList = [this.formConfiguration.countryMasterList.find(
        (c: { id: number }) => c.id === this.defaultCountry
      )!];
      this.selectedDataSubjectCountry = this.selectedCountry ? this.selectedCountry : this.formConfiguration.filteredDataSubjectPhoneList[0];
    }
  }


  allowNumbersOnly(event: KeyboardEvent) {
    const charCode = event.key;
    if (!/[0-9]/.test(charCode)) {
      event.preventDefault();
    }
  }

  async onDeleteDraft(): Promise<void> {
    const confirmation = confirm('Are you sure you want to delete this draft?');
    if (!confirmation) return;

    this.deleteDraftLoading = true

    try {
      this.apiHelperService.deleteOption(this.requestRid).subscribe({
        next: () => {
          this.snackbarService.openSnack('Draft deleted successfully!');
          this.router.navigate(['/user/dsrr/request']);
        },
        error: (err) => {
          this.logger.error(err);
        }
      });

    } catch (error) {
      this.logger.error('Error:', error);
    }
    finally {
      this.deleteDraftLoading = false

    }
  }

  get isThirdPartyRequest(): boolean {
    return this.category?.value === THIRD_PARTY
  }

  get preview(): boolean {
    return this.viewType === RequestFormViewType.FORM_CONFIGURATION
  }

  get isCreateRequest(): boolean {
    return this.viewType === RequestFormViewType.DSR
  }

  getMaterialIcon(friendlyName: string): string {
    return ICON_MAPPING[friendlyName] || friendlyName;
  }

  onUploadPresignedUrl(event: any) {
    this.requestAttachments = [...event.selectedFiles];
  }

  onRemoveFile(event: any) {
    this.requestAttachments = [...event.selectedFiles]
  }

  uploadStatus(event: any) {
    this.fileUploadInProgress = event.fileUploadInProgress;
  }

  get _submitIsDisabled(): boolean {
    return this.form.invalid || this.fileUploadInProgress
  }

  get _draftIsDisabled(): boolean {
    return this.fileUploadInProgress
  }
}

