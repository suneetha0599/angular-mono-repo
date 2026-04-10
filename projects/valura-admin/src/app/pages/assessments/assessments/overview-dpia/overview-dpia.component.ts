import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CustomMatErrorComponent } from '@valura-lib/components/custom-mat-error/custom-mat-error.component';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { HttpService } from '@valura-lib/service/network/http.service';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE, USER_PURPOSE } from '@admin-core/constants/api-constants';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ADMIN_USER, EXTERNAL_USER, INTERNAL_USER, RISK_MATRIX } from '@admin-core/constants/constants';
import { AccessRecord, AssessemntSource, FIRST_PAGE, OVERVIEW, PAGE_SIZE, RISK, ROLE, Status } from '../constants';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ApiHelperService as ConfigurationApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { User } from '@admin-core/models/user.model';
import { UserService } from '@admin-core/services/user/user.service';
import { AssessmentBpaDetails, AssessmentType, UserType } from '@admin-core/models/assessment/assessment';
import { AuthService } from '@admin-core/services/auth.service';
import { AssessmentTypeService } from '@admin-core/services/assessment-type/assessment-type.service';
import { MatRadioModule } from '@angular/material/radio';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
}

@Component({
  selector: 'app-overview-dpia',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatChipsModule,
    MatSelectModule, MatOptionModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, MatIconModule, MatRadioModule, MatChipsModule,
    MatAutocompleteTrigger, CustomMatErrorComponent, ScrollingModule, LoadingButtonComponent, CustomEditorComponent, MatProgressSpinner
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  templateUrl: './overview-dpia.component.html',
  styleUrl: './overview-dpia.component.scss'
})
export class OverviewDpiaComponent {
  @Input() overviewForm!: FormGroup
  @Input() formUpdated: string = '';
  @Input() bpaDetails!: AssessmentBpaDetails;
  @Input() mode!: string;
  @Input() dataUpdated: any
  @Input() panelType: any;
  @Input() assessmentSource: string = '';

  @Output() templateId = new EventEmitter<number>();
  @Output() onCreateBpa = new EventEmitter<boolean>();
  @Output() onChangeBpa = new EventEmitter<any>();
  @Output() onCreateAsset = new EventEmitter<any>();
  @Output() onCreateVendor = new EventEmitter<any>();
  @Output() clearDataUpdated = new EventEmitter<any>();

  bpaMasterList: any[] = [];
  filteredBpaMasterList: any[] = [];
  assessmentTypes: AssessmentType[] = [];
  filteredAssessmentTypes: AssessmentType[] = [];
  templateMasterList: any[] = [];
  authors: any[] = [];
  approvers: any[] = [];
  respondents: any[] = [];
  riskMatrix: any[] = [];

  filteredAuthorList: User[] = [];
  filteredApproverList: User[] = [];
  filteredRespondentList: User[] = [];
  selectedApprovers1: any[] = [];
  selectedApprovers2: any[] = [];
  selectedApprovers3: any[] = [];
  selectedRespondents: any[] = [];
  loggedUser: any
  bpaPaginationDetail = {
    totalRecords: 0,
    pageNo: 0,
    loading: false
  }
  templatePaginationDetail = {
    totalRecords: 0,
    pageNo: 0,
    loading: false
  }
  previousTemplate: any;
  isTemplateInitialized = false;
  showCreateBpaButton: boolean = false;
  bpaContainerHeight: string = '';
  private bpaRequestGen = 0;
  templateContainerHeight: string = '';
  minToDateFilter = new Date();
  private selectedProcessingActivity: any = null;
  private selectedAsset: any = null;
  private selectedVendor: any = null;
  private previousProcessingFor: string = '';
  searchControl: FormControl = new FormControl('');
  OVERVIEW = OVERVIEW;
  RISK = RISK;
  ROLE = ROLE;
  AccessRecord = AccessRecord;
  previousAuthorId: any;
  addUserIsLoading: boolean = false;
  private respondentRequestGen = 0;
  AssessemntSource = AssessemntSource;

  private userService = inject(UserService);
  private configurationApiHelperService = inject(ConfigurationApiHelperService);
  private assessmentTypeService = inject(AssessmentTypeService);
  private authService = inject(AuthService)
  private assessmentService = inject(AssessmentService);
  private rolePermissionService = inject(RolePermissionService);

  @ViewChild('templateScroll') templateVirtualScroll!: CdkVirtualScrollViewport;
  @ViewChild('bpaScroll') bpaVirtualScroll!: CdkVirtualScrollViewport;

  constructor(private router: Router, private snackbarService: SnackbarService, private httpService: HttpService, private cd: ConfirmationDialogService, private apiHelperService: ApiHelperService) {
    let minToDate = new Date();
    minToDate.setHours(0, 0, 0);
    this.minToDateFilter = minToDate;
  }

  ngOnInit() {
    this.setUserPermissions()
    this.riskMatrix = RISK_MATRIX;

    if (this.riskMatrix?.length && !this.risk.value) {
      this.risk.setValue(this.riskMatrix[0].key);
    }

    this.getAssessmentTypeList()
    this.getUserList([ADMIN_USER]);

    if (this.respondentType.value) {
      this.getUserList([INTERNAL_USER, EXTERNAL_USER], true);
    }

    this.getLoggedInUser()

    const defaultTemplate = this.overviewForm.get('template')?.value;
    if (defaultTemplate) {
      this.previousTemplate = defaultTemplate;
      this.isTemplateInitialized = true;
    }
    this.updateApproverList();
    this.initializeSearchListener();

    if (this.assessmentSource === AssessemntSource.VENDOR && this.panelType === OVERVIEW) {
      this.processingFor.setValue(AccessRecord.VENDOR);
      this.previousProcessingFor = AccessRecord.VENDOR;
    }

    if (!this.respondentType.value) {
      this.respondentType.setValue(INTERNAL_USER);
    }

    this.respondentType.valueChanges.subscribe(value => {
      if (value) {
        this.loadRespondentList(value);
      }
    });

    // Persist the current respondent to AssessmentService whenever it changes
    this.respondent.valueChanges.subscribe(value => {
      const user = Array.isArray(value) ? value[0] : value;
      if (user && (user.applicationUserId || user.userId)) {
        this.assessmentService.currentRespondentUser = user;
      }
    });

    // Save initial respondent if already populated (e.g. loaded assessment)
    const initialRespondent = this.respondent.value;
    if (initialRespondent && typeof initialRespondent === 'object' && (initialRespondent.applicationUserId || initialRespondent.userId)) {
      this.assessmentService.currentRespondentUser = initialRespondent;
    }
    this.overviewForm.get('authorAsRespondent')?.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        const author = this.author.value;
        this.respondent.setValue(author);
        this.respondent.disable();
        this.respondentType.disable();
      } else {
        this.respondent.enable();
        this.respondentType.enable();
      }
    });
  }

  private initializeSearchListener() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((query: string) => {
        this.bpaPaginationDetail.pageNo = FIRST_PAGE;

        if (this.processingFor.value === AccessRecord.PROCESSING_ACTIVITY) {
          this.getBpaMasterList(FIRST_PAGE, query || '');
        } else if (this.processingFor.value === AccessRecord.VENDOR) {
          this.getVendorList(FIRST_PAGE, query || '');
        } else {
          this.getAssetList(FIRST_PAGE, query || '');
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formUpdated']) {
      if (this.formUpdated && this.panelType === ROLE) {
        this.patchAuthorDetails();
        this.clearDataUpdated.emit({ type: 1 })
      }
    }
    if (changes['dataUpdated'] && this.dataUpdated) {
      if (this.panelType === OVERVIEW) {
        this.getFormTemplateList()
        this.initAssetOrBpaMasterList()
        this.setAssessmentTitleAsReadonly();
      }
      if (this.panelType === ROLE) {
        this.patchPreviousAuthorId();
        this.patchAuthorDetails()
      }
      this.clearDataUpdated.emit({ type: 2 })
    }
    if (changes['bpaDetails']) {
      if (this.bpaDetails && this.panelType === OVERVIEW) {
        this.tryPatchBpaDetails();
        this.loadRespondentList(this.respondentType.value);
      }
      if (this.bpaDetails && this.panelType === ROLE) {
        this.patchBpaRespondent();
      }
    }
    if (changes['overviewForm'] && this.overviewForm && this.panelType === OVERVIEW) {
      if (this.assessmentSource === AssessemntSource.VENDOR) {
        this.processingFor.setValue(AccessRecord.VENDOR, { emitEvent: false });
        this.previousProcessingFor = AccessRecord.VENDOR;
      }
      this.initAssetOrBpaMasterList();
      this.getFormTemplateList()
      this.setAssessmentTitleAsReadonly();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.syncApproversUI();
      this.syncRespondentsUI();
    });
  }

  createVendor() {
    this.onCreateVendor.emit(true);
  }

  onCancel() {
    this.overviewReset();
  }

  overviewReset() {
    this.overviewForm.reset({
      bpa: '',
      type: '',
      title: '',
      template: '',
      description: '',
      author: '',
      approver: '',
      respondent: '',
      risk: '',
      completeBy: ''
    });

    this.selectedApprovers1 = [];
    this.selectedApprovers2 = [];
    this.selectedApprovers3 = [];
    this.selectedRespondents = [];
    this.templateMasterList = [];
    this.templatePaginationDetail = {
      totalRecords: 0,
      pageNo: 0,
      loading: false
    }
  }

  createBPA() {
    this.onCreateBpa.emit(true);
  }

  createAsset() {
    this.onCreateAsset.emit(true);
  }

  filterAuthors(value: string) {
    if (!value || typeof value !== 'string') {
      value = '';
    }

    const filterValue = value.toLowerCase();
    this.filteredAuthorList = this.authors.filter(author =>
      author.displayName.toLowerCase().includes(filterValue)
    );
  }

  onAuthorSelected(event: MatAutocompleteSelectedEvent) {
    const user = event.option.value;
    const selectedUser = {
      userId: user.applicationUserId,
      displayName: user.displayName,
      userType: user.userType,
      email: user.email
    }

    this.author.patchValue(selectedUser);
    this.addAuthorAsLevel1Approver(user);
  }

  addAuthorAsLevel1Approver(author: any) {
    if (!author) return;

    const authorId = author.applicationUserId ?? author.userId;
    let current = this.approver1.value || [];
    current = current.filter(
      (a: any) => (a.applicationUserId ?? a.userId) !== authorId
    );

    if (this.previousAuthorId) {
      current = current.filter(
        (a: any) => (a.applicationUserId ?? a.userId) !== this.previousAuthorId
      );
    }

    const exists = current.some(
      (a: any) => (a.applicationUserId ?? a.userId) === authorId
    );

    let updated = exists ? current : [author, ...current];
    this.approver1.patchValue(updated);
    this.selectedApprovers1 = updated;
    this.previousAuthorId = authorId;
    this.assessmentService.onDeleteAuthor();
  }

  isAuthorExist(name: string): boolean {
    return this.authors.includes(name);
  }

  getUser(user: any) {
    return `${user.displayName ? user.displayName : ''}`;
  }

  getUserId(user: any) {
    return `${user.displayName ? user.applicationUserId : 0}`;
  }

  filterApprovers(value: string) {
    if (!value || typeof value !== 'string') {
      value = '';
    }

    const filterValue = value.toLowerCase();
    this.filteredApproverList = this.approvers.filter(ap =>
      ap.displayName.toLowerCase().includes(filterValue)
    );
  }

  // isApproverExist(value: string) {
  //   return this.approvers.includes(value);
  // }

  isApproverExist(value: string): boolean {
    const email = typeof value == 'string' ? value?.toLowerCase() : ''
    return this.approvers.some(a =>
      a.email?.toLowerCase() === email
    );
  }

  async getBpaMasterList(page: number = FIRST_PAGE, searchText: string = '') {
    if (this.bpaPaginationDetail.loading) return;

    this.bpaPaginationDetail.loading = true;
    this.bpaPaginationDetail.pageNo = page;
    const currentGen = ++this.bpaRequestGen;

    const params = { page, size: PAGE_SIZE, searchText: searchText || '', status: Status.ACTIVE };
    try {
      const res = await this.apiHelperService.getBpaActivityList(params);
      if (currentGen !== this.bpaRequestGen) return;
      if (page === FIRST_PAGE) {
        this.bpaMasterList = [];
        this.bpaPaginationDetail.totalRecords = +(res?.totalFilteredItemsCount ?? res?.totalFilteredItemsCount ?? 0);
      }
      this.bpaMasterList = [...this.bpaMasterList, ...(res?.listingBPA ?? [])];
      this.filteredBpaMasterList = [...this.bpaMasterList];
      this.bpaPaginationDetail.loading = false;
      setTimeout(() => {
        const calculated = this.calculateContainerHeight(this.bpaPaginationDetail, this.bpaVirtualScroll, this.bpaMasterList);
        this.bpaContainerHeight = (parseInt(calculated) > 10) ? calculated : '100px';
      }, 100);
    } catch (e) {
      console.error('Asset Fetch Error:', e);
      if (currentGen === this.bpaRequestGen) this.bpaPaginationDetail.loading = false;
    }
  }

  onChangeAssessmentType() {
    this.isTemplateInitialized = false;
    this.overviewForm.get('template')?.setValue('');
    this.templatePaginationDetail = {
      totalRecords: 0,
      pageNo: 0,
      loading: false
    }
    this.getFormTemplateList()
  }

  async getFormTemplateList(page: number = FIRST_PAGE) {
    if (this.templatePaginationDetail.loading || !this.type.value) return;
    this.templatePaginationDetail.loading = true;
    this.templatePaginationDetail.pageNo = page;

    const params = { page: page, size: PAGE_SIZE, type: (this.type.value?.id ?? 0), status: Status.ACTIVE };
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    return await firstValueFrom(
      this.httpService.httpGet(_url, params)).then(res => {
        if (page === FIRST_PAGE) {
          this.templateMasterList = [];
          this.templatePaginationDetail.totalRecords = +(res?.data?.totalFilteredItemsCount ?? 0);
        }

        this.templateMasterList = [...this.templateMasterList, ...(res?.data?.templates ?? [])];
        this.templatePaginationDetail.loading = false;
        this.templateContainerHeight = this.calculateContainerHeight(this.templatePaginationDetail, this.templateVirtualScroll, this.templateMasterList)

        const currentTemplate = this.template.value;
        if (currentTemplate) {
          const selectedTemplate = this.templateMasterList.find(t =>
            (typeof currentTemplate === 'string' ? t.name === currentTemplate : t.templateId === currentTemplate.templateId)
          );

          if (selectedTemplate) {
            this.template.patchValue(selectedTemplate, { emitEvent: false });
            this.previousTemplate = selectedTemplate;
            this.isTemplateInitialized = true;
            this.templateId.emit(selectedTemplate.templateId);
          }
        }
      })
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  compareTemplates(t1: any, t2: any): boolean {
    return t1 && t2 ? t1.templateId === t2.templateId : t1 === t2;
  }

  async getUserList(userTypes: any, isRespondent: boolean = false) {
    try {
      const data = await this.userService.getAllUserMasterList(false, userTypes);
      if (isRespondent) {
        this.loadRespondentList(this.respondentType.value);
      } else {
        this.filteredApproverList = [];
        this.filteredAuthorList = [];
        this.approvers = data;
        this.filteredApproverList = [...this.approvers];
        this.authors = data;
        this.filteredAuthorList = [...this.authors];
      }
    }
    catch (e) {
      console.error('Error', e);
    }
  }

  async patchAuthorDetails() {
    if (!this.author.value || Object.keys(this.author.value).length === 0) {
      const existingAuthor = this.authService.getUserInfo();
      if (existingAuthor?.applicationUserId) {
        const matchedAuthor = await this.userService.getUserById(existingAuthor.applicationUserId)
        if (matchedAuthor) {
          this.author.patchValue(matchedAuthor);
          this.addAuthorAsLevel1Approver(matchedAuthor);
        }
      }
    }
    this.syncApproversUI();
    this.syncRespondentsUI();
  }

  get bpaId() {
    return this.bpa?.value?.bpaId
  }

  get assetId() {
    return this.bpa?.value?.assetId
  }

  get vendorId() {
    return this.bpa?.value?.vendorId ?? this.bpa?.value?.id
  }

  get bpa() {
    return this.overviewForm.get('bpa') as FormControl;
  }

  get type() {
    return this.overviewForm.get('type') as FormControl;
  }

  get title(): FormControl {
    return this.overviewForm.get('title') as FormControl;
  }

  get template() {
    return this.overviewForm.get('template') as FormControl;
  }

  get description() {
    return this.overviewForm.get('description') as FormControl;
  }

  get author() {
    return this.overviewForm.get('author') as FormControl;
  }

  get approver1() {
    return this.overviewForm.get('approver1') as FormControl;
  }

  get approver2() {
    return this.overviewForm.get('approver2') as FormControl;
  }

  get approver3() {
    return this.overviewForm.get('approver3') as FormControl;
  }

  get respondent() {
    return this.overviewForm.get('respondent') as FormControl;
  }

  get risk() {
    return this.overviewForm.get('risk') as FormControl;
  }

  get completeBy() {
    return this.overviewForm.get('completeBy') as FormControl;
  }

  get respondentType() {
    return this.overviewForm.get('respondentType') as FormControl;
  }

  get onProcessingFor() {
    return this.overviewForm.get('processingFor') as FormControl;
  }

  displayOwner(ap: any): string {
    return ap ? ap.email : '';
  }

  displayApprover(ap: any): string {
    return ap ? ap.email : '';
  }

  displayRespondent(res: any): string {
    return res ? res.email : '';
  }

  // toggleApprover(approver: any) {
  //   if (this.isSelected(approver)) {
  //     this.selectedApprovers = this.selectedApprovers.filter(a => a !== approver);
  //   } else {
  //     this.selectedApprovers.push(approver);
  //   }
  //   this.filterApprovers(this.approver.value || '');
  //   this.approver.setValue(this.selectedApprovers.map(a => this.getUser(a)));
  //   this.updateApproverErrors();
  // }

  // isSelected(approver: any): boolean {
  //   return this.selectedApprovers.some(a => a.applicationUserId === approver.applicationUserId);
  // }

  // removeApprover(ap: any) {
  //   const index = this.selectedApprovers.indexOf(ap);
  //   if (index >= 0) {
  //     this.selectedApprovers.splice(index, 1);
  //   }
  //   this.approver.setValue(this.selectedApprovers.map(a => this.getUser(a)));
  //   this.updateApproverErrors();
  // }

  isRespondentExist(name: string): boolean {
    return this.selectedRespondents.some(r => r.name === name);
  }

  filterRespondents(value: string) {
    const search = typeof value === 'string' ? value.toLowerCase() : '';
    this.filteredRespondentList = this.respondents
      .filter(r => (r?.email || '').toLowerCase().includes(search))
      .sort((a, b) => {
        if (a.respondentType === INTERNAL_USER && b.respondentType !== INTERNAL_USER) return -1;
        if (a.respondentType !== INTERNAL_USER && b.respondentType === INTERNAL_USER) return 1;
        return 0;
      });
  }

  isRespondentSelected(respondent: any): boolean {
    return this.selectedRespondents.some(r => r.applicationUserId === respondent.applicationUserId);
  }

  toggleRespondent(respondent: any) {
    const index = this.selectedRespondents.indexOf(respondent);
    if (index >= 0) {
      this.selectedRespondents.splice(index, 1);
    } else {
      this.selectedRespondents.push(respondent);
    }

    this.respondent.setValue(this.selectedRespondents.map(r => this.getUser(r)));
    this.updateRespondentErrors();
  }

  removeRespondent(respondent: any) {
    const index = this.selectedRespondents.indexOf(respondent);
    if (index >= 0) {
      this.selectedRespondents.splice(index, 1);
    }

    this.respondent.setValue(this.selectedRespondents.map(r => this.getUser(r)));
    this.updateRespondentErrors();
  }

  async addNewUser(email: string, type: 'author' | 'approver' | 'respondent'): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.snackbarService.openSnack("Please enter a valid email address");
      return;
    }

    const purposeMap = {
      author: USER_PURPOSE.ASSESSMENT_AUTHOR,
      approver: USER_PURPOSE.ASSESSMENT_APPROVER,
      respondent: this.isVendorContext ? USER_PURPOSE.VENDOR_ASSESSMENT_RESPONDENT : USER_PURPOSE.ASSESSMENT_RESPONDENT
    };

    this.addUserIsLoading = true;
    try {
      let res;
      if (this.respondentType.value === INTERNAL_USER) {
        res = await firstValueFrom(this.apiHelperService.getOrCreateInternalUser({ email, purpose: purposeMap[type] }));
      } else {
        res = await firstValueFrom(this.apiHelperService.getOrCreateExternalUser({ email, purpose: purposeMap[type] }));
      }

      if (res?.success) {
        const fullName = res.data.displayName || email.split('@')[0];
        const userId = res.data.applicationUserId;
        const newUser = {
          applicationUserId: userId,
          displayName: fullName,
          email: email,
          userType: this.respondentType.value === INTERNAL_USER ? INTERNAL_USER : EXTERNAL_USER
        };

        const user = this.userService.createNewUserObj(newUser.applicationUserId, email, newUser.displayName, newUser.userType)
        if (this.respondentType.value === INTERNAL_USER) {
          this.userService.addInternalUser(user);
        } else {
          this.userService.addExternalUser(user);
        }

        if (type === 'author') {
          this.authors.push(newUser);
          this.filteredAuthorList = [...this.authors];
          this.overviewForm.patchValue({ author: newUser });
        } else if (type === 'approver') {
          this.approvers.push(newUser);
          this.filteredApproverList = [...this.approvers];
          this.overviewForm.patchValue({ approver: newUser });
        } else if (type === 'respondent') {
          this.respondents.push(user);
          this.filteredRespondentList = [...this.respondents];
          this.overviewForm.patchValue({ respondent: user });
        }
        // this.getUserList([ADMIN_USER, INTERNAL_USER]);
        // this.getUserList([INTERNAL_USER, EXTERNAL_USER], true);

        this.snackbarService.openSnack("User added successfully");
      } else {
        // this.snackbarService.openSnack("User addition failed");
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      // this.snackbarService.openSnack(error.message || "User addition failed");
    } finally {
      this.addUserIsLoading = false;
    }
  }

  msCompareFnBpa(objOne: any, objTwo: any) {
    if (!objOne || !objTwo) return false;

    const id1 = objOne.vendorId ?? objOne.assetId ?? objOne.bpaId ?? objOne.id;
    const id2 = objTwo.vendorId ?? objTwo.assetId ?? objTwo.bpaId ?? objTwo.id;

    return id1 === id2;
  }

  msCompareTemplate(objOne: any, objTwo: any) {
    return objOne && objTwo ? objOne.templateId === objTwo.templateId : objOne === objTwo;
  }

  compareUsers = (u1: any, u2: any) => {
    if (!u1 || !u2) return u1 === u2;

    const id1 = u1.applicationUserId ?? u1.userId;
    const id2 = u2.applicationUserId ?? u2.userId;

    return id1 === id2;
  };

  updateApproverList() {
    this.approver1.valueChanges.subscribe(val => {
      this.selectedApprovers1 = val || [];
    });

    this.approver2.valueChanges.subscribe(val => {
      this.selectedApprovers2 = val || [];
    });

    this.approver3.valueChanges.subscribe(val => {
      this.selectedApprovers3 = val || [];
    });
  }

  private syncApproversUI() {
    // const formApprovers = this.approver.value || [];
    // if (Array.isArray(formApprovers) && formApprovers.length) {
    //   this.selectedApprovers = this.approvers.filter(a =>
    //     formApprovers.includes(this.getUser(a))
    //   );
    //   this.approver.setValue([...formApprovers], { emitEvent: false });
    // }
    // this.approver.updateValueAndValidity();
  }

  private syncRespondentsUI() {
    // const formRespondents = this.respondent.value || [];
    // if (Array.isArray(formRespondents) && formRespondents.length) {
    //   this.selectedRespondents = this.respondents.filter(r =>
    //     formRespondents.includes(this.getUser(r))
    //   );
    //   this.respondent.setValue([...formRespondents], { emitEvent: false });
    // }
    // this.respondent.updateValueAndValidity();
  }

  private updateApproverErrors() {
    // if (this.selectedApprovers.length === 0 && (this.approver.touched || this.approver.dirty)) {
    //   this.approver.setErrors({ required: true });
    // } else {
    //   this.approver.setErrors(null);
    // }
  }

  private updateRespondentErrors() {
    // if (this.selectedRespondents.length === 0 && (this.respondent.touched || this.respondent.dirty)) {
    //   this.respondent.setErrors({ required: true });
    // } else {
    //   this.respondent.setErrors(null);
    // }
  }

  onApproverBlur() {
    // if (this.selectedApprovers.length === 0) {
    //   this.approver.setErrors({ required: true });
    //   this.approver.markAsTouched();
    // }
  }

  onRespondentBlur() {
    // if (this.selectedRespondents.length === 0) {
    //   this.respondent.setErrors({ required: true });
    //   this.respondent.markAsTouched();
    // }
  }

  async loadMoreBpa(selectPanel: MatSelect) {
    if (!selectPanel?.panelOpen || this.bpaPaginationDetail.loading) return;

    const hasMore =
      this.bpaMasterList.length <
      this.bpaPaginationDetail.totalRecords;

    if (!hasMore) return;

    this.bpaPaginationDetail.pageNo++;

    const searchText = this.searchControl?.value || '';

    if (this.processingFor.value === AccessRecord.PROCESSING_ACTIVITY) {
      await this.getBpaMasterList(
        this.bpaPaginationDetail.pageNo,
        searchText
      );
    } else if (this.processingFor.value === AccessRecord.VENDOR) {
      await this.getVendorList(
        this.bpaPaginationDetail.pageNo,
        searchText
      );
    } else {
      await this.getAssetList(
        this.bpaPaginationDetail.pageNo,
        searchText
      );
    }
  }

  async loadMoreTemplate(selectPanel: MatSelect) {
    if (!selectPanel?.panelOpen || this.templatePaginationDetail.loading) return;

    const hasMore = this.templateMasterList.length < this.templatePaginationDetail.totalRecords;
    if (!hasMore) return;

    this.templatePaginationDetail.pageNo++;

    await this.getFormTemplateList(this.templatePaginationDetail.pageNo);
  }

  get templateSize() {
    return this.templateMasterList?.length ?? 0
  }

  get bpaSize() {
    return this.bpaMasterList?.length ?? 0
  }

  onApproverSelected(event: MatAutocompleteSelectedEvent, controlName: string) {
    const user = event.option.value;
    const selectedUser = {
      userId: user.applicationUserId,
      displayName: user.displayName,
      userType: user.userType,
      email: user.email
    }
    // this.selectedApprovers = [selectedUser];
    this.overviewForm.patchValue({
      [controlName]: selectedUser
    });
  }

  onRespondentSelected(event: MatAutocompleteSelectedEvent) {
    const user = event.option.value;
    const selectedUser = {
      userId: user.applicationUserId,
      displayName: user.displayName,
      userType: user.userType,
      email: user.email
    }
    // this.patchRespondent(selectedUser)
  }

  patchRespondent(selectedUser: UserType) {
    this.selectedRespondents = [selectedUser];
    this.overviewForm.patchValue({
      respondent: selectedUser
    });

    this.assessmentService.currentRespondentUser = selectedUser;
  }

  onFormTemplateChange(event: any) {
    const selectedTemplate = event?.value;
    if (!selectedTemplate) return;

    if (!this.isTemplateInitialized) {
      this.isTemplateInitialized = true;
      this.previousTemplate = event.value;
      this.templateId.emit(this.previousTemplate?.templateId || 0);
      this.clearTemplateDetail()
      return;
    }

    if (this.previousTemplate?.templateId !== selectedTemplate.templateId) {
      this.cd.showDialog(
        'Alert',
        'Are you sure you want to change the form template?',
        'Yes',
        'No',
        '420px',
      ).subscribe((result: any) => {
        if (result) {
          this.previousTemplate = event.value;
          this.templateId.emit(this.previousTemplate?.templateId || 0);
          this.clearTemplateDetail();
        } else {
          this.overviewForm.get('template')?.setValue(this.previousTemplate);
        }
      });
    }
  }

  setUserPermissions() {
    this.showCreateBpaButton = this.rolePermissionService.createBpa || this.rolePermissionService.fullAccessBpa;
  }

  get bpaPlaceholder() {
    const value = this.bpa?.value;
    if (!value) {
      return this.processingFor.value === AccessRecord.ASSET ? '' : '';
    }
    return (value.name || value.title || value.assetName || '');
  }

  get templatePlaceholder() {
    return this.template?.value?.name ? this.template.value.name : ``
  }

  async getAssessmentTypeList() {
    const res = await this.assessmentTypeService.getAssessmentTypeMasterList();
    this.assessmentTypes = res ?? [];
    this.filteredAssessmentTypes = [...this.assessmentTypes];
    if (this.bpaDetails) {
      this.tryPatchBpaDetails();
    }
  }

  addNewAssessmentTypes(assessmentName: string) {
    const body = {
      name: assessmentName
    }
    this.configurationApiHelperService.addNewAssessmentType(body)
      .subscribe({
        next: async (res) => {
          const assessmentType = res?.assessmentType;
          if (assessmentType) {
            this.assessmentTypes.push(assessmentType);
            this.filteredAssessmentTypes = [...this.assessmentTypes];
            await this.assessmentTypeService.createAndNewAssessmentType(assessmentType)
          }
        },
        error: (e: Error) => {
          console.error(e.message);
        },
      });
  }

  filterAssessmentTypes(value: string) {
    if (typeof value !== "string") {
      return
    }
    const filterValue = value.toLowerCase();
    this.filteredAssessmentTypes = this.assessmentTypes.filter(type =>
      type.name.toLowerCase().includes(filterValue)
    );
  }

  showCreateOption() {
    this.filteredBpaMasterList = [];
    this.bpaContainerHeight = '100px';
  }
  onAssessmentSelected(value: any) {
    this.overviewForm.patchValue({
      type: value
    });
    this.onSelectionChange()
    this.onChangeAssessmentType()
  }

  get filteredAssesmentTypeIsEmpty() {
    return !this.filteredAssessmentTypes?.length
  }

  assessmentDisplayName(assessmentType: AssessmentType) {
    return assessmentType ? assessmentType.name : ""
  }

  calculateContainerHeight(paginationDetail: any, virtualScroll: CdkVirtualScrollViewport, masterList: any): string {
    const numberOfItems = paginationDetail.totalRecords;
    const itemHeight = 20;
    const visibleItems = 10
    const extraPixels = (numberOfItems > 10) ? 0 : (numberOfItems < 2 ? 10 : 50)
    setTimeout(() => {
      if (virtualScroll)
        virtualScroll.checkViewportSize();
    }, 300);

    if (numberOfItems <= visibleItems) {
      return `${(itemHeight * numberOfItems) + extraPixels}px`;
    }
    return `${(itemHeight * visibleItems) + extraPixels}px`;
  }

  getLoggedInUser() {
    const userData = this.authService.getUserInfo();
    const userType = this.authService.getUserType()
    if (userData && userData.displayName) {
      this.loggedUser = userData;
      const selectedUser = {
        userId: userData.applicationUserId,
        displayName: userData.displayName,
        userType: userType
      };

      this.overviewForm.patchValue({
        author: selectedUser
      });
    }
  }

  async patchBpaDetails() {
    this.bpaPaginationDetail.loading = false;
    if (!this.bpaDetails) return;
    const selectedAssessmentType = this.assessmentTypes[0];
    this.onAssessmentSelected(selectedAssessmentType);
    let entityName = '';

    if (this.bpaDetails?.bpa) {
      this.processingFor.patchValue(AccessRecord.PROCESSING_ACTIVITY);
      this.previousProcessingFor = AccessRecord.PROCESSING_ACTIVITY;
      await this.getBpaMasterList();
      const exists = this.bpaMasterList.find(
        b => b.bpaId === this.bpaDetails.bpa.bpaId
      );
      if (!exists) {
        this.bpaMasterList.unshift(this.bpaDetails.bpa);
        this.filteredBpaMasterList = [...this.bpaMasterList];
      }
      this.bpa.patchValue(this.bpaDetails.bpa, { emitEvent: false });
      entityName = this.bpaDetails.bpa?.name ?? '';

      const processOwnerId = this.bpaDetails?.processOwner?.userId;
      const authorId = this.author.value?.userId || this.author.value?.applicationUserId;
      if (processOwnerId && authorId && processOwnerId === authorId) {
        this.authorAsRespondent.patchValue(true);
        this.onCheckboxChange(true);
      } else {
        this.patchBpaRespondent();
        this.syncRespondentWithList();
      }
    }
    else if (this.bpaDetails?.asset) {
      this.processingFor.patchValue(AccessRecord.ASSET);
      this.previousProcessingFor = AccessRecord.ASSET;
      this.bpaPaginationDetail.loading = false;
      await this.getAssetList();

      const exists = this.bpaMasterList.find(
        a => a.assetId === this.bpaDetails.asset.assetId
      );
      if (!exists) {
        this.bpaMasterList.unshift(this.bpaDetails.asset);
        this.filteredBpaMasterList = [...this.bpaMasterList];
      }
      this.bpa.patchValue(this.bpaDetails.asset, { emitEvent: false });
      entityName = this.bpaDetails.asset?.name ?? '';
    }
    else if (this.bpaDetails?.vendor) {
      this.processingFor.patchValue(AccessRecord.VENDOR);
      this.previousProcessingFor = AccessRecord.VENDOR;
      this.bpaPaginationDetail.loading = false;
      await this.getVendorList();

      const exists = this.bpaMasterList.find(
        v => v.vendorId === this.bpaDetails?.vendor?.vendorId
      );
      if (!exists) {
        this.bpaMasterList.unshift(this.bpaDetails.vendor);
        this.filteredBpaMasterList = [...this.bpaMasterList];
      }
      this.bpa.patchValue(this.bpaDetails.vendor, { emitEvent: false });
      entityName = this.bpaDetails.vendor?.name ?? '';
    }

    this.patchAssessmentName(
      selectedAssessmentType?.name ?? '',
      entityName
    );

    this.setAssessmentTitleAsReadonly()

    if (this.bpaDetails?.disabled) {
      this.title.disable();
    }
  }

  patchBpaRespondent() {
    //Respondent patch
    const user = this.bpaDetails?.processOwner;
    if (user) {
      const selectedUser = {
        userId: user.userId,
        displayName: user.displayName,
        userType: user.userType,
        email: user.email
      }
      this.patchRespondent(selectedUser);
    }
  }

  async syncRespondentWithList() {
    if (String(this.bpaDetails?.processOwner?.userType) === INTERNAL_USER || String(this.bpaDetails?.processOwner?.userType) === ADMIN_USER) {
      this.respondentType.setValue(INTERNAL_USER);
    } else {
      this.respondentType.setValue(EXTERNAL_USER);
    }

    const user = this.bpaDetails?.processOwner;
    const matchedUser = this.respondents.find(
      u => String(u.applicationUserId) === String(user.userId)
    );
    if (matchedUser) {
      this.respondent.patchValue(matchedUser);
    }
  }

  patchAssessmentName(assessmentTypeName: string, bpaName: string) {
    const assessmentTitle = `${assessmentTypeName ? `${assessmentTypeName} - ${bpaName}` : `${bpaName}`}`;
    this.title.patchValue(assessmentTitle);
    this.setAssessmentTitleAsReadonly();
  }

  onSelectionChange() {
    const bpaName = `${this.bpa.value.name ?? ''}`;
    const assessmentTypeName = `${this.type.value.name ?? ''}`;
    this.patchAssessmentName(assessmentTypeName, bpaName);
  }

  onBpaSelectionChange() {
    if (this.processingFor.value === AccessRecord.PROCESSING_ACTIVITY) {
      this.selectedProcessingActivity = this.bpa.value;
    } else if (this.processingFor.value === AccessRecord.VENDOR) {
      this.selectedVendor = this.bpa.value;
    } else {
      this.selectedAsset = this.bpa.value;
    }

    this.onSelectionChange();

    // if (this.bpaId) {
    //   this.onChangeBpa.emit({ bpaId: this.bpaId });
    // }
  }

  async loadRespondentList(type: string, changeRespondentType: boolean = false) {
    const currentReq = ++this.respondentRequestGen;
    const adminUsers = await this.userService.getAdminUserMasterList();
    const internalUsers = await this.userService.getInternalUserMasterList();
    const externalUsers = await this.userService.getExternalUserMasterList();

    if (currentReq !== this.respondentRequestGen) return;

    if (type === INTERNAL_USER) {
      this.respondents = [...internalUsers, ...adminUsers];
    } else {
      this.respondents = [...externalUsers];
    }

    if (changeRespondentType) {
      this.respondent.reset(null, { emitEvent: false });
    }
    this.filteredRespondentList = [...this.respondents];
  }

  onProcessingActivitySearch(query: string) {
    if (!query) {
      this.filteredBpaMasterList = [...this.bpaMasterList];
      return;
    }

    const filterValue = query.toLowerCase();

    this.filteredBpaMasterList = this.bpaMasterList.filter((r: any) =>
      r.name?.toLowerCase().includes(filterValue)
    );
  }

  onProcessingForChange(event: any) {
    this.bpaMasterList = [];
    this.filteredBpaMasterList = [];
    this.searchControl.setValue('', { emitEvent: false });

    this.bpaPaginationDetail = {
      totalRecords: 0,
      pageNo: FIRST_PAGE,
      loading: false
    };
    const currentValue = this.bpa.value;
    if (this.previousProcessingFor === AccessRecord.PROCESSING_ACTIVITY) {
      this.selectedProcessingActivity = currentValue;
    } else if (this.previousProcessingFor === AccessRecord.ASSET) {
      this.selectedAsset = currentValue;
    } else if (this.previousProcessingFor === AccessRecord.VENDOR) {
      this.selectedVendor = currentValue;
    }
    this.previousProcessingFor = event.value;
    this.bpa.setValue('')
    this.filteredBpaMasterList = [];

    if (event.value === AccessRecord.PROCESSING_ACTIVITY) {
      this.getBpaMasterList().then(() => {
        if (this.selectedProcessingActivity) {
          this.bpa.patchValue(this.selectedProcessingActivity, { emitEvent: false });
        }
      });
    } else if (event.value === AccessRecord.VENDOR) {
      this.getVendorList().then(() => {
        if (this.selectedVendor) {
          this.bpa.patchValue(this.selectedVendor, { emitEvent: false });
        }
      });
    } else {
      this.getAssetList().then(() => {
        if (this.selectedAsset) {
          this.bpa.patchValue(this.selectedAsset, { emitEvent: false });
        }
      });
    }
  }

  async getAssetList(page: number = FIRST_PAGE, searchText: string = '') {
    if (this.bpaPaginationDetail.loading) return;

    this.bpaPaginationDetail.loading = true;
    this.bpaPaginationDetail.pageNo = page;
    const currentGen = ++this.bpaRequestGen;

    const params = {
      page,
      size: PAGE_SIZE,
      searchText: searchText || '',
      status: Status.ACTIVE
    };

    try {
      const res = await this.apiHelperService.getAssetList(params);
      if (currentGen !== this.bpaRequestGen) return;

      if (page === FIRST_PAGE) {
        this.bpaMasterList = [];
        this.bpaPaginationDetail.totalRecords = +(res?.totalFilteredItemsCount ?? res?.totalFilteredItemsCount ?? 0);
      }

      this.bpaMasterList = [...this.bpaMasterList, ...(res?.assets ?? [])];
      this.filteredBpaMasterList = [...this.bpaMasterList];
      this.bpaPaginationDetail.loading = false;
      setTimeout(() => {
        const calculated = this.calculateContainerHeight(this.bpaPaginationDetail, this.bpaVirtualScroll, this.bpaMasterList);
        this.bpaContainerHeight = (parseInt(calculated) > 10) ? calculated : '100px';
      }, 100);

    } catch (e) {
      console.error('Asset Fetch Error:', e);
      if (currentGen === this.bpaRequestGen) this.bpaPaginationDetail.loading = false;
    }
  }

  async getVendorList(page: number = FIRST_PAGE, searchQuery: string = '') {
    if (this.bpaPaginationDetail.loading) return;

    this.bpaPaginationDetail.loading = true;
    this.bpaPaginationDetail.pageNo = page;
    const currentGen = ++this.bpaRequestGen;

    const params = {
      page,
      size: PAGE_SIZE,
      searchQuery: searchQuery || '',
      status: Status.ACTIVE
    };

    try {
      const res = await this.apiHelperService.getVendorList(params);
      if (currentGen !== this.bpaRequestGen) return;

      if (page === FIRST_PAGE) {
        this.bpaMasterList = [];
        this.bpaPaginationDetail.totalRecords = +(res?.totalFilteredItemsCount ?? 0);
      }

      this.bpaMasterList = [...this.bpaMasterList, ...(res?.vendors ?? [])];
      this.filteredBpaMasterList = [...this.bpaMasterList];
      this.bpaPaginationDetail.loading = false;
      setTimeout(() => {
        const calculated = this.calculateContainerHeight(this.bpaPaginationDetail, this.bpaVirtualScroll, this.bpaMasterList);
        this.bpaContainerHeight = (parseInt(calculated) > 10) ? calculated : '100px';
      }, 100);

    } catch (e) {
      console.error('Vendor Fetch Error:', e);
      if (currentGen === this.bpaRequestGen) this.bpaPaginationDetail.loading = false;
    }
  }

  onChangeApprover(controlName: string) {
    const value = this.overviewForm.get(controlName)?.value || [];

    if (controlName === 'approver1') {
      this.selectedApprovers1 = value;
    }

    if (controlName === 'approver2') {
      this.selectedApprovers2 = value;
    }

    if (controlName === 'approver3') {
      this.selectedApprovers3 = value;
    }
  }

  removeApprover(user: any, controlName: string) {
    if (controlName === 'approver1') {
      const currentAuthor = this.author.value;
      if ((user?.userId || user?.applicationUserId) === currentAuthor?.userId) {
        return;
      }
    }

    const current = this.overviewForm.get(controlName)?.value || [];
    const updated = current.filter(
      (a: any) => (a.applicationUserId || a.userId) !==
        (user.applicationUserId || user.userId)
    );
    this.overviewForm.get(controlName)?.setValue(updated);

    if (controlName === 'approver1') {
      this.selectedApprovers1 = updated;
    }

    if (controlName === 'approver2') {
      this.selectedApprovers2 = updated;
    }

    if (controlName === 'approver3') {
      this.selectedApprovers3 = updated;
    }
    this.assessmentService.onDeleteApprover(user)
  }

  get processingFor() {
    return this.overviewForm.get('processingFor') as FormControl;
  }

  clearTemplateDetail() {
    this.assessmentService.assessmentTemplateDetail = null;
  }

  private tryPatchBpaDetails() {
    if (this.bpaDetails && this.assessmentTypes?.length) {
      this.patchBpaDetails();
    }
  }

  initAssetOrBpaMasterList() {
    this.bpaPaginationDetail.loading = false;
    this.bpaMasterList = [];
    this.filteredBpaMasterList = [];
    this.previousProcessingFor = this.processingFor.value;
    if (this.processingFor.value === AccessRecord.PROCESSING_ACTIVITY) {
      this.getBpaMasterList(FIRST_PAGE);
    } else if (this.processingFor.value === AccessRecord.VENDOR) {
      this.getVendorList(FIRST_PAGE);
    } else {
      this.getAssetList(FIRST_PAGE);
    }
  }

  onBpaOpenedChange(isOpen: boolean) {
    if (isOpen) return;

    const hadSearch = !!this.searchControl.value?.trim();
    this.searchControl.setValue('', { emitEvent: false });

    if (!hadSearch) return;

    this.bpaPaginationDetail.pageNo = FIRST_PAGE;

    if (this.processingFor.value === AccessRecord.PROCESSING_ACTIVITY) {
      this.getBpaMasterList(FIRST_PAGE, '');
    } else if (this.processingFor.value === AccessRecord.VENDOR) {
      this.getVendorList(FIRST_PAGE, '');
    } else {
      this.getAssetList(FIRST_PAGE, '');
    }
  }

  isRemovable(ap: any): boolean {
    const author = this.author.value;

    if (!author) return false;

    const authorId = author.applicationUserId ?? author.userId;
    const apId = ap.applicationUserId ?? ap.userId;

    if (!authorId || !apId) return false;

    return apId.toString() !== authorId.toString();
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  shouldShowAddRespondent(): boolean {
    const value = this.respondent.value;
    return value && this.isValidEmail(value) && !this.isRespondentExist(value);
  }

  patchPreviousAuthorId() {
    const author = this.author.value
    if (author?.userId && !this.previousAuthorId) {
      this.previousAuthorId = author?.userId ?? 0
    }
  }

  get respondentButtonText() {
    return `Create ${this.respondentType.value === `${INTERNAL_USER}` ? 'Internal Respondent' : 'External Respondent'}`
  }

  setAssessmentTitleAsReadonly() {
    if (this.title) {
      const hasSelection = this.bpa?.value && typeof this.bpa.value === 'object';
      if (!this.title.value || !hasSelection || !this.type?.value) {
        this.title.disable();
      }
      else {
        this.title.enable();
      }
    }
  }

  get authorAsRespondent() {
    return this.overviewForm.get('authorAsRespondent') as FormControl;
  }

  onCheckboxChange(checked: boolean) {
    if (checked) {
      const author = this.author.value;
      this.respondent.setValue(author);
      this.respondent.disable();
      this.respondentType.disable();

    } else {
      this.respondent.enable();
      this.respondentType.enable();
      this.respondent.reset();
    }
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

  onDescriptionChange(data: { content: string, edited: boolean }) {
    this.description.setValue(data.content);
    if (data.edited) {
      this.description.markAsDirty();
    }
  }

  isAuthor(approver: any) {
    const author = this.author.value;

    if (!author) return false;

    const authorId = author.applicationUserId ?? author.userId;
    const apId = approver.applicationUserId ?? approver.userId;

    return authorId === apId;
  }
}
