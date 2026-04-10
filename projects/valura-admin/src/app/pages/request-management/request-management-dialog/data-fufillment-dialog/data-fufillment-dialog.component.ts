import { Component, Inject, inject } from '@angular/core';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FIRST_PAGE, PAGE_SIZE, RequestAction } from '../../constant';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatCard, MatCardContent } from '@angular/material/card';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { RequestDocuments } from '@admin-core/models/request-management/DsrRequest';
import { buildEmailTemplateForm, getEmailPayload, getEmailTemplate, getFinalEmailContent } from '@valura-lib/components/email-template/email-template-utils';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { EmailTemplates } from '@admin-core/models/EmailTemplate';
import { EmailTemplateComponent } from '@valura-lib/components/email-template/email-template.component';
import { ViewTypeDialogConfig } from '@admin-core/models/request-management/ViewTypeDialogConfig';
import { EmailTemplateId, EmailTriggerEvent } from '@admin-core/constants/email-template-constants';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { getFileName } from '../../../task-management/task-utils';
import { DocumentThrough } from '@admin-core/constants/constants';

interface FulFillmentType {
  key: string
  label: string
  templateData: any,
  templateId: any
}
@Component({
  selector: 'app-data-fufillment-dialog',
  imports: [MatDialogModule, MatIconModule, MatCheckboxModule, MatButtonModule, LoadingButtonComponent, MatCard, NgClass,
    MatCardContent, DatePipe, EmailTemplateComponent, NgTemplateOutlet, MatRadioModule, FormsModule],
  templateUrl: './data-fufillment-dialog.component.html',
  styleUrl: './data-fufillment-dialog.component.scss'
})

export class DataFufillmentDialogComponent {

  dialogTitle: string = "Request Fulfillment"
  dialogType: string = ""
  selectedRequestDocumentList: RequestDocuments[] = []
  requestRid: number = 0;
  requestDocuments: RequestDocuments[] = []
  positiveButtonLabel: string = "Done"
  negativeButtonLabel: string = "Cancel"
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  taskDocuments: RequestDocuments[] = []
  submitLoading: boolean = false;
  saveRecordsLoading: boolean = false;
  totalPages: number = 0;
  pageSize: number = PAGE_SIZE
  pageNo: number = FIRST_PAGE
  emailTemplateForm!: FormGroup;
  currentStep: number = 0;
  emailTemplate!: EmailTemplates
  templateSubject: string = '';
  templateContent: string = '';
  renderedContent: string = '';
  templateId: string = ''
  protectedVariables: string[] = [];
  templateLoading: boolean = false;
  DOCUMENT_SELETION = "DOCUMENT_SELETION"
  viewType: string = ''
  fullFillmentTypes: FulFillmentType[] = [
    { key: 'PARTIAL_FULFILLMENT', label: 'Partial', templateData: null, templateId: EmailTriggerEvent.DSR_REQUEST_FULFILLED },
    { key: 'COMPLETE_FULFILLMENT', label: 'Complete', templateData: null, templateId: EmailTriggerEvent.DSR_REQUEST_FULFILLED },
    { key: 'NO_FULFILLMENT', label: 'Reject', templateData: null, templateId: EmailTriggerEvent.DSR_REQUEST_FULFILLED }
  ];

  selectedFulFillmentType!: FulFillmentType;
  selectedType: string = '';
  getFileName = getFileName

  constructor(
    public dialogRef: MatDialogRef<DataFufillmentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ViewTypeDialogConfig,
    private fb: FormBuilder,) {
    this.requestRid = +(this.data.requestId)
    this.onDialogInit()
  }

  async onDialogInit() {
    this.buildEmailTemplateForm();
    this.viewType = this.DOCUMENT_SELETION
    if (this.viewType == this.DOCUMENT_SELETION) {
      this.getTaskDocuments();
      return
    }
    this.initResolutionDetails()
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onNegativeButtonClick() {
    if (this.currentStep === 1) {
      this.previousStep();
    } else {
      this.closeDialog();
    }
  }

  async onSubmit() {
    if (this.showFirstStep) {
      if (!this.validForm && this.fullFillmentTypes.find(type => type.key == this.fullFillmentTypes[2].key)) {
        this.snackbarService.openSnack("Document is required!")
        return
      }
      await this.goToNextStep();
      return;
    }

    this.submitLoading = true;
    const documents = this.selectedRequestDocumentList.map(document => { return document.url })
    const body = {
      "data": {
        "documents": documents,
        fulfillmentStatus: this.selectedFulFillmentType?.key
      },
      ...this.notificationPayload
    }
    let event = RequestAction.REQUEST_FULFILLMENT
    this.apiHelperService.saveDsrRequestDetails(body, this.requestRid, event)
      .subscribe({
        next: async (res) => {
          this.submitLoading = false;
          this.dialogRef.close({ taskUpdated: true })
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitLoading = false
        },
      });
  }

  onSelectDocument(document: RequestDocuments, docIndex: number) {
    document.selected = !document.selected;

    if (document.selected) {
      let findDoc = this.selectedRequestDocumentList.find(doc => doc.url == document.url);
      if (!findDoc) {
        this.selectedRequestDocumentList.push(document)
      }
    }
    else {
      this.selectedRequestDocumentList.splice(docIndex, 1)
    }
  }

  async getTaskDocuments(pageNo: number = FIRST_PAGE,) {
    let params = { page: pageNo, size: this.pageSize, through: DocumentThrough.FULFILLMENT_DOCUMENTS };
    try {
      const data = await this.apiHelperService.getDocumentList(this.requestRid, params);

      if (data) {
        if (pageNo === FIRST_PAGE) {
          this.taskDocuments = data.documents ?? [];
        }
        else {
          this.taskDocuments = [...this.taskDocuments, ...(data.documents ?? [])];
        }
        this.pageNo = pageNo;
        this.totalPages = data.totalPages;
      }
    } finally {

    }
  }

  onScroll(e: Event) {
    const target = e.target as HTMLElement;
    const bottomReached = target.scrollHeight - target.scrollTop <= target.clientHeight;

    if (bottomReached && this.pageNo < this.totalPages) {
      this.getTaskDocuments(this.pageNo + 1);
    }
  }

  buildEmailTemplateForm() {
    this.emailTemplateForm = buildEmailTemplateForm(this.fb)
    this.currentStep = 0;
    if (this.data.emailTemplateData?.recipientEmail) {
      this.emailTemplateForm.patchValue({
        recipientEmail: this.data.emailTemplateData.recipientEmail
      });
    }
  }

  async goToNextStep() {
    if (this.currentStep === 0) {
      if (!this.validForm) {
        this.snackbarService.openSnack("Document is required!")
        return;
      }

      if (!this.selectedType) {
        let fulfillment = this.fullFillmentTypes[0];
        this.selectedType = fulfillment.key;
        this.selectedFulFillmentType = fulfillment
      }
      this.currentStep = 1;
      await this.loadEmailTemplate();
    }
  }

  async loadEmailTemplate() {
    this.templateLoading = true;
    try {
      const data = { ...this.data, ...this.formDataForTemplate, templateId: this.fullFillmentTypes.find(type => type.key == this.selectedType)?.templateId ?? this.templateId }
      let templateData: any;

      if (this.selectedFulFillmentType?.templateData && !this.isFirstStep) {
        templateData = this.selectedFulFillmentType.templateData
      }

      else {
        templateData = await getEmailTemplate(this.apiHelperService, data);

        if (this.selectedFulFillmentType) {
          this.selectedFulFillmentType.templateData = templateData;
        }
      }
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

  previousStep() {
    if (this.currentStep === 1) {
      this.currentStep = 0;
    }
  }

  get showDocumentSelection(): boolean {
    return this.currentStep === 0;
  }

  get showEmailStep(): boolean {
    return this.currentStep === 1;
  }

  get canProceedToNext(): boolean {
    if (this.currentStep !== 0) return false;

    const sendBackDocs = this.data?.dsrRequestDetails?.sendBackDocuments;
    if (this.selectedType === this.fullFillmentTypes[2].key) {
      return true;
    }
    if (sendBackDocs) {
      return this.selectedRequestDocumentList?.length > 0;
    }
    return !!this.selectedType;
  }


  get canGoBack(): boolean {
    return this.currentStep === 1;
  }

  get canSave(): boolean {
    if (this.currentStep === 0) {
      return this.validForm;
    }
    return this.emailTemplateForm.valid;
  }

  get validForm(): boolean {
    if (this.selectedType === this.fullFillmentTypes[2].key) {
      return true;
    }
    return this.data?.dsrRequestDetails?.sendBackDocuments ? !!(this.selectedRequestDocumentList?.length) : true;

  }

  get notificationPayload() {
    if (this.emailContent) {
      const finalContent = getFinalEmailContent(this.emailContent.value, this.protectedVariables, this.outerHtmlContent.value);
      const payLoad = getEmailPayload(this.recipientEmail.value, this.emailSubject.value, finalContent)
      return payLoad
    }
    return null
  }

  get isFirstStep() {
    return this.currentStep === 0
  }

  get showFirstStep() {
    return this.viewType == this.DOCUMENT_SELETION && this.isFirstStep
  }

  get showNegativeButtonLabel() {
    return (this.isFirstStep ? this.negativeButtonLabel : 'Back')
  }

  get formDataForTemplate() {
    let data = null;
    if (this.templateId == EmailTriggerEvent.DSR_REQUEST_FULFILLED) {
      data = { typeOfRequest: this.data.dsrRequestDetails.dsrDetails.rightName }
    }
    else if (this.templateId == EmailTriggerEvent.DSR_REQUEST_FULFILLED) {
      data = { typeOfRequest: this.data.dsrRequestDetails.dsrDetails.rightName }
    }
    else if (this.templateId == EmailTriggerEvent.DSR_REQUEST_FULFILLED) {
      data = { typeOfRequest: this.data.dsrRequestDetails.dsrDetails.rightName }
    }
    return data
  }

  async onChangeSelection(event: MatRadioChange) {
    let fulfillment: any = this.fullFillmentTypes.find(type => type.key == this.selectedType);
    this.selectedFulFillmentType = fulfillment;

    if (this.selectedFulFillmentType.key == this.fullFillmentTypes[0].key) {
      this.templateId = EmailTriggerEvent.DSR_REQUEST_FULFILLED;
      return
    }
    if (this.selectedFulFillmentType.key == this.fullFillmentTypes[1].key) {
      this.templateId = EmailTriggerEvent.DSR_REQUEST_FULFILLED;
      return
    }
    if (this.selectedFulFillmentType.key == this.fullFillmentTypes[2].key) {
      this.templateId = EmailTriggerEvent.DSR_REQUEST_FULFILLED;
      return;
    }
  }

  async initResolutionDetails() {
    this.templateId = EmailTemplateId.GRIEVANCE_RESOLUTION;
    await this.loadEmailTemplate();
    return
  }
}



