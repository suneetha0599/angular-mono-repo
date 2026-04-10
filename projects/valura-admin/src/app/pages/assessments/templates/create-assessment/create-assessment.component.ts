import { ValidationQuestion } from '@admin-core/models/configuration/regulation';
import { CreateTemplateComponent } from './../create-template/create-template.component';
import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { QuestionnaireComponent } from '../../questionnaire/questionnaire.component';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { FormArray, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { buildTemplateForm, buildTemplatePayload, patchTemplateForm } from '../template-utils';
import { GLOBAL_DIALOG_DEFAULTS, MANUAL_VENDOR_TEMPLATE_REQUEST, NAVIGATION_TYPE, TEMPLATE_MANUAL_DRAFT_KEY } from '@admin-core/constants/constants';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpService } from '@valura-lib/service/network/http.service';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { TEMPLATE_MODE } from '../constants';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@valura-lib/components//confirmation-dialog/confirmation-dialog.component';
import { AuthService } from '@admin-core/services/auth.service';
import { v1 as uuidv1 } from 'uuid';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { TemplateService } from '@admin-core/services/template/template.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { TemplatePreviewStateService } from '../template-preview-state.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { AssessemntSource } from '../../assessments/constants';

const { TEMPLATE_LIST } = routeConstants
@Component({
  selector: 'app-create-assessment',
  imports: [
    CommonModule,
    MatTabsModule,
    CreateTemplateComponent,
    QuestionnaireComponent,
    LoadingButtonComponent,
    ErrorLoadingItemsComponent,
    MatIconModule, MatTooltipModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './create-assessment.component.html',
  styleUrl: './create-assessment.component.scss',
  providers: [AssessmentService]
})
export class CreateAssessmentComponent {
  tabHeaderDetails: any[] = [
    { id: 1, name: 'Overview' },
    { id: 2, name: 'Questionnaire' },
    // { id: 3, name: 'Rules' },
  ];
  selected: 'basic' | 'questions' = 'basic';
  isPreviewLoading: boolean = false;
  createTemplateForm!: FormGroup;
  templateId: number = 0;
  manualDraftTemplateId: string = '';
  isDraftLoading: boolean = false;
  pageTitle: string = 'Create Template';
  isSubmitLoading: boolean = false;
  selectedTabIndex: number = 0;
  templateDetails: any;
  templateMode: string = TEMPLATE_MODE.EDIT;
  currentPath: string = '';
  formIsUpdated: boolean = false;
  dataUpdated: string = '';
  currentTemplateDetails = {
    assessmentRid: 0,
    index: 0
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  private initialFormValue: any;
  private createTemplateFormSubscription!: Subscription;
  hasApiError: boolean = false;
  private formUpdatedSubscription!: Subscription;
  assessmentSource: string = AssessemntSource.GENERAL
  isFinalSaved: boolean = false;

  private templatePreviewStateService = inject(TemplatePreviewStateService);
  private location = inject(Location);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private assessmentService = inject(AssessmentService);
  private templateService = inject(TemplateService);
  private authService = inject(AuthService);
  private confirmationDialogService = inject(ConfirmationDialogService);

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild(QuestionnaireComponent) questionnaireComponent?: QuestionnaireComponent;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
    this.formUpdatedSubscription = this.templatePreviewStateService.formIsUpdated$.subscribe(value => {
      if (value && !this.formIsUpdated) {
        this.formIsUpdated = true;
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.formIsUpdated && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
    this.templatePreviewStateService.removeStorageData()
  }

  canDeactivate(): boolean {
    if (this.formIsUpdated) return false;
    return true;
  }


  ngOnInit() {
    if (this.router.url.includes(routeConstants.VENDORS)) {
      this.assessmentSource = AssessemntSource.VENDOR;
    }
    this.route.queryParams.subscribe(params => {
      const templateId = params['templateId'];
      const mode = params['mode'];
      const manualDraftTemplateId = params['manualDraftTemplateId'];
      this.templateId = +(templateId || 0);
      this.manualDraftTemplateId = manualDraftTemplateId;
      const returnTab = this.templatePreviewStateService.getReturnTab();
      if (returnTab) {
        this.selected = returnTab;
        this.templatePreviewStateService.clearReturnTab();
      }
      if (this.manualDraftTemplateId || this.templateId) {
        this.pageTitle = "Edit Template";
      }
      this.updateMode(mode)
      this.onInitPage();
    });
  }

  ngOnDestroy() {
    this.createTemplateFormSubscription?.unsubscribe();
    this.formUpdatedSubscription?.unsubscribe();
  }

  async onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.createTemplateForm = buildTemplateForm(this.fb);
    // this.clearFormState();
    if (this.templatePreviewStateService.hasSnapshot()) {
      const snapshot = this.templatePreviewStateService.getSnapshot();
      patchTemplateForm(this.fb, this.createTemplateForm, snapshot);
      this.initFormSubscription();
      return;
    }
    if (this.manualDraftTemplateId) {
      await this.getManualDraftRequestDetails();
      this.initFormSubscription();
      return
    }

    if (this.templateId) {
      await this.getTemplateDetails();
      await this.updateCurrentRequestIndex();
    }
    this.initFormSubscription();
  }

  async onPreviewAndPublish(): Promise<void> {
    const isDraft = !!this.manualDraftTemplateId;
    if (this.templateForm.invalid) {
      const fieldName = this.getFirstInvalidTemplateField();
      this.templateForm.markAllAsTouched()
      this.snackbarService.openSnack(fieldName ? `${fieldName} is required.` : 'Please complete required template fields.');
      return;
    }

    if (this.questionnaireComponent) {
      const isValid = this.questionnaireComponent.validateAllQuestions();
      if (!isValid) {
        this.selectedTabIndex = 1;
        return;
      }
    }
    else {
      const result = this.validateAllQuestions();

      if (!result.valid) {
        this.selected = 'questions';

        setTimeout(() => {
          this.snackbarService.openSnack(result.message ?? 'Validation failed.');

          if (
            result.sectionIndex !== undefined &&
            result.questionIndex !== undefined &&
            result.question &&
            this.questionnaireComponent
          ) {
            this.questionnaireComponent.handleInvalidQuestion(
              result.sectionIndex,
              result.questionIndex,
              result.question,
              result.message ?? 'Validation failed.'
            );
          }
        });

        return;
      }

    }

    if (this.questionnaireComponent) {
      await this.questionnaireComponent.uploadAllPendingImages();
    }
    const currentId = this.manualDraftTemplateId || this.templateId || 'new';
    this.templatePreviewStateService.setSnapshot(this.createTemplateForm.getRawValue(), currentId);
    this.templatePreviewStateService.setReturnTab('questions');
    const templateValue = this.templateForm?.value;
    const formData = {
      template: {
        name: templateValue?.templateName,
        description: templateValue?.description,
        assessmentType: templateValue?.templateType,
      },
      sections: (this.questionsForm?.value || []).map((section: any) => ({
        sectionName: section.section,
        id: section.id,
        description: section.description,
        totalQuestion: section.questions?.length || 0,
        expanded: false,
        questions: (section.questions || []).map((q: any) => ({
          id: q.id,
          text: q.text,
          helper: q.helper,
          type: q.type,
          required: q.required,
          comment: q.comment,
          file: q.file,
          rules: q.rules || [],
          options: (q.options || []).map((o: any) => ({ value: o.value }))
        }))
      }))
    };


    const publishPayload = !this.templateId
      ? await buildTemplatePayload(this.createTemplateForm, this.assessmentService, this.assessmentApiHelperService, false, (msg) => this.snackbarService.openSnack(msg))
      : null;

    const templateRouteId = this.manualDraftTemplateId || this.templateId || 'new';

    const navState = JSON.parse(JSON.stringify({
      key: this.manualDraftTemplateId
        ? NAVIGATION_TYPE.TEMPLATE_DRAFT_DETAIL
        : NAVIGATION_TYPE.TEMPLATE_DETAIL,
      id: this.templateId,
      formData,
      isDraft: isDraft,
      isPublishMode: this.showDraftButton,
      manualDraftTemplateId: this.manualDraftTemplateId,
      publishPayload,
    }));
    this.templatePreviewStateService.updateFormState(this.formIsUpdated)
    this.formIsUpdated = false;
    this.router.navigate([`${this.currentPath}/${routeConstants.PREVIEW_TEMPLATE}`, templateRouteId], { state: navState });
  }

  initFormSubscription() {
    this.initialFormValue = this.createTemplateForm.getRawValue();
    this.createTemplateFormSubscription = this.createTemplateForm.valueChanges.subscribe(val => {
      if (val && this.createTemplateForm.dirty && !this.formIsUpdated)
        this.formIsUpdated = true;
    });
  }

  resetFormState() {
    this.initialFormValue = this.createTemplateForm.getRawValue();
    this.formIsUpdated = false;
    this.clearFormState();
  }

  clearFormState() {
    this.templatePreviewStateService.updateFormState(false);
  }

  updateMode(mode: string) {
    this.templateMode = (mode === TEMPLATE_MODE.VIEW ? TEMPLATE_MODE.VIEW : (mode === TEMPLATE_MODE.EDIT ? TEMPLATE_MODE.EDIT : TEMPLATE_MODE.CREATE));
  }

  get templateForm() {
    return this.createTemplateForm?.get('template') as FormGroup
  }

  get questionsForm() {
    return this.createTemplateForm?.get('assessments') as FormArray
  }

  async onCancel(): Promise<void> {
    this.resetFormState();
    this.goBackToListing();
  }

  async onSave(): Promise<void> {
    if (this.templateForm.invalid || this.questionsForm.invalid) {
      this.createTemplateForm.markAllAsTouched();
      this.snackbarService.openSnack('Please fill all required fields before submitting.');
      return;
    }

    if (this.templateForm.invalid) {

      this.createTemplateForm.markAllAsTouched();
      const fieldName = this.getFirstInvalidFieldName();
      this.snackbarService.openSnack(fieldName ? `${fieldName} is required.` : 'Please fill all required fields before submitting.');
      return;
    }
    if (this.questionnaireComponent) {
      await this.questionnaireComponent.uploadAllPendingImages();
    }

    const sectionsArray = this.questionsForm?.value || [];
    if (!sectionsArray || sectionsArray.length === 0) {
      this.snackbarService.openSnack('Please add at least one section before saving the template.');
      return;
    }

    const sectionWithoutQuestions = sectionsArray.find((section: any) => {
      return !section.questions || section.questions.length === 0;
    });




    if (sectionWithoutQuestions) {
      const confirm = await firstValueFrom(
        this.confirmationDialogService.showDialog(
          'Alert',
          'There is a section with <b>0 questions</b>. Are you sure you want to continue?',
          'Yes, Continue',
          'Cancel'
        )
      );

      if (!confirm) {
        return;
      }
    }

    if (this.templateId) {
      this.updateTemplates();
      return
    }
    this.isSubmitLoading = true;
    try {
      const payload = await buildTemplatePayload(this.createTemplateForm, this.assessmentService, this.assessmentApiHelperService, false, (msg) => this.snackbarService.openSnack(msg));
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const res = await this.assessmentApiHelperService.createTemplate(payload, _url);
      if (res.success) {
        this.isFinalSaved = true;
        await this.deleteManualDraftRequests();
        this.resetFormState();
        this.goBackToListing();
      }
    } catch (e) {
      console.error('Error', e);
    } finally {
      this.isSubmitLoading = false;
    }
  }

  private getFirstInvalidFieldName(): string | null {
    const controls = this.createTemplateForm.controls;

    for (const key of Object.keys(controls)) {
      const control = controls[key];

      if (control.invalid) {
        return this.getFieldLabel(key);
      }
    }

    return null;
  }

  private getFieldLabel(controlName: string): string {

    const fieldMap: Record<string, string> = {
      name: 'Template Name',
      description: 'Description',
      category: 'Category',
      type: 'Assessment Type',
      passingScore: 'Passing Score'
      // Add all required fields here
    };

    return fieldMap[controlName] || controlName;
  }

  async updateTemplates() {
    this.isSubmitLoading = true;

    const payload = await buildTemplatePayload(this.createTemplateForm, this.assessmentService, this.assessmentApiHelperService, true, (msg) => this.snackbarService.openSnack(msg));
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    this.assessmentApiHelperService.updateTemplateDetails(this.templateId, payload, _url)
      .subscribe({
        next: async (res) => {
          this.resetFormState();
          this.goBackToListing()
          this.isSubmitLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isSubmitLoading = false
        },
      });

  }

  async confirmDiscardChanges(): Promise<boolean> {
    if (!this.createTemplateForm || !this.createTemplateForm.dirty) return true;
    return this.showUnsavedChangesDialog();
  }

  async onDelete() {
    const confirmed = await this.showDeleteConfirmation();
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.httpService.httpDelete(`assessment/template/${this.templateId}`, null, null, true)
      );
      this.snackbarService.openSnack('Template deleted successfully', 'success');
      this.goBackToListing();
    } catch (error) {
      console.error('Error deleting template:', error);
      this.snackbarService.openSnack('Failed to delete template');
    }
  }

  private async showDeleteConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,
        data: {
          title: 'Delete Template',
          message: 'Are you sure you want to delete this template? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        },
        panelClass: 'dialog-wrapper'
      });


      dialogRef.afterClosed().subscribe(result => {
        resolve(result === true);
      });
    });
  }

  private async showUnsavedChangesDialog(): Promise<boolean> {
    return firstValueFrom(
      this.confirmationDialogService.showDialog(
        'Alert',
        'You have unsaved changes that will be lost. Are you sure you want to leave this page?',
        'Yes',
        'No',
        '420px',
      )
    );
  }

  async goBack(): Promise<void> {
    this.location.back();
  }

  goBackToListing(): void {
    this.formIsUpdated = false;
    this.router.navigate([`${this.currentPath}/${TEMPLATE_LIST}`]);
  }

  onTabChange(index: number) {
  }

  get isEditMode(): boolean {
    return this.templateMode === TEMPLATE_MODE.EDIT
  }

  get isCreateMode(): boolean {
    return this.templateMode === TEMPLATE_MODE.CREATE;
  }

  get hasSections(): boolean {
    return (this.questionsForm?.length ?? 0) > 0;
  }

  async onSaveAsDraft() {
    const templateNameControl = this.templateForm.get('templateName');

    if (!templateNameControl?.value?.trim()) {
      templateNameControl?.markAsTouched();
      this.snackbarService.openSnack('Please fill the required details!');
      return;
    }

    if (this.questionnaireComponent) {
      await this.questionnaireComponent.uploadAllPendingImages();
    }
    const userData = this.authService.getUserInfo();
    let userId;
    if (userData) {
      userId = userData.applicationUserId
    }
    const formData = {
      ...this.createTemplateForm.getRawValue(),
      createdAt: this.templateDetails?.createdAt ? this.templateDetails.createdAt : new Date().toISOString(),
      createdBy: this.templateDetails?.createdBy ? this.templateDetails.createdBy : userId
    };

    const body = this.manualDraftTemplateId
      ? { formData: formData }
      : { key: this.isVendorContext ? MANUAL_VENDOR_TEMPLATE_REQUEST : TEMPLATE_MANUAL_DRAFT_KEY, formData: formData };

    this.isDraftLoading = true;
    this.assessmentApiHelperService
      .saveManualDraft(body, this.manualDraftTemplateId ?? '')
      .subscribe({
        next: async () => {
          this.resetFormState();
          this.goBackToListing();
          this.isDraftLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isDraftLoading = false;
        },
      });
  }

  canDelete: boolean = false;

  async getTemplateDetails() {
    if (!this.templateId) {
      return
    }
    this.hasApiError = false;
    try {
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const data = await this.assessmentApiHelperService.getTemplateDetails(this.templateId, null, _url);
      if (!data) { this.hasApiError = true; return }
      if (data) {
        this.templateDetails = data;
        patchTemplateForm(this.fb, this.createTemplateForm, this.templateDetails);
        this.initialFormValue = this.createTemplateForm.getRawValue();
        if (!this.isEditMode) {
          this.createTemplateForm.disable()
        }
        this.canDelete = data.template.canDelete;
        this.dataUpdated = uuidv1();
      }
    } catch (e) { this.hasApiError = true; }
  }


  async getManualDraftRequestDetails() {
    if (!this.manualDraftTemplateId) {
      return
    }
    const data = await this.assessmentApiHelperService.getManualDraftDetails(this.manualDraftTemplateId);
    if (data) {
      this.templateDetails = data.formData;
      patchTemplateForm(this.fb, this.createTemplateForm, this.templateDetails);
      this.initialFormValue = this.createTemplateForm.getRawValue();
    }
  }

  async patchRequestForm() {
    this.createTemplateForm.patchValue(this.templateDetails);
  }

  hasFormChanged(): boolean {
    if (!this.initialFormValue) {
      return true;
    }
    const currentValue = this.createTemplateForm.getRawValue();
    return JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  }

  get isSaveButtonDisabled(): boolean {
    if (this.templateId) {
      return !this.hasFormChanged();
    }
    return false;
  }

  async deleteManualDraftRequests() {
    if (this.manualDraftTemplateId) {
      await this.deleteManualDraftRequest();
      return
    }
  }

  async deleteManualDraftRequest() {
    try {
      const response = await this.assessmentApiHelperService.deleteManualDraftRequest(this.manualDraftTemplateId);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  get showDraftButton(): boolean {
    return !(this.templateId)
  }

  async updateCurrentRequestIndex() {
    let templateList = this.templateService.getTemplateRid();
    let nodeIndex = templateList.findIndex(
      (item: any) => item.requestRid === this.templateId
    );
    if (nodeIndex > -1) {
      this.currentTemplateDetails.index = nodeIndex;
      await this.loadPrevTemplateList();
      await this.loadNextTemplateList();
    }
  }

  async loadPrevTemplateList() {
    const tempRequestList = this.templateService.getTemplateRid();

    if (this.currentTemplateDetails.index == 0) {
      let pageData = this.templateService.getNextTemplateRequestPageNo(true);
      if (pageData?.exceeded) {
        this.templateService.removePrevTemplateRid();
        return;
      }

      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.templateService.setPrevTemplateRequestPage(pageData.pageNo);
      const list = await this.templateService.getTemplateList(newPageNo, this.isVendorContext);
      if (list?.length) {
        this.templateService.setPrevTemplateRequestShifted('true');
        this.templateService.setPrevTemplateRequestRid(list);
        return;
      }
    }

    this.templateService.setPrevTemplateRequestRid(tempRequestList);
    this.templateService.setPrevTemplateRequestShifted('false');
  }

  async loadNextTemplateList() {
    const tempRequestList = this.templateService.getTemplateRid();

    const currentSize = this.templateService.getTemplateRid()?.length ?? 0;
    if (currentSize - this.currentTemplateDetails.index == 1) {
      const pageData = this.templateService.getNextTemplateRequestPageNo();
      if (pageData?.exceeded) {
        this.templateService.removeNextTemplateRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.templateService.setNextTemplateRequestPage(newPageNo);
      const list = await this.templateService.getTemplateList(newPageNo, this.isVendorContext);
      if (list?.length) {
        this.templateService.setNextTemplateRequestShifted('true');
        this.templateService.setNextTemplateRequestRid(list);
        return;
      }
    }

    this.templateService.setNextTemplateRequestRid(tempRequestList);
    this.templateService.setNextTemplateRequestShifted('false');
  }

  async goToPrevRequest() {
    const canProceed = await this.confirmDiscardChanges();
    if (!canProceed) return;
    this.formIsUpdated = false;

    this.currentTemplateDetails.index--;
    this.navigationDirection = 'prev';

    if (this.templateService.getPrevTemplateShifted()) {
      const tempRequestList = this.templateService.getTemplateRid();
      this.templateService.setTemplateRequestRid(tempRequestList);
      const currentRequestSize = this.templateService.getTemplateRid()?.length ?? 0;
      this.currentTemplateDetails.index = currentRequestSize - 1;
      this.templateService.setPrevTemplateRequestShifted('false');
      this.templateService.setPrevTemplateRequestPage(0, true);
    }
    const currentRequest = this.templateService.getNextOrPrevTemplateRequestRid(this.currentTemplateDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  async goToNextRequest() {
    const canProceed = await this.confirmDiscardChanges();
    if (!canProceed) return;
    this.formIsUpdated = false;

    this.currentTemplateDetails.index++;
    this.navigationDirection = 'next';

    if (this.templateService.getNextTemplateRequestShifted()) {
      const tempNextRequestList = this.templateService.getNextTemplateRequestRid();
      this.templateService.setTemplateRequestRid(tempNextRequestList);
      this.currentTemplateDetails.index = 0;
      this.templateService.setNextTemplateRequestShifted('false');
      this.templateService.setNextTemplateRequestPage(0, true);
    }
    const currentRequest = this.templateService.getNextOrPrevTemplateRequestRid(this.currentTemplateDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  openNextRequest(templateRid: number) {
    const queryParams = {
      templateId: templateRid,
      mode: TEMPLATE_MODE.VIEW
    };

    this.router.navigate(
      [`${this.currentPath}/${routeConstants.CREATE_TEMPLATE}`],
      { queryParams }
    );
  }

  get disablePrevBtn() {
    return this.templateService.getPrevTemplateRid()?.length === 0;
  }

  get disableNextBtn() {
    return this.templateService.getNextTemplateRequestRid()?.length === 0;
  }

  async onPreview() {
    const isDraft = this.manualDraftTemplateId;
    const templateId = isDraft ? this.manualDraftTemplateId : this.templateId;

    const templateValue = this.templateForm?.value;
    const formData = {
      template: {
        name: templateValue?.templateName,
        description: templateValue?.description,
        assessmentType: templateValue?.templateType,
      },
      sections: (this.questionsForm?.value || []).map((section: any) => ({
        sectionName: section.section,
        description: section.description,
        totalQuestion: section.questions?.length || 0,
        expanded: true,
        questions: (section.questions || []).map((q: any) => ({
          id: q.id,
          text: q.text,
          helper: q.helper,
          type: q.type,
          required: q.required,
          comment: q.comment,
          file: q.file,
          options: (q.options || []).map((o: any) => ({ value: o.value }))
        }))
      }))
    };

    this.router.navigate([`${this.currentPath}/${routeConstants.PREVIEW_TEMPLATE}`, templateId], {
      state: {
        key: isDraft ? NAVIGATION_TYPE.TEMPLATE_DRAFT_DETAIL : NAVIGATION_TYPE.TEMPLATE_DETAIL,
        id: this.templateId,
        isReadOnly: true,
        formData
      }
    });
  }

  private getFirstInvalidTemplateField(): string | null {
    const templateGroup = this.templateForm;
    for (const key of Object.keys(templateGroup.controls)) {
      const control = templateGroup.get(key);
      if (control && control.invalid) {
        return this.mapTemplateFieldLabel(key);
      }
    }
    return null;
  }

  private mapTemplateFieldLabel(controlName: string): string {
    const fieldMap: Record<string, string> = {
      templateName: 'Template Name',
      description: 'Description',
      templateType: 'Template Type',
      status: 'Status'
    };
    return fieldMap[controlName] || controlName;
  }



  validateAllQuestions(): { valid: boolean; message?: string; sectionIndex?: number; questionIndex?: number; question?: any; } {
    const sections = this.questionsForm as FormArray;

    if (!sections || sections.length === 0) {
      return {
        valid: false,
        message: 'Please add at least one section.'
      };
    }

    for (let sIndex = 0; sIndex < sections.length; sIndex++) {
      const section = sections.at(sIndex) as FormGroup;
      const questions = section.get('questions') as FormArray;

      // if (!questions || questions.length === 0) {
      //   return {
      //     valid: false,
      //     message: `Section "${section.get('section')?.value}" must contain at least one question.`,
      //     sectionIndex: sIndex
      //   };
      // }

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions.at(qIndex) as FormGroup;
        const value = question.value;

        const cleanText = this.stripHtml(value.text);
        const cleanHelper = this.stripHtml(value.helper);

        if (!cleanText) {
          return {
            valid: false,
            message: 'Question text cannot be empty.',
            sectionIndex: sIndex,
            questionIndex: qIndex,
            question: question
          };
        }
        if (!value.type || !value.type.trim()) {
          return {
            valid: false,
            message: 'Question type is required.',
            sectionIndex: sIndex,
            questionIndex: qIndex,
            question: question
          };
        }

        if (
          value.type === 'SINGLE_SELECT' ||
          value.type === 'MULTI_SELECT' ||
          value.type === 'RADIO'
        ) {
          if (!value.options || value.options.length === 0) {
            return {
              valid: false,
              message: 'Please add at least one option.',
              sectionIndex: sIndex,
              questionIndex: qIndex,
              question: question
            };
          }

          const hasEmptyOption = value.options.some(
            (opt: any) => !opt.value || !opt.value.trim()
          );

          if (hasEmptyOption) {
            return {
              valid: false,
              message: 'Option values cannot be empty.',
              sectionIndex: sIndex,
              questionIndex: qIndex,
              question: question
            };
          }
        }
      }
    }

    return { valid: true };
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.trim() || '';
  }

  onBasicClick(event: Event) {
    if (this.questionnaireComponent?.editingQuestionIndex !== null) {
      const canLeave = this.questionnaireComponent?.canLeaveEditingQuestion?.();
      if (!canLeave) {
        event.preventDefault();
        this.selected = 'questions';
        return;
      }
    }

    this.selected = 'basic';
  }

  onQuestionsChange(event: any) {
    this.formIsUpdated = true;
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

}
