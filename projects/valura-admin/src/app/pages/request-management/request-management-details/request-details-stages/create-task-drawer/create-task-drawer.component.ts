
import { Component, EventEmitter, OnInit, Output, Input, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@valura-lib/service/network/api-helper.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { UserService } from '@admin-core/services/user/user.service';
import { AuthService } from '@admin-core/services/auth.service';
import { DbService } from '@admin-core/services/db/db.service';
import { RiskViewDrawerService } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { User } from '@admin-core/models/user.model';
import { USER_TYPES, PRIORITY_OPTIONS, EFFORT_LEVELS, TASK_TYPES } from '@admin-core/constants/constants';
import { ASSESSMENT_RISK, ASSESSMENT_VENDOR_RISK, USER_PURPOSE } from '@admin-core/constants/api-constants';
import { signal, computed, effect } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { AssessmentAttachedTo } from '@admin-page/assessments/assessments/constants';

interface FlatDisplayInfoOption {
  value: string;
  label: string;
  isGroup: boolean;
  groupValue?: string;
}

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
  selector: 'app-create-task-drawer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTooltipModule,
    MatCheckboxModule,
    TextFieldModule,
    MatChipsModule,
    MatAutocompleteModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatProgressSpinnerModule,
    CustomEditorComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  templateUrl: './create-task-drawer.component.html',
  styleUrl: './create-task-drawer.component.scss',
})
export class CreateTaskDrawerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() requestRid: number = 0;
  @Input() requestStage: string = '';
  @Input() documentsList: any[] = [];
  @Input() task: any = null;
  @Input() isEditMode: boolean = false;
  @Input() dsrRequestDetails: any;
  @Input() isRiskContext: boolean = false;
  @Input() assessmentId: number = 0;
  @Input() sections: any[] = [];
  @Input() risks: any[] = [];
  @Input() riskId: string = '';
  @Input() questionId: number = 0;
  @Input() source?: string;
  @Input() hideParameterFields = false;
  @Input() isVendorContext = false;

  @Output() onClose = new EventEmitter<any>();
  @Output() onSaveTask = new EventEmitter<any>();
  @ViewChild('displayInfoInput', { read: MatAutocompleteTrigger }) displayInfoTrigger!: MatAutocompleteTrigger;
  @ViewChild('labelInput', { read: MatAutocompleteTrigger }) labelInputTrigger!: MatAutocompleteTrigger;
  @ViewChild('internalUserInput', { read: MatAutocompleteTrigger }) internalUserTrigger!: MatAutocompleteTrigger;
  @ViewChild('internalUserInput') internalUserInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('externalUserInput', { read: MatAutocompleteTrigger }) externalUserTrigger!: MatAutocompleteTrigger;
  @ViewChild('sectionSelect') sectionSelect!: MatSelect;
  @ViewChild('riskSelect') riskSelect!: MatSelect;
  @ViewChild('drawerScrollContainer') drawerScrollContainer!: ElementRef<HTMLElement>;
  taskForm!: FormGroup;
  readonly isDragOver = signal<boolean>(false);
  readonly uploadedFiles = signal<Array<{
    file: File;
    fileName: string;
    fileKey?: string;
    presignedUrl?: string;
    fileSize: number;
    eTag?: string;
    serverPath?: string;
    isExisting?: boolean;
  }>>([]);
  readonly fileUploadInProgress = signal<boolean>(false);
  readonly submitLoading = signal<boolean>(false);
  readonly formHasChanges = signal<boolean>(false);
  readonly isFormValid = signal<boolean>(false);
  readonly canSubmitOrUpdate = computed(() => {
    const isValid = this.taskForm?.valid ?? false;
    const hasChanges = this.hasFormChanges;
    const isUploading = this.fileUploadInProgress();
    const canSubmit = isValid && !isUploading && (!this.isEditMode || hasChanges);
    return canSubmit;
  });
  private existingDocumentAttached: any[] = [];
  private deletedDocumentAttached: any[] = [];
  private existingTaskLabelMappings: any[] = [];
  private isPopulatingForm: boolean = false;
  private autoAssignedRespondent: any = null;
  private initialFormValues: any = null;
  private initialUploadedFilesCount: number = 0;
  private descriptionChangedByUser: boolean = false;
  private _initialValuesTimer: any = null;
  private _userLoadTimer: any = null;
  editorInitialContent: string = '';
  loadedRisks: any[] = [];
  get effectiveRisks(): any[] {
    return this.loadedRisks.length > 0 ? this.loadedRisks : this.risks;
  }
  isDisplayInfoDropdownOpen = false;
  isLabelsDropdownOpen = false;
  isInternalUserDropdownOpen = false;
  isExternalUserDropdownOpen = false;
  private scrollListener: any;
  private displayInfoPanelScrollListener: any;
  private preventDropdownReopen = false;
  private dropdownCloseTimeout: any = null;
  private clickOutsideListener: any = null;
  private dropdownOpenDebounceTimeout: any = null;
  private readonly MIN_SEARCH_LENGTH = 0;
  private readonly DROPDOWN_REOPEN_DELAY = 300;
  private readonly DROPDOWN_OPEN_DEBOUNCE = 150;
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dbService = inject(DbService);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private assessmentService = inject(AssessmentService);
  readonly labelsLoading = signal<boolean>(false);
  readonly assigneeTypeSignal = signal<string>('INTERNAL');
  internalUserControl = new FormControl<User | string | null>(null);
  readonly userMasterList = signal<User[]>([]);
  readonly internalUserSearchTerm = signal<string>('');
  readonly internalUserLoading = signal<boolean>(false);
  readonly internalUserCreated = signal<User | null>(null);
  readonly internalUserError = signal<string | null>(null);
  readonly externalUserLoading = signal<boolean>(false);
  readonly externalUser = signal<any>(null);
  readonly externalUserError = signal<string | null>(null);
  externalUserControl = new FormControl<User | string | null>(null);
  readonly externalUserSearchTerm = signal<string>('');
  readonly externalUserCreated = signal<User | null>(null);

  availableLabels: Array<{ id: number; name: string; isDeleted: boolean }> = [];
  filteredLabelsList: Array<{ id: number; name: string; isDeleted: boolean }> = [];
  labelSearchTerm = '';

  priorityOptions = PRIORITY_OPTIONS;
  effortLevels = EFFORT_LEVELS;
  taskTypes = TASK_TYPES;
  selectedSectionQuestions: any[] = [];
  editFallbackSection: any = null;
  isLoadingTaskSections: boolean = false;
  isLoadingTaskQuestions: boolean = false;
  drawerTaskSections: any[] = [];
  taskAvailableQuestions: any[] = [];

  // Section pagination
  private sectionPage: number = 0;
  private hasMoreSections: boolean = true;
  isLoadingMoreSections: boolean = false;
  private sectionScrollHandler: any;

  // Risk pagination
  private riskPage: number = 1;
  private hasMoreRisks: boolean = true;
  isLoadingMoreRisks: boolean = false;
  private riskScrollHandler: any;

  // Question dropdown
  @ViewChild('questionSelect') questionSelect!: MatSelect;

  // Drawer scroll → close open dropdowns
  private drawerScrollCloseHandler: any;

  private readonly RISK_FILE_UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 30 * 1024 * 1024,
    MAX_FILE_SIZE_MB: 30,
    ALLOWED_FILE_TYPES: ['.svg', '.jpg', '.png'],
    SUPPORTED_MIME_TYPES: ['image/svg+xml', 'image/jpeg', 'image/png']
  };

  get activeFileUploadConfig() {
    return this.isRiskContext ? this.RISK_FILE_UPLOAD_CONFIG : this.FILE_UPLOAD_CONFIG;
  }

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  displayInfoGroups: Array<{ name: string; value: string; children: Array<{ value: string; label: string; group: string }> }> = [];
  flattenedDisplayInfoOptions: FlatDisplayInfoOption[] = [];
  private allFlattenedOptions: FlatDisplayInfoOption[] = [];
  displayInfoSearchTerm = '';
  attachmentsPageSize: number = 10;
  attachmentsPageNo: number = 1;
  attachmentsTotalPages: number = 0;
  isLoadingAttachments: boolean = false;
  private attachmentsLoadedForRequestRid: number | null = null;
  private dsrFieldDisplayKeysFromApi: Array<{ key: string; value: string; displayFor?: string }> = [];
  get allDisplayInfoOptions() {
    return this.displayInfoGroups.flatMap(group => group.children);
  }
  readonly currentLoggedInUser = computed(() => {
    return this.authService.getUserInfo();
  });
  get titleControl(): FormControl {
    return this.taskForm.get('title') as FormControl;
  }
  get descriptionControl(): FormControl {
    return this.taskForm.get('description') as FormControl;
  }
  get externalEmailControl(): FormControl {
    return this.taskForm.get('externalEmail') as FormControl;
  }
  get assigneeControl(): FormControl {
    return this.taskForm.get('assignee') as FormControl;
  }
  minToDateFilter = new Date();
  readonly filteredInternalUsers = computed(() => {
    const users = this.userMasterList();
    const searchTerm = this.internalUserSearchTerm().toLowerCase();
    const currentUser = this.currentLoggedInUser();
    let filteredUsers = users.filter(user => user && user.applicationUserId && (user.userType === 'INTERNAL_USER' || user.userType === 'ADMIN_USER'));
    if (currentUser && currentUser.applicationUserId) {
      filteredUsers = filteredUsers.filter(user =>
        user.applicationUserId !== currentUser.applicationUserId
      );
    }

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => {
        const displayName = user.displayName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return displayName.includes(searchTerm) || email.includes(searchTerm);
      });
    }
    return filteredUsers;
  });
  readonly filteredExternalUsers = computed(() => {
    const users = this.userMasterList();
    const searchTerm = this.externalUserSearchTerm().toLowerCase();
    let filteredUsers = users.filter(user => user && user.applicationUserId && user.userType === 'EXTERNAL_USER');
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => {
        const displayName = user.displayName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return displayName.includes(searchTerm) || email.includes(searchTerm);
      });
    }
    return filteredUsers;
  });
  readonly showInternalUserDropdown = computed(() => {
    return this.assigneeTypeSignal() === 'INTERNAL';
  });
  readonly showExternalUserInput = computed(() => {
    return this.assigneeTypeSignal() === 'EXTERNAL' && !this.isExternalEmailDataSubject();
  });
  readonly isExternalEmailDataSubject = signal<boolean>(false);
  readonly isExternalEmailThirdParty = signal<boolean>(false);
  readonly dsrFormRequestedUser = signal<any>(null);
  readonly effectiveAssigneeType = computed(() => {
    const formAssigneeType = this.assigneeTypeSignal();
    const isDataSubject = this.isExternalEmailDataSubject();
    if (formAssigneeType === 'EXTERNAL' && isDataSubject) {
      return 'DATA_SUBJECT';
    }
    return formAssigneeType;
  });
  readonly showDataSubjectAssignment = computed(() => {
    return this.effectiveAssigneeType() === 'DATA_SUBJECT';
  });
  readonly showThirdPartyMatchMessage = computed(() => {
    const formAssigneeType = this.assigneeTypeSignal();
    const hasExternalUser = !!this.externalUser()?.applicationUserId;
    return formAssigneeType === 'EXTERNAL' && this.isExternalEmailThirdParty() && hasExternalUser;
  });
  readonly showCreateInternalUser = computed(() => {
    const searchTerm = this.internalUserSearchTerm();
    const assigneeType = this.assigneeTypeSignal();
    if (assigneeType !== 'INTERNAL' || !searchTerm || searchTerm.trim().length === 0) {
      return false;
    }
    const users = this.filteredInternalUsers();
    const hasExactMatch = users.some(user =>
      user.email?.toLowerCase() === searchTerm.toLowerCase()
    );
    const isValidEmail = this.validateEmail(searchTerm);
    const shouldShow = !hasExactMatch && isValidEmail;
    return shouldShow;
  });
  readonly showCreateExternalUser = computed(() => {
    const searchTerm = this.externalUserSearchTerm();
    const assigneeType = this.assigneeTypeSignal();
    if (assigneeType !== 'EXTERNAL' || !searchTerm || searchTerm.trim().length === 0) {
      return false;
    }
    const users = this.filteredExternalUsers();
    const hasExactMatch = users.some(user =>
      user.email?.toLowerCase() === searchTerm.toLowerCase()
    );
    const isValidEmail = this.validateEmail(searchTerm);
    const shouldShow = !hasExactMatch && isValidEmail;
    return shouldShow;
  });
  readonly hasValidUserMasterList = computed(() => {
    const userList = this.userMasterList();
    return userList.length > 0;
  });
  getDataRequestOptions(): Array<{ value: string, label: string }> {
    const dsrUser = this.dsrFormRequestedUser();
    if (!dsrUser) return [];
    return [{
      value: dsrUser.pid,
      label: `${dsrUser.pid} (${dsrUser.pidType})`
    }];
  }
  get assignedDataSubjectUser(): string {
    const assigneeType = this.taskForm.get('assigneeType')?.value;
    if (assigneeType === 'DATA_SUBJECT') {
      const dataSubjectOptions = this.getDataRequestOptions();
      return dataSubjectOptions.length > 0 ? dataSubjectOptions[0].label : 'No data subject available';
    }
    return '';
  }
  constructor(private fb: FormBuilder) {
    effect(() => {
      if (this.internalUserLoading()) {
        this.internalUserControl.disable({ emitEvent: false });
      } else {
        this.internalUserControl.enable({ emitEvent: false });
      }
    });
    effect(() => {
      const shouldShowButton = this.showCreateInternalUser();
      const userNotCreated = !this.internalUserCreated();
      if (shouldShowButton && userNotCreated) {
        setTimeout(() => {
          this.forceCloseInternalUserDropdown();
        }, 0);
      }
    });
    effect(() => {
      const isOpen = this.isInternalUserDropdownOpen;
      if (isOpen) {
        this.setupClickOutsideListener();
      } else {
        this.removeClickOutsideListener();
      }
    });
  }

  private async loadAvailableLabels(): Promise<void> {
    this.labelsLoading.set(true);
    try {
      const labelsFromApi = await this.apiHelperService.getAllLabels();

      this.availableLabels = labelsFromApi.map(label => ({
        id: label.id,
        name: label.name,
        isDeleted: label.isDeleted ?? false
      }));

      this.onSearchLabels(this.labelSearchTerm);

      if (this.isEditMode) {
        const currentLabels = this.taskForm.get('labels')?.value || [];
        for (const selected of currentLabels) {
          if (!this.availableLabels.some(l => l.name.toLowerCase() === selected.name.toLowerCase())) {
            this.availableLabels.push({
              id: selected.id || 0,
              name: selected.name,
              isDeleted: false
            });
          }
        }
        this.onSearchLabels(this.labelSearchTerm);
      }
    } catch (err) {
      console.error('Failed to load labels', err);
      this.snackbarService.openSnack('Failed to load labels');
    } finally {
      this.labelsLoading.set(false);
    }
  }

  isLabelSelected(label: any): boolean {
    const current = this.taskForm.get('labels')?.value || [];
    return current.some((l: any) => l.name.toLowerCase() === label.name.toLowerCase());
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupAssigneeSubscriptions();
    this.loadInternalUsers();
    if (!this.isRiskContext) {
      this.initializeDsrFormRequestedUser();
    }
  }


  onDrawerOpened(): void {
    this.loadAvailableLabels();
    if (this.isRiskContext && !this.isEditMode) {
      this.autoAssignRespondentFromAssessment();
      const riskControl = this.taskForm.get('riskIdField');
      const checkboxControl = this.taskForm.get('linkToExistingRisk');
      if ((this.source === 'RISK_CREATE_TASK' || this.source === 'RISK_VIEW_DRAWER') && this.riskId) {
        const numericId = parseInt(this.riskId.replace('R-', ''), 10);
        if (!isNaN(numericId)) {
          checkboxControl?.setValue(true, { emitEvent: false });
          checkboxControl?.disable({ emitEvent: false });
          riskControl?.setValue(numericId, { emitEvent: false });
          riskControl?.disable({ emitEvent: false });
        }
        this.taskForm.get('chooseParameter')?.disable({ emitEvent: false });
      } else if (this.source === 'ASSESSMENT_TASK') {
        this.drawerTaskSections = [];
        this.taskAvailableQuestions = [];
        this.taskForm.get('chooseParameter')?.enable({ emitEvent: false });
        this.taskForm.get('chooseParameter')?.setValue(false, { emitEvent: false });
        checkboxControl?.enable({ emitEvent: false });
        checkboxControl?.setValue(false, { emitEvent: false });
        riskControl?.disable({ emitEvent: false });
        riskControl?.setValue('', { emitEvent: false });
        this.taskForm.get('sectionId')?.setValue(null, { emitEvent: false });
        this.taskForm.get('questionId')?.setValue(null, { emitEvent: false });
      } else {
        riskControl?.enable({ emitEvent: false });
        if (this.riskId) {
          const numericId = parseInt(this.riskId.replace('R-', ''), 10);
          if (!isNaN(numericId)) {
            riskControl?.setValue(numericId, { emitEvent: false });
          }
        }
      }
      this.cdr.detectChanges();
    }
    if (this.isRiskContext && !this.isEditMode && this.questionId > 0) {
      this.preselectQuestionContext();
    }
    const editTaskAttachedTo = this.isEditMode ? (this.task as any)?.attachedTo : null;

    if (this.isEditMode && this.source === 'ASSESSMENT_TASK_EDIT' && this.questionId > 0) {
      const taskSectionId = (this.task as any)?.sectionId;
      const taskSectionTitle = (this.task as any)?.sectionTitle || '';
      const taskQuestionTitle = (this.task as any)?.questionTitle || '';
      if (taskSectionId) {
        this.drawerTaskSections = [{ id: taskSectionId, sectionName: taskSectionTitle, questions: [] }];
        this.taskAvailableQuestions = [{ id: this.questionId, text: taskQuestionTitle }];
        this.taskForm.patchValue({ sectionId: taskSectionId, questionId: this.questionId }, { emitEvent: false });
      }
      this.taskForm.get('chooseParameter')?.setValue(true, { emitEvent: false });
      this.taskForm.get('chooseParameter')?.disable({ emitEvent: false });
      this.taskForm.get('sectionId')?.disable({ emitEvent: false });
      this.taskForm.get('questionId')?.disable({ emitEvent: false });
      this.taskForm.get('linkToExistingRisk')?.disable({ emitEvent: false });
    }

    if (this.source === 'ASSESSMENT_TASK_EDIT' && (editTaskAttachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || editTaskAttachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK)) {
      const linkedRiskId = (this.task as any)?.attachedToId;
      const linkedRiskTitle = (this.task as any)?.riskTitle || '';
      if (linkedRiskId) {
        this.loadedRisks = [{ riskId: linkedRiskId, riskTitle: linkedRiskTitle }];
        this.taskForm.get('linkToExistingRisk')?.setValue(true, { emitEvent: false });
        this.taskForm.get('riskIdField')?.setValue(linkedRiskId, { emitEvent: false });
        this.taskForm.get('linkToExistingRisk')?.disable({ emitEvent: false });
        this.taskForm.get('riskIdField')?.disable({ emitEvent: false });
      }
      this.taskForm.get('chooseParameter')?.disable({ emitEvent: false });
    } else if (this.source === 'ASSESSMENT_TASK_EDIT' && (editTaskAttachedTo === AssessmentAttachedTo.ASSESSMENT || editTaskAttachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR)) {
      this.taskForm.get('chooseParameter')?.disable({ emitEvent: false });
      this.taskForm.get('linkToExistingRisk')?.disable({ emitEvent: false });
    } else if (this.source === 'QUESTION_AND_RESPONSE' && !this.isEditMode && this.assessmentId) {
      this.loadAssessmentTaskRisks();
    }
    if (this.source === 'QUESTION_AND_RESPONSE') {
      this.taskForm.get('chooseParameter')?.setValue(true);
      this.taskForm.get('chooseParameter')?.disable();
      this.taskForm.get('sectionId')?.disable();
      this.taskForm.get('questionId')?.disable();
    }
    setTimeout(async () => {
      if (this.isEditMode && this.task) {
        await this.populateFormForEdit();
      }
    }, 150);
  }
  private initializeDsrFormRequestedUser(): void {
    if (this.dsrRequestDetails?.dsrFormRequestedUserDetails) {
      this.dsrFormRequestedUser.set(this.dsrRequestDetails.dsrFormRequestedUserDetails);
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestRid'] && this.requestRid && this.requestRid !== this.attachmentsLoadedForRequestRid) {
      this.extractDsrFieldDisplayKeys();
      this.initializeDisplayInfoGroups();
    }
    if (changes['dsrRequestDetails'] && this.dsrRequestDetails) {
      this.initializeDsrFormRequestedUser();
      this.extractDsrFieldDisplayKeys();
      if (this.requestRid) {
        this.initializeDisplayInfoGroups();
      }
    }
    if (changes['task'] && this.task && this.isEditMode) {
      this.extractDsrFieldDisplayKeys();
      if (this.requestRid) {
        this.initializeDisplayInfoGroups();
      }
      setTimeout(async () => {
        await this.populateFormForEdit();
      }, 100);
    }
    if (changes['isEditMode'] && !this.isEditMode && changes['isEditMode'].previousValue) {
      this.resetForm();
    }
  }
  private resetForm(): void {
    if (this.taskForm) {
      this.taskForm.reset({
        title: '',
        description: '',
        dueDate: null,
        priority: 'MEDIUM',
        effortLevel: null,
        labels: [],
        assigneeType: 'INTERNAL',
        assignee: '',
        externalEmail: '',
        displayInfo: [],
        sectionId: null,
        questionId: null,
        taskType: null,
        linkToExistingRisk: false,
        riskIdField: this.isRiskContext ? this.riskId : '',
        chooseParameter: false,
      });
      this.editorInitialContent = '';
      this.uploadedFiles.set([]);
      this.existingDocumentAttached = [];
      this.deletedDocumentAttached = [];
      this.existingTaskLabelMappings = [];
      this.assigneeTypeSignal.set('INTERNAL');
      this.internalUserControl.setValue(null);
      this.internalUserCreated.set(null);
      this.internalUserError.set(null);
      this.internalUserSearchTerm.set('');
      this.externalUserControl.setValue(null);
      this.externalUserCreated.set(null);
      this.externalUserError.set(null);
      this.externalUserSearchTerm.set('');
      this.externalUser.set(null);
      this.availableLabels = [];
      this.filteredLabelsList = [];
      this.formHasChanges.set(false);
      this.initialFormValues = null;
      this.attachmentsLoadedForRequestRid = null;
      this.attachmentsPageNo = 1;
      this.attachmentsTotalPages = 0;
    }
  }

  private extractDsrFieldDisplayKeys(): void {
    let keys: Array<{ key: string; value: string; displayFor?: string }> = [];

    if (this.dsrRequestDetails?.dsrFieldDisplayKeys && Array.isArray(this.dsrRequestDetails.dsrFieldDisplayKeys)) {
      keys = this.dsrRequestDetails.dsrFieldDisplayKeys;
    }
    else if (this.task?.dsrDetail?.dsrFieldDisplayKeys && Array.isArray(this.task.dsrDetail.dsrFieldDisplayKeys)) {
      keys = this.task.dsrDetail.dsrFieldDisplayKeys;
    }

    this.dsrFieldDisplayKeysFromApi = keys;
  }

  private getIsRequestedByThirdParty(): boolean {
    if (this.isEditMode && this.task?.dsrDetail) {
      return this.task.dsrDetail.isRequestedByThirdParty ?? false;
    }
    if (this.dsrRequestDetails?.dsrDetails) {
      return this.dsrRequestDetails.dsrDetails.isRequestedByThirdParty ?? false;
    }
    return false;
  }

  private initializeDisplayInfoGroups(): void {
    const fieldsChildren: Array<{ value: string; label: string; group: string }> =
      this.dsrFieldDisplayKeysFromApi.map(field => ({
        value: field.key,
        label: field.value,
        group: 'FIELDS'
      }));

    const shouldReloadAttachments = this.requestRid !== this.attachmentsLoadedForRequestRid;
    const existingAttachments = !shouldReloadAttachments
      ? (this.displayInfoGroups?.find(g => g.value === 'ATTACHMENTS')?.children || [])
      : [];

    this.displayInfoGroups = [
      {
        name: 'Fields',
        value: 'FIELDS',
        children: fieldsChildren
      },
      {
        name: 'Attachments',
        value: 'ATTACHMENTS',
        children: shouldReloadAttachments ? [] : existingAttachments
      }
    ];
    if (shouldReloadAttachments) {
      this.attachmentsPageNo = 1;
      this.attachmentsTotalPages = 0;
      this.loadAttachmentsList(1);
    } else {
      this.updateFlattenedDisplayInfoOptions();
    }
  }
  async loadAttachmentsList(pageNo: number = this.attachmentsPageNo): Promise<void> {
    if (!this.requestRid) {
      console.warn('[Pagination] loadAttachmentsList: No requestRid available');
      return;
    }
    if (this.isLoadingAttachments) {
      return;
    }
    this.isLoadingAttachments = true;
    const params = { page: pageNo, size: this.attachmentsPageSize };
    try {
      const data = await this.apiHelperService.getDocumentList(this.requestRid, params);
      if (data) {
        const newAttachments = (data.documents || []).map((doc: any) => {
          const fileName = doc.name ? this.getFileNameFromKey(doc.name) : 'Unnamed Document';
          return {
            value: doc.url || doc.documentUrl || doc.name,
            label: fileName,
            group: 'ATTACHMENTS'
          };
        });
        newAttachments.sort((a: any, b: any) => a.label.localeCompare(b.label));
        const attachmentsGroup = this.displayInfoGroups.find(g => g.value === 'ATTACHMENTS');
        if (attachmentsGroup) {
          const beforeCount = attachmentsGroup.children.length;
          if (pageNo === 1) {
            attachmentsGroup.children = newAttachments;
          } else {
            const combined = [...attachmentsGroup.children, ...newAttachments];
            attachmentsGroup.children = combined.sort((a: any, b: any) => a.label.localeCompare(b.label));
          }
          const afterCount = attachmentsGroup.children.length;
        }
        this.attachmentsPageNo = pageNo;
        this.attachmentsTotalPages = data.totalPages || 0;
        if (pageNo === 1) {
          this.attachmentsLoadedForRequestRid = this.requestRid;
        }

        this.addDsrDocumentsToAttachments();

        this.updateFlattenedDisplayInfoOptions();
      }
    } catch (error) {
      console.error('[Pagination] Error loading attachments:', error);
    } finally {
      this.isLoadingAttachments = false;
    }
  }

  private addDsrDocumentsToAttachments(): void {
    if (!this.isEditMode || !this.task?.dsrDetail?.documentsList) {
      return;
    }

    const attachmentsGroup = this.displayInfoGroups.find(g => g.value === 'ATTACHMENTS');
    if (!attachmentsGroup) {
      return;
    }

    const dsrDocuments = this.task.dsrDetail.documentsList || [];
    const existingValues = new Set(attachmentsGroup.children.map((child: any) => child.value));

    dsrDocuments.forEach((doc: any) => {
      const docValue = doc.documentUrl || doc.url || doc.name || '';
      const docLabel = doc.documentName || this.getFileNameFromKey(doc.documentUrl) || this.getFileNameFromKey(doc.name) || 'Unnamed Document';

      if (docValue && !existingValues.has(docValue)) {
        attachmentsGroup.children.push({
          value: docValue,
          label: docLabel,
          group: 'ATTACHMENTS'
        });
        existingValues.add(docValue);
      }
    });

    attachmentsGroup.children.sort((a: any, b: any) => a.label.localeCompare(b.label));
  }
  private updateFlattenedDisplayInfoOptions(): void {
    const flattened: FlatDisplayInfoOption[] = [];
    this.displayInfoGroups.forEach(group => {
      const shouldShowGroup = group.value === 'ATTACHMENTS' || (group.children && group.children.length > 0);
      if (shouldShowGroup) {
        flattened.push({
          value: group.value,
          label: group.name,
          isGroup: true
        });
        if (group.children && group.children.length > 0) {
          group.children.forEach(child => {
            flattened.push({
              value: child.value,
              label: child.label,
              isGroup: false,
              groupValue: group.value
            });
          });
        }
      }
    });
    this.allFlattenedOptions = flattened;
    this.flattenedDisplayInfoOptions = [...flattened];
  }
  onDisplayInfoPanelScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const scrollHeight = target.scrollHeight;
    const scrollTop = target.scrollTop;
    const clientHeight = target.clientHeight;
    const bottomReached = scrollHeight - scrollTop <= clientHeight + 5;
    if (bottomReached &&
      this.attachmentsPageNo < this.attachmentsTotalPages &&
      !this.isLoadingAttachments &&
      this.attachmentsLoadedForRequestRid === this.requestRid) {
      this.loadAttachmentsList(this.attachmentsPageNo + 1);
    }
  }
  ngOnDestroy(): void {
    this.removeScrollListener();
    this.removeSectionScrollListener();
    this.removeRiskScrollListener();
    this.removeDrawerScrollCloseListener();
    if (this.dropdownCloseTimeout) {
      clearTimeout(this.dropdownCloseTimeout);
    }
    if (this.dropdownOpenDebounceTimeout) {
      clearTimeout(this.dropdownOpenDebounceTimeout);
    }
    if (this._initialValuesTimer) {
      clearTimeout(this._initialValuesTimer);
    }
    if (this._userLoadTimer) {
      clearTimeout(this._userLoadTimer);
    }
    this.removeClickOutsideListener();
  }
  onDisplayInfoDropdownOpened(): void {
    this.isDisplayInfoDropdownOpen = true;
    this.displayInfoSearchTerm = '';
    this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
    this.addScrollListener();
    if (!this.displayInfoPanelScrollListener) {
      this.displayInfoPanelScrollListener = this.onDisplayInfoPanelScroll.bind(this);
    }
    setTimeout(() => {
      let panel = document.querySelector('.display-info-autocomplete-panel .mat-mdc-autocomplete-panel');
      if (!panel) {
        panel = document.querySelector('.cdk-overlay-pane.display-info-autocomplete-panel .mat-mdc-autocomplete-panel');
      }
      if (!panel) {
        panel = document.querySelector('.display-info-autocomplete-panel');
      }
      if (panel) {
        panel.addEventListener('scroll', this.displayInfoPanelScrollListener, { passive: true });
      }
    }, 150);
  }
  onDisplayInfoDropdownClosed(): void {
    this.isDisplayInfoDropdownOpen = false;
    this.displayInfoSearchTerm = '';
    this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
    let panel = document.querySelector('.display-info-autocomplete-panel .mat-mdc-autocomplete-panel');
    if (!panel) {
      panel = document.querySelector('.cdk-overlay-pane.display-info-autocomplete-panel .mat-mdc-autocomplete-panel');
    }
    if (!panel) {
      panel = document.querySelector('.display-info-autocomplete-panel');
    }
    if (panel && this.displayInfoPanelScrollListener) {
      panel.removeEventListener('scroll', this.displayInfoPanelScrollListener);
    }
    if (!this.isLabelsDropdownOpen && !this.isInternalUserDropdownOpen) {
      this.removeScrollListener();
    }
  }
  openDisplayInfoDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.displayInfoTrigger) return;
    if (this.isDisplayInfoDropdownOpen) {
      this.displayInfoTrigger.closePanel();
      this.isDisplayInfoDropdownOpen = false;
      this.displayInfoSearchTerm = '';
      this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
      if (!this.isLabelsDropdownOpen && !this.isInternalUserDropdownOpen) {
        this.removeScrollListener();
      }
    } else {
      this.displayInfoTrigger.openPanel();
    }
  }
  onLabelsDropdownOpened(): void {
    this.isLabelsDropdownOpen = true;
    this.addScrollListener();
  }
  onLabelsDropdownClosed(): void {
    this.isLabelsDropdownOpen = false;
    if (!this.isDisplayInfoDropdownOpen && !this.isInternalUserDropdownOpen) {
      this.removeScrollListener();
    }
  }
  openLabelsDropdown(): void {
    if (this.labelInputTrigger) {
      if (this.labelInputTrigger.panelOpen) {
        this.labelInputTrigger.closePanel();
      } else {
        this.labelInputTrigger.openPanel();
      }
    }
  }
  onInternalUserDropdownOpened(): void {
    if (this.preventDropdownReopen) {
      this.internalUserTrigger?.closePanel();
      return;
    }
    if (this.showCreateInternalUser() && !this.internalUserCreated()) {
      this.internalUserTrigger?.closePanel();
      return;
    }
    this.isInternalUserDropdownOpen = true;
    this.addScrollListener();
    this.focusInternalUserInput();
  }
  onInternalUserDropdownClosed(): void {
    this.isInternalUserDropdownOpen = false;
    if (!this.isDisplayInfoDropdownOpen && !this.isLabelsDropdownOpen && !this.isExternalUserDropdownOpen) {
      this.removeScrollListener();
    }
  }
  onExternalUserDropdownOpened(): void {
    this.isExternalUserDropdownOpen = true;
    this.addScrollListener();
  }
  onExternalUserDropdownClosed(): void {
    this.isExternalUserDropdownOpen = false;
    if (!this.isDisplayInfoDropdownOpen && !this.isLabelsDropdownOpen && !this.isInternalUserDropdownOpen) {
      this.removeScrollListener();
    }
  }
  private addScrollListener(): void {
    const drawerContainer = document.querySelector('.create-task-drawer-wrapper .flex-1.overflow-auto');
    if (drawerContainer && !this.scrollListener) {
      this.scrollListener = () => {
        if (this.isDisplayInfoDropdownOpen && this.displayInfoTrigger) {
          this.displayInfoTrigger.closePanel();
          this.isDisplayInfoDropdownOpen = false;
        }
        if (this.isLabelsDropdownOpen && this.labelInputTrigger) {
          this.labelInputTrigger.closePanel();
          this.isLabelsDropdownOpen = false;
        }
        if (this.isInternalUserDropdownOpen && this.internalUserTrigger) {
          this.internalUserTrigger.closePanel();
          this.isInternalUserDropdownOpen = false;
        }
        if (this.isExternalUserDropdownOpen && this.externalUserTrigger) {
          this.externalUserTrigger.closePanel();
          this.isExternalUserDropdownOpen = false;
        }
      };
      drawerContainer.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }
  private removeScrollListener(): void {
    const drawerContainer = document.querySelector('.create-task-drawer-wrapper .flex-1.overflow-auto');
    if (drawerContainer && this.scrollListener) {
      drawerContainer.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }
  initializeForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      dueDate: [null],
      priority: ['MEDIUM'],
      effortLevel: [null, Validators.required],
      labels: [[]],
      assigneeType: ['INTERNAL', Validators.required],
      assignee: ['', Validators.required],
      externalEmail: ['', [Validators.email]],
      displayInfo: [[]],
      sectionId: [null],
      questionId: [null],
      taskType: [null],
      linkToExistingRisk: [false],
      riskIdField: [{ value: '', disabled: true }],
      chooseParameter: [false],
    });
    this.assigneeTypeSignal.set('INTERNAL');
    if (this.isRiskContext && this.riskId) {
      this.taskForm.get('riskIdField')?.setValue(this.riskId);
    }
  }

  private autoAssignRespondentFromAssessment(): void {
    const respondent = this.assessmentService.currentRespondentUser;
    if (!respondent) return;

    const userType = respondent.userType || '';
    const assigneeType = userType === 'EXTERNAL_USER' ? 'EXTERNAL' : 'INTERNAL';
    const userId = respondent.applicationUserId ?? respondent.userId;
    if (!userId) return;

    const normalizedRespondent = { ...respondent, applicationUserId: userId };
    this.autoAssignedRespondent = normalizedRespondent;

    this.isPopulatingForm = true;

    this.taskForm.get('assigneeType')?.setValue(assigneeType, { emitEvent: false });
    this.onAssigneeTypeChange(assigneeType);

    if (assigneeType === 'INTERNAL') {
      this.internalUserControl.setValue(normalizedRespondent, { emitEvent: false });
    } else {
      this.externalUserControl.setValue(normalizedRespondent, { emitEvent: false });
      this.externalUser.set(normalizedRespondent);
    }

    this.taskForm.patchValue({
      assignee: userId.toString(),
      externalEmail: respondent.email || ''
    });

    this.taskForm.get('assignee')?.updateValueAndValidity();
    this.taskForm.updateValueAndValidity();

    this.isPopulatingForm = false;

    this.formHasChanges.set(true);
  }

  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      if (control && control.errors) {
        errors[key] = {
          errors: control.errors,
          value: control.value,
          valueType: typeof control.value
        };
      }
    });
    return Object.keys(errors).length > 0 ? errors : null;
  }
  async populateFormForEdit(): Promise<void> {

    if (!this.task) {
      console.error('populateFormForEdit: No task data provided');
      return;
    }
    if (this.questionId > 0) {
      this.preselectQuestionContext();
      if (this.selectedSectionQuestions.length === 0) {
        const fallbackTitle = (this.task as any)?.questionTitle || '';
        this.selectedSectionQuestions = [{ id: this.questionId, text: fallbackTitle }];
      }
    }
    if (!this.taskForm) {
      console.error('populateFormForEdit: Form not initialized yet');
      return;
    }
    this.isPopulatingForm = true;
    this.formHasChanges.set(false);


    if (this.requestRid && this.requestRid !== this.attachmentsLoadedForRequestRid) {
      await this.loadAttachmentsList(1);
    }

    let parsedDueDate = null;
    if (this.task.dueDate && this.task.dueDate !== 'N/A') {
      try {
        parsedDueDate = new Date(this.task.dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = this.task.dueDate.match(ddmmyyyyRegex);
          if (match) {
            const [, day, month, year] = match;
            parsedDueDate = new Date(`${year}-${month}-${day}`);
          }
          if (isNaN(parsedDueDate.getTime())) {
            console.warn('[DEBUG] populateFormForEdit - Could not parse due date, setting to null:', this.task.dueDate);
            parsedDueDate = null;
          }
        }
      } catch (error) {
        console.error('Error parsing due date:', error);
        parsedDueDate = null;
      }
    } else {
      console.warn('[DEBUG] populateFormForEdit - No due date in task data or dueDate is N/A');
    }

    this.descriptionChangedByUser = false;
    let descriptionHtml = this.task.description || '';
    if (descriptionHtml) {
      this.editorInitialContent = descriptionHtml;
    }

    this.taskForm.patchValue({
      title: this.task.title || '',
      description: descriptionHtml,
      dueDate: parsedDueDate,
      priority: this.task.priority || null,
      effortLevel: this.task.levelOfEffort || null,
    });


    const assigneeType = this.mapAssigneeTypeFromApi(this.task.assignToUserType || 'INTERNAL_USER');


    this.taskForm.patchValue({ assigneeType });
    this.assigneeTypeSignal.set(assigneeType);

    if (assigneeType === 'INTERNAL' && this.task.assignToUserId) {
      this.taskForm.patchValue({ assignee: this.task.assignToUserId.toString() });

      if (this._userLoadTimer) {
        clearTimeout(this._userLoadTimer);
      }
      this._userLoadTimer = setTimeout(async () => {
        await this.loadInternalUsers();
        const user = this.userMasterList().find(u => u.applicationUserId === this.task.assignToUserId);
        if (user) {
          this.internalUserControl.setValue(user);
        } else {
          console.warn('[DEBUG] populateFormForEdit - User not found in userMasterList');
        }
        this._userLoadTimer = null;
      }, 200);
    } else if (assigneeType === 'EXTERNAL' && this.task.assignToUserId) {
      this.loadExternalUserForEdit();
    } else if (assigneeType === 'DATA_SUBJECT') {
    }
    let labelSource: any[] = [];
    if (this.task.taskLabelMappings && Array.isArray(this.task.taskLabelMappings)) {
      this.existingTaskLabelMappings = this.task.taskLabelMappings.map((mapping: any) => ({
        mappingId: mapping.mappingId || mapping.id || 0,
        labelId: mapping.labelId || mapping.id || 0,
        labelName: mapping.labelName || mapping.name || '',
        taskId: this.task.taskId || 0,
        isDeleted: false
      }));
      labelSource = this.task.taskLabelMappings.map((mapping: any) => ({
        id: mapping.labelId || mapping.id || 0,
        name: mapping.labelName || mapping.name || '',
        mappingId: mapping.mappingId || mapping.id || 0,
        isDeleted: false
      }));
    } else if (this.task.labelMappings && Array.isArray(this.task.labelMappings)) {
      this.existingTaskLabelMappings = this.task.labelMappings.map((label: any) => ({
        mappingId: label.mappingId || label.id || 0,
        labelId: label.id || 0,
        labelName: label.labelName || label.name || '',
        taskId: this.task.taskId || 0,
        isDeleted: false
      }));
      labelSource = this.task.labelMappings.map((label: any) => ({
        id: label.id || 0,
        name: label.labelName || label.name || '',
        mappingId: label.mappingId || label.id || 0,
        isDeleted: false
      }));
    } else if (this.task.taskDetails?.labels) {
      labelSource = this.task.taskDetails.labels.map((label: any) => ({
        id: label.id || 0,
        name: label.name || label,
        isDeleted: label.isDeleted || false
      }));
      this.existingTaskLabelMappings = [];
    }
    this.taskForm.patchValue({ labels: labelSource });

    for (const label of labelSource) {
      if (!this.availableLabels.some((l: any) => l.name.toLowerCase() === label.name.toLowerCase())) {
        this.availableLabels.push({ id: label.id || 0, name: label.name, isDeleted: false });
      }
    }
    this.onSearchLabels(this.labelSearchTerm);
    const displayInfo: any[] = [];
    const visibleFields = this.task.visibleFieldNames || this.task.taskDetails?.visibleFieldNames || [];
    const fieldNames = Array.isArray(visibleFields) ? visibleFields : [];

    const loadedAttachments = this.displayInfoGroups?.find(g => g.value === 'ATTACHMENTS')?.children || [];
    const loadedFields = this.displayInfoGroups?.find(g => g.value === 'FIELDS')?.children || [];

    fieldNames.forEach((itemValue: string) => {
      const field = loadedFields.find((f: any) => f.value === itemValue);
      if (field) {
        displayInfo.push(field);
        return;
      }

      const loadedAttachment = loadedAttachments.find((att: any) =>
        att.value === itemValue ||
        (att.value && itemValue && att.value.includes(itemValue)) ||
        (itemValue && att.value && itemValue.includes(att.value))
      );
      if (loadedAttachment) {
        displayInfo.push(loadedAttachment);
      } else if (this.documentsList && Array.isArray(this.documentsList)) {
        const doc = this.documentsList.find(d =>
          d.url === itemValue ||
          d.fullPath === itemValue ||
          d.name === itemValue ||
          (d.fullPath && d.fullPath.includes(itemValue)) ||
          (itemValue && itemValue.includes(d.name))
        );
        if (doc) {
          displayInfo.push({
            value: doc.fullPath || doc.url || itemValue,
            label: doc.name,
            group: 'ATTACHMENTS'
          });
        } else if (this.task.dsrDetail?.documentsList && Array.isArray(this.task.dsrDetail.documentsList)) {
          const dsrDoc = this.task.dsrDetail.documentsList.find((d: any) =>
            d.documentUrl === itemValue ||
            d.url === itemValue ||
            d.name === itemValue ||
            (d.documentUrl && d.documentUrl.includes(itemValue)) ||
            (itemValue && itemValue.includes(d.documentName || d.name || ''))
          );
          if (dsrDoc) {
            displayInfo.push({
              value: dsrDoc.documentUrl || dsrDoc.url || itemValue,
              label: dsrDoc.documentName || this.getFileNameFromKey(dsrDoc.documentUrl) || this.getFileNameFromKey(dsrDoc.name) || 'Unnamed Document',
              group: 'ATTACHMENTS'
            });
          }
        }
      }
    });

    let documentsAttached: any[] = [];
    if (this.task.documentAttached && Array.isArray(this.task.documentAttached) && this.task.documentAttached.length > 0) {
      documentsAttached = this.task.documentAttached;
    } else if (this.task.documentsAttached && Array.isArray(this.task.documentsAttached) && this.task.documentsAttached.length > 0) {
      documentsAttached = this.task.documentsAttached;
    } else if (this.task.taskDetails?.documentAttached && Array.isArray(this.task.taskDetails.documentAttached) && this.task.taskDetails.documentAttached.length > 0) {
      documentsAttached = this.task.taskDetails.documentAttached;
    } else if (this.task.taskDetails?.documentsAttached && Array.isArray(this.task.taskDetails.documentsAttached) && this.task.taskDetails.documentsAttached.length > 0) {
      documentsAttached = this.task.taskDetails.documentsAttached;
    }

    this.existingDocumentAttached = documentsAttached;
    this.deletedDocumentAttached = [];

    if (documentsAttached && documentsAttached.length > 0) {
      documentsAttached.forEach((doc: any) => {
        const docValue = doc.url || doc.documentUrl || doc.name || doc.fileKey || '';
        const docLabel = doc.documentName || doc.name || this.getFileNameFromKey(doc.documentUrl) || 'Unnamed Document';
        if (docValue && !displayInfo.some(item => item.value === docValue)) {
          displayInfo.push({
            value: docValue,
            label: docLabel,
            group: 'ATTACHMENTS'
          });
        }
      });
    }

    if (this.task.dsrDetail?.documentsList && Array.isArray(this.task.dsrDetail.documentsList) && this.task.dsrDetail.documentsList.length > 0) {
      this.task.dsrDetail.documentsList.forEach((doc: any) => {
        const docValue = doc.documentUrl || doc.url || doc.name || '';
        const docLabel = doc.documentName || doc.name || this.getFileNameFromKey(doc.documentUrl) || 'Unnamed Document';
        if (docValue && !displayInfo.some(item => item.value === docValue)) {
          displayInfo.push({
            value: docValue,
            label: docLabel,
            group: 'ATTACHMENTS'
          });
        }
      });
    }

    this.taskForm.patchValue({ displayInfo });

    const existingFiles = this.existingDocumentAttached.map(doc => {
      return {
        file: null as any,
        fileName: doc.documentName || this.getFileNameFromKey(doc.documentUrl) || 'Unnamed Document',
        fileKey: doc.documentUrl || doc.url || doc.fileKey || '',
        presignedUrl: undefined,
        fileSize: doc.fileSize || 0,
        eTag: undefined,
        serverPath: undefined,
        isExisting: true
      };
    });

    this.uploadedFiles.set(existingFiles);
    this.taskForm.markAsPristine();
    this.taskForm.markAsUntouched();



    if (this._initialValuesTimer) {
      clearTimeout(this._initialValuesTimer);
    }
    this._initialValuesTimer = setTimeout(() => {

      if (this.isEditMode && this.task?.assignToUserId) {
        const expectedAssignee = this.task.assignToUserId.toString();
        const currentAssignee = this.taskForm.get('assignee')?.value;
        if (currentAssignee !== expectedAssignee) {
          this.taskForm.patchValue({ assignee: expectedAssignee }, { emitEvent: false });
        }
      }

      const rawFormValue = this.taskForm.getRawValue();

      this.initialFormValues = JSON.parse(JSON.stringify(rawFormValue));
      this.initialFormValues.description = this.descriptionControl.value || '';
      this.initialUploadedFilesCount = this.uploadedFiles().length + this.existingDocumentAttached.length;

      this.taskForm.updateValueAndValidity({ emitEvent: false });

      this.isPopulatingForm = false;
      this.descriptionChangedByUser = false;
      this.detectChanges();
      this._initialValuesTimer = null;

    }, 250);
  }
  get hasFormChanges(): boolean {
    if (!this.isEditMode) return true;
    if (!this.initialFormValues) return false;

    const currentFileCount = this.uploadedFiles().length + this.existingDocumentAttached.length;
    if (currentFileCount !== this.initialUploadedFilesCount) return true;

    const currentEditorHtml = (this.descriptionControl.value || '').trim();
    const initialEditorHtml = (this.initialFormValues.description || '').trim();
    if (currentEditorHtml !== initialEditorHtml) return true;

    const currentValues = this.taskForm.getRawValue();
    const fieldsToCompare = [
      'title', 'dueDate', 'priority', 'effortLevel', 'assigneeType',
      'assignee', 'externalEmail', 'sectionId', 'questionId', 'taskType',
      'linkToExistingRisk', 'riskIdField', 'chooseParameter'
    ];
    for (const field of fieldsToCompare) {
      if (JSON.stringify(currentValues[field]) !== JSON.stringify(this.initialFormValues[field])) {
        return true;
      }
    }

    if (JSON.stringify(currentValues.labels) !== JSON.stringify(this.initialFormValues.labels)) return true;
    if (JSON.stringify(currentValues.displayInfo) !== JSON.stringify(this.initialFormValues.displayInfo)) return true;

    return false;
  }

  private detectChanges(): void {
    this.formHasChanges.set(this.hasFormChanges);
  }
  private mapAssigneeTypeFromApi(apiType: string): string {
    const mapping: { [key: string]: string } = {
      'INTERNAL_USER': 'INTERNAL',
      'EXTERNAL_USER': 'EXTERNAL',
      'DSR_FORM_USER': 'DATA_SUBJECT'
    };
    return mapping[apiType] || 'INTERNAL';
  }
  private async loadExternalUserForEdit(): Promise<void> {
    if (!this.task.assignToUserId) return;
    try {
      this.externalUserLoading.set(true);
      await this.loadInternalUsers();
      const user = this.userMasterList().find(u => u.applicationUserId === this.task.assignToUserId && u.userType === 'EXTERNAL_USER');
      if (user) {
        this.externalUserControl.setValue(user);
        this.externalUser.set(user);
        this.taskForm.patchValue({ externalEmail: user.email || this.task.assigneeToUserName });
      } else if (this.task.assigneeToUserName) {
        this.taskForm.patchValue({ externalEmail: this.task.assigneeToUserName });
        this.externalUser.set({
          applicationUserId: this.task.assignToUserId,
          email: this.task.assigneeToUserName
        });
      }
    } catch (error) {
      console.error('Error loading external user:', error);
    } finally {
      this.externalUserLoading.set(false);
    }
  }
  private getFileNameFromKey(fileKey: string): string {
    if (!fileKey) return 'Unknown File';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }
  private setupAssigneeSubscriptions(): void {
    this.taskForm.valueChanges.subscribe(() => {
      this.isFormValid.set(this.taskForm.valid);
      if (!this.isPopulatingForm) {
        this.detectChanges();
      }
    });

    this.taskForm.statusChanges.subscribe((status) => {
      this.isFormValid.set(status === 'VALID');
    });

    this.taskForm.get('assigneeType')?.valueChanges.subscribe((assigneeType: string) => {
      this.onAssigneeTypeChange(assigneeType);
    });

    this.taskForm.get('linkToExistingRisk')?.valueChanges.subscribe((checked: boolean) => {
      const riskIdControl = this.taskForm.get('riskIdField');
      if (checked && this.isRiskContext) {
        riskIdControl?.enable({ emitEvent: false });
        if (this.riskId) {
          const numericId = parseInt(this.riskId.replace('R-', ''), 10);
          if (!isNaN(numericId)) {
            riskIdControl?.setValue(numericId, { emitEvent: false });
          }
        }
        if (this.source === 'ASSESSMENT_TASK' || this.source === 'ASSESSMENT_TASK_EDIT') {
          riskIdControl?.setValidators([Validators.required]);
          riskIdControl?.updateValueAndValidity({ emitEvent: false });
          if (this.effectiveRisks.length === 0 && this.assessmentId) {
            this.loadAssessmentTaskRisks();
          }
        }
        this.cdr.detectChanges();
      } else {
        riskIdControl?.disable({ emitEvent: false });
        riskIdControl?.setValue('', { emitEvent: false });
        if (this.source === 'ASSESSMENT_TASK' || this.source === 'ASSESSMENT_TASK_EDIT') {
          riskIdControl?.clearValidators();
          riskIdControl?.updateValueAndValidity({ emitEvent: false });
        }
      }
    });
    this.taskForm.get('chooseParameter')?.valueChanges.subscribe((checked: boolean) => {
      if (this.source === 'ASSESSMENT_TASK' || this.source === 'ASSESSMENT_TASK_EDIT') {
        const sectionCtrl = this.taskForm.get('sectionId');
        const questionCtrl = this.taskForm.get('questionId');
        if (checked) {
          sectionCtrl?.setValidators([Validators.required]);
          questionCtrl?.setValidators([Validators.required]);
          sectionCtrl?.updateValueAndValidity({ emitEvent: false });
          questionCtrl?.updateValueAndValidity({ emitEvent: false });
          if (this.drawerTaskSections.length === 0 && this.assessmentId && this.source !== 'ASSESSMENT_TASK_EDIT') {
            this.loadTaskDrawerSections();
          }
        } else {
          sectionCtrl?.clearValidators();
          questionCtrl?.clearValidators();
          sectionCtrl?.setValue(null, { emitEvent: false });
          questionCtrl?.setValue(null, { emitEvent: false });
          sectionCtrl?.updateValueAndValidity({ emitEvent: false });
          questionCtrl?.updateValueAndValidity({ emitEvent: false });
          this.taskAvailableQuestions = [];
        }
      }
    });
    this.internalUserControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe((value: User | string | null) => {
      if (typeof value === 'object' && value && value.applicationUserId && this.isEditMode) {
        const expectedAssignee = value.applicationUserId.toString();
        const currentAssignee = this.taskForm.get('assignee')?.value;
        if (currentAssignee !== expectedAssignee) {
          this.taskForm.patchValue({ assignee: expectedAssignee }, { emitEvent: false });
          if (this.initialFormValues) {
            this.initialFormValues.assignee = expectedAssignee;
          }
        }
      }
      if (typeof value === 'string') {
        this.internalUserSearchTerm.set(value);
        if (value && value.trim().length > 0 && this.internalUserCreated()) {
          this.internalUserCreated.set(null);
          this.internalUserError.set(null);
        }

        if (!this.isEditMode) {
          const currentAssignee = this.taskForm.get('assignee')?.value;

          const isAutoAssigned =
            this.autoAssignedRespondent &&
            currentAssignee === this.autoAssignedRespondent.applicationUserId?.toString();

          if (currentAssignee && !isAutoAssigned) {
            const assignedUser =
              this.userMasterList().find(
                (u: User) => u.applicationUserId?.toString() === currentAssignee
              ) ?? null;

            if (assignedUser) {
              const displayName = this.displayInternalUser(assignedUser);

              if (value.trim().toLowerCase() === displayName.trim().toLowerCase()) {
                this.internalUserControl.setValue(assignedUser, { emitEvent: false });
                return;
              }
            }

            this.taskForm.patchValue({ assignee: '' });
          }
        }
      }
      if (value === null || value === undefined) {
        this.internalUserSearchTerm.set('');
      }
    });
    this.externalUserControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe((value: User | string | null) => {
      if (typeof value === 'object' && value && value.applicationUserId) {
        const expectedAssignee = value.applicationUserId.toString();
        const currentAssignee = this.taskForm.get('assignee')?.value;
        if (currentAssignee !== expectedAssignee) {
          this.taskForm.patchValue({
            assignee: expectedAssignee,
            externalEmail: value.email || ''
          }, { emitEvent: false });
          this.externalUser.set(value);
          if (this.initialFormValues) {
            this.initialFormValues.assignee = expectedAssignee;
            this.initialFormValues.externalEmail = value.email || '';
          }
        }
      }
      if (typeof value === 'string') {
        this.externalUserSearchTerm.set(value);
        if (value && value.trim().length > 0 && this.externalUserCreated()) {
          this.externalUserCreated.set(null);
          this.externalUserError.set(null);
        }
        if (!value || value.trim().length === 0) {
          if (!this.isEditMode) {
            this.taskForm.patchValue({ assignee: '', externalEmail: '' }, { emitEvent: false });
          }
        }
        if (!this.isEditMode && value && value.trim().length > 0) {
          const currentAssignee = this.taskForm.get('assignee')?.value;
          if (currentAssignee) {
            this.taskForm.patchValue({ assignee: '', externalEmail: '' });
          }
        }
      }
      if (value === null || value === undefined) {
        this.externalUserSearchTerm.set('');
      }
    });
    this.taskForm.get('externalEmail')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((email: string | null) => {
      const currentEmail = email?.trim() || '';
      const externalUserEmail = this.externalUser()?.email?.trim() || '';
      if (!currentEmail || (externalUserEmail && currentEmail.toLowerCase() !== externalUserEmail.toLowerCase())) {
        this.externalUser.set(null);
        this.externalUserError.set(null);
        this.isExternalEmailDataSubject.set(false);
        this.isExternalEmailThirdParty.set(false);
        this.taskForm.patchValue({ assignee: '' }, { emitEvent: false });
      }
    });
  }
  async loadInternalUsers(): Promise<void> {
    try {
      this.internalUserLoading.set(true);
      let users: User[];
      if (this.source === 'QUESTION_AND_RESPONSE' || this.source === 'RISK_CREATE_TASK' || this.source === 'RISK_VIEW_DRAWER' || this.source === 'ASSESSMENT_TASK' || this.source === 'ASSESSMENT_TASK_EDIT') {
        const [adminUsers, internalUsers, externalUsers] = await Promise.all([
          this.dbService.getAllAdminUsers(),
          this.dbService.getAllInternalUsers(),
          this.dbService.getAllExternalUsers(),
        ]);
        users = [...adminUsers, ...internalUsers, ...externalUsers];
      } else {
        users = await this.userService.getAllUserMasterList(false, USER_TYPES);
      }
      this.userMasterList.set(users || []);
    } catch (error) {
      console.error('Failed to load internal users:', error);
      this.snackbarService.openSnack('Failed to load internal users');
      this.userMasterList.set([]);
    } finally {
      this.internalUserLoading.set(false);
    }
  }
  onAssigneeTypeChange(assigneeType: string): void {
    this.assigneeTypeSignal.set(assigneeType);
    const assigneeControl = this.taskForm.get('assignee');
    const externalEmailControl = this.taskForm.get('externalEmail');
    if (!this.isPopulatingForm && !this.isEditMode) {
      this.taskForm.patchValue({ assignee: '', externalEmail: '' });
      this.internalUserControl.setValue('');
      this.externalUser.set(null);
      this.externalUserError.set(null);
    } else {
    }
    if (assigneeType !== 'EXTERNAL') {
      this.isExternalEmailDataSubject.set(false);
      this.isExternalEmailThirdParty.set(false);
    }
    if (assigneeType === 'INTERNAL') {
      assigneeControl?.setValidators([Validators.required]);
      externalEmailControl?.clearValidators();
    } else if (assigneeType === 'EXTERNAL') {
      assigneeControl?.clearValidators();
      externalEmailControl?.setValidators([Validators.required, Validators.email]);
    }
    assigneeControl?.updateValueAndValidity();
    externalEmailControl?.updateValueAndValidity();
  }
  onInternalUserSelected(event: any): void {
    const user = event.option.value;
    if (user && typeof user === 'object') {
      this.taskForm.patchValue({ assignee: user.applicationUserId.toString() });
      this.internalUserSearchTerm.set('');
      this.internalUserCreated.set(null);
      this.internalUserError.set(null);
    }
  }
  clearInternalUser(): void {
    this.preventDropdownReopen = true;
    this.taskForm.patchValue({ assignee: '' });
    this.internalUserCreated.set(null);
    this.internalUserError.set(null);
    this.internalUserSearchTerm.set('');
    this.internalUserControl.setValue('');
    this.forceCloseInternalUserDropdown();
    setTimeout(() => {
      this.preventDropdownReopen = false;
    }, this.DROPDOWN_REOPEN_DELAY);
  }
  async onCreateInternalUser(): Promise<void> {
    const email = this.internalUserSearchTerm();
    if (!email || !this.validateEmail(email)) {
      this.snackbarService.openSnack('Please enter a valid email address');
      return;
    }
    this.internalUserLoading.set(true);
    this.internalUserError.set(null);
    try {
      const purpose = this.isRiskContext ? (this.isVendorContext ? USER_PURPOSE.VENDOR_ASSESSMENT_TASK : USER_PURPOSE.ASSESSMENT_TASK) : USER_PURPOSE.DSR_TASK;
      const response = await this.apiHelperService.getOrCreateInternalUser({ email, purpose }).toPromise();
      if (response?.success && response?.data?.applicationUserId) {
        const fullName = response.data.displayName || email.split('@')[0];
        const userEmail = response.data.email || email;
        const userId = response.data.applicationUserId;
        const newUser: User = await this.userService.createAndAddInternalUser(userId, userEmail, fullName);
        if (!newUser.displayName) {
          newUser.displayName = fullName;
        }
        if (!newUser.email) {
          newUser.email = userEmail;
        }
        const currentUsers = this.userMasterList();
        this.userMasterList.set([...currentUsers, newUser]);
        this.taskForm.patchValue({ assignee: newUser.applicationUserId.toString() });
        this.internalUserCreated.set(newUser);
        this.internalUserControl.setValue(newUser, { emitEvent: false });
        this.cdr.detectChanges();
        this.snackbarService.openSnack('Internal user created and assigned successfully');
        setTimeout(() => {
          this.internalUserSearchTerm.set('');
          this.forceCloseInternalUserDropdown();
        }, 100);
      } else {
        throw new Error(response?.message || 'Failed to create internal user');
      }
    } catch (error: any) {
      console.error('Internal user creation failed:', error);
      const errorMessage = error?.message || 'Failed to create internal user';
      this.internalUserError.set(errorMessage);
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.internalUserLoading.set(false);
    }
  }
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  displayInternalUser(user: User | string | null): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const displayValue = user.displayName || user.email || (user as any).name || '';
      if (!displayValue) {
        console.warn('User object has no displayName or email:', user);
      }
      return displayValue;
    }
    return '';
  }
  async onExternalEmailSubmit(): Promise<void> {
    const emailControl = this.taskForm.get('externalEmail');
    const email = emailControl?.value?.trim();
    if (!email) {
      this.snackbarService.openSnack('Please enter an email address');
      return;
    }
    if (emailControl?.hasError('email')) {
      this.snackbarService.openSnack('Please enter a valid email address');
      return;
    }
    const currentUser = this.authService.getUserInfo();
    if (currentUser && currentUser.email && email.toLowerCase() === currentUser.email.toLowerCase()) {
      this.snackbarService.openSnack('You cannot assign a task to yourself');
      return;
    }
    const dsrUser = this.dsrFormRequestedUser();
    const dataSubjectPid = dsrUser?.pid?.trim();
    const isDataSubjectEmail = dataSubjectPid && email.toLowerCase() === dataSubjectPid.toLowerCase();
    const thirdPartyEmail = this.dsrRequestDetails?.dsrDetails?.thirdPartyEmail?.trim();
    const isThirdPartyEmail = thirdPartyEmail && email.toLowerCase() === thirdPartyEmail.toLowerCase();
    try {
      this.externalUserLoading.set(true);
      this.externalUserError.set(null);
      const externalPurpose = this.isRiskContext ? (this.isVendorContext ? USER_PURPOSE.VENDOR_ASSESSMENT_TASK : USER_PURPOSE.ASSESSMENT_TASK) : USER_PURPOSE.DSR_TASK;
      const response = await this.apiHelperService.getOrCreateExternalUser({ email, purpose: externalPurpose }).toPromise();
      if (response && response.data && response.data.applicationUserId) {
        this.externalUser.set(response.data);
        if (isDataSubjectEmail) {
          this.isExternalEmailDataSubject.set(true);
          this.isExternalEmailThirdParty.set(false);
          this.autoAssignDataSubjectUser();
          this.snackbarService.openSnack('Data subject email detected - configured for data subject workflow');
        } else if (isThirdPartyEmail) {
          this.isExternalEmailDataSubject.set(false);
          this.isExternalEmailThirdParty.set(true);
          this.snackbarService.openSnack('Third party email matched - user assigned');
        } else {
          this.isExternalEmailDataSubject.set(false);
          this.isExternalEmailThirdParty.set(false);
          this.snackbarService.openSnack('External user verified successfully');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error getting external user:', error);
      this.externalUserError.set(error?.message || 'Failed to verify external user');
      this.externalUser.set(null);
      this.isExternalEmailDataSubject.set(false);
      this.isExternalEmailThirdParty.set(false);
      this.snackbarService.openSnack('Failed to verify external user');
    } finally {
      this.externalUserLoading.set(false);
    }
  }
  private autoAssignDataSubjectUser(): void {
    const dataSubjectOptions = this.getDataRequestOptions();
    if (dataSubjectOptions.length > 0) {
      const assigneeValue = dataSubjectOptions[0].value;
      this.taskForm.patchValue({ assignee: assigneeValue });
      this.taskForm.get('assignee')?.updateValueAndValidity();
    } else {
      console.warn('No data subject options available for auto-assignment');
    }
  }
  clearExternalUser(): void {
    this.externalUser.set(null);
    this.externalUserError.set(null);
    this.isExternalEmailDataSubject.set(false);
    this.isExternalEmailThirdParty.set(false);
    this.taskForm.patchValue({ externalEmail: '', assignee: '' });
    this.externalUserControl.setValue('');
    this.externalUserSearchTerm.set('');
    this.externalUserCreated.set(null);
  }
  onExternalUserSelected(event: any): void {
    const user = event.option.value;
    if (user && typeof user === 'object') {
      this.taskForm.patchValue({
        assignee: user.applicationUserId.toString(),
        externalEmail: user.email || ''
      });
      this.externalUser.set(user);
      this.externalUserSearchTerm.set('');
      this.externalUserCreated.set(null);
      this.externalUserError.set(null);
    }
  }
  displayExternalUser(user: User | string | null): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      return user.displayName || user.email || '';
    }
    return '';
  }
  onExternalUserInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      if (this.showCreateExternalUser() && !this.externalUserCreated()) {
        event.preventDefault();
        this.onCreateExternalUser();
        return;
      }
    }
  }
  async onCreateExternalUser(): Promise<void> {
    const email = this.externalUserSearchTerm();
    if (!email || !this.validateEmail(email)) {
      this.snackbarService.openSnack('Please enter a valid email address');
      return;
    }
    this.externalUserLoading.set(true);
    this.externalUserError.set(null);
    try {
      const purpose = this.isRiskContext ? (this.isVendorContext ? USER_PURPOSE.VENDOR_ASSESSMENT_TASK : USER_PURPOSE.ASSESSMENT_TASK) : USER_PURPOSE.DSR_TASK;
      const response = await this.apiHelperService.getOrCreateExternalUser({ email, purpose }).toPromise();
      if (response?.success && response?.data?.applicationUserId) {
        const fullName = response.data.displayName || email;
        const userEmail = response.data.email || email;
        const userId = response.data.applicationUserId;
        const newUser: User = await this.userService.createAndAddExternalUser(userId, userEmail, fullName);
        if (!newUser.displayName) {
          newUser.displayName = fullName;
        }
        if (!newUser.email) {
          newUser.email = userEmail;
        }
        const currentUsers = this.userMasterList();
        this.userMasterList.set([...currentUsers, newUser]);
        this.taskForm.patchValue({
          assignee: newUser.applicationUserId.toString(),
          externalEmail: userEmail
        });
        this.externalUser.set(newUser);
        this.externalUserCreated.set(newUser);
        this.externalUserControl.setValue(newUser, { emitEvent: false });
        this.cdr.detectChanges();
        this.snackbarService.openSnack('External user created and assigned successfully');
        setTimeout(() => {
          this.externalUserSearchTerm.set('');
        }, 100);
      } else {
        throw new Error(response?.message || 'Failed to create external user');
      }
    } catch (error: any) {
      console.error('External user creation failed:', error);
      const errorMessage = error?.message || 'Failed to create external user';
      this.externalUserError.set(errorMessage);
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.externalUserLoading.set(false);
    }
  }
  private forceCloseInternalUserDropdown(): void {
    if (this.internalUserTrigger) {
      this.preventDropdownReopen = true;
      this.internalUserTrigger.closePanel();
      this.isInternalUserDropdownOpen = false;
      if (this.dropdownCloseTimeout) {
        clearTimeout(this.dropdownCloseTimeout);
      }
      this.dropdownCloseTimeout = setTimeout(() => {
        this.preventDropdownReopen = false;
      }, this.DROPDOWN_REOPEN_DELAY);
    }
  }
  private focusInternalUserInput(): void {
    setTimeout(() => {
      if (this.internalUserInputRef?.nativeElement) {
        this.internalUserInputRef.nativeElement.focus();
      }
    }, 100);
  }
  private setupClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      return;
    }
    setTimeout(() => {
      this.clickOutsideListener = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const inputElement = this.internalUserInputRef?.nativeElement;
        const panel = document.querySelector('.mat-mdc-autocomplete-panel');
        if (inputElement && !inputElement.contains(target) && panel && !panel.contains(target)) {
          this.forceCloseInternalUserDropdown();
        }
      };
      document.addEventListener('click', this.clickOutsideListener, true);
    }, 100);
  }
  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
      this.clickOutsideListener = null;
    }
  }
  onInternalUserInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.forceCloseInternalUserDropdown();
      return;
    }
    if (event.key === 'Enter') {
      if (this.showCreateInternalUser() && !this.internalUserCreated()) {
        event.preventDefault();
        this.onCreateInternalUser();
        return;
      }
    }
    if (event.key === 'ArrowDown' && !this.isInternalUserDropdownOpen) {
      event.preventDefault();
      this.openInternalUserDropdown();
    }
  }
  openInternalUserDropdown(): void {
    if (this.dropdownOpenDebounceTimeout) {
      clearTimeout(this.dropdownOpenDebounceTimeout);
    }
    this.dropdownOpenDebounceTimeout = setTimeout(() => {
      if (this.internalUserTrigger) {
        this.internalUserTrigger.openPanel();
      }
    }, this.DROPDOWN_OPEN_DEBOUNCE);
  }
  get isMinSearchLengthMet(): boolean {
    const currentValue = this.internalUserControl.value;
    if (typeof currentValue === 'string') {
      return currentValue.trim().length >= this.MIN_SEARCH_LENGTH;
    }
    return false;
  }
  getDropdownAriaLabel(): string {
    const isOpen = this.isInternalUserDropdownOpen;
    const hasResults = this.filteredInternalUsers().length > 0;
    if (isOpen && hasResults) {
      return `${this.filteredInternalUsers().length} users found. Use arrow keys to navigate.`;
    }
    if (isOpen && !hasResults) {
      return 'No users found';
    }
    return 'Click to view all internal users or type to search';
  }
  onInternalUserSelectedEnhanced(event: any): void {
    const user = event.option.value;
    if (user && typeof user === 'object') {
      this.taskForm.patchValue({ assignee: user.applicationUserId.toString() });
      this.internalUserSearchTerm.set('');
      this.internalUserCreated.set(null);
      this.internalUserError.set(null);
      this.forceCloseInternalUserDropdown();
    }
  }
  get debugButtonState(): string {
    return JSON.stringify({
      showCreate: this.showCreateInternalUser(),
      userCreated: !!this.internalUserCreated(),
      searchTerm: this.internalUserSearchTerm(),
      assigneeType: this.assigneeTypeSignal(),
      controlValue: this.internalUserControl.value
    });
  }
  private initializeFlattenedDisplayInfo(): void {
    this.allFlattenedOptions = this.flattenDisplayInfoGroups(this.displayInfoGroups);
    this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
  }
  private flattenDisplayInfoGroups(groups: any[]): FlatDisplayInfoOption[] {
    const flattened: FlatDisplayInfoOption[] = [];
    for (const group of groups) {
      flattened.push({
        value: group.value,
        label: group.name,
        isGroup: true
      });
      for (const child of group.children) {
        flattened.push({
          value: child.value,
          label: child.label,
          isGroup: false,
          groupValue: group.value
        });
      }
    }
    return flattened;
  }
  onSearchDisplayInfo(query: any): void {
    let searchTerm = '';
    if (typeof query === 'string') {
      searchTerm = query;
    } else if (query && typeof query === 'object') {
      searchTerm = (query.label ?? query.value ?? '').toString();
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
      return;
    }
    const matchingGroupValues = new Set<string>();
    const matchingItems: FlatDisplayInfoOption[] = [];
    for (const item of this.allFlattenedOptions) {
      if (!item.isGroup && item.label.toLowerCase().includes(q)) {
        matchingItems.push(item);
        if (item.groupValue) {
          matchingGroupValues.add(item.groupValue);
        }
      }
    }
    const result: FlatDisplayInfoOption[] = [];
    for (const item of this.allFlattenedOptions) {
      if (item.isGroup && matchingGroupValues.has(item.value)) {
        result.push(item);
      } else if (!item.isGroup && matchingItems.includes(item)) {
        result.push(item);
      }
    }
    this.flattenedDisplayInfoOptions = result;
  }
  handleDisplayInfoClick(item: FlatDisplayInfoOption, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (item.isGroup) {
      return;
    }
    this.toggleItemSelection(item);
  }
  onDisplayInfoCheckboxChange(item: FlatDisplayInfoOption, event: any): void {
    if (!item.isGroup) {
      this.toggleItemSelection(item);
    }
  }
  onDisplayInfoOptionSelected(event: any): void {
    event.option.deselect();
  }
  private toggleGroupSelection(groupValue: string): void {
    const group = this.displayInfoGroups.find(g => g.value === groupValue);
    if (!group) return;
    const control = this.taskForm.get('displayInfo');
    const current = control?.value || [];
    if (this.isGroupFullySelected(groupValue)) {
      const updated = current.filter((item: any) =>
        !group.children.some((child: any) => child.value === item.value)
      );
      control?.setValue(updated);
    } else {
      const childrenToAdd = group.children.filter((child: any) =>
        !current.some((c: any) => c.value === child.value)
      );
      control?.setValue([...current, ...childrenToAdd]);
    }
  }
  private toggleItemSelection(item: FlatDisplayInfoOption): void {
    const control = this.taskForm.get('displayInfo');
    const current = control?.value || [];

    if (item.groupValue === 'FIELDS' && item.label === 'All') {
      const allFieldItems = this.dsrFieldDisplayKeysFromApi
        .filter(field => field.key !== 'ALL')
        .map(field => ({
          value: field.key,
          label: field.value,
          group: 'FIELDS'
        }));

      const allFieldsSelected = allFieldItems.every(field =>
        current.some((c: any) => c.value === field.value)
      );

      if (allFieldsSelected) {
        const updated = current.filter((i: any) =>
          !allFieldItems.some(field => field.value === i.value) && i.value !== 'ALL'
        );
        control?.setValue(updated);
      } else {
        const itemsToAdd = allFieldItems.filter(field =>
          !current.some((c: any) => c.value === field.value)
        );
        const allItem = {
          value: 'ALL',
          label: 'All',
          group: 'FIELDS'
        };
        control?.setValue([...current, ...itemsToAdd, allItem]);
      }
      this.formHasChanges.set(true);
      return;
    }

    if (this.isItemSelected(item.value)) {
      const updated = current.filter((i: any) => i.value !== item.value);

      if (item.groupValue === 'FIELDS') {
        const updatedWithoutAll = updated.filter((i: any) => i.value !== 'ALL');
        control?.setValue(updatedWithoutAll);
      } else {
        control?.setValue(updated);
      }
    } else {
      const fullItem = this.findDisplayInfoItem(item.value);
      if (fullItem) {
        const updatedValues = [...current, fullItem];

        if (item.groupValue === 'FIELDS') {
          const allFieldKeys = this.dsrFieldDisplayKeysFromApi
            .filter(field => field.key !== 'ALL')
            .map(field => field.key);

          const allFieldsNowSelected = allFieldKeys.every(fieldKey =>
            updatedValues.some((v: any) => v.value === fieldKey)
          );

          if (allFieldsNowSelected && !updatedValues.some((v: any) => v.value === 'ALL')) {
            updatedValues.push({
              value: 'ALL',
              label: 'All',
              group: 'FIELDS'
            });
          }
        }

        control?.setValue(updatedValues);
      }
    }
    this.formHasChanges.set(true);
  }
  private findDisplayInfoItem(value: string): any {
    for (const group of this.displayInfoGroups) {
      const found = group.children.find((child: any) => child.value === value);
      if (found) return found;
    }
    return null;
  }
  removeDisplayInfo(item: any): void {

    const control = this.taskForm.get('displayInfo');
    if (!control) return;
    const current = control.value || [];
    const updated = current.filter((i: any) => i.value !== item.value);



    control.setValue(updated);
    this.formHasChanges.set(true);

    setTimeout(() => {
      this.detectChanges();
    }, 100);
  }
  isGroupFullySelected(groupValue: string): boolean {
    const group = this.displayInfoGroups.find(g => g.value === groupValue);
    if (!group) return false;
    const current = this.taskForm.get('displayInfo')?.value || [];
    return group.children.every((child: any) =>
      current.some((c: any) => c.value === child.value)
    );
  }
  isGroupPartiallySelected(groupValue: string): boolean {
    const group = this.displayInfoGroups.find(g => g.value === groupValue);
    if (!group) return false;
    const current = this.taskForm.get('displayInfo')?.value || [];
    const selectedCount = group.children.filter((child: any) =>
      current.some((c: any) => c.value === child.value)
    ).length;
    return selectedCount > 0 && selectedCount < group.children.length;
  }
  isItemSelected(value: string): boolean {
    const current = this.taskForm.get('displayInfo')?.value || [];

    const fieldsGroup = this.displayInfoGroups.find(g => g.value === 'FIELDS');
    if (fieldsGroup) {
      const allOption = fieldsGroup.children.find((child: any) => child.label === 'All');
      if (allOption && allOption.value === value) {
        const allFieldItems = this.dsrFieldDisplayKeysFromApi
          .filter(field => field.key !== 'ALL')
          .map(field => field.key);

        return allFieldItems.length > 0 && allFieldItems.every(fieldKey =>
          current.some((item: any) => item.value === fieldKey)
        );
      }
    }

    return current.some((item: any) => item.value === value);
  }
  getDisplayInfoName(infoObj: any): string {
    if (typeof infoObj === 'string') {
      return this.allDisplayInfoOptions.find(i => i.value === infoObj)?.label || infoObj;
    }
    return infoObj?.label || infoObj?.value || '';
  }
  selectPriority(priority: string): void {
    this.taskForm.patchValue({ priority });
  }
  selectEffortLevel(effort: string): void {
    this.taskForm.patchValue({ effortLevel: effort });
  }
  private preselectQuestionContext(): void {
    const section = this.sections.find((s: any) =>
      (s.questions || []).some((q: any) => q.id === this.questionId)
    );
    if (section) {
      this.selectedSectionQuestions = section.questions || [];
      this.taskForm.patchValue({
        sectionId: section.id,
        questionId: this.questionId,
      }, { emitEvent: false });
    }
  }

  onRiskSectionChange(sectionId: number): void {
    const sectionWrapper = this.sections.find((sw: any) => sw.id === sectionId);
    this.selectedSectionQuestions = sectionWrapper?.questions || [];
    this.taskForm.get('questionId')?.reset();
  }
  removeLabel(index: number): void {
    const control = this.taskForm.get('labels');
    if (!control) return;
    const current = control.value || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    control.setValue(updated);
    this.formHasChanges.set(true);
  }
  onSearchLabels(query: any): void {
    let raw = '';
    if (typeof query === 'string') raw = query;
    else if (query && typeof query === 'object') {
      raw = (query.name ?? '').toString();
    } else raw = '';
    const q = raw.trim().toLowerCase();
    if (!Array.isArray(this.availableLabels)) {
      this.filteredLabelsList = [];
      return;
    }
    this.filteredLabelsList = this.availableLabels.filter((label: any) =>
      (label.name ?? '').toLowerCase().includes(q)
    );
  }
  selectLabel(labelObj: any): void {
    if (!labelObj) return;
    const control = this.taskForm.get('labels');
    const current = control?.value || [];
    if (!current.some((l: any) => l.name.toLowerCase() === labelObj.name.toLowerCase())) {
      const formattedLabel = {
        id: labelObj.id || 0,
        name: labelObj.name,
        isDeleted: false
      };
      control?.setValue([...current, formattedLabel]);
      this.formHasChanges.set(true);
    }
    this.labelSearchTerm = '';
    this.filteredLabelsList = [...this.availableLabels];
  }
  addTypedLabel(event: MatChipInputEvent): void {
    const input = event.input;
    const value = (event.value || '').trim();
    if (!value) return;
    const control = this.taskForm.get('labels');
    const current = control?.value || [];
    const exists = current.some((l: any) =>
      l.name.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      const matchingExisting = this.availableLabels.find(
        (l: any) => l.name.toLowerCase() === value.toLowerCase()
      );
      const newLabel = {
        id: matchingExisting?.id || 0,
        name: matchingExisting?.name || value,
        isDeleted: false
      };
      control?.setValue([...current, newLabel]);
      this.formHasChanges.set(true);
      if (!this.availableLabels.some(l => l.name.toLowerCase() === value.toLowerCase())) {
        this.availableLabels.push(newLabel);
        this.filteredLabelsList = [...this.availableLabels];
      }
    }
    if (input) input.value = '';
    this.labelSearchTerm = '';
  }
  getLabelName(labelObj: any): string {
    if (typeof labelObj === 'number') {
      return this.availableLabels.find(l => l.id === labelObj)?.name || '';
    }
    return labelObj?.name || '';
  }
  private readonly FILE_UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    SUPPORTED_MIME_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
  };
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      this.uploadFiles(files);
    }
  }
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(input.files);
    }
    input.value = '';
  }
  async uploadFiles(files: FileList): Promise<void> {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!this.validateFile(file)) {
        return false;
      }
      if (this.isDuplicateFile(file.name)) {
        this.snackbarService.openSnack(`${file.name} already added`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) {
      return;
    }
    this.fileUploadInProgress.set(true);
    try {
      const showIndividualNotifications = validFiles.length === 1;
      const uploadPromises = validFiles.map(file => this.processFileUpload(file, showIndividualNotifications));
      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      if (validFiles.length > 1) {
        if (failed === 0) {
          this.snackbarService.openSnack(`All ${successful} files uploaded successfully!`);
        } else if (successful === 0) {
          this.snackbarService.openSnack(`All ${failed} files failed to upload`);
        } else {
          this.snackbarService.openSnack(`${successful} files uploaded, ${failed} failed`);
        }
      }
    } finally {
      this.fileUploadInProgress.set(false);
    }
  }
  async uploadSingleFile(file: File): Promise<void> {
    if (!this.validateFile(file)) {
      return;
    }
    if (this.isDuplicateFile(file.name)) {
      this.snackbarService.openSnack(`${file.name} already added`);
      return;
    }
    await this.processFileUpload(file);
  }
  private validateFile(file: File): boolean {
    const config = this.activeFileUploadConfig;
    if (file.size > config.MAX_FILE_SIZE) {
      this.snackbarService.openSnack(`File size exceeds ${config.MAX_FILE_SIZE_MB}MB`);
      return false;
    }
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      this.snackbarService.openSnack(`File type not supported. Allowed: ${config.ALLOWED_FILE_TYPES.join(', ')}`);
      return false;
    }
    return true;
  }
  private isDuplicateFile(fileName: string): boolean {
    return this.uploadedFiles().some(f => f.fileName === fileName);
  }
  private async processFileUpload(file: File, showIndividualNotification: boolean = true): Promise<void> {
    try {
      const uploadResponse = await this.apiHelperService.uploadPresignedUrl({
        fileName: file.name,
        contentType: file.type,
        purpose: this.isRiskContext ? 'ASSESSMENT_DOCUMENT_UPLOAD' : 'DSR_DOCUMENT_UPLOAD'
      });
      if (!uploadResponse?.presignedUrl || !uploadResponse?.fileKey) {
        throw new Error('Invalid upload response: missing presigned URL or fileKey');
      }
      const uploadResult = await this.apiHelperService.getImageEtag(uploadResponse.presignedUrl, file);
      if (!uploadResult) {
        throw new Error('Failed to upload file to cloud storage');
      }
      const eTag = this.extractETag(uploadResult);
      const serverPath = this.extractServerPathFromPresignedUrl(uploadResponse.presignedUrl);
      const attachmentData = {
        file: file,
        fileName: file.name,
        fileKey: uploadResponse.fileKey,
        presignedUrl: uploadResponse.presignedUrl,
        fileSize: file.size,
        eTag: eTag,
        serverPath: serverPath,
        isExisting: false
      };
      this.uploadedFiles.update(files => [...files, attachmentData]);
      this.formHasChanges.set(true);
      if (showIndividualNotification) {
        this.snackbarService.openSnack(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      this.snackbarService.openSnack(`${file.name} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  private extractETag(uploadResult: any): string {
    if (!uploadResult) {
      return '';
    }
    if (uploadResult.headers) {
      const eTag = uploadResult.headers.get('ETag') || uploadResult.headers.get('etag');
      if (eTag) {
        return eTag;
      }
    }
    if (uploadResult.eTag) {
      return uploadResult.eTag;
    }
    if (uploadResult.body?.eTag) {
      return uploadResult.body.eTag;
    }
    console.warn('ETag not found in upload result, this may cause issues with file verification');
    return '';
  }
  private extractServerPathFromPresignedUrl(presignedUrl: string): string {
    try {
      const url = new URL(presignedUrl);
      return `${url.origin}${url.pathname}`;
    } catch (error) {
      console.error('Error extracting server path from presigned URL:', error);
      return '';
    }
  }
  removeFile(index: number): void {
    const fileToRemove = this.uploadedFiles()[index];

    if (fileToRemove?.isExisting) {
      const existingDoc = this.existingDocumentAttached.find((doc: any) => {
        const docUrl = doc.documentUrl || doc.url || doc.fileKey || '';
        return docUrl === fileToRemove.fileKey;
      });

      if (existingDoc) {
        this.deletedDocumentAttached.push({
          documentUrl: existingDoc.documentUrl || existingDoc.url || existingDoc.fileKey || fileToRemove.fileKey,
          documentName: existingDoc.documentName || fileToRemove.fileName,
          status: 'DELETED'
        });
      }

      this.existingDocumentAttached = this.existingDocumentAttached.filter((doc: any) => {
        const docUrl = doc.documentUrl || doc.url || doc.fileKey || '';
        return docUrl !== fileToRemove.fileKey;
      });
    }

    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
    this.formHasChanges.set(true);
  }
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  private areAllFilesCompletelyUploaded(): boolean {
    const files = this.uploadedFiles();
    return files.every(file => file.fileKey && (file.eTag || file.isExisting));
  }

  private validateFileUploadsComplete(): boolean {
    const files = this.uploadedFiles();
    if (files.length === 0) {
      return true;
    }
    if (this.fileUploadInProgress()) {
      this.snackbarService.openSnack('Please wait for all file uploads to complete');
      return false;
    }
    const incompleteFiles = files.filter(file =>
      !file.fileKey || (!file.isExisting && !file.eTag)
    );
    if (incompleteFiles.length > 0) {
      const fileNames = incompleteFiles.map(f => f.fileName).join(', ');
      this.snackbarService.openSnack(`Some files are not completely uploaded: ${fileNames}`);
      return false;
    }
    return true;
  }
  async onSave(): Promise<void> {
    if (!this.taskForm.valid) {
      this.taskForm.markAllAsTouched();
      this.snackbarService.openSnack('Please fill all required fields');
      return;
    }
    const assigneeType = this.assigneeTypeSignal();
    const effectiveType = this.effectiveAssigneeType();
    if (assigneeType === 'INTERNAL' && !this.taskForm.get('assignee')?.value) {
      this.snackbarService.openSnack('Please select an internal assignee');
      return;
    }
    if (assigneeType === 'EXTERNAL' && effectiveType !== 'DATA_SUBJECT' && !this.externalUser()?.applicationUserId) {
      this.snackbarService.openSnack('Please submit external user email');
      return;
    }
    this.submitLoading.set(true);
    try {
      const formValue = this.taskForm.getRawValue();
      let assignToValue: number = 0;
      if (effectiveType === 'DATA_SUBJECT' && this.externalUser()?.applicationUserId) {
        assignToValue = this.externalUser()!.applicationUserId;
      } else if (formValue.assigneeType === 'EXTERNAL' && this.externalUser()?.applicationUserId) {
        assignToValue = this.externalUser()!.applicationUserId;
      } else if (formValue.assignee) {
        assignToValue = typeof formValue.assignee === 'string'
          ? parseInt(formValue.assignee, 10)
          : formValue.assignee;
      }
      const assignToUserType = this.mapAssigneeTypeToApi(effectiveType);
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      const dueDate = formValue.dueDate
        ? formatDate(new Date(formValue.dueDate))
        : '';
      const displayInfoValues = (formValue.displayInfo || [])
        .map((item: any) => typeof item === 'string' ? item : item.value);

      const allFieldKeys = this.dsrFieldDisplayKeysFromApi
        .filter(field => field.key !== 'ALL')
        .map(field => field.key);

      const allFieldsSelected = allFieldKeys.length > 0 && allFieldKeys.every(fieldKey =>
        displayInfoValues.includes(fieldKey)
      );

      const visibleFieldNames = displayInfoValues.filter((value: string) => {
        if (value === 'ALL') {
          return allFieldsSelected;

        }
        return true;
      });
      const allLabels = formValue.labels || [];
      const existingLabelIds: string[] = allLabels
        .filter((label: any) => label.id && label.id > 0)
        .map((label: any) => label.id.toString());
      const newLabels = allLabels.filter((label: any) => !label.id || label.id === 0);
      const newLabelList = newLabels.length > 0
        ? newLabels.map((label: any) => {
          return {
            labelId: uuid(),
            name: label.name,
            isLabelDeleted: false,
            isLabelUpdated: false
          };
        })
        : [];
      const newLabelIds: string[] = newLabelList.map((label: any) => label.labelId);
      const labelIds: string[] = [...existingLabelIds, ...newLabelIds];
      const labels = allLabels.map((label: any) => ({
        id: label.id || 0,
        name: label.name,
        isDeleted: false
      }));
      if (!this.validateFileUploadsComplete()) {
        this.snackbarService.openSnack('Please wait for all files to finish uploading');
        return;
      }


      const newUploadedForEdit = this.uploadedFiles()
        .filter(file => file.fileKey && !file.isExisting)
        .map(file => ({
          documentUrl: file.fileKey,
          documentName: file.fileName,
          status: 'ADDED'
        }));

      let documentAttached: any[] = [];
      if (this.isEditMode) {
        documentAttached = [
          ...newUploadedForEdit,
          ...this.deletedDocumentAttached
        ];
      } else {
        documentAttached = this.uploadedFiles()
          .filter(file => file.fileKey)
          .map(file => ({
            fileName: file.fileName,
            fileKey: file.fileKey
          }));
      }

      let documentRequired: boolean;
      if (this.isEditMode) {
        const totalDocumentCount = this.existingDocumentAttached.length + newUploadedForEdit.length;
        documentRequired = totalDocumentCount > 0;
      } else {
        documentRequired = documentAttached.length > 0;
      }

      const taskPayload: any = {
        title: formValue.title,
        description: this.descriptionControl.value || formValue.description,
        dueDate: dueDate,
        assignTo: assignToValue,
        priority: formValue.priority,
        documentRequired: documentRequired,
        assignToUserType: assignToUserType,
        parentTaskId: this.task?.parentTaskId || 0,
        documentAttached: documentAttached,
        visibleFieldNames: visibleFieldNames.length > 0 ? visibleFieldNames : [],
        labelIds: labelIds.length > 0 ? labelIds : [],
        newLabelList: newLabelList.length > 0 ? newLabelList : [],
        levelOfEffort: formValue.effortLevel || null
      };
      if (this.isEditMode) {
        taskPayload.taskMeta = null;
        const currentLabels = formValue.labels || [];
        const taskLabelMappings: any[] = [];
        for (const existingMapping of this.existingTaskLabelMappings) {
          const stillSelected = currentLabels.some((label: any) =>
            label.id === existingMapping.labelId ||
            label.name === existingMapping.labelName
          );
          if (stillSelected) {
            taskLabelMappings.push({
              mappingId: existingMapping.mappingId,
              labelId: existingMapping.labelId,
              taskId: this.task?.taskId || 0,
              isDeleted: false
            });
          } else {
            taskLabelMappings.push({
              mappingId: existingMapping.mappingId,
              labelId: existingMapping.labelId,
              taskId: this.task?.taskId || 0,
              isDeleted: true
            });
          }
        }
        for (const currentLabel of currentLabels) {
          const isExisting = this.existingTaskLabelMappings.some((mapping: any) =>
            mapping.labelId === currentLabel.id ||
            mapping.labelName === currentLabel.name
          );
          if (!isExisting) {
            let newLabelId = currentLabel.id;
            if (!currentLabel.id || currentLabel.id === 0) {
              const matchingNewLabel = newLabelList.find((nl: any) =>
                nl.name === currentLabel.name
              );
              if (matchingNewLabel) {
                newLabelId = matchingNewLabel.labelId;
              }
            }
            taskLabelMappings.push({
              mappingId: 0,
              labelId: newLabelId,
              taskId: this.task?.taskId || 0,
              isDeleted: false
            });
          }
        }
        taskPayload.taskLabelMappings = taskLabelMappings;
      }
      if (!this.isEditMode && !this.isRiskContext) {
        taskPayload.stage = this.mapDisplayStageToTaskStage(this.requestStage) || 'VERIFICATION';
      }
      if (this.isEditMode && this.task?.taskId) {
        taskPayload.taskId = this.task.taskId;
      }




      let response: any;
      if (this.isRiskContext && this.isEditMode) {
        const resolvedQuestionId = formValue.questionId || this.questionId || 0;
        const currentLabels = formValue.labels || [];
        const commandDueDate = formValue.dueDate ? new Date(formValue.dueDate).toISOString() : null;
        const labelsNotYetAdded = currentLabels.filter((label: any) =>
          !this.existingTaskLabelMappings.some(
            (mapping: any) => mapping.labelId === label.id || mapping.labelName === label.name
          )
        );
        const existingLabelsForEdit = labelsNotYetAdded.filter((label: any) => label.id && label.id > 0);
        const newLabelsForEdit = labelsNotYetAdded.filter((label: any) => !label.id || label.id === 0);
        const newLabelEntriesForEdit = newLabelsForEdit.map((label: any) => ({
          uuid: uuid(),
          name: label.name,
        }));
        const labelsToAdd: (number | string)[] = [
          ...existingLabelsForEdit.map((label: any) => Number(label.id)),
          ...newLabelEntriesForEdit.map((nl: any) => nl.uuid),
        ];
        const labelMappingIdsToDelete: number[] = this.existingTaskLabelMappings
          .filter((mapping: any) => !currentLabels.some(
            (label: any) => label.id === mapping.labelId || label.name === mapping.labelName
          ))
          .map((mapping: any) => mapping.mappingId);
        const newAttachmentsForEdit = this.uploadedFiles()
          .filter(f => f.fileKey && !f.isExisting)
          .map(f => ({ fileName: f.fileName, fileKey: f.fileKey! }));
        const deletedAttachments = this.deletedDocumentAttached.map((doc: any) => ({
          fileKey: doc.documentUrl || doc.url || doc.fileKey || '',
          fileName: doc.documentName || doc.name || ''
        }));
        const editCommands: any[] = [];
        const newTitle = formValue.title;
        if (newTitle !== (this.task?.title || '')) {
          editCommands.push({ type: 'updateTitle', title: newTitle });
        }
        const newDescription = this.descriptionControl.value || formValue.description || '';
        if (newDescription !== (this.task?.description || '')) {
          editCommands.push({ type: 'updateDescription', description: newDescription });
        }
        if (assignToValue !== this.task?.assignToUserId || assignToUserType !== (this.task?.assignToUserType || 'INTERNAL_USER')) {
          editCommands.push({ type: 'updateAssignTo', assignedTo: { userId: assignToValue, userType: assignToUserType } });
        }
        editCommands.push({ type: 'updateDocumentRequired', documentRequired: documentRequired });
        const newEffortLevel = formValue.effortLevel || null;
        if (newEffortLevel !== (this.task?.levelOfEffort || null)) {
          editCommands.push({ type: 'updateLevelOfEffort', levelOfEffort: newEffortLevel });
        }
        const newPriority = formValue.priority || 'MEDIUM';
        if (newPriority !== (this.task?.priority || 'MEDIUM')) {
          editCommands.push({ type: 'updatePriority', priority: newPriority });
        }
        const originalDueDate = this.task?.dueDate && this.task.dueDate !== 'N/A' ? new Date(this.task.dueDate).toISOString() : null;
        if (commandDueDate !== originalDueDate) {
          if (commandDueDate) {
            editCommands.push({ type: 'updateDueDate', dueDate: commandDueDate });
          }
        }
        if (newLabelEntriesForEdit.length > 0) {
          editCommands.push({ type: 'createAndAddLabel', labels: newLabelEntriesForEdit });
        }
        if (labelsToAdd.length > 0) {
          editCommands.push({ type: 'addLabels', labels: labelsToAdd });
        }
        if (labelMappingIdsToDelete.length > 0) {
          editCommands.push({ type: 'deleteLabels', labelMappingId: labelMappingIdsToDelete });
        }
        if (newAttachmentsForEdit.length > 0) {
          editCommands.push({ type: 'addTaskAttachment', attachments: newAttachmentsForEdit });
        }
        if (deletedAttachments.length > 0) {
          editCommands.push({ type: 'deleteTaskAttachment', attachments: deletedAttachments });
        }
        if (editCommands.length === 0) {
          this.closeDrawer();
          return;
        }
        const editCommandPayload = { commandId: uuid(), commands: editCommands };
        const taskAttachedTo = this.task?.attachedTo;
        if (taskAttachedTo === AssessmentAttachedTo.ASSESSMENT || taskAttachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          response = await this.assessmentApiHelperService.updateAssessmentMainTaskCommands(
            this.assessmentId,
            this.task.taskId,
            editCommandPayload,
            this.isVendorContext
          );
        } else if (taskAttachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || taskAttachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) {
          const editFormRaw = this.taskForm.getRawValue();
          const selectedQuestionId = editFormRaw.questionId ? Number(editFormRaw.questionId) : 0;
          const selectedRiskId = editFormRaw.linkToExistingRisk && editFormRaw.riskIdField ? Number(editFormRaw.riskIdField) : 0;
          if (selectedQuestionId > 0 && selectedRiskId > 0) {
            response = await this.assessmentApiHelperService.updateAssessmentTask(
              this.assessmentId,
              selectedQuestionId,
              this.task.taskId,
              editCommandPayload,
              selectedRiskId,
              this.isVendorContext
            );
          } else {
            response = await this.assessmentApiHelperService.updateAssessmentRiskTaskCommands(
              this.assessmentId,
              selectedRiskId > 0 ? selectedRiskId : this.task.attachedToId,
              this.task.taskId,
              editCommandPayload,
              this.isVendorContext
            );
          }
        } else {
          const editFormRaw = this.taskForm.getRawValue();
          const editLinkedRiskId = editFormRaw.linkToExistingRisk && editFormRaw.riskIdField
            ? Number(editFormRaw.riskIdField)
            : undefined;
          response = await this.assessmentApiHelperService.updateAssessmentTask(
            this.assessmentId,
            resolvedQuestionId,
            this.task.taskId,
            editCommandPayload,
            editLinkedRiskId,
            this.isVendorContext
          );
        }

      } else if (this.isEditMode && this.task?.taskId) {
        response = await this.apiHelperService.updateTask(taskPayload);
      } else if (this.isRiskContext) {
        const resolvedQuestionId = formValue.questionId || this.questionId || 0;
        const existingLabelsForCreate = allLabels.filter((label: any) => label.id && label.id > 0);
        const newLabelsForCreate = allLabels.filter((label: any) => !label.id || label.id === 0);
        const newLabelEntriesForCreate = newLabelsForCreate.map((label: any) => ({
          uuid: uuid(),
          name: label.name,
        }));
        const taskLabelIds: (number | string)[] = [
          ...existingLabelsForCreate.map((label: any) => Number(label.id)),
          ...newLabelEntriesForCreate.map((nl: any) => nl.uuid),
        ];
        const uploadedAttachments = this.uploadedFiles()
          .filter(f => f.fileKey)
          .map(f => ({ fileName: f.fileName, fileKey: f.fileKey! }));
        const commandDueDate = formValue.dueDate
          ? new Date(formValue.dueDate).toISOString()
          : null;
        const commands: any[] = [
          { type: 'updateTitle', title: formValue.title },
          { type: 'updateDescription', description: this.descriptionControl.value || formValue.description || '' },
          { type: 'updateAssignTo', assignedTo: { userId: assignToValue, userType: assignToUserType } },
          { type: 'updateDocumentRequired', documentRequired: documentRequired },
          { type: 'updateLevelOfEffort', levelOfEffort: formValue.effortLevel || null },
          { type: 'updateParentTaskId', parentTaskId: this.task?.parentTaskId || 0 },
          { type: 'updatePriority', priority: formValue.priority || 'MEDIUM' },
          // { type: 'updateStatus', status: 'OPEN' },
          { type: 'addTaskAttachment', attachments: uploadedAttachments },
        ];
        if (newLabelEntriesForCreate.length > 0) {
          commands.push({ type: 'createAndAddLabel', labels: newLabelEntriesForCreate });
        }
        if (taskLabelIds.length > 0) {
          commands.push({ type: 'addLabels', labels: taskLabelIds });
        }
        if (commandDueDate) {
          commands.push({ type: 'updateDueDate', dueDate: commandDueDate });
        }
        const commandPayload = { commandId: uuid(), commands };
        const numericRiskId = this.riskId ? parseInt(this.riskId.replace('R-', ''), 10) : NaN;
        if (!isNaN(numericRiskId) && numericRiskId > 0) {
          response = await this.assessmentApiHelperService.createAssessmentRiskTaskCommands(
            this.assessmentId,
            numericRiskId,
            commandPayload,
            this.isVendorContext
          );
        } else if (this.source === 'ASSESSMENT_TASK') {
          const formRaw = this.taskForm.getRawValue();
          if (formRaw.chooseParameter && formRaw.questionId) {
            const riskIdForQuestion = formRaw.linkToExistingRisk && formRaw.riskIdField ? Number(formRaw.riskIdField) : undefined;
            response = await this.assessmentApiHelperService.createAssessmentQuestionTaskCommands(
              this.assessmentId,
              Number(formRaw.questionId),
              commandPayload,
              riskIdForQuestion,
              this.isVendorContext
            );
          } else if (formRaw.linkToExistingRisk && formRaw.riskIdField) {
            response = await this.assessmentApiHelperService.createAssessmentRiskTaskCommands(
              this.assessmentId,
              Number(formRaw.riskIdField),
              commandPayload,
              this.isVendorContext
            );
          } else {
            response = await this.assessmentApiHelperService.createAssessmentMainTaskCommands(
              this.assessmentId,
              commandPayload,
              this.isVendorContext
            );
          }
        } else if (resolvedQuestionId > 0) {
          const formRaw = this.taskForm.getRawValue();
          const linkedRiskId = formRaw.linkToExistingRisk && formRaw.riskIdField ? Number(formRaw.riskIdField) : undefined;
          response = await this.assessmentApiHelperService.createAssessmentQuestionTaskCommands(
            this.assessmentId,
            resolvedQuestionId,
            commandPayload,
            linkedRiskId,
            this.isVendorContext
          );
        } else {
          response = await this.assessmentApiHelperService.createAssessmentTaskCommands(
            this.assessmentId,
            commandPayload,
            this.isVendorContext
          );
        }
      } else {
        response = await this.apiHelperService.createTask(this.requestRid, taskPayload).toPromise();
      }
      const successMessage = this.isEditMode ? 'Task updated successfully' : 'Task created successfully';
      this.snackbarService.openSnack(successMessage);
      if (response) {
        try {
          const eventData = {
            ...response,
            taskUpdated: this.isEditMode,
            taskCreated: !this.isEditMode
          };
          this.onSaveTask.emit(eventData);
        } catch (emitError) {
          console.error('Error emitting onSaveTask:', emitError);
        }
      }
      try {
        this.closeDrawer(true);
      } catch (closeError) {
        console.error('Error in closeDrawer:', closeError);
        this.onClose.emit(true);
      }
    } catch (error: any) {
      console.error('Exception in onSave:', error);
      console.error('Error stack:', error?.stack);
      const errorMessage = this.isEditMode ? 'Failed to update task' : 'Failed to create task';
      this.snackbarService.openSnack(error?.message || errorMessage);
    } finally {
      this.submitLoading.set(false);
    }
  }
  private mapAssigneeTypeToApi(formAssigneeType: string): string {
    const mapping: { [key: string]: string } = {
      'INTERNAL': 'INTERNAL_USER',
      'EXTERNAL': 'EXTERNAL_USER',
      'DATA_SUBJECT': 'DSR_FORM_USER'
    };
    return mapping[formAssigneeType] || 'INTERNAL_USER';
  }
  private mapDisplayStageToTaskStage(displayStage: string): string {
    const mapping: { [key: string]: string } = {
      'REQUEST_VERIFICATION': 'VERIFICATION',
      'REQUEST_VALIDATION': 'VALIDATION',
      'DATA_MAPPING': 'DATA_MAPPING',
      'REQUEST_FULFILLMENT': 'DATA_FULFILLMENT'
    };
    return mapping[displayStage] || 'VERIFICATION';
  }
  async closeDrawer(skipConfirmation: boolean = false): Promise<void> {
    try {
      if (this.taskForm) {
        this.taskForm.reset({
          title: '',
          description: '',
          dueDate: null,
          priority: 'MEDIUM',
          effortLevel: null,
          labels: [],
          assigneeType: 'INTERNAL',
          assignee: '',
          externalEmail: '',
          displayInfo: [],
          sectionId: null,
          questionId: null,
          taskType: null,
          linkToExistingRisk: false,
          riskIdField: this.isRiskContext ? this.riskId : '',
        });
      }
      this.selectedSectionQuestions = [];
      this.editorInitialContent = '';
      try {
        this.internalUserControl.setValue('');
        this.internalUserSearchTerm.set('');
        this.internalUserCreated.set(null);
        this.internalUserError.set(null);
        this.externalUserControl.setValue('');
        this.externalUserSearchTerm.set('');
        this.externalUserCreated.set(null);
        this.externalUser.set(null);
        this.externalUserError.set(null);
        this.assigneeTypeSignal.set('INTERNAL');
      } catch (assigneeError) {
        console.warn('Error resetting assignee state:', assigneeError);
      }
      try {
        this.uploadedFiles.set([]);
        this.existingDocumentAttached = [];
        this.deletedDocumentAttached = [];
        this.existingTaskLabelMappings = [];
      } catch (filesError) {
        console.warn('Error clearing files:', filesError);
      }
      this.displayInfoSearchTerm = '';
      this.labelSearchTerm = '';
      if (this.allFlattenedOptions) {
        this.flattenedDisplayInfoOptions = [...this.allFlattenedOptions];
      }
      this.availableLabels = [];
      this.filteredLabelsList = [];
      this.formHasChanges.set(false);
      this.initialFormValues = null;
      this.onClose.emit(true);
    } catch (error) {
      console.error('Error in closeDrawer cleanup:', error);
      this.onClose.emit(true);
    }
  }

  onDescriptionChange(data: { content: string, edited: boolean }): void {
    this.ngZone.run(() => {
      const html = data.content || '';

      const text = html.replace(/<[^>]*>/g, '').trim();

      this.descriptionControl.setValue(text ? html : '');

      this.descriptionControl.markAsDirty();
      this.descriptionControl.markAsTouched();
      this.descriptionControl.updateValueAndValidity();

      this.isFormValid.set(this.taskForm.valid);

      if (!this.isPopulatingForm) {
        this.descriptionChangedByUser = true;
        this.detectChanges();
      }
    });
  }

  getQuestionText(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  async loadTaskDrawerSections(reset: boolean = true): Promise<void> {
    if (!this.assessmentId) return;
    if (reset) {
      this.sectionPage = 0;
      this.hasMoreSections = true;
      this.drawerTaskSections = [];
      this.taskAvailableQuestions = [];
      this.isLoadingTaskSections = true;
    } else {
      this.isLoadingMoreSections = true;
    }
    this.cdr.detectChanges();
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        { sectionPage: this.sectionPage, sectionLimit: 20, questionLimit: 0 }
      );
      const newSections = (res?.sectionResponses || []).map((s: any) => ({
        id: s.sectionId,
        sectionName: s.sectionTitle,
        questions: [],
      }));
      this.drawerTaskSections.push(...newSections);
      this.hasMoreSections = newSections.length === 20;
    } catch (e) {
      console.error('Error loading sections for task:', e);
      if (reset) this.drawerTaskSections = [];
      this.sectionPage = Math.max(0, this.sectionPage - 1);
    } finally {
      this.isLoadingTaskSections = false;
      this.isLoadingMoreSections = false;
      this.cdr.detectChanges();
    }
  }

  onSectionDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.removeSectionScrollListener();
      this.removeDrawerScrollCloseListener();
      return;
    }
    this.attachDrawerScrollCloseListener();
    setTimeout(() => {
      const panel = this.sectionSelect?.panel?.nativeElement;
      if (!panel) return;
      this.removeSectionScrollListener();
      this.sectionScrollHandler = this.onSectionScroll.bind(this);
      panel.addEventListener('scroll', this.sectionScrollHandler);
    });
  }

  private onSectionScroll(event: Event): void {
    const panel = event.target as HTMLElement;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 10;
    if (atBottom && !this.isLoadingMoreSections && this.hasMoreSections) {
      this.sectionPage++;
      this.loadTaskDrawerSections(false);
    }
  }

  private removeSectionScrollListener(): void {
    const panel = this.sectionSelect?.panel?.nativeElement;
    if (panel && this.sectionScrollHandler) {
      panel.removeEventListener('scroll', this.sectionScrollHandler);
    }
    this.sectionScrollHandler = undefined;
  }

  async onTaskSectionChange(sectionId: number): Promise<void> {
    this.taskForm.get('questionId')?.setValue(null, { emitEvent: false });
    this.taskAvailableQuestions = [];
    if (!sectionId) return;
    const cached = this.drawerTaskSections.find((s: any) => s.id === sectionId);
    if (cached?.questions?.length > 0) {
      this.taskAvailableQuestions = cached.questions;
      return;
    }
    this.isLoadingTaskQuestions = true;
    this.cdr.detectChanges();
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        { sectionId, questionPage: 0, questionLimit: 100, messagePage: 0, messageLimit: 0 }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === sectionId);
      if (sec) {
        const questions = (sec.question || []).map((q: any) => ({
          id: q.questionId,
          text: q.questionText,
        }));
        if (cached) cached.questions = questions;
        this.taskAvailableQuestions = questions;
      }
    } catch (e) {
      console.error('Error loading questions for task section:', e);
      this.taskAvailableQuestions = [];
    } finally {
      this.isLoadingTaskQuestions = false;
      this.cdr.detectChanges();
    }
  }

  private async loadAssessmentTaskRisks(reset: boolean = true): Promise<void> {
    if (!this.assessmentId) return;
    if (reset) {
      this.riskPage = 1;
      this.hasMoreRisks = true;
      this.loadedRisks = [];
    }
    this.isLoadingMoreRisks = true;
    try {
      const _url = this.isVendorContext ? ASSESSMENT_VENDOR_RISK : ASSESSMENT_RISK;
      const data = await this.assessmentApiHelperService.getAssessmentRisks(this.assessmentId, { page: this.riskPage, size: 20 }, _url);
      const raw: any[] = data?.risks || data?.content || (Array.isArray(data) ? data : []);
      const newRisks = raw.map((r: any) => ({
        ...r,
        riskId: r.riskId ?? r.id,
        riskTitle: r.riskTitle ?? r.title,
      }));
      this.loadedRisks.push(...newRisks);
      this.hasMoreRisks = newRisks.length === 20;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load risks for assessment task:', err);
      if (reset) this.loadedRisks = [];
      this.riskPage = Math.max(1, this.riskPage - 1);
    } finally {
      this.isLoadingMoreRisks = false;
    }
  }

  onRiskDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.removeRiskScrollListener();
      this.removeDrawerScrollCloseListener();
      return;
    }
    this.attachDrawerScrollCloseListener();
    setTimeout(() => {
      const panel = this.riskSelect?.panel?.nativeElement;
      if (!panel) return;
      this.removeRiskScrollListener();
      this.riskScrollHandler = this.onRiskScroll.bind(this);
      panel.addEventListener('scroll', this.riskScrollHandler);
    });
  }

  private onRiskScroll(event: Event): void {
    const panel = event.target as HTMLElement;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 10;
    if (atBottom && !this.isLoadingMoreRisks && this.hasMoreRisks) {
      this.riskPage++;
      this.loadAssessmentTaskRisks(false);
    }
  }

  private removeRiskScrollListener(): void {
    const panel = this.riskSelect?.panel?.nativeElement;
    if (panel && this.riskScrollHandler) {
      panel.removeEventListener('scroll', this.riskScrollHandler);
    }
    this.riskScrollHandler = undefined;
  }

  onQuestionDropdownOpened(opened: boolean): void {
    if (opened) {
      this.attachDrawerScrollCloseListener();
    } else {
      this.removeDrawerScrollCloseListener();
    }
  }

  private attachDrawerScrollCloseListener(): void {
    this.removeDrawerScrollCloseListener();
    const container = this.drawerScrollContainer?.nativeElement;
    if (!container) return;
    this.drawerScrollCloseHandler = () => {
      this.sectionSelect?.close();
      this.questionSelect?.close();
      this.riskSelect?.close();
    };
    container.addEventListener('scroll', this.drawerScrollCloseHandler, { passive: true });
  }

  private removeDrawerScrollCloseListener(): void {
    const container = this.drawerScrollContainer?.nativeElement;
    if (container && this.drawerScrollCloseHandler) {
      container.removeEventListener('scroll', this.drawerScrollCloseHandler);
    }
    this.drawerScrollCloseHandler = undefined;
  }
}

