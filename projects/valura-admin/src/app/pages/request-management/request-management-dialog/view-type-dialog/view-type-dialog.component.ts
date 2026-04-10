import { Component, computed, inject, Inject, signal, WritableSignal } from '@angular/core';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RequestAction, RequestDialogTypes, RequestDisplayStage } from '../../constant';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { User } from '@admin-core/models/user.model';
import { DsrRequestDetails } from '@admin-core/models/request-management/DsrRequest';
import { EmailTemplateId, EmailTriggerEvent } from '@admin-core/constants/email-template-constants';
import { buildEmailTemplateForm, getEmailPayload, getEmailTemplate, getFinalEmailContent } from '@valura-lib/components/email-template/email-template-utils';
import { firstValueFrom } from 'rxjs';
import { EmailTemplateComponent } from '@valura-lib/components/email-template/email-template.component';
import { ViewTypeDialogConfig } from '@admin-core/models/request-management/ViewTypeDialogConfig';
import { NgTemplateOutlet } from '@angular/common';
import { EmailTemplates } from '@admin-core/models/EmailTemplate';
import { UserService } from '@admin-core/services/user/user.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-view-type-dialog',
  imports: [CustomMatTextareaComponent, MatDialogModule, LoadingButtonComponent, MatSelectModule, FormsModule, ReactiveFormsModule, MatInputModule,
    MatFormFieldModule, MatButtonModule, MatIconModule, MatCheckboxModule, EmailTemplateComponent, NgTemplateOutlet, MatDatepickerModule,
    MatNativeDateModule, CustomMatErrorComponent],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'dd/MM/yyyy' },
        display: {
          dateInput: 'dd/MM/yyyy',
          monthYearLabel: 'MMM yyyy',
          dateA11yLabel: 'dd/MM/yyyy',
          monthYearA11yLabel: 'MMMM yyyy',
        }
      }
    }
  ],
  templateUrl: './view-type-dialog.component.html',
  styleUrl: './view-type-dialog.component.scss'
})
export class ViewTypeDialogComponent {

  RequestDialogTypes = RequestDialogTypes
  dialogTitle: string = ''
  dialogType: string = ''
  negativeButtonLabel: string = "Cancel"
  positiveButtonLabel: string = "Save"
  requestRid: number = 0
  submitLoading: boolean = false;
  eventName: string = ''
  stage: string = ''
  validationQuestions: any;
  dsrRequestDetails!: DsrRequestDetails
  userMasterList: User[] = [];
  extensionDetails: any;
  extensionDays: number = 0;
  form!: FormGroup
  emailTemplateForm!: FormGroup;
  cancelRequest: boolean = false;
  templateLoading: boolean = false;
  currentStep: number = 0;
  emailTemplate!: EmailTemplates
  renderedContent: string = '';
  templateId: string = ''
  verificationModes = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "document", label: "Document" }
  ];
  protectedVariables: string[] = [];
  showReceipient: boolean = false;
  recipientEmailOptions: any = []
  today = new Date();
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);

  constructor(
    public dialogRef: MatDialogRef<ViewTypeDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ViewTypeDialogConfig,
    private fb: FormBuilder, public requestService: RequestManagementService,) {
    this.dialogType = data.dialogType;
    this.requestRid = +(data.requestId);
    this.dialogTitle = data.dialogTitle;
    this.eventName = data?.eventName ?? '';
    this.stage = data?.stage ?? '';
    this.dsrRequestDetails = data?.dsrRequestDetails
    this.validationQuestions = data?.validationQuestions
    this.positiveButtonLabel = data?.positiveButtonLabel ?? ''
    this.negativeButtonLabel = data?.negativeButtonLabel ?? ''
    this.extensionDetails = data?.extensionDetails || {};
    this.extensionDays = this.extensionDetails?.extensionDays || 0;
    this.today.setHours(0, 0, 0, 0);
    if (this.dsrRequestDetails) {
      if (this.dsrRequestDetails.dsrDetails.firstPartyEmail || this.dsrRequestDetails.dsrDetails.thirdPartyEmail) {
        this.showReceipient = true
      }
    }
    this.onDialogInit()


  }

  get extensionDateControl(): FormControl {
    return this.form.get('extensionDate') as FormControl;
  }

  get reasonControl(): FormControl {
    return this.form.get('reason') as FormControl
  }

  private toMidnight(d: Date | string | null): Date | null {
    if (!d) return null;
    const x = new Date(d);
    if (isNaN(x.getTime())) return null;
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + days);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  requestedOnDate = computed(() => {
    return this.toMidnight(this.dsrRequestDetails?.dsrDetails?.requestedOn ?? null);
  });

  resolutionDate = computed(() => {
    return this.toMidnight(this.dsrRequestDetails?.dsrDetails?.requestResolutionDate ?? null);
  });

  totalExtensionDays = computed(() => {
    return Number(this.extensionDetails?.extensionDays ?? 0);
  });

  remainingExtensionDaysComputed = computed(() => {
    return Number(this.extensionDetails?.remainingExtensionDays ??
      this.extensionDetails?.extensionDays ?? 0);
  });


  originalResolutionDate = computed(() => {
    const currentResolution = this.resolutionDate();
    if (!currentResolution) return null;

    const isExtended = this.extensionDetails?.isExtended || false;
    if (!isExtended) {
      return currentResolution;
    }

    const totalDays = this.totalExtensionDays();
    const remainingDays = this.remainingExtensionDaysComputed();
    const usedDays = totalDays - remainingDays;

    if (usedDays <= 0) {
      return currentResolution;
    }

    return this.addDays(currentResolution, -usedDays);
  });


  maxAllowedDate = computed(() => {
    const originalResolution = this.originalResolutionDate();
    const days = this.totalExtensionDays();

    if (!originalResolution || !days || days <= 0) return null;

    return this.addDays(originalResolution, days);
  });

  disableDateValidator = (control: FormControl) => {
    const value = control.value;
    return value && !this.dateFilter(value)
      ? { disabledDate: true }
      : null;
  };



  dateFilter = (raw: Date | null): boolean => {
    if (!raw) return false;

    const date = this.toMidnight(raw);
    if (!date) return false;

    const requestedOn = this.requestedOnDate();
    const resolution = this.resolutionDate();
    const maxAllowed = this.maxAllowedDate();

    if (!requestedOn || !resolution) {
      console.warn('dateFilter: Missing requestedOn or resolution date');
      return false;
    }

    if (resolution.getTime() < requestedOn.getTime()) {
      console.error('Data corruption: requestResolutionDate is before requestedOn');
      return false;
    }

    const todayMid = this.today;

    const dateTime = date.getTime();
    const todayTime = todayMid.getTime();
    const resolutionTime = resolution.getTime();

    if (dateTime < todayTime) return false;


    if (dateTime <= resolutionTime) return false;

    if (maxAllowed) {
      if (dateTime > maxAllowed.getTime()) return false;
    } else {
      return false;
    }

    return true;
  };






  closeDialog(): void {
    this.dialogRef.close();
  }

  onNegativeButtonClick() {
    if (this.currentStep === 1 && !RequestDialogTypes.VALIDATE_REQUEST) {
      this.previousStep();
    } else {
      this.closeDialog();
    }
  }

  get emailContent() {
    return this.emailTemplateForm.get('content') as FormControl;
  }

  get emailSubject() {
    return this.emailTemplateForm.get('subject') as FormControl;
  }

  get recipientEmail() {
    return this.emailTemplateForm.get('recipientEmail') as FormControl;
  }

  get outerHtmlContent() {
    return this.emailTemplateForm.get('outerHtmlContent') as FormControl;
  }

  async onSave() {
    if (this.isFirstStep) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      await this.nextStep();
      return;
    }
    if (this.emailTemplateForm.invalid && this.templateId) {
      this.emailTemplateForm.markAllAsTouched();
      return;
    }
    if (this.dialogType == RequestDialogTypes.VERIFY_DS_IDENTITY || this.dialogType == RequestDialogTypes.VERIFY_THIRD_PARTY || this.dialogType == RequestDialogTypes.VALIDATE_REQUEST || this.dialogType == RequestDialogTypes.REOPEN_REQUEST) {
      this.onSaveVerificationForm()
    }
    else if (this.dialogType == RequestDialogTypes.REQUEST_VALIDATION_CANCEL) {
      this.onCancelRequest()
    }
    else if (this.dialogType == RequestDialogTypes.ESCALATE_REQUEST) {
      this.onEscalateRequest()
    }
    else if (this.dialogType == RequestDialogTypes.EXTEND_PERIOD) {
      this.onExtendPeriod()
    }
    else if (this.dialogType == RequestDialogTypes.TASK_REOPEN_REQUEST) {
      this.onTaskReopen()
    }
  }

  onDialogInit() {
    this.cancelRequest = this.data?.cancelRequest ?? false;
    this.currentStep = 0;
    if (this.dialogType == RequestDialogTypes.VERIFY_DS_IDENTITY || this.dialogType == RequestDialogTypes.VERIFY_THIRD_PARTY) {
      this.setDialogTitle()
      this.form = this.fb.group({
        modeOfVerification: [null, Validators.required],
        remarks: ['', this.cancelRequest ? Validators.required : null]
      });
      if (this.cancelRequest) {
        this.templateId = EmailTriggerEvent.DSR_REQUEST_REJECTED
      }
    }
    else if (this.dialogType == RequestDialogTypes.REQUEST_VALIDATION_CANCEL) {
      this.form = this.fb.group({
        rejectReason: ['', Validators.required]
      });
      this.templateId = EmailTriggerEvent.DSR_REQUEST_REJECTED
    }

    else if (this.dialogType == RequestDialogTypes.ESCALATE_REQUEST) {
      this.form = this.fb.group({
        toUserId: [null, Validators.required],
        reason: ['', Validators.required]
      });
      this.templateId = EmailTemplateId.ESCALATED_REQUEST_NOTIFICATION
      this.getUserMasterList()
    }

    else if (this.dialogType == RequestDialogTypes.EXTEND_PERIOD) {
      this.form = this.fb.group({
        reason: ['', Validators.required],
        extensionDate: [null, [Validators.required, this.disableDateValidator]]
      });
      this.templateId = EmailTriggerEvent.DSR_REQUEST_DEADLINE_EXTENDED
    }

    else if (this.dialogType == RequestDialogTypes.REOPEN_REQUEST) {
      this.form = this.fb.group({
        reopenFromInitial: ['',],
        reason: ['', Validators.required]
      });
    }

    this.emailTemplateForm = buildEmailTemplateForm(this.fb);
    this.showMessage();
    if (this.data.emailTemplateData?.recipientEmail) {
      this.emailTemplateForm.patchValue({
        recipientEmail: this.data.emailTemplateData.recipientEmail
      });
    }

    if (this.dialogType == RequestDialogTypes.VALIDATE_REQUEST) {
      this.templateId = EmailTriggerEvent.DSR_REQUEST_VALIDATED;
      this.currentStep = 1;
      if (this.showReceipient) {
        this.recipientEmail.enable()
        // this.prepareRecipientEmailOptions()
      }
      this.loadEmailTemplate();
    }

    else if (this.dialogType == RequestDialogTypes.TASK_REOPEN_REQUEST) {
      this.form = this.fb.group({
        reason: ['', Validators.required]
      });
    }
  }

  setDialogTitle() {
    if (this.dialogType == RequestDialogTypes.VERIFY_DS_IDENTITY) {
      this.dialogTitle = this.cancelRequest ? "Cancel request" : "Verify Data Subject";
    }
    else if (this.dialogType == RequestDialogTypes.VERIFY_THIRD_PARTY) {
      this.dialogTitle = this.cancelRequest ? "Cancel request" : "Verify Third Party";
    }
  }

  onCancelRequest() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.snackbarService.openSnack(`${this.errorMessage}`)
      return
    }
    this.submitLoading = true
    let event = this.eventName
    let data = {}
    if (this.stage == RequestDisplayStage.REQUEST_VERIFICATION) {
      if (this.requestService.showDocumentVerificationBtn(this.dsrRequestDetails.dsrDetails.state)) {
        data = { "isDocumentVerified": false, }
        event = RequestAction.DOCUMENT_VERIFY;
      }
      else if (this.requestService.showRequestVerificationBtn(this.dsrRequestDetails.dsrDetails.state)) {
        data = { "verificationRequest": false }
      }
      data = {
        "rejectionReason": this.form.get('rejectReason')?.value ?? '',
      }
      event = RequestAction.REJECT_FORM;
    }
    else if (this.stage == RequestDisplayStage.REQUEST_VALIDATION) {
      data = {
        "validateRequest": false,
        "rejectionReason": this.form.get('rejectReason')?.value ?? '',
        "validationQuestion": this.data.validationQuestions,
      }
    }

    const body = {
      "data": { ...data },
      ...this.notificationPayload
    }
    this.apiHelperService.saveDsrRequestDetails(body, this.requestRid, event)
      .subscribe({
        next: async (res) => {
          this.dialogRef.close({ requestRejected: true })
          this.submitLoading = false
          this.form.reset()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitLoading = false
        },
      });
  }

  onTaskReopen() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.snackbarService.openSnack(`${this.errorMessage}`)
      return
    }
    const body = {
      "remarks": this.form.get('reason')?.value ?? '',
    };
    this.submitLoading = true;
    const action = (this.data?.taskAction ?? '');
    this.apiHelperService.onTaskAction(+(this.requestRid), action, body)
      .subscribe({
        next: async (res) => {
          this.dialogRef.close({ success: true })
          this.submitLoading = false
          this.form.reset()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitLoading = false
        },
      });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    //yyyy-MM-dd'T'HH:mm:ss
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }


  onExtendPeriod() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack(`${this.errorMessage}`);
      return;
    }

    const selectedDate: Date = this.form.get('extensionDate')?.value;
    const formattedDate = selectedDate ? this.formatDate(selectedDate) : '';

    const body = {
      reason: this.form.get('reason')?.value ?? '',
      extensionDate: formattedDate,
      shouldNotify: true,
      ...this.notificationPayload
    };

    this.submitLoading = true;
    this.apiHelperService.onExtendDsrRequest(body, this.requestRid)
      .subscribe({
        next: async (res) => {
          this.dialogRef.close({ periodExtended: true });
          this.submitLoading = false;
          this.form.reset();
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitLoading = false;
        },
      });
  }


  async getUserMasterList() {
    this.userMasterList = await this.userService.getAdminUserMasterList()
  }

  async loadEmailTemplate() {
    this.templateLoading = true;
    try {
      const data = { ...this.data, ...this.formDataForTemplate, templateId: this.templateId, }
      const templateData = await getEmailTemplate(this.apiHelperService, data);
      if (templateData) {
        this.emailTemplate = templateData.template;
        this.protectedVariables = this.emailTemplate.templateVariables;
        this.emailTemplateForm.patchValue(templateData.templateData);
        this.renderedContent = templateData.renderedContent
      }
    } catch (error) {
      console.error('Error loading email template:', error);
    } finally {
      this.templateLoading = false;
    }
  }


  async nextStep() {
    if (this.currentStep === 0) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }

      this.currentStep = 1;
      if (this.templateId) {
        await this.loadEmailTemplate();
      }
    }
  }

  previousStep() {
    if (this.currentStep === 1) {
      this.currentStep = 0;
    }
  }

  get showVerificationStep(): boolean {
    return this.currentStep === 0;
  }

  get showEmailStep(): boolean {
    return this.currentStep === 1;
  }

  get canProceedToNext(): boolean {
    return this.currentStep === 0 && this.form.valid;
  }

  get canGoBack(): boolean {
    return this.currentStep === 1;
  }

  get canSave(): boolean {
    if (this.currentStep === 0) {
      return this.form.valid;
    }
    return this.emailTemplateForm.valid;
  }

  async onSaveVerificationForm() {
    if (this.form && this.form.invalid) {
      this.form.markAllAsTouched()
      this.snackbarService.openSnack(`${this.errorMessage}`)
      return
    }
    let body = null;
    this.submitLoading = true;
    try {
      if (this.dialogType == RequestDialogTypes.VERIFY_DS_IDENTITY) {
        body = { data: { ...this.form.value, "verificationRequest": this.cancelRequest ? false : true } };
      }
      else if (this.dialogType == RequestDialogTypes.VERIFY_THIRD_PARTY) {
        body = {
          data: {
            ...this.form.value, "modeOfThirdPartyVerification": this.form.value.modeOfVerification, "verifyThirdPartyRequest": this.cancelRequest ? false : true, "thirdPartyRemarks": this.form.value.remarks
          }
        };
      }
      else if (this.dialogType == RequestDialogTypes.VALIDATE_REQUEST) {
        const finalValidationQuestion = this.removeShowSectionName(this.validationQuestions);
        body = { data: { validationQuestion: finalValidationQuestion, "validateRequest": true, rejectionReason: "" }, ...this.notificationPayload }
      }
      else if (this.dialogType == RequestDialogTypes.REOPEN_REQUEST) {
        body = { data: { reopenFromInitial: this.form.value.reopenFromInitial, reopenReason: this.form.value.reason } }
      }
      const res = await firstValueFrom(this.apiHelperService.saveDsrRequestDetails(body, this.requestRid, this.data.event));

      this.dialogRef.close({ success: true, data: res });

    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      this.submitLoading = false;
    }
  }

  private removeShowSectionName(sections: any[]) {
    return sections.map(section => {
      const { showSectionName, ...restSection } = section;

      return {
        ...restSection,
        validationQuestions: section.validationQuestions?.map((q: any) => ({ ...q }))
      };
    });
  }


  onEscalateRequest() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.snackbarService.openSnack(`${this.errorMessage}`)
      return
    }
    const body = {
      "toUserId": this.form.get('toUserId')?.value ?? 0,
      "reason": this.form.get('reason')?.value ?? '',
    };
    this.submitLoading = true
    this.apiHelperService.onEscalateRequest(body, this.requestRid)
      .subscribe({
        next: async (res) => {
          this.dialogRef.close({ requesEscalated: true })
          this.submitLoading = false
          this.form.reset()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitLoading = false
        },
      });
  }

  get notificationPayload() {
    if (this.emailContent) {
      const finalContent = this.renderedContent ||
        getFinalEmailContent(this.emailContent.value, this.protectedVariables, this.outerHtmlContent.value);
      const payLoad = getEmailPayload(this.recipientEmail.value, this.emailSubject.value, finalContent)
      return payLoad
    }
    return null
  }

  get isFirstStep(): boolean {
    return !!(this.currentStep === 0 && this.templateId)
  }

  get showNegativeButtonLabel() {
    if (this.dialogType === RequestDialogTypes.VALIDATE_REQUEST) {
      return this.negativeButtonLabel;
    }
    else {
      return (this.templateId ? (this.isFirstStep ? this.negativeButtonLabel : 'Back') : this.negativeButtonLabel);
    }
  }

  get formDataForTemplate() {
    let data: any = { typeOfRequest: this.dsrRequestDetails.dsrDetails.rightName };

    if (this.dialogType == RequestDialogTypes.REQUEST_VALIDATION_CANCEL) {
      data = { ...data, remarks: this.form.value?.rejectReason ?? '' }
    }
    else if (this.dialogType == RequestDialogTypes.EXTEND_PERIOD) {
      const selectedDate = this.form.value?.extensionDate as Date | null;
      const currentResolution = this.resolutionDate();

      let calculatedExtensionDays = this.extensionDays;

      if (selectedDate && currentResolution) {
        const diffMs = new Date(selectedDate).getTime() - currentResolution.getTime();
        calculatedExtensionDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      }

      data = { ...data, remarks: this.form.value?.reason ?? '', extensionDays: calculatedExtensionDays };
    }
    return data
  }


  get errorMessage() {
    return `Please fill the required details!`
  }

  prepareRecipientEmailOptions() {
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

  get firstPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.firstPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.firstPartyFirstName} ${this.dsrRequestDetails.dsrDetails.firstPartyLastName ? this.dsrRequestDetails.dsrDetails.firstPartyLastName : ``}` : ``}`;
  }

  get thirdPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.thirdPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.thirdPartyFirstName} ${this.dsrRequestDetails.dsrDetails.thirdPartyLastName ? this.dsrRequestDetails.dsrDetails.thirdPartyLastName : ``}` : ``}`;
  }

  showMessage() {
    /*  Request pause related message */
    const message = this.data?.displayMessage;
    if (message) {
      this.snackbarService.openSnack(message);
    }
  }
}
