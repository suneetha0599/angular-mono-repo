
import { Component, inject, DestroyRef, Inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatSpinner } from '@angular/material/progress-spinner';
import { TaskService } from './services/task/task.service';
import { TaskStateService, AssigneeType, AssigneeSelection, ExternalUser } from './services/task-state/task-state.service';
import { FileUploadService } from './services/file-upload/file-upload.service';
import { DocumentService } from './services/document/document.service';
import { TaskApiService } from './services/task-api/task-api.service';
import { TaskValidators } from './validators/task.validators';
import { TaskUtils } from './utils/task.utils';
import { DialogData, DialogResult } from './models/dialog-config.model';
import { RequestTask } from '@admin-core/models/request-management/DsrRequest';
import { RequestDataFulfillmentRecords } from '@admin-core/models/request-management/DsrRequest';
import { TaskAttachment } from './models/task.model';
import { PRIORITY_OPTIONS } from './constants/task.constants';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { FileDropDirective } from '@valura-lib/directives/file-drop/file-drop.directive';
import { TaskDialogShimmerComponent } from './component/task-dialog-shimmer/task-dialog-shimmer.component';
import { DsrRequestDetails } from '@admin-core/models/request-management/DsrRequest';
import { RequestDialogTypes, REQUEST_DATA_FULFILLMENT_RECORD_HEADER, dataFullFillmentDetails } from '../../constant';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AuthService } from '@admin-core/services/auth.service';
import { DialogType } from './models/task.types';
import { EmailTemplateComponent } from '@valura-lib/components/email-template/email-template.component';
import { EmailTemplateId } from '@admin-core/constants/email-template-constants';
import { buildEmailTemplateForm, getEmailTemplate, getFinalEmailContent, getEmailPayload } from '@valura-lib/components/email-template/email-template-utils';
import { EmailTemplates } from '@admin-core/models/EmailTemplate';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ViewTypeDialogConfig } from '@admin-core/models/request-management/ViewTypeDialogConfig';
import { RequestDisplayStage } from '../../constant';
import { User } from '@admin-core/models/user.model';
import { USER_TYPES } from '@admin-core/constants/constants';
import { USER_PURPOSE } from '@admin-core/constants/api-constants';
import { recipientDetails } from '../../request-utils';
import { UserService } from '@admin-core/services/user/user.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'l, LTS' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

export interface AssigneeOption {
  value: string | number;
  label: string;
}

interface RecipientOption {
  value: string;
  label: string;
  type: 'data_subject' | 'third_party';
  name?: string;
}

interface RecipientGroup {
  groupName: string;
  options: RecipientOption[];
}

interface RecipientSelectionData {
  email: string;
  name?: string;
  type?: 'data_subject' | 'third_party';
}

export interface ExtendedDialogData extends DialogData {
  assessmentId?: number;
  measures?: any[];
  isRiskMitigation?: boolean;
  isQuestionTask?: boolean;
  questionData?: {
    id: number;
    text: string;
    response: string;
  };
  isMeasureTask?: boolean;
  measureData?: {
    id: number;
    description: string;
    status: string;
  };
}

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingButtonComponent,
    TaskDialogShimmerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    FileDropDirective,
    MatTooltipModule,
    MatRadioModule,
    MatSpinner,
    EmailTemplateComponent,
    MatAutocompleteModule,
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)' }))
      ])
    ]),
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  templateUrl: './create-task-dialog.component.html',
  styleUrl: './create-task-dialog.component.scss'
})
export class CreateTaskDialogComponent implements OnInit, OnDestroy {
  readonly dialogTitle: string;
  readonly dialogType: string;
  readonly requestRid: number;
  readonly task?: RequestTask;
  readonly parentTaskId: number;
  readonly dsrRequestDetails?: DsrRequestDetails;
  readonly assigneeTypeSignal = signal<string>('INTERNAL');
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dueDatePicker') dueDatePicker!: any;

  taskForm!: FormGroup;
  private destroyRef = inject(DestroyRef);

  readonly RequestDialogTypes = RequestDialogTypes;
  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly dataFullFillmentDetails = dataFullFillmentDetails;
  readonly tableHeaders = REQUEST_DATA_FULFILLMENT_RECORD_HEADER;
  readonly displayedHeaders: string[] = this.tableHeaders.map((c: any) => c.columnDef);
  dataFullFillmentRecordList = new MatTableDataSource<RequestDataFulfillmentRecords>();

  private readonly taskService = inject(TaskService);
  readonly taskStateService = inject(TaskStateService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly documentService = inject(DocumentService);
  private readonly taskApiService = inject(TaskApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly apiHelperService = inject(ApiHelperService);
  private readonly assessmentApiHelperService = inject(AssessmentApiHelperService);
  private readonly authService = inject(AuthService);
  private readonly formValiditySignal = signal<boolean>(false);
  private selectedRecipientData: RecipientSelectionData = { email: '' };

  private templateVariableCache = new Map<string, { content: string; subject: string }>();
  private templateLoadedSignal = signal<boolean>(false);

  readonly isInitialLoading = signal<boolean>(true);
  readonly isFormDataLoading = signal<boolean>(true);
  readonly isDataFulfillmentLoading = signal<boolean>(true);

  private readonly formValueSignal = signal<any>({});
  private readonly formDirtySignal = signal<boolean>(false);

  readonly submitLoading = this.taskStateService.submitLoading;
  readonly fileUploadInProgress = this.taskStateService.fileUploadInProgress;
  readonly uploadedFiles = this.taskStateService.uploadedFiles;
  readonly userMasterList = this.taskStateService.userMasterList;
  readonly availableDocuments = this.taskStateService.availableDocuments;
  readonly isDragOver = this.taskStateService.isDragOver;
  readonly isDocumentDropdownOpen = this.taskStateService.isDocumentDropdownOpen;
  readonly hasFormErrors = this.taskStateService.hasFormErrors;
  readonly formErrorMessage = this.taskStateService.formErrorMessage;
  readonly dsrFormRequestedUser = this.taskStateService.dsrFormRequestedUser;
  readonly selectedAssigneeType = this.taskStateService.selectedAssigneeType;
  readonly selectedSubAssignee = this.taskStateService.selectedSubAssignee;

  assessmentId?: number;
  measures: any[] = [];
  selectedMeasureId: number | null = null;
  isRiskMitigation = false;
  isQuestionTask = false;
  questionData?: {
    id: number;
    text: string;
    response: string;
  };
  isMeasureTask = false;
  measureData?: {
    id: number;
    description: string;
    status: string;
  };

  readonly effectiveAssigneeType = computed(() => {
    const formAssigneeType = this.assigneeTypeSignal();
    const isDataSubject = this.isExternalEmailDataSubject();
    if (formAssigneeType === 'EXTERNAL' && isDataSubject) {
      return 'DATA_SUBJECT';
    }
    return formAssigneeType;
  });

  readonly canProceedToNotification = computed(() => {
    if (!this.shouldShowNotificationStep() || this.currentStep() !== 0) {
      return true;
    }

    const basicFormValid = this.formValiditySignal();
    const assigneeValid = this.validateCurrentAssigneeSelectionPure();
    const notSubmitting = !this.submitLoading();
    const notUploadingFiles = !this.hasAnyUploadsInProgress();
    const notProcessingExternal = !this.externalUserLoading();
    const canProceed = basicFormValid && assigneeValid && notSubmitting && notUploadingFiles && notProcessingExternal;
    return canProceed;
  });

  readonly shouldHideFileUpload = computed(() =>
    this.effectiveAssigneeType() === 'DATA_SUBJECT'
  );

  readonly isDataRequestSelected = computed(() =>
    this.effectiveAssigneeType() === 'DATA_SUBJECT'
  );

  readonly showDataSubjectAssignment = computed(() =>
    this.effectiveAssigneeType() === 'DATA_SUBJECT'
  );

  readonly isExternalUserSelected = this.taskStateService.isExternalUserSelected;
  readonly showSubAssigneeDropdown = this.taskStateService.showSubAssigneeDropdown;

  readonly showExternalUserInput = computed(() => {
    const formValue = this.formValueSignal();
    const formAssigneeType = formValue?.assigneeType;
    return formAssigneeType === 'EXTERNAL' && !this.isExternalEmailDataSubject();
  });

  readonly showThirdPartyMatchMessage = computed(() => {
    const formValue = this.formValueSignal();
    const formAssigneeType = formValue?.assigneeType;
    const hasExternalUser = !!this.externalUser()?.applicationUserId;
    return formAssigneeType === 'EXTERNAL' && this.isExternalEmailThirdParty() && hasExternalUser;
  });

  get matchedThirdPartyEmail(): string {
    return this.dsrRequestDetails?.dsrDetails?.thirdPartyEmail?.trim() || '';
  }

  readonly hasValidAssigneeSelection = this.taskStateService.hasValidAssigneeSelection;
  readonly externalUserLoading = this.taskStateService.externalUserLoading;
  readonly externalUser = this.taskStateService.externalUser;
  readonly externalUserError = this.taskStateService.externalUserError;

  readonly internalUserLoading = this.taskStateService.internalUserLoading;
  readonly internalUserCreated = this.taskStateService.internalUserCreated;
  readonly internalUserError = this.taskStateService.internalUserError;
  readonly internalUserSearchTerm = this.taskStateService.internalUserSearchTerm;
  readonly showCreateInternalUser = this.taskStateService.showCreateInternalUser;
  readonly filteredInternalUsers = this.taskStateService.filteredInternalUsers;

  internalUserControl = new FormControl<User | string | null>(null);

  readonly selectedDocumentCount = this.taskStateService.selectedDocumentCount;
  readonly selectedDocuments = this.taskStateService.selectedDocuments;
  readonly isDocumentAutocompleteOpen = this.taskStateService.isDocumentAutocompleteOpen;
  readonly documentSearchState = this.taskStateService.documentSearchState;
  readonly canLoadMoreDocuments = this.taskStateService.canLoadMoreDocuments;
  readonly hasAnyUploadsInProgress = computed(() =>
    this.fileUploadInProgress() || this.taskStateService.hasDocumentsUploading()
  );

  private externalUserCache = new Map<number, ExternalUser>();
  private isReconstructingExternalUser = false;

  documentPageNo: number = 1;
  documentTotalPages: number = 0;
  documentPageSize: number = 10;
  documentPaginationLoading = signal<boolean>(false);
  showReceipient: boolean = false;
  recipientEmailOptions: any = []
  private scrollDebounceTimer?: number;
  newUserIsCreated = {
    internalUser: false,
    externalUser: false
  }

  readonly validUserMasterList = computed(() => {
    return this.userMasterList().filter(user => {
      return user && user.applicationUserId;
    });
  });

  readonly currentLoggedInUser = computed(() => {
    return this.authService.getUserInfo();
  });

  readonly filteredInternalUsersExcludingCurrent = computed(() => {
    const currentUser = this.currentLoggedInUser();
    const validUsers = this.validUserMasterList();
    const searchTerm = this.taskStateService.internalUserSearchTerm().toLowerCase();

    let filteredUsers = validUsers;
    if (currentUser && currentUser.applicationUserId) {
      filteredUsers = validUsers.filter(user =>
        user.applicationUserId !== currentUser.applicationUserId
      );
    }

    if (!searchTerm.trim()) {
      return filteredUsers;
    }

    return filteredUsers.filter(user => {
      const fullName = `${user.displayName}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
  });

  readonly isFormDirty = computed(() => {
    if (!this.taskForm || !this.task) return false;
    const currentValues = this.formValueSignal();
    const formMarkedDirty = this.formDirtySignal();

    const originalAssigneeType = this.mapApiAssigneeTypeToForm(this.task.assignToUserType || '');

    const originalValues = {
      title: this.task.title || '',
      description: this.task.description || '',
      dueDate: this.task.dueDate ? TaskUtils.parseDate(this.task.dueDate) : null,
      priority: this.normalizePriority(this.task.priority || 'MEDIUM'),
      assigneeType: originalAssigneeType,
      assignee: this.getOriginalAssigneeValue(),
      documentRequired: Boolean(this.task.documentRequired)
    };

    const assigneeTypeChanged = currentValues.assigneeType !== originalValues.assigneeType;

    if (assigneeTypeChanged) {
      return true;
    }

    if (originalValues.assigneeType === 'DATA_SUBJECT' && currentValues.assigneeType === 'DATA_SUBJECT') {
      const dataSubjectOptions = this.taskService.getDataRequestOptions();
      const expectedValue = dataSubjectOptions.length > 0 ? dataSubjectOptions[0].value : null;

      if (expectedValue && currentValues.assignee === expectedValue) {
        const otherFieldsChanged =
          currentValues.title !== originalValues.title ||
          currentValues.description !== originalValues.description ||
          JSON.stringify(currentValues.dueDate) !== JSON.stringify(originalValues.dueDate) ||
          currentValues.priority !== originalValues.priority ||
          currentValues.documentRequired !== originalValues.documentRequired;

        return otherFieldsChanged;
      }
    }

    return JSON.stringify(currentValues) !== JSON.stringify(originalValues);
  });

  readonly canUpdateTask = computed(() => {
    if (!this.taskForm) return false;
    const isEdit = !!this.task;
    const basicFormValid = this.formValiditySignal();
    const formChanged = isEdit ? this.isFormDirty() : true;
    const assigneeValid = this.validateCurrentAssigneeSelectionPure();
    const notSubmitting = !this.submitLoading();
    const notUploadingFiles = !this.hasAnyUploadsInProgress();
    const notProcessingExternal = !this.externalUserLoading();

    return basicFormValid && formChanged && assigneeValid && notSubmitting && notUploadingFiles && notProcessingExternal;
  });

  private validateCurrentAssigneeSelectionPure(): boolean {
    const effectiveAssigneeType = this.effectiveAssigneeType();
    const formValue = this.formValueSignal();
    const assigneeValue = formValue?.assignee;

    if (effectiveAssigneeType === 'INTERNAL') {
      const userList = this.taskStateService.userMasterList();

      if (!assigneeValue) {
        return false;
      }

      if (userList.length === 0) {
        return false;
      }

      const isValid = userList.some(user =>
        user.applicationUserId.toString() === assigneeValue.toString()
      );
      return isValid;

    } else if (effectiveAssigneeType === 'DATA_SUBJECT') {
      if (!assigneeValue) {
        const dataSubjectOptions = this.taskService.getDataRequestOptions();
        return dataSubjectOptions.length > 0;
      }

      const dataSubjectOptions = this.taskService.getDataRequestOptions();
      const isValid = dataSubjectOptions.some(option =>
        option.value.toString() === assigneeValue.toString()
      );
      return isValid;

    } else if (effectiveAssigneeType === 'EXTERNAL') {
      const externalUser = this.externalUser();
      const isValid = !!externalUser?.applicationUserId;
      return isValid;
    }
    return false;
  }

  readonly canSubmitForm = computed(() => {
    if (!this.taskForm) return false;

    const effectiveAssigneeType = this.effectiveAssigneeType();
    const basicFormValid = this.taskForm.valid;
    const notSubmitting = !this.submitLoading();
    const notUploadingFiles = !this.hasAnyUploadsInProgress();
    const notProcessingExternal = !this.externalUserLoading();
    let assigneeValid = false;

    if (effectiveAssigneeType === 'INTERNAL') {
      assigneeValid = !!this.taskForm.get('assignee')?.value;
    } else if (effectiveAssigneeType === 'DATA_SUBJECT') {
      assigneeValid = !!this.taskForm.get('assignee')?.value;
    } else if (effectiveAssigneeType === 'EXTERNAL') {
      assigneeValid = !!this.externalUser()?.applicationUserId;
    }

    return basicFormValid && assigneeValid && notSubmitting && notUploadingFiles && notProcessingExternal;
  });

  readonly currentStep = signal<number>(0);
  emailTemplateForm!: FormGroup
  readonly notificationForm = signal<FormGroup>(this.fb.group({}));
  readonly templateLoading = signal<boolean>(false);
  readonly emailTemplate = signal<EmailTemplates | null>(null);
  readonly renderedContent = signal<string>('');
  readonly protectedVariables = signal<string[]>([]);
  readonly templateId = signal<string>('');

  private showNotificationStepSignal = signal<boolean>(false);

  readonly shouldShowNotificationStep = computed(() => {
    if (!this.taskForm) return false;
    const effectiveType = this.effectiveAssigneeType();
    const isDataSubjectTask = effectiveType === 'DATA_SUBJECT';
    const isValidDialogType = this.dialogType == RequestDialogTypes.DATA_FULFILLMENT_TASK ||
      this.dialogType == RequestDialogTypes.TASK_MANAGEMENT_TASK;
    return isValidDialogType && isDataSubjectTask && !this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask;
  });

  readonly currentTemplateId = computed(() => {
    const effectiveType = this.effectiveAssigneeType();

    if (this.data.componentStage === RequestDisplayStage.REQUEST_VERIFICATION) {
      return EmailTemplateId.IDENTITY_VERIFICATION_NEEDED;
    }
    return EmailTemplateId.ADDITIONAL_DETAILS_NEEDED;
  });

  readonly isTemplateLoaded = computed(() =>
    !!this.emailTemplate() && !!this.renderedContent() && this.renderedContent().length > 0 && this.templateLoadedSignal()
  );

  onEmailTemplateContentChange(): void {
    const emailForm = this.emailTemplateForm
    const notificationForm = this.notificationForm();

    if (emailForm.get('subject')?.value) {
      notificationForm.patchValue({
        subject: emailForm.get('subject')?.value
      });
    }

    if (emailForm.get('content')?.value) {
      notificationForm.patchValue({
        content: emailForm.get('content')?.value
      });
    }
  }

  onEmailTemplateKeyDown(event: KeyboardEvent): void {
    // Handle any special key events if needed
  }

  readonly canProceedToTaskForm = computed(() => {
    if (this.currentStep() === 1 && this.shouldShowNotificationStep()) {
      const notificationForm = this.notificationForm();
      const emailForm = this.emailTemplateForm

      const notificationValid = notificationForm.get('sendNotification')?.value ?
        notificationForm.get('recipientEmail')?.valid : true;
      const emailValid = notificationForm.get('sendNotification')?.value ?
        emailForm.valid : true;
      return notificationValid && emailValid && !this.templateLoading();
    }
    return true;
  });

  readonly isTaskFormStep = computed(() =>
    this.currentStep() === 0
  );

  readonly isNotificationStep = computed(() =>
    this.currentStep() === 1 && this.shouldShowNotificationStep()
  );

  readonly canCreateTask = computed(() => {
    if (!this.taskForm) return false;

    const effectiveType = this.effectiveAssigneeType();
    const notSubmitting = !this.submitLoading();
    const notUploadingFiles = !this.hasAnyUploadsInProgress();
    const notProcessingExternal = !this.externalUserLoading();
    const basicFormValid = this.isFormValidForSubmission();
    const assigneeValid = this.validateCurrentAssigneeSelectionPure();

    const canCreate = basicFormValid && assigneeValid && notSubmitting && notUploadingFiles && notProcessingExternal;
    return canCreate;
  });

  private isFormValidForSubmission(): boolean {
    if (!this.taskForm) return false;

    const formValue = this.formValueSignal();
    const effectiveType = this.effectiveAssigneeType();

    const titleControl = this.taskForm.get('title');
    const descriptionControl = this.taskForm.get('description');
    const dueDateControl = this.taskForm.get('dueDate');
    const priorityControl = this.taskForm.get('priority');
    const assigneeTypeControl = this.taskForm.get('assigneeType');

    const titleValid = titleControl?.valid ?? false;
    const descriptionValid = descriptionControl?.valid ?? false;
    const dueDateValid = dueDateControl?.valid ?? false;
    const priorityValid = priorityControl?.valid ?? false;
    const assigneeTypeValid = assigneeTypeControl?.valid ?? false;

    let externalEmailValid = true;
    if (effectiveType === 'EXTERNAL' && this.showExternalUserInput()) {
      const externalEmailControl = this.taskForm.get('externalEmail');
      externalEmailValid = externalEmailControl?.valid ?? false;
    }

    let coreFormValid = titleValid && descriptionValid && dueDateValid &&
      priorityValid && assigneeTypeValid && externalEmailValid;

    if (this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask) {
      const measureControl = this.taskForm.get('measureId');
      const measureValid = measureControl?.valid ?? false;
      coreFormValid = coreFormValid && measureValid;
    }

    return coreFormValid;
  }

  readonly isExternalUserFormValid = computed(() => {
    const assigneeType = this.taskForm?.get('assigneeType')?.value;
    if (assigneeType !== 'EXTERNAL') return true;
    const emailValue = this.taskForm?.get('externalEmail')?.value;
    const emailValid = this.taskForm?.get('externalEmail')?.valid;
    const userSelected = !!this.externalUser()?.applicationUserId;
    return emailValue && emailValid && userSelected;
  });

  readonly isExternalEmailDataSubject = signal<boolean>(false);
  readonly isExternalEmailThirdParty = signal<boolean>(false);
  minToDateFilter = new Date()
  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExtendedDialogData
  ) {
    let today = new Date();
    today.setHours(23, 59, 9);
    this.minToDateFilter = today;
    this.requestRid = data.requestRid;
    this.dialogTitle = data.dialogTitle;
    this.dialogType = data.dialogType;
    this.task = data.task;
    this.parentTaskId = data.parentTaskId ?? 0;
    this.dsrRequestDetails = data.dsrRequestDetails;
    this.initializeNotificationWorkflow();

    this.isRiskMitigation = data.isRiskMitigation || false;
    this.isQuestionTask = data.isQuestionTask || false;
    this.questionData = data.questionData;
    this.isMeasureTask = data.isMeasureTask || false;
    this.measureData = data.measureData;

    if (this.isRiskMitigation || this.isQuestionTask || this.isMeasureTask) {
      this.measures = data.measures || [];
      this.assessmentId = data.assessmentId;

      if (this.isMeasureTask && this.measureData) {
        this.selectedMeasureId = this.measureData.id;
      }
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isInitialLoading.set(true);
      await this.initializeComponent();
      this.loadInternalUsersOnly();

      if (this.shouldShowNotificationStep()) {
        this.initializeNotificationForm();
      }
      this.setupAssigneeTypeWatcher();
      if (this.isNotificationStep()) {
        await this.loadEmailTemplate();
      }

      if (this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask) {
        this.initializeRiskMitigationForm();
      }
    } finally {
      setTimeout(() => {
        this.isInitialLoading.set(false);
      }, 800);
    }
  }

  private initializeRiskMitigationForm(): void {
    const measureControl = this.taskForm.get('measureId') as FormControl;
    measureControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.selectedMeasureId = value || null;
      this.formValueSignal.set(this.taskForm.getRawValue());
    });
  }

  ngOnDestroy(): void {
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }
    this.externalUserCache.clear();
    this.templateVariableCache.clear();
    this.taskStateService.setDocumentAutocompleteOpen(false);
    this.taskStateService.clearSelectedDocuments();
    this.taskStateService.setUploadedFiles([]);
    this.taskStateService.clearExternalUserState();
    this.taskStateService.resetDocumentUploadProgress();
    this.internalUserControl.setValue('');
    this.taskStateService.clearInternalUserState();

    this.documentService.reset();
  }
  private getTemplateCacheKey(): string {
    const effectiveType = this.effectiveAssigneeType();
    const stage = this.data.componentStage;
    const templateId = this.currentTemplateId();
    return `${effectiveType}_${stage}_${templateId}`;
  }

  async loadEmailTemplate(): Promise<void> {
    if (this.isRiskMitigation) {
      return;
    }

    const templateId = this.currentTemplateId();
    if (!templateId) {
      console.warn('No template ID available');
      return;
    }

    const cacheKey = this.getTemplateCacheKey();

    if (this.templateVariableCache.has(cacheKey) && this.isTemplateLoaded()) {
      this.updateRecipientInEmailContent(this.selectedRecipientData, this.selectedRecipientData);
      return;
    }

    if (this.templateLoading()) {
      return;
    }

    this.templateLoading.set(true);
    this.templateLoadedSignal.set(false);

    try {
      if (!this.dsrRequestDetails && this.requestRid) {
        await this.loadDsrRequestDetails(this.requestRid);
      }

      const currentFormValues = this.taskForm?.getRawValue();
      const recipientDetail = recipientDetails(this.data.dsrRequestDetails || null);
      const dialogConfig: ViewTypeDialogConfig = {
        dialogType: this.data.dialogType || 'CREATE_TASK',
        requestId: this.data.requestRid?.toString() || '0',
        dialogTitle: this.data.dialogTitle || 'Task Notification',
        positiveButtonLabel: 'Confirm',
        negativeButtonLabel: 'Cancel',
        extensionDetails: this.data.dsrRequestDetails?.extensionDetails || {
          isExtended: false,
          extensionDays: 0,
          extensionReason: '',
          extensionRequestedBy: 0,
          extensionRequestedByUserName: '',
          remainingExtensionDays: 0
        },
        dsrRequestDetails: this.dsrRequestDetails || this.data.dsrRequestDetails || {} as DsrRequestDetails,
        emailTemplateData: {
          recipientEmail: recipientDetail?.recipientEmail,
          dataSubjectName: recipientDetail?.dataSubjectName,
          taskTitle: currentFormValues?.title || this.task?.title || 'New Task',
          taskDescription: currentFormValues?.description || this.task?.description || '',
          dueDate: this.getFormattedDueDate(currentFormValues?.dueDate),
          stage: this.data.componentStage
        },
        event: 'TASK_NOTIFICATION',
        remarks: '',
        typeOfRequest: this.getTypeOfRequest(),
        templateId,
        extensionDays: this.data.dsrRequestDetails?.extensionDetails?.extensionDays || 0,
        deliveryMethod: '',
        exemptionBasis: '',
        dataProtectionAuthority: '',
        completionDetails: '',
        submissionDate: this.getSubmissionDate(),
        lawReference: '',
        complaintDescription: '',
        resolutionSummary: ''
      };

      const templateData = await getEmailTemplate(this.apiHelperService, dialogConfig);

      if (templateData) {
        this.emailTemplate.set(templateData.template);
        this.protectedVariables.set(templateData.template.templateVariables || []);

        this.emailTemplateForm.patchValue(templateData.templateData);
        this.renderedContent.set(templateData.renderedContent);

        this.notificationForm().patchValue({
          subject: templateData.templateData.subject,
          content: templateData.templateData.content
        });

        this.templateVariableCache.set(cacheKey, {
          content: templateData.templateData.content,
          subject: templateData.templateData.subject
        });

        this.templateLoadedSignal.set(true);

        setTimeout(() => {
          this.updateRecipientInEmailContent(this.selectedRecipientData, this.selectedRecipientData);
        }, 50);
      }
    } catch (error) {
      console.error('Failed to load email template:', error);
      this.snackbarService.openSnack('Failed to load notification template');
    } finally {
      this.templateLoading.set(false);
    }
  }


  getCancelButtonText(): string {
    return 'Cancel';
  }

  handlePrimaryAction(): void {
    const effectiveType = this.effectiveAssigneeType();
    const currentStepValue = this.currentStep();

    if (effectiveType === 'DATA_SUBJECT' && currentStepValue === 0) {
      this.onNextStep();
    } else {
      this.onSubmit();
    }
  }

  handleSecondaryAction(): void {
    if (this.isNotificationStep()) {
      this.onPreviousStep();
    } else {
      this.closeDialog();
    }
  }

  private async initializeComponent(): Promise<void> {
    const isEditMode = !!this.task;

    if (this.isTaskFormDialog()) {
      if (isEditMode) {
        await this.initializeEditMode();
      } else {
        await this.initializeCreateMode();
      }

      await this.initializeTaskForm();
      this.isFormDataLoading.set(false);
    } else if (this.dialogType === RequestDialogTypes.DATA_FULFILLMENT_VIEW) {
      await this.loadDataFulfillmentRecords();
      this.isDataFulfillmentLoading.set(false);
    }
  }

  private async loadDsrRequestDetails(requestRid: number): Promise<void> {
    if (this.isRiskMitigation || this.isQuestionTask || this.isMeasureTask) {
      return;
    }

    try {
      const data = await this.apiHelperService.getDsrRequestDetails(requestRid, { isDraft: false });
      if (data) {
        this.taskStateService.setDsrRequestDetails(data);
        if (data.dsrFormRequestedUserDetails) {
          this.taskStateService.setDsrFormRequestedUser(data.dsrFormRequestedUserDetails);
        }
      }
    } catch (error) {
      console.error('Failed to load DSR request details:', error);
      this.snackbarService.openSnack('Failed to load request details');
    }
  }

  private async initializeEditMode(): Promise<void> {
    const userMasterListEmpty = this.taskStateService.userMasterList().length === 0;
    const hasDocumentAttached = !!(this.task?.documentAttached && this.task.documentAttached.length > 0);
    const hasDocumentUploaded = !!(this.task?.documentUploaded && this.task.documentUploaded.length > 0);
    const hasDocumentIds = !!(this.task?.documents && this.task.documents.length > 0);

    const loadPromises: Promise<any>[] = [];
    if (!this.dsrRequestDetails) {
      loadPromises.push(this.loadDsrRequestDetails(this.requestRid));
    } else {
      this.taskStateService.setDsrRequestDetails(this.dsrRequestDetails);
      if (this.dsrRequestDetails.dsrFormRequestedUserDetails) {
        this.taskStateService.setDsrFormRequestedUser(this.dsrRequestDetails.dsrFormRequestedUserDetails);
      }
    }

    if (userMasterListEmpty) {
      loadPromises.push(this.loadUserMasterListForEdit());
    }

    if (!this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask) {
      if (hasDocumentAttached) {
        this.createDocumentOptionsFromAttached();
      } else if (hasDocumentIds || (!hasDocumentAttached && !hasDocumentIds)) {
        if (this.data.documentsList && this.data.documentsList.length > 0) {
          this.initializeDocumentsFromList();
          if (hasDocumentIds) {
            this.taskStateService.setSelectedDocumentIds(this.task!.documents!);
          }
        } else {
          loadPromises.push(this.loadDocumentsAndSelectExisting());
        }
      }
    }

    if (loadPromises.length > 0) {
      await Promise.allSettled(loadPromises);
    }
  }

  private createDocumentOptionsFromAttached(): void {
    if (!this.task?.documentAttached || !Array.isArray(this.task.documentAttached) || this.task.documentAttached.length === 0) {
      return;
    }

    const documentOptions = this.task.documentAttached.map((path: string, index: number) => ({
      id: `attached_${index}`,
      name: this.extractFileNameFromPath(path),
      fullPath: path
    }));

    this.taskStateService.setAvailableDocuments(documentOptions);
    this.taskStateService.setSelectedDocumentIds(documentOptions.map(doc => doc.id));

    this.taskStateService.setDocumentSearchState({
      isSearching: false,
      hasMore: false,
      currentPage: 1,
      totalCount: documentOptions.length,
      lastSearchTerm: ''
    });
  }

  private extractFileNameFromPath(path: string): string {
    if (!path) return 'Unknown Document';

    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/^dsr_document_upload_\d+\./, '').replace(/_/g, ' ') || 'Document';
  }

  private async loadDocumentsAndSelectExisting(): Promise<void> {
    try {
      await this.documentService.initializeDocumentList(this.requestRid);
      if (this.task?.documents && this.task.documents.length > 0) {
        this.taskStateService.setSelectedDocumentIds(this.task.documents);
      }
    } catch (error) {
      console.error('Failed to load and select existing documents:', error);
    }
  }

  private initializeDocumentsFromList(): void {
    if (!this.data.documentsList || this.data.documentsList.length === 0) {
      return;
    }

    this.taskStateService.setAvailableDocuments(this.data.documentsList);
    this.taskStateService.setDocumentSearchState({
      isSearching: false,
      hasMore: false,
      currentPage: 1,
      totalCount: this.data.documentsList.length,
      lastSearchTerm: ''
    });
  }

  private async initializeCreateMode(): Promise<void> {
    if (this.dsrRequestDetails) {
      this.taskStateService.setDsrRequestDetails(this.dsrRequestDetails);
      if (this.dsrRequestDetails.dsrFormRequestedUserDetails) {
        this.taskStateService.setDsrFormRequestedUser(this.dsrRequestDetails.dsrFormRequestedUserDetails);
      }

      await this.initializeTaskFormWithData(
        this.dialogType as any,
        this.requestRid,
        undefined,
        this.dsrRequestDetails
      );
    } else {
      const nonRequestDetails = this.isRiskMitigation || this.isQuestionTask || this.isMeasureTask
      await this.taskService.initializeTaskForm(
        this.dialogType as any,
        this.requestRid,
        undefined,
        false,
        nonRequestDetails
      );
    }

    if (!this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask) {
      if (this.data.documentsList && this.data.documentsList.length > 0) {
        this.initializeDocumentsFromList();
      } else {
        await this.documentService.initializeDocumentList(this.requestRid, false, this.isRiskMitigation);
      }
    }
  }

  async initializeTaskFormWithData(
    dialogType: DialogType,
    requestRid: number,
    task?: RequestTask,
    dsrRequestDetails?: DsrRequestDetails,
    isEditMode: boolean = false
  ): Promise<void> {
    this.taskStateService.setSubmitLoading(false);
    this.taskStateService.clearFormErrors();

    if (this.isTaskFormDialog()) {
      if (!isEditMode) {
        await this.loadUserMasterListForEdit();

        if (!this.isRiskMitigation) {
          if (this.data.documentsList && this.data.documentsList.length > 0) {
            this.initializeDocumentsFromList();
          } else {
            await this.documentService.loadInitialDocuments();
          }
        }

        if (dsrRequestDetails) {
          this.taskStateService.setDsrRequestDetails(dsrRequestDetails);
          if (dsrRequestDetails.dsrFormRequestedUserDetails) {
            this.taskStateService.setDsrFormRequestedUser(dsrRequestDetails.dsrFormRequestedUserDetails);
          }
        } else {
          await this.loadDsrRequestDetails(requestRid);
        }
      }

      if (task?.attachments) {
        this.taskStateService.setUploadedFiles([...task.attachments]);
      }
    }
  }

  private async loadUserMasterListForEdit(userTypes?: string[]): Promise<void> {
    try {
      const users = await this.userService.getAllUserMasterList(false, userTypes);
      this.taskStateService.setUserMasterList(users);
    } catch (error) {
      console.error('Failed to load user list for edit mode:', error);
    }
  }

  private isTaskFormDialog(): boolean {
    return this.dialogType === RequestDialogTypes.DATA_FULFILLMENT_TASK ||
      this.dialogType === RequestDialogTypes.TASK_MANAGEMENT_TASK;
  }

  getShimmerDialogType(): 'TASK_FORM' | 'DATA_FULFILLMENT_VIEW' {
    if (this.dialogType === RequestDialogTypes.DATA_FULFILLMENT_VIEW) {
      return 'DATA_FULFILLMENT_VIEW';
    }
    return 'TASK_FORM';
  }


  private async initializeTaskForm(): Promise<void> {
    const isEditMode = !!this.task;
    const dueDateValidators = isEditMode ? [] : [TaskValidators.futureDateOnly()];

    this.taskForm = this.fb.group({
      title: [
        this.task?.title || '',
        [Validators.required, TaskValidators.taskTitle()]
      ],
      description: [
        this.task?.description || '',
        [Validators.required, TaskValidators.taskDescription()]
      ],
      dueDate: [
        this.task?.dueDate ? TaskUtils.parseDate(this.task.dueDate) : null,
        dueDateValidators
      ],
      task: [
        'DSR_TASK',
        [Validators.required]
      ],
      priority: [
        this.task?.priority || 'MEDIUM',
        [Validators.required]
      ],
      assigneeType: [
        this.task?.assigneeType || 'INTERNAL',
        [Validators.required]
      ],
      assignee: [
        { value: this.task?.assignToUserId || '', disabled: false }
      ],
      externalEmail: ['', [Validators.email]],
      documents: [
        this.task?.documents || []
      ],
      attachments: [this.uploadedFiles()],
      documentRequired: [
        this.task?.documentRequired ?? false
      ]
    });

    if (this.isRiskMitigation && !this.isQuestionTask && !this.isMeasureTask) {
      this.taskForm.addControl('measureId', new FormControl(null, [Validators.required]));
    }

    this.setupFormSubscriptions();

    this.taskForm.statusChanges.pipe(
      debounceTime(100),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formValiditySignal.set(this.taskForm.valid);
    });

    this.taskForm.valueChanges.pipe(
      debounceTime(50),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formValiditySignal.set(this.taskForm.valid);
      this.formValueSignal.set(this.taskForm.getRawValue());
      this.formDirtySignal.set(this.taskForm.dirty);
    });

    this.internalUserControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.taskStateService.setInternalUserSearchTerm(value);
        const currentAssignee = this.taskForm.get('assignee')?.value;
        if (currentAssignee) {
          this.taskForm.patchValue({ assignee: '' });
          this.formValueSignal.set(this.taskForm.getRawValue());
        }
      } else if (value && typeof value === 'object') {
        this.taskStateService.setInternalUserSearchTerm('');
      } else if (value === null || value === undefined || value === '') {
        this.taskStateService.setInternalUserSearchTerm('');

        const currentAssignee = this.taskForm.get('assignee')?.value;
        if (currentAssignee) {
          this.taskForm.patchValue({ assignee: '' });
          this.formValueSignal.set(this.taskForm.getRawValue());
        }
      }
    });

    if (this.task) {
      await this.setInitialFormValues();
    }

    const initialAssigneeType = this.taskForm.get('assigneeType')?.value || 'INTERNAL';
    this.assigneeTypeSignal.set(initialAssigneeType);

    setTimeout(() => {
      this.onAssigneeTypeChange(initialAssigneeType);
    }, 100);

    this.formValiditySignal.set(this.taskForm.valid);
    this.formValueSignal.set(this.taskForm.getRawValue());
    this.formDirtySignal.set(false);
  }
  private setupFormSubscriptions(): void {
    this.taskForm.get('assigneeType')?.valueChanges.subscribe((assigneeType: string) => {
      this.onAssigneeTypeChange(assigneeType);
    });

    this.taskForm.get('assignee')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      this.formValueSignal.set(this.taskForm.getRawValue());
    });

    this.taskForm.get('title')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formValueSignal.set(this.taskForm.getRawValue());
    });

    this.taskForm.get('description')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formValueSignal.set(this.taskForm.getRawValue());
    });
  }


  async onCreateInternalUser(): Promise<void> {
    const email = this.internalUserSearchTerm();

    if (!email || !this.validateEmail(email)) {
      this.snackbarService.openSnack('Please enter a valid email address');
      return;
    }

    this.taskStateService.setInternalUserLoading(true);
    this.taskStateService.setInternalUserError(null);

    try {
      const isAssessmentContext = this.assessmentId || this.isQuestionTask || this.isMeasureTask || this.isRiskMitigation;
      const purpose = isAssessmentContext ? USER_PURPOSE.ASSESSMENT_TASK : USER_PURPOSE.DSR_TASK;
      const response = await this.taskApiService.getOrCreateInternalUser(email, purpose).toPromise();

      if (response?.success && response?.data?.applicationUserId) {
        const fullName = response.data.displayName || email.split('@')[0];
        const userEmail = response.data.email || email;
        const userId = response.data.applicationUserId;

        const newUser: User = await this.userService.createAndAddInternalUser(userId, userEmail, fullName);
        const currentUsers = this.taskStateService.userMasterList();
        this.taskStateService.setUserMasterList([...currentUsers, newUser]);
        this.taskForm.patchValue({ assignee: newUser.applicationUserId.toString() });
        this.taskStateService.setInternalUserCreated(newUser);
        this.internalUserControl.setValue(newUser, { emitEvent: false });
        this.newUserIsCreated.internalUser = true
        this.snackbarService.openSnack('Internal user created and assigned successfully');
        setTimeout(() => {
          this.taskStateService.setInternalUserSearchTerm('');
        }, 100);

      } else {
        throw new Error(response?.message || 'Failed to create internal user');
      }
    } catch (error: any) {
      console.error('Internal user creation failed:', error);
      const errorMessage = error?.message || 'Failed to create internal user';
      this.taskStateService.setInternalUserError(errorMessage);
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.taskStateService.setInternalUserLoading(false);
    }
  }

  private async fetchExternalUserDetails(userId: number): Promise<void> {
    const placeholderUser: ExternalUser = {
      email: `external.user.${userId}@domain.com`,
      applicationUserId: userId,
      name: `External User ${userId}`
    };

    this.taskStateService.setExternalUser(placeholderUser);
  }

  private normalizePriority(priority: string): string {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const normalizedPriority = priority.toUpperCase();

    return validPriorities.includes(normalizedPriority) ? normalizedPriority : 'MEDIUM';
  }

  private getExternalEmail(assigneeType?: string): string {
    const effectiveAssigneeType = assigneeType || this.mapApiAssigneeTypeToForm(this.task?.assignToUserType || '');

    if (!this.task || effectiveAssigneeType !== 'EXTERNAL') {
      return '';
    }
    return this.extractEmailFromUserName(this.task.assignToUserName || '');
  }

  private mapApiAssigneeTypeToForm(apiAssigneeType: string): string {
    const mapping: { [key: string]: string } = {
      'INTERNAL': 'INTERNAL_USER',
      'EXTERNAL': 'EXTERNAL_USER',
      'DATA_SUBJECT': 'DSR_FORM_USER'
    };

    return mapping[apiAssigneeType] || 'INTERNAL';
  }

  getAssigneeOptions(): AssigneeOption[] {
    const assigneeType = this.taskForm.get('assigneeType')?.value;

    if (assigneeType === 'INTERNAL') {
      return this.filteredInternalUsersExcludingCurrent().map(user => ({
        value: user.applicationUserId.toString(),
        label: `${user.displayName}`
      }));
    } else if (assigneeType === 'DATA_SUBJECT') {
      return this.taskService.getDataRequestOptions();
    }

    return [];
  }

  private getAssigneeValue(assigneeType: string): string {
    if (!this.task) return '';

    switch (assigneeType) {
      case 'INTERNAL':
      case 'DATA_SUBJECT':
        return this.task.assignToUserId?.toString() || '';
      case 'EXTERNAL':
        return '';
      default:
        return '';
    }
  }

  private async reconstructExternalUserState(): Promise<void> {
    if (!this.task?.assignToUserId || this.isReconstructingExternalUser) return;
    const cachedUser = this.externalUserCache.get(this.task.assignToUserId);
    if (cachedUser) {
      this.taskStateService.setExternalUser(cachedUser);
      return;
    }

    this.isReconstructingExternalUser = true;

    let userEmail: string;
    let userName: string;

    if (!this.task.assignToUserName || this.task.assignToUserName.trim() === '') {
      try {
        this.taskStateService.setExternalUserLoading(true);

        const userDetails = await this.userService.getUserById(this.task.assignToUserId);

        if (userDetails) {
          userEmail = userDetails.email || `external.user.${this.task.assignToUserId}@domain.com`;
          userName = userDetails.email ||
            `${userDetails.displayName || ''}`.trim() ||
            `External User (ID: ${this.task.assignToUserId})`;
        } else {
          userEmail = `external.user.${this.task.assignToUserId}@domain.com`;
          userName = `External User (ID: ${this.task.assignToUserId})`;
        }
      } catch (error) {
        console.error('Failed to fetch external user details:', error);
        userEmail = `external.user.${this.task.assignToUserId}@domain.com`;
        userName = `External User (ID: ${this.task.assignToUserId})`;
      } finally {
        this.taskStateService.setExternalUserLoading(false);
      }
    } else {
      userEmail = this.extractEmailFromUserName(this.task.assignToUserName);
      userName = this.task.assignToUserName;
    }

    const externalUser: ExternalUser = {
      email: userEmail,
      applicationUserId: this.task.assignToUserId,
      name: userName
    };

    this.externalUserCache.set(this.task.assignToUserId, externalUser);
    this.taskStateService.setExternalUser(externalUser);
    this.isReconstructingExternalUser = false;
  }


  private async setInitialFormValues(): Promise<void> {
    if (!this.task) {
      console.warn('No task data available for form initialization');
      return;
    }

    const formAssigneeType = this.mapApiAssigneeTypeToForm(this.task.assignToUserType || '');
    const dueDate = this.task.dueDate && this.task.dueDate.trim() !== '' ?
      TaskUtils.parseDate(this.task.dueDate) : null;
    const normalizedPriority = this.normalizePriority(this.task.priority || 'MEDIUM');

    if (formAssigneeType === 'EXTERNAL') {
      await this.reconstructExternalUserState();
    }

    const externalEmail = formAssigneeType === 'EXTERNAL'
      ? this.getExternalEmailForEdit()
      : this.getExternalEmail(formAssigneeType);

    const formValues = {
      title: this.task.title || '',
      description: this.task.description || '',
      dueDate: dueDate,
      taskType: 'DSR_TASK',
      priority: normalizedPriority,
      assigneeType: formAssigneeType,
      assignee: this.getAssigneeValue(formAssigneeType),
      externalEmail: externalEmail,
      documents: this.getDocumentIds(),
      documentRequired: Boolean(this.task.documentRequired)
    };

    this.taskForm.patchValue(formValues, { emitEvent: false });
    this.assigneeTypeSignal.set(formAssigneeType);
    if (formAssigneeType === 'INTERNAL' && this.task.assignToUserId) {
      const userList = this.taskStateService.userMasterList();
      const assignedUser = userList.find(user =>
        user.applicationUserId.toString() === this.task!.assignToUserId!.toString()
      );

      if (assignedUser) {
        this.internalUserControl.setValue(assignedUser, { emitEvent: false });
      } else {
        console.warn('Assigned user not found in user master list, reloading users');
        await this.loadUserMasterListForEdit();
        const refreshedUserList = this.taskStateService.userMasterList();
        const refreshedAssignedUser = refreshedUserList.find(user =>
          user.applicationUserId.toString() === this.task!.assignToUserId!.toString()
        );

        if (refreshedAssignedUser) {
          this.internalUserControl.setValue(refreshedAssignedUser, { emitEvent: false });
        }
      }
    }

    this.handleDocumentAttachments();
    this.handleDocumentUploaded();
    this.taskService.onAssigneeTypeChange(this.mapFormAssigneeTypeToApi(formAssigneeType));
    setTimeout(() => {
      this.taskStateService.setOriginalFormState(this.taskForm.getRawValue());
    }, 0);
  }

  private getDocumentIds(): string[] {
    if (this.task?.documentAttached?.length) {
      return this.taskStateService.selectedDocumentIds();
    }
    return this.task?.documents || [];
  }

  private handleDocumentAttachments(): void {
    if (this.task?.documentAttached?.length) {
      return;
    }

    if (this.task?.documents && Array.isArray(this.task.documents)) {
      this.taskStateService.setSelectedDocumentIds(this.task.documents);
    }
  }

  private handleDocumentUploaded(): void {
    if (this.task?.documentUploaded && Array.isArray(this.task.documentUploaded) && this.task.documentUploaded.length > 0) {
      const taskUploads = this.task.documentUploaded.map((upload: any) => this.transformDocumentUpload(upload));
      this.taskStateService.setUploadedFiles(taskUploads);
      return;
    }

    if (this.task?.attachments && Array.isArray(this.task.attachments) && this.task.attachments.length > 0) {
      const taskAttachments = this.task.attachments.map(att => ({
        file: new File([], att.fileName || 'file'),
        fileName: att.fileKey || 'Unknown File',
        fileKey: att.fileKey || '',
        presignedUrl: '',
        isExisting: true
      }));
      this.taskStateService.setUploadedFiles(taskAttachments);
    }
  }

  private transformDocumentUpload(upload: any): TaskAttachment {
    if (typeof upload === 'string') {
      return {
        file: new File([], this.extractFileNameFromPath(upload)),
        fileName: this.extractFileNameFromPath(upload),
        fileKey: upload,
        presignedUrl: '',
        isExisting: true
      };
    }

    return {
      file: new File([], upload.fileName || upload.name || 'file'),
      fileName: upload.fileName || upload.name || 'Unknown File',
      fileKey: upload.fileKey || upload.key || upload.path || '',
      presignedUrl: upload.presignedUrl || '',
      fileSize: upload.fileSize || upload.size || 0,
      isExisting: true
    };
  }

  private getExternalEmailForEdit(): string {
    const externalUser = this.taskStateService.externalUser();
    if (externalUser?.email) {
      return externalUser.email;
    }
    if (this.task?.assignToUserName && this.task.assignToUserName.trim() !== '') {
      return this.extractEmailFromUserName(this.task.assignToUserName);
    }
    return '';
  }

  private mapFormAssigneeTypeToApi(formAssigneeType: string): AssigneeType {
    const mapping: { [key: string]: AssigneeType } = {
      'INTERNAL': 'INTERNAL_USER' as AssigneeType,
      'EXTERNAL': 'EXTERNAL_USER' as AssigneeType,
      'DATA_SUBJECT': 'DSR_FORM_USER' as AssigneeType
    };

    return mapping[formAssigneeType] || 'INTERNAL_USER';
  }



  onAssigneeTypeChange(assigneeType: string): void {
    const isEditMode = !!this.task;
    const currentFormAssigneeType = this.assigneeTypeSignal();

    const isActualChange = currentFormAssigneeType !== assigneeType;

    this.assigneeTypeSignal.set(assigneeType);

    if (assigneeType !== 'EXTERNAL') {
      this.isExternalEmailDataSubject.set(false);
      this.isExternalEmailThirdParty.set(false);
    }

    if (!isEditMode || isActualChange) {
      if (!isEditMode) {
        this.taskForm.patchValue({ assignee: '', externalEmail: '' });
      } else {
        const currentType = this.mapApiAssigneeTypeToForm(this.task?.assignToUserType || '');
        if (assigneeType !== currentType) {
          if (assigneeType !== 'EXTERNAL') {
            this.taskForm.patchValue({ externalEmail: '' });
          }
          if (assigneeType !== 'INTERNAL') {
            this.taskForm.patchValue({ assignee: '' });
            this.internalUserControl.setValue('');
          }
        }
      }
    }

    this.taskStateService.clearExternalUserState();

    const assigneeControl = this.taskForm.get('assignee');

    if (assigneeType === 'INTERNAL') {
      assigneeControl?.setValidators([Validators.required]);

      if (isActualChange || this.taskStateService.userMasterList().length === 0) {
        this.loadInternalUsersOnly();
      }

      this.taskService.onAssigneeTypeChange('APPLICATION_USER' as AssigneeType);

    } else if (assigneeType === 'EXTERNAL') {
      assigneeControl?.clearValidators();
      this.taskService.onAssigneeTypeChange('EXTERNAL_USER' as AssigneeType);
    } else if (assigneeType === 'DATA_SUBJECT') {
      assigneeControl?.clearValidators();
      this.taskService.onAssigneeTypeChange('DATA_SUBJECT' as AssigneeType);
    }

    assigneeControl?.updateValueAndValidity();
    if (isActualChange) {
      this.taskForm.markAsDirty();
    }

    this.taskForm.updateValueAndValidity();

    this.formValiditySignal.set(this.taskForm.valid);
    this.formValueSignal.set(this.taskForm.getRawValue());
  }


  private async loadInternalUsersOnly(): Promise<void> {
    try {
      const currentAssigneeValue = this.taskForm.get('assignee')?.value;
      const currentInternalUserValue = this.internalUserControl.value;

      const internalUsers = await this.userService.getAllUserMasterList(false, USER_TYPES);
      this.taskStateService.setUserMasterList(internalUsers || []);

      const isEditMode = !!this.task;
      if (!isEditMode) {
        this.taskForm.patchValue({ assignee: '' });
        this.internalUserControl.setValue('');
      } else if (currentAssigneeValue) {
        const isCurrentAssigneeValid = internalUsers?.some((user: User) =>
          user.applicationUserId.toString() === currentAssigneeValue.toString()
        );

        if (!isCurrentAssigneeValid) {
          this.taskForm.patchValue({ assignee: '' });
          this.internalUserControl.setValue('');
        }
      }
    } catch (error) {
      console.error('Failed to load internal users:', error);
      this.snackbarService.openSnack('Failed to load internal users');
    }
  }
  readonly hasValidUserMasterList = computed(() => {
    const userList = this.taskStateService.userMasterList();
    const hasUsers = userList.length > 0;

    if (!hasUsers) {
      console.warn(' User master list is empty');
    }

    return hasUsers;
  });

  readonly debugStateInfo = computed(() => {
    return {
      assigneeTypeSignal: this.assigneeTypeSignal(),
      showSubAssigneeDropdown: this.showSubAssigneeDropdown(),
      userMasterListLength: this.userMasterList().length,
      selectedAssigneeType: this.selectedAssigneeType(),
      isExternalUserSelected: this.isExternalUserSelected(),
      externalUser: this.externalUser(),
      formAssigneeType: this.taskForm?.get('assigneeType')?.value,
      formAssigneeValue: this.taskForm?.get('assignee')?.value
    };
  });

  getSubmitButtonText(): string {
    const effectiveType = this.effectiveAssigneeType();

    if (effectiveType === 'DATA_SUBJECT') {
      if (this.currentStep() === 0) {
        return 'Next';
      } else {
        return !this.submitLoading() ? (this.task ? 'Update Task' : 'Create Task') : '';
      }
    } else {
      return !this.submitLoading() ? (this.task ? 'Update Task' : 'Create Task') : '';
    }
  }

  private extractEmailFromUserName(userName: string): string {
    if (!userName) return '';
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(userName)) {
      return userName;
    }
    const emailMatch = userName.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : userName;
  }

  private autoAssignDataSubjectUser(): void {
    const dataSubjectOptions = this.taskService.getDataRequestOptions();
    if (dataSubjectOptions.length > 0) {
      const assigneeValue = dataSubjectOptions[0].value;
      this.taskForm.patchValue({ assignee: assigneeValue });
      this.formValueSignal.set(this.taskForm.getRawValue());

      this.taskForm.get('assignee')?.updateValueAndValidity();
    } else {
      console.warn(' No data subject options available');
    }
  }

  get assignedDataSubjectUser(): string {
    const assigneeType = this.taskForm.get('assigneeType')?.value;
    if (assigneeType === 'DATA_SUBJECT') {
      const dataSubjectOptions = this.taskService.getDataRequestOptions();
      return dataSubjectOptions.length > 0 ? dataSubjectOptions[0].label : 'No data subject available';
    }
    return '';
  }

  private getOriginalAssigneeValue(): string {
    if (!this.task) return '';

    const formAssigneeType = this.mapApiAssigneeTypeToForm(this.task.assignToUserType || '');

    if (formAssigneeType === 'EXTERNAL') {
      return '';
    }

    return this.task.assignToUserId?.toString() || '';
  }

  get taskActionText(): string {
    if (this.shouldShowNotificationStep()) {
      return this.task ? 'Edit Task' : 'Create Task';
    }
    return this.task ? 'Edit Task' : 'Create Task';
  }

  selectPriority(priority: string): void {
    this.taskForm.patchValue({ priority });
    this.formValueSignal.set(this.taskForm.getRawValue());
  }
  hasExternalEmailErrors(): boolean {
    const externalEmailControl = this.taskForm?.get('externalEmail');
    return !!(externalEmailControl?.errors && externalEmailControl?.touched);
  }

  async onSubmitExternalEmail(): Promise<void> {
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

    const currentUser = this.currentLoggedInUser();
    if (currentUser && currentUser.email && email.toLowerCase() === currentUser.email.toLowerCase()) {
      this.snackbarService.openSnack('You cannot assign a task to yourself');
      return;
    }

    const dsrUser = this.taskStateService.dsrFormRequestedUser();
    const dataSubjectPid = dsrUser?.pid?.trim();
    const thirdPartyEmail = this.dsrRequestDetails?.dsrDetails?.thirdPartyEmail?.trim();

    if (dataSubjectPid && email.toLowerCase() === dataSubjectPid.toLowerCase()) {
      this.isExternalEmailDataSubject.set(true);
      this.isExternalEmailThirdParty.set(false);
      this.taskStateService.clearExternalUserState();
      this.autoAssignDataSubjectUser();
      this.initializeNotificationForm();
      this.snackbarService.openSnack('Data subject email detected - configured for data subject workflow');
      return;
    }

    if (thirdPartyEmail && email.toLowerCase() === thirdPartyEmail.toLowerCase()) {
      this.isExternalEmailThirdParty.set(true);
    } else {
      this.isExternalEmailThirdParty.set(false);
    }

    this.isExternalEmailDataSubject.set(false);
    this.taskStateService.setExternalUserLoading(true);
    this.taskStateService.clearExternalUserError();

    try {
      const response = await this.taskApiService.getOrCreateExternalUser(email).toPromise();

      if (response?.success && response?.data?.applicationUserId) {
        const externalUser: ExternalUser = {
          email: email,
          applicationUserId: response.data.applicationUserId,
          name: email
        };

        this.taskStateService.setExternalUser(externalUser);
        this.snackbarService.openSnack('External user processed successfully');
        this.newUserIsCreated.externalUser = true
      } else {
        throw new Error(response?.message || 'Failed to process external user');
      }
    } catch (error: any) {
      console.error('External user lookup failed:', error);
      const errorMessage = error?.message || 'Failed to process external user';
      this.taskStateService.setExternalUserError(errorMessage);
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.taskStateService.setExternalUserLoading(false);
    }
  }

  clearExternalUser(): void {
    this.taskStateService.clearExternalUserState();
    this.isExternalEmailDataSubject.set(false);
    this.isExternalEmailThirdParty.set(false);
    this.taskForm.patchValue({ externalEmail: '', assignee: '' });
  }

  openDocumentDropdown(): void {
    this.taskStateService.setDocumentAutocompleteOpen(true);
  }

  toggleDocumentDropdown(): void {
    const isOpen = this.isDocumentAutocompleteOpen();
    this.taskStateService.setDocumentAutocompleteOpen(!isOpen);
  }

  closeDocumentDropdown(): void {
    this.taskStateService.setDocumentAutocompleteOpen(false);
  }

  async onDocumentSelectionChange(documentId: string, isSelected: boolean): Promise<void> {
    if (isSelected) {
      this.taskStateService.addSelectedDocument(documentId);
    } else {
      this.taskStateService.removeSelectedDocument(documentId);
    }

    this.updateFormDocuments();
  }

  async toggleDocumentSelection(documentId: string): Promise<void> {
    const isCurrentlySelected = this.taskStateService.selectedDocumentIds().includes(documentId);
    await this.onDocumentSelectionChange(documentId, !isCurrentlySelected);
  }


  removeDocumentSelection(documentId: string): void {
    this.taskStateService.removeSelectedDocument(documentId);
    this.updateFormDocuments();
  }

  clearAllSelectedDocuments(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.taskStateService.clearSelectedDocuments();
    this.updateFormDocuments();
  }

  loadMoreDocuments(): void {
    this.documentService.loadMoreDocuments();
  }

  onDocumentsScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const threshold = 50;

    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }

    this.scrollDebounceTimer = window.setTimeout(() => {
      const isNearBottom = (container.scrollTop + container.clientHeight) >=
        (container.scrollHeight - threshold);

      if (isNearBottom && this.canLoadMoreDocuments()) {
        this.documentService.loadMoreDocuments();
      }
    }, 10);
  }

  isDocumentSelected(documentId: string): boolean {
    return this.taskStateService.selectedDocumentIds().includes(documentId);
  }

  private updateFormDocuments(): void {
    const selectedIds = this.taskStateService.selectedDocumentIds();
    this.taskForm.patchValue({ documents: selectedIds });
    this.formValueSignal.set(this.taskForm.getRawValue());
  }

  getSelectedDocumentsCount(): number {
    return this.selectedDocumentCount();
  }

  clearDocumentSelection(): void {
    this.clearAllSelectedDocuments();
  }

  onDocumentScroll(e: Event) {
    const target = e.target as HTMLElement;
    const bottomReached = target.scrollHeight - target.scrollTop <= target.clientHeight;

    if (bottomReached && !this.documentPaginationLoading() && this.documentPageNo < this.documentTotalPages) {
      this.loadDocuments(this.documentPageNo + 1);
    }
  }

  async loadDocuments(pageNo: number = this.documentPageNo): Promise<void> {
    if (!this.requestRid || this.isRiskMitigation) return;

    if (pageNo > 1) {
      this.documentPaginationLoading.set(true);
    }
    const params = {
      page: pageNo,
      size: this.documentPageSize
    };

    try {
      const data = await this.taskApiService.getDocumentList(this.requestRid, params);

      if (data?.documents) {
        const documentOptions = data.documents.map(doc => ({
          id: doc.id.toString(),
          name: doc.name.split('/').pop() || doc.name,
          fullPath: doc.name
        }));

        if (pageNo === 1) {
          this.taskStateService.setAvailableDocuments(documentOptions);
        } else {
          const currentDocs = this.taskStateService.availableDocuments();
          this.taskStateService.setAvailableDocuments([...currentDocs, ...documentOptions]);
        }

        this.documentPageNo = pageNo;
        this.documentTotalPages = data.totalCount || 0;
        this.taskStateService.setDocumentSearchState({
          isSearching: false,
          hasMore: pageNo < this.documentTotalPages,
          currentPage: pageNo,
          totalCount: data.totalCount || 0,
          lastSearchTerm: ''
        });
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      this.snackbarService.openSnack('Failed to load documents');
    } finally {
      this.documentPaginationLoading.set(false);
    }
  }

  onFileDropped(fileList: FileList): void {
    if (this.shouldHideFileUpload()) return;
    this.taskStateService.setDragOver(false);
    this.fileUploadService.uploadFiles(fileList);
    this.updateFormAttachments();
  }

  onFileBrowse(event: Event): void {
    if (this.shouldHideFileUpload()) return;
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.fileUploadService.uploadFiles(input.files);
      this.updateFormAttachments();
    }
  }

  removeFile(index: number): void {
    this.fileUploadService.removeFile(index);
    this.updateFormAttachments();
  }

  private updateFormAttachments(): void {
    this.taskForm.get('attachments')?.setValue(this.uploadedFiles());
    this.formValueSignal.set(this.taskForm.getRawValue());
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  onDragOver(event: DragEvent): void {
    if (this.shouldHideFileUpload()) return;
    event.preventDefault();
    event.stopPropagation();
    this.taskStateService.setDragOver(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.shouldHideFileUpload()) return;
    event.preventDefault();
    event.stopPropagation();
    this.taskStateService.setDragOver(false);
  }


  onclick(event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = '';
  }

  private async loadDataFulfillmentRecords(): Promise<void> {
    if (this.task?.taskId) {
      await this.taskService.loadDataFulfillmentRecords(this.requestRid, this.task.taskId);
      const records = this.taskStateService.dataFulfillmentRecords();
      this.dataFullFillmentRecordList = new MatTableDataSource(records);
    }
  }

  onActionChange(record: RequestDataFulfillmentRecords): void {

  }

  getExcempted(record: RequestDataFulfillmentRecords): string {
    return record.exempted ? 'Exempted' : 'Not Exempted';
  }

  getActionStatus(record: RequestDataFulfillmentRecords): string {
    return record.approved ? 'Approved' : 'Rejected';
  }

  closeDialog(): void {
    this.taskStateService.clearSelectedDocuments();
    this.taskStateService.setDocumentAutocompleteOpen(false);
    this.taskStateService.setUploadedFiles([]);
    this.taskStateService.clearExternalUserState();
    if (this.taskForm) {
      this.taskForm.patchValue({ documents: [] });
    }

    this.internalUserControl.setValue('');
    this.taskStateService.clearInternalUserState();

    this.documentService.reset();
    this.taskService.resetState();
    this.dialogRef.close({ newUserIsCreated: this.newUserIsCreated });
  }

  onCancel(): void {
    this.taskForm.reset();
    this.internalUserControl.setValue('');
    this.taskStateService.setUploadedFiles([]);
    this.taskStateService.clearExternalUserState();
    this.taskStateService.clearInternalUserState();
    this.taskStateService.clearSelectedDocuments();
    this.closeDialog();
  }

  searchFilter(): void {
  }

  trackByDocumentId(index: number, document: any): string {
    return document.id;
  }

  private initializeNotificationWorkflow(): void {
    this.currentStep.set(0);
  }

  private determineTemplateScenario(): boolean {
    const stage = this.data.componentStage;
    if (this.dialogType === RequestDialogTypes.DATA_FULFILLMENT_TASK ||
      this.dialogType === RequestDialogTypes.TASK_MANAGEMENT_TASK) {
      return true;
    }

    return false;
  }

  private initializeNotificationForm(): void {
    if (this.userEmailInfo) {
      this.showReceipient = true
    }
    const form = this.fb.group({
      sendNotification: [true],
      recipientEmail: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      content: ['', Validators.required]
    });

    const initialRecipientEmail = this.determineInitialRecipientEmail();
    if (initialRecipientEmail) {
      form.patchValue({
        recipientEmail: initialRecipientEmail
      });
    }

    this.notificationForm.set(form);
    this.emailTemplateForm = buildEmailTemplateForm(this.fb);
    if (this.showReceipient) {
      this.emailTemplateForm.get('recipientEmail')?.enable()
      // this.prepareRecipientEmailOptions()
    }
  }

  private determineInitialRecipientEmail(): string {
    if (!this.dsrRequestDetails) return '';

    const isThirdParty = this.dsrRequestDetails.dsrDetails?.isRequestedByThirdParty;
    const pid = this.dsrRequestDetails.dsrFormRequestedUserDetails?.pid?.trim();
    const thirdPartyEmail = this.dsrRequestDetails.dsrDetails?.thirdPartyEmail?.trim();
    const thirdPartyName = this.thirdPartyFullName;
    const firstPartyFullName = this.firstPartyFullName;

    if (!isThirdParty) {
      this.selectedRecipientData = {
        email: pid || '',
        name: firstPartyFullName,
        type: 'data_subject'
      };
      return pid || '';
    }
    const hasPid = pid && pid !== '';
    const hasThirdPartyEmail = thirdPartyEmail && thirdPartyEmail !== '';
    if (hasPid && hasThirdPartyEmail) {
      this.selectedRecipientData = {
        email: pid,
        name: firstPartyFullName,
        type: 'data_subject'
      };
      return pid;
    } else if (hasPid) {
      this.selectedRecipientData = {
        email: pid,
        name: firstPartyFullName,
        type: 'data_subject'
      };
      return pid;
    } else if (hasThirdPartyEmail) {
      this.selectedRecipientData = {
        email: thirdPartyEmail,
        name: thirdPartyName,
        type: 'third_party'
      };
      return thirdPartyEmail;
    }

    return '';
  }

  private getRecipientEmail(): string {
    const notificationEmail = this.notificationForm().get('recipientEmail')?.value;
    if (notificationEmail && notificationEmail.trim() !== '') {
      return notificationEmail.trim();
    }
    if (this.selectedRecipientData?.email && this.selectedRecipientData.email.trim() !== '') {
      return this.selectedRecipientData.email.trim();
    }
    const dsrEmail = this.dsrRequestDetails?.dsrFormRequestedUserDetails?.pid ||
      this.data.dsrRequestDetails?.dsrFormRequestedUserDetails?.pid;
    if (dsrEmail && dsrEmail.trim() !== '') {
      return dsrEmail.trim();
    }

    return '';
  }

  refreshTemplateContent(): void {
    if (this.shouldShowNotificationStep() && this.currentStep() === 1) {
      this.updateRecipientInEmailContent(this.selectedRecipientData, this.selectedRecipientData);
    }
  }

  private getDataSubjectName(): string {
    if (this.selectedRecipientData?.name && this.selectedRecipientData.name.trim() !== '') {
      return this.selectedRecipientData.name;
    }

    const dsrDetails = this.dsrRequestDetails?.dsrDetails || this.data.dsrRequestDetails?.dsrDetails;

    if (this.selectedRecipientData?.type === 'third_party') {
      const thirdPartyName = this.thirdPartyFullName;
      if (thirdPartyName && thirdPartyName.trim() !== '') {
        return thirdPartyName;
      }
    }

    if (this.selectedRecipientData?.type === 'data_subject') {
      const firstPartyName = this.firstPartyFullName;
      if (firstPartyName && firstPartyName.trim() !== '') {
        return firstPartyName;
      }
    }

    const recipientEmail = this.getRecipientEmail();
    if (recipientEmail && recipientEmail.includes('@')) {
      return recipientEmail.split('@')[0].replace(/[._-]/g, ' ');
    }
    return this.selectedRecipientData?.type === 'third_party' ? 'Third Party' : 'Data Subject';
  }

  private getFormattedDueDate(dueDate: any): string {
    if (dueDate) {
      return TaskUtils.formatDate(dueDate);
    }
    if (this.task?.dueDate) {
      return TaskUtils.formatDate(TaskUtils.parseDate(this.task.dueDate));
    }
    return '';
  }

  private getTypeOfRequest(): string {
    const dsrDetails = this.dsrRequestDetails?.dsrDetails || this.data.dsrRequestDetails?.dsrDetails;
    return dsrDetails?.rightName || 'DSR';
  }

  private getSubmissionDate(): string {
    const dsrDetails = this.dsrRequestDetails?.dsrDetails || this.data.dsrRequestDetails?.dsrDetails;
    return dsrDetails?.requestedOn || '';
  }

  async onNextStep(): Promise<void> {
    const currentStepValue = this.currentStep();
    const shouldShowNotification = this.shouldShowNotificationStep();
    if (currentStepValue === 0 && shouldShowNotification) {
      const formValid = this.formValiditySignal();
      const assigneeValid = this.validateCurrentAssigneeSelectionPure();

      if (!formValid || !assigneeValid) {
        TaskUtils.markFormGroupTouched(this.taskForm);
        return;
      }
      if (!this.notificationForm().get('recipientEmail')?.value) {
        const recipientEmail = this.getRecipientEmail();
        if (recipientEmail) {
          this.notificationForm().patchValue({ recipientEmail });
        }
      }
      this.currentStep.set(1);
      try {
        await this.loadEmailTemplate();
      } catch (error) {
        console.error('Failed to load email template during step transition:', error);
        this.snackbarService.openSnack('Failed to prepare notification. Please try again.');
        this.currentStep.set(0);
      }
    }
  }

  onPreviousStep(): void {
    if (this.currentStep() === 1 && this.shouldShowNotificationStep()) {
      this.currentStep.set(0);
    }
  }

  onKeepNotification(): void {
    this.onNextStep();
  }

  onCancelNotification(): void {
    this.notificationForm().reset();
    this.showNotificationStepSignal.set(false);
    this.currentStep.set(1);
  }

  async onSubmit(): Promise<void> {
    if (this.isRiskMitigation || this.isQuestionTask || this.isMeasureTask) {
      await this.submitRiskMitigationTask();
      return;
    }

    if (!this.validateFileUploadsComplete()) {
      return;
    }

    if (this.taskForm.invalid || this.externalUserLoading()) {
      TaskUtils.markFormGroupTouched(this.taskForm);
      this.snackbarService.openSnack('Please fill in all required fields');
      return;
    }

    const effectiveAssigneeType = this.effectiveAssigneeType();
    if (effectiveAssigneeType === 'EXTERNAL' && !this.externalUser()) {
      this.snackbarService.openSnack('Please submit the external user email first');
      return;
    }

    try {
      const notificationData = this.prepareNotificationData();

      await this.taskService.submitTask(
        this.dialogType as any,
        this.requestRid,
        this.parentTaskId,
        this.taskForm,
        this.task,
        this.data.componentStage,
        this.data.requestService,
        notificationData,
        effectiveAssigneeType
      );

      this.taskStateService.clearSelectedDocuments();
      this.taskStateService.setDocumentAutocompleteOpen(false);
      this.taskStateService.setUploadedFiles([]);
      this.taskStateService.clearExternalUserState();
      this.taskStateService.clearInternalUserState();
      this.internalUserControl.setValue('');
      this.documentService.reset();
      this.taskService.resetState();

      this.dialogRef.close({ taskUpdated: true, newUserIsCreated: this.newUserIsCreated } as DialogResult);
    } catch (error) {
      console.error('Task submission failed:', error);
      this.snackbarService.openSnack('Failed to submit task. Please try again.');
    }
  }

  private async submitRiskMitigationTask(): Promise<void> {
    if (!this.validateFileUploadsComplete()) return;
    if (this.taskForm.invalid) {
      TaskUtils.markFormGroupTouched(this.taskForm);
      this.snackbarService.openSnack('Please fill in all required fields');
      return;
    }

    const formValue = this.taskForm.getRawValue();

    let assignToValue: number = 0;
    if (formValue.assigneeType === 'EXTERNAL' && this.externalUser()?.applicationUserId) {
      assignToValue = this.externalUser()!.applicationUserId;
    } else if (formValue.assignee) {
      assignToValue = typeof formValue.assignee === 'string'
        ? parseInt(formValue.assignee, 10)
        : formValue.assignee;
    }

    const uploadedFiles = this.uploadedFiles();
    const uploadedFilePaths = uploadedFiles.map(f => f.fileKey).filter(Boolean);

    const selectedDocs = formValue.documents || [];
    const allDocs = [...selectedDocs, ...uploadedFilePaths];

    this.taskStateService.setSubmitLoading(true);

    try {
      if (this.task?.taskId) {
        const updatePayload: any = {
          taskId: this.task.taskId,
          title: formValue.title,
          description: formValue.description,
          dueDate: formValue.dueDate ? TaskUtils.formatDate(formValue.dueDate) : '',
          assignTo: assignToValue,
          priority: formValue.priority,
          documentRequired: formValue.documentRequired || false,
          assignToUserType: this.mapFormAssigneeTypeToApi(formValue.assigneeType || 'INTERNAL'),
          parentTaskId: this.parentTaskId || 0,
          documentAttached: allDocs.map(doc => ({
            documentUrl: doc,
            status: 'ADDED'
          })),
          taskMeta: this.isQuestionTask
            ? {
              id: this.questionData?.id || 0,
              type: 'QUESTION'
            }
            : this.isMeasureTask
              ? {
                id: this.measureData?.id || 0,
                type: 'MITIGATION'
              }
              : {
                id: this.selectedMeasureId || 0,
                type: 'MITIGATION'
              }
        };


        await this.apiHelperService.updateTask(updatePayload);
        this.dialogRef.close({ taskUpdated: true });
      } else {
        const createPayload = {
          title: formValue.title,
          description: formValue.description,
          dueDate: formValue.dueDate ? TaskUtils.formatDate(formValue.dueDate) : '',
          assignTo: assignToValue,
          priority: formValue.priority,
          documentRequired: formValue.documentRequired || false,
          assignToUserType: this.mapFormAssigneeTypeToApi(formValue.assigneeType || 'INTERNAL'),
          parentTaskId: this.parentTaskId || 0,
          documentAttached: allDocs,
          taskMeta: this.isQuestionTask
            ? {
              id: this.questionData?.id || 0,
              type: 'QUESTION',
              text: this.questionData?.text || '',
              response: this.questionData?.response || ''
            }
            : this.isMeasureTask
              ? {
                id: this.measureData?.id || 0,
                type: 'MITIGATION',
                description: this.measureData?.description || '',
                status: this.measureData?.status || ''
              }
              : {
                mitigationId: this.selectedMeasureId || 0
              }
        };

        await this.assessmentApiHelperService.createAssessmentTask(this.assessmentId!, createPayload);
        this.dialogRef.close({ taskCreated: true });
      }
    } catch (error: any) {
      console.error('Task operation failed:', error);
      const errorMessage = error?.message || `Failed to ${this.task?.taskId ? 'update' : 'create'} task. Please try again.`;
      this.snackbarService.openSnack(errorMessage);
    } finally {
      this.taskStateService.setSubmitLoading(false);
    }
  }

  private prepareNotificationData(): any {
    const effectiveAssigneeType = this.effectiveAssigneeType();

    if (effectiveAssigneeType !== 'DATA_SUBJECT' ||
      !this.shouldShowNotificationStep() ||
      this.currentStep() === 0 ||
      !this.notificationForm().get('sendNotification')?.value) {
      return null;
    }

    const emailForm = this.emailTemplateForm;

    const finalContent = getFinalEmailContent(
      emailForm.get('content')?.value || '',
      this.protectedVariables(),
      emailForm.get('outerHtmlContent')?.value || ''
    );

    return {
      notificationData: {
        notifyTo: emailForm.get('recipientEmail')?.value,
        subject: emailForm.get('subject')?.value,
        body: finalContent
      }
    };
  }

  getFormValidationMessage(): string {
    const assigneeType = this.taskForm?.get('assigneeType')?.value;

    if (!this.taskForm?.get('title')?.valid && this.taskForm?.get('title')?.touched) {
      return 'Task name is required';
    }

    if (!this.taskForm?.get('description')?.valid && this.taskForm?.get('description')?.touched) {
      return 'Task description is required';
    }

    if (assigneeType === 'INTERNAL' && !this.taskForm?.get('assignee')?.valid && this.taskForm?.get('assignee')?.touched) {
      return 'Please select an internal assignee';
    }

    if (assigneeType === 'DATA_SUBJECT' && !this.taskForm?.get('assignee')?.valid) {
      return 'Data subject user not available';
    }

    if (assigneeType === 'EXTERNAL' && !this.externalUser()?.applicationUserId) {
      return 'Please submit external user email';
    }

    return '';
  }

  private setupAssigneeTypeWatcher(): void {
    this.taskForm?.get('assigneeType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (assigneeType) => {
        if (this.shouldShowNotificationStep() && this.currentStep() === 1) {
          await this.loadEmailTemplate();
        }
      });
  }

  isDataRequestSelectedFromCombined(): boolean {
    return this.taskForm.get('assigneeType')?.value === 'DATA_SUBJECT';
  }

  getDataRequestOptions(): Array<{ value: string | number, label: string }> {
    return this.taskService.getDataRequestOptions();
  }

  hasValidUsers(): boolean {
    return this.filteredInternalUsersExcludingCurrent().length > 0;
  }

  toggleDocumentRequired(): void {
    const currentValue = this.taskForm.get('documentRequired')?.value || false;
    this.taskForm.patchValue({
      documentRequired: !currentValue
    });
    this.formValueSignal.set(this.taskForm.getRawValue());
  }

  get isDocumentRequired(): boolean {
    return this.taskForm.get('documentRequired')?.value || false;
  }

  hasTaskNameErrors(): boolean {
    const titleControl = this.taskForm?.get('title');
    return !!(titleControl?.errors && titleControl?.touched);
  }

  hasDueDateErrors(): boolean {
    const dueDateControl = this.taskForm?.get('dueDate');
    return !!(dueDateControl?.errors && dueDateControl?.touched);
  }

  hasTaskRowErrors(): boolean {
    return this.hasTaskNameErrors() || this.hasDueDateErrors();
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  private validateFileUploadsComplete(): boolean {
    const uploadedFiles = this.uploadedFiles();

    if (uploadedFiles.length === 0) {
      return true;
    }

    if (this.fileUploadInProgress()) {
      this.snackbarService.openSnack('Please wait for all file uploads to complete');
      return false;
    }

    const incompleteFiles = uploadedFiles.filter(file =>
      !file.fileKey || (!file.eTag && !file.isExisting)
    );

    if (incompleteFiles.length > 0) {
      const fileNames = incompleteFiles.map(f => f.fileName).join(', ');
      this.snackbarService.openSnack(`Some files are not completely uploaded: ${fileNames}`);
      return false;
    }

    return true;
  }

  readonly hasIncompleteUploads = computed(() => {
    const uploadedFiles = this.uploadedFiles();
    const hasUploadingFiles = this.fileUploadInProgress();
    const hasIncompleteFiles = uploadedFiles.some(file =>
      !file.fileKey || (!file.eTag && !file.isExisting)
    );

    return hasUploadingFiles || hasIncompleteFiles;
  });

  private updateRecipientInEmailContent(previousData: RecipientSelectionData, newData: RecipientSelectionData): void {
    const cacheKey = this.getTemplateCacheKey();
    if (!this.templateVariableCache.has(cacheKey)) {
      const currentContent = this.emailTemplateForm.get('content')?.value || '';
      const currentSubject = this.emailTemplateForm.get('subject')?.value || '';
      if (currentContent || currentSubject) {
        this.templateVariableCache.set(cacheKey, {
          content: currentContent,
          subject: currentSubject
        });
      } else {
        console.warn('No template content available for variable replacement');
        this.loadEmailTemplate();
        return;
      }
    }
    const cachedTemplate = this.templateVariableCache.get(cacheKey);
    if (!cachedTemplate) {
      console.warn('Failed to retrieve cached template');
      this.loadEmailTemplate();
      return;
    }
    try {
      const previousName = previousData.name || '';
      const newName = newData.name || '';
      const previousEmail = previousData.email || '';
      const newEmail = newData.email || '';

      let updatedContent = this.replaceRecipientVariablesInContent(
        cachedTemplate.content,
        previousName,
        newName,
        previousEmail,
        newEmail
      );

      let updatedSubject = this.replaceRecipientVariablesInContent(
        cachedTemplate.subject,
        previousName,
        newName,
        previousEmail,
        newEmail
      );

      if (updatedContent === cachedTemplate.content && previousName !== newName) {
        console.warn('Content replacement did not change the content');
      }

      this.emailTemplateForm.patchValue({
        content: updatedContent,
        subject: updatedSubject
      }, { emitEvent: false });
      this.notificationForm().patchValue({
        content: updatedContent,
        subject: updatedSubject
      }, { emitEvent: false });
      this.renderedContent.set(updatedContent);

      this.onEmailTemplateContentChange();
    } catch (error) {
      console.error('Error updating recipient in email content:', error);
      this.loadEmailTemplate();
    }
  }

  private replaceRecipientVariablesInContent(content: string, previousName: string, newName: string, previousEmail: string, newEmail: string): string {
    if (!content) return content;

    let updatedContent = content;
    if (previousName && newName && previousName !== newName) {
      const nameRegex = new RegExp(this.escapeRegex(previousName), 'g');
      updatedContent = updatedContent.replace(nameRegex, newName);
    }
    if (previousEmail && newEmail && previousEmail !== newEmail) {
      const emailRegex = new RegExp(this.escapeRegex(previousEmail), 'g');
      updatedContent = updatedContent.replace(emailRegex, newEmail);
    }
    return updatedContent;
  }


  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  displayInternalUser(user: User | string | null): string {
    if (!user) {
      return '';
    }

    if (typeof user === 'string') {
      return user;
    }

    const displayName = user.displayName || '';
    const fullName = `${displayName}`.trim();

    if (fullName && user.email) {
      return `${fullName} (${user.email})`;
    } else if (fullName) {
      return fullName;
    } else if (user.email) {
      return user.email;
    } else {
      return `User ${user.applicationUserId}`;
    }
  }


  onInternalUserSelected(event: any): void {
    const user = event.option.value;
    if (user && typeof user === 'object') {
      this.taskForm.patchValue({ assignee: user.applicationUserId.toString() });
      this.taskStateService.setInternalUserSearchTerm('');
    }
  }

  clearInternalUser(): void {
    this.taskForm.patchValue({ assignee: '' });
    this.internalUserControl.setValue('');
    this.taskStateService.clearInternalUserState();
  }

  get recipientEmail() {
    return this.emailTemplateForm?.get('recipientEmail') as FormControl;
  }

  prepareRecipientEmailOptions() {
    if (!this.dsrRequestDetails) {
      return
    }
    let options = []
    if (this.dsrRequestDetails.dsrDetails.firstPartyEmail) {
      const firstPartyEmail = this.dsrRequestDetails.dsrDetails.firstPartyEmail;
      const firstPartyFullName = this.firstPartyFullName;
      options.push({
        groupName: 'Data Subject',
        options: [{
          value: firstPartyEmail,
          label: firstPartyEmail,
          type: 'data_subject',
          name: firstPartyFullName || 'Data Subject'
        }]
      });
    }
    if (this.dsrRequestDetails.dsrDetails.thirdPartyEmail) {
      const thirdPartyEmail = this.dsrRequestDetails.dsrDetails.thirdPartyEmail;
      const thirdPartyName = this.thirdPartyFullName;
      options.push({
        groupName: 'Third Party',
        options: [{
          value: thirdPartyEmail,
          label: thirdPartyEmail,
          type: 'third_party',
          name: thirdPartyName || 'Third Party'
        }]
      });
    }
    this.recipientEmailOptions = [...options]
  }

  get userEmailInfo() {
    return this.dsrRequestDetails?.dsrDetails?.firstPartyEmail || this.dsrRequestDetails?.dsrDetails?.thirdPartyEmail
  }

  get firstPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.firstPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.firstPartyFirstName} ${this.dsrRequestDetails.dsrDetails.firstPartyLastName ? this.dsrRequestDetails.dsrDetails.firstPartyLastName : ``}` : ``}`;
  }

  get thirdPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.thirdPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.thirdPartyFirstName} ${this.dsrRequestDetails.dsrDetails.thirdPartyLastName ? this.dsrRequestDetails.dsrDetails.thirdPartyLastName : ``}` : ``}`;
  }
}
