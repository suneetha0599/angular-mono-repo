import { Component, inject, ViewChild } from '@angular/core';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { Template, TemplateDetail } from '../../assessments/assignment-model';
import { MatIconModule } from "@angular/material/icon";
import { TemplateService } from '@admin-core/services/template/template.service';
import { TEMPLATE_MODE } from '../constants';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { CommonModule, Location } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { GLOBAL_DIALOG_DEFAULTS, NAVIGATION_TYPE } from '@admin-core/constants/constants';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { TriggerDrawerComponent } from "../trigger-drawer/trigger-drawer.component";
import { StatusUpdateDialogComponent } from '../status-update-dialog/status-update-dialog.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { firstValueFrom } from 'rxjs';
import { buildTemplateForm, buildTemplatePayload, patchTemplateForm } from '../template-utils';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { TemplateNameConflictDialogComponent } from '../template-name-conflict-dialog/template-name-conflict-dialog.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { AssessemntSource } from '../../assessments/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
import { templateDeleteMessage } from '@admin-core/utils/error-message/template-error-message-util';

@Component({
  selector: 'app-template-details',
  imports: [EllipsisTooltipDirective, MatIconModule, CommonModule, MatTooltipModule, MatSidenavModule, TriggerDrawerComponent, ErrorLoadingItemsComponent, LoadingButtonComponent, SafeHtmlPipe],
  templateUrl: './template-details.component.html',
  styleUrl: './template-details.component.scss'
})
export class TemplateDetailsComponent {
  loading = true
  templateDetails: any
  templateId: number = 0;
  isDraft = false;
  manualDraftTemplateId = ''
  currentTemplateDetails = {
    assessmentRid: 0,
    index: 0
  };
  currentPath = ''
  private navigationDirection: 'prev' | 'next' | null = null;
  dialogRef: MatDialogRef<any> | null = null;
  selectedEditPayload: any;
  hasApiError: boolean = false;
  isSubmitLoading: boolean = false;
  createTemplateForm!: FormGroup;
  editAssessmentTemplate: boolean = false;
  assessmentSource: string = AssessemntSource.GENERAL
  routeSource: string = '';

  @ViewChild('templateTriggerDrawer') templateTriggerDrawer!: MatDrawer;

  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private dialog = inject(MatDialog);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private assessmentService = inject(AssessmentService);
  private rolePermissionService = inject(RolePermissionService);
  private location = inject(Location);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private apiHelperService: ApiHelperService,
    private templateService: TemplateService,
  ) { }

  ngOnInit() {

    if (this.router.url.includes(routeConstants.VENDORS)) {
      this.assessmentSource = AssessemntSource.VENDOR;
    }
    this.setNavigationDetails();
    this.setUserPermissions();
    this.route.queryParamMap.subscribe({
      next: async params => {
        const templateId = params.get('templateId');
        const manualDraftTemplateId = params.get('manualDraftTemplateId');

        if (manualDraftTemplateId) {
          this.templateId = 0;
          this.isDraft = true;
          this.manualDraftTemplateId = manualDraftTemplateId;

          this.onInitPage();

          this.createTemplateForm = buildTemplateForm(this.fb);
          await this.loadDraftTemplateDetails(manualDraftTemplateId);
        }
        else if (templateId) {
          this.templateId = +templateId;
          this.onInitPage();
          await this.loadTemplateDetails();
        }

      }
    });
  }

  setNavigationDetails() {
    const navState = history.state;
    if (navState) {
      this.routeSource = navState?.routeSource;
    }
  }

  private async loadDraftTemplateDetails(draftId: string): Promise<void> {
    this.loading = true;
    this.hasApiError = false;
    try {
      const draftDetails =
        await this.assessmentApiHelperService.getManualDraftDetails(draftId);

      if (draftDetails?.formData) {
        const draftForm = draftDetails.formData;
        const templateType = draftForm?.template?.templateType;

        const typeId = typeof templateType === 'object' ? templateType?.id : templateType;
        const mappedDraft: TemplateDetail = {
          template: {
            templateId: draftId,
            name: draftForm.template.templateName || "",
            description: draftForm.template.description || "",
            assessmentType: draftForm.template.templateType || "",
            status: draftForm.template.status,
            createdOn: draftForm.createdAt,
            createdBy: draftForm.createdBy || 0,
            type: typeId
          },
          sections: draftForm.assessments || [],
          totalSection: draftForm.assessments?.length || 0,
          totalQuestion: 0,
        };
        let totalQuestions: number = 0;
        if (mappedDraft.sections?.length) {
          mappedDraft.sections.map(section => {
            section.totalQuestion = (section.questions?.length ?? 0);
            totalQuestions += section.totalQuestion;
          })
          mappedDraft.totalQuestion = totalQuestions
        }
        this.templateDetails = await this.templateService.processTemplatedetails(mappedDraft);
        patchTemplateForm(this.fb, this.createTemplateForm, this.templateDetails);
        return
      }
      this.hasApiError = true
    }
    catch (error) {
      console.error('Error loading draft details:', error);
      // this.snackbarService.openSnack('Failed to load draft details');
      this.hasApiError = true
    } finally {
      this.loading = false;
    }
  }


  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.updateCurrentRequestIndex()
  }

  private async loadTemplateDetails(): Promise<void> {
    this.loading = true;
    this.hasApiError = false
    try {
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const templateDetails = await this.assessmentApiHelperService.getTemplateDetails(+(this.templateId), null, _url);
      if (templateDetails) {
        this.templateDetails = await this.templateService.processTemplatedetails(templateDetails);
        return
      }
      this.hasApiError = true
    } catch (error) {
      console.error('Error loading task details:', error);
      this.snackbarService.openSnack('Failed to load task details');
      this.hasApiError = true
    } finally {
      this.loading = false;
    }
  }
  async updateCurrentRequestIndex() {
    const templateList = this.templateService.getTemplateRid();

    const currentId = this.isDraft
      ? this.manualDraftTemplateId
      : this.templateId;

    const nodeIndex = templateList.findIndex(
      (item: any) => item.requestRid == currentId
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
      const list = await this.templateService.getTemplateList(newPageNo, this.isVendorContext, this.isDraft);
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
      const list = await this.templateService.getTemplateList(newPageNo, this.isVendorContext, this.isDraft);
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

  openNextRequest(templateRid: any) {

    const queryParams = this.isDraft
      ? {
        manualDraftTemplateId: templateRid,
        mode: TEMPLATE_MODE.VIEW
      }
      : {
        templateId: templateRid,
        mode: TEMPLATE_MODE.VIEW
      };

    this.router.navigate(
      [`${this.currentPath}/${routeConstants.TEMPLATE_DETAILS}`],
      { queryParams }
    );
  }


  get disablePrevBtn() {
    return this.templateService.getPrevTemplateRid()?.length === 0;
  }

  get disableNextBtn() {
    return this.templateService.getNextTemplateRequestRid()?.length === 0;
  }

  openTemplateTriggerDrawer() {
    this.selectedEditPayload = {
      currentQuestionId: 11,
      currentSectionId: 8,
      templateDetails: this.templateDetails
    };
    this.templateTriggerDrawer.open();
  }

  async deleteTemplate() {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this template?',
        confirmationDetail: this.templateDetails.template.name,
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
      if (this.isDraft) {
        try {
          await this.assessmentApiHelperService.deleteManualDraftRequest(this.manualDraftTemplateId);
          this.snackbarService.openSnack(templateDeleteMessage());
          this.dialogRef?.close();
          this.goToListingPage();
        }
        catch (error) {
          console.error('Error deleting template:', error);
        }
      }
      else {
        this.onDeleteMainTemplate()
      }
    });
  }

  onDeleteMainTemplate() {
    const templateId = this.templateId;
    const deleteCommand = {
      commands: [
        {
          type: "deleteTemplate",
          templateId: templateId
        }
      ],
    }
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    this.assessmentApiHelperService.updateTemplateDetails(templateId, deleteCommand, _url, false)
      .subscribe({
        next: async (res) => {
          this.snackbarService.openSnack(templateDeleteMessage());
          this.dialogRef?.close();
          this.goToListingPage();
        },
        error: (e: Error) => {
          console.error(e.message);
        },
      });
  }

  openEdit() {
    let queryParams = {}
    if (this.isDraft) {
      queryParams = { manualDraftTemplateId: this.manualDraftTemplateId, mode: 'EDIT' };
    }
    else {
      queryParams = { templateId: this.templateId, mode: 'EDIT' };
    }
    this.router.navigate([`${this.currentPath}/${routeConstants.CREATE_TEMPLATE}`], {
      queryParams: queryParams,
    })
  }

  openEditStatus() {
    const dialogRef = this.dialog.open(StatusUpdateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'template',
        templateId: this.templateId,
        currentStatus: this.templateDetails?.status,
        isVendorContext: this.isVendorContext
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTemplateDetails();
      }
    });
  }

  onPreview() {
    const isDraft = this.manualDraftTemplateId;
    const templateId = isDraft ? this.manualDraftTemplateId : this.templateId
    this.router.navigate([`${this.currentPath}/${routeConstants.PREVIEW_TEMPLATE}`, templateId],
      {
        state: {
          key: isDraft ? NAVIGATION_TYPE.TEMPLATE_DRAFT_DETAIL : NAVIGATION_TYPE.TEMPLATE_DETAIL,
          id: this.templateId,
          isReadOnly: true,
        }
      })
  }

  goToListingPage() {
    this.router.navigate([
      `${this.currentPath}/${routeConstants.TEMPLATE_LIST}`,
    ]);
  }

  get publishText() {
    return this.isDraft ? `Unpublished` : `Published`
  }

  async onSave(): Promise<void> {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched()
      const fieldName = this.getFirstInvalidTemplateField();
      this.snackbarService.openSnack(fieldName ? `${fieldName} is required.` : 'Please complete required template fields.');
      return;
    }
    const questionError = this.getFirstInvalidQuestionField();
    this.questionsForm.markAllAsTouched()
    if (questionError) {
      this.snackbarService.openSnack(questionError);
      return;
    }

    const sectionsArray = this.questionsForm?.value || [];
    const isValid = this.templateService.validateAllQuestions(sectionsArray);
    if (!isValid) {
      return;
    }

    // const sectionWithoutQuestions = sectionsArray.find((section: any) => {
    //   return !section.questions || section.questions.length === 0;
    // });

    // if (sectionWithoutQuestions) {
    //   const confirm = await firstValueFrom(
    //     this.confirmationDialogService.showDialog(
    //       'Alert',
    //       'There is a section with <b>0 questions</b>. Are you sure you want to continue?',
    //       'Yes, Continue',
    //       'Cancel'
    //     )
    //   );

    //   if (!confirm) {
    //     return;
    //   }
    // }

    const confirmPublish = await firstValueFrom(
      this.confirmationDialogService.showDialog(
        'Confirm Template Publication',
        'Are you sure you want to publish this template? <br> Once the template is published and activated, it cannot be edited further. Please confirm that you want to proceed.',
        'Confirm',
        'Cancel'
      )
    );

    if (!confirmPublish) {
      return;
    }

    if (this.templateId) {
      this.updateTemplates();
      return;
    }

    this.isSubmitLoading = true;
    try {
      const payload = await buildTemplatePayload(this.createTemplateForm, this.assessmentService, this.assessmentApiHelperService, true, (msg) => this.snackbarService.openSnack(msg));

      let currentName = payload.name;
      let nameResolved = false;

      while (!nameResolved) {
        const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;

        const nameCheckRes = await this.assessmentApiHelperService.duplicateTemplate({ templateName: currentName }, _url);

        if (nameCheckRes?.data?.templateNameExists) {
          const suggestedName = nameCheckRes.data.newTemplateName || `${currentName} v2`;
          const conflictDialogRef = this.dialog.open(TemplateNameConflictDialogComponent, {
            ...GLOBAL_DIALOG_DEFAULTS,
            disableClose: true,
            panelClass: 'dialog-wrapper',
            data: {
              currentName: currentName,
              suggestedName,
            },
          });
          const newName = await firstValueFrom(conflictDialogRef.afterClosed());
          if (!newName) {
            this.isSubmitLoading = false;
            return;
          }
          currentName = newName;
        } else {
          nameResolved = true;
        }
      }

      payload.name = currentName;
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const res = await this.assessmentApiHelperService.createTemplate(payload, _url);
      if (res.success) {
        await this.deleteManualDraftRequests();
        this.goToListingPage();
      }
    } catch (e) {
      console.error('Error', e);
    } finally {
      this.isSubmitLoading = false;
    }
  }

  async deleteManualDraftRequests() {
    if (this.manualDraftTemplateId) {
      await this.deleteManualDraftRequest();
      return;
    }
  }

  async deleteManualDraftRequest() {
    try {
      const response = await this.assessmentApiHelperService.deleteManualDraftRequest(this.manualDraftTemplateId);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async updateTemplates() {
    this.isSubmitLoading = true;
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    const payload = await buildTemplatePayload(this.createTemplateForm, this.assessmentService, this.assessmentApiHelperService, true, (msg) => this.snackbarService.openSnack(msg));
    this.assessmentApiHelperService.updateTemplateDetails(this.templateId, payload, _url)
      .subscribe({
        next: async (res) => {
          this.goToListingPage();
          this.isSubmitLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isSubmitLoading = false;
        },
      });
  }

  get templateForm() {
    return this.createTemplateForm?.get('template') as FormGroup;
  }

  get questionsForm() {
    return this.createTemplateForm?.get('assessments') as FormArray;
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

  private getFirstInvalidQuestionField(): string | null {
    const sections = this.questionsForm.controls;
    for (let sIndex = 0; sIndex < sections.length; sIndex++) {
      const section = sections[sIndex] as FormGroup;
      const questions = section.get('questions') as FormArray;
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions.at(qIndex) as FormGroup;
        const text = question.get('text')?.value?.replace(/<[^>]*>/g, '').trim();
        if (!text) {
          return `Question text is empty (Section ${sIndex + 1}, Question ${qIndex + 1})`;
        }
        if (!question.get('type')?.value) {
          return `Question type is empty (Section ${sIndex + 1}, Question ${qIndex + 1})`;
        }
        if (question.invalid) {
          return `Incomplete fields in Section ${sIndex + 1}, Question ${qIndex + 1}`;
        }
      }
    }

    return null;
  }

  setUserPermissions() {
    this.editAssessmentTemplate = this.rolePermissionService.editAssessmentTemplate || this.rolePermissionService.fullAccessAssessmentTemplate;
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

  goBack() {
    this.location.back();
  }
}
