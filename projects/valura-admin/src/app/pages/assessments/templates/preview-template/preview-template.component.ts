import { Component, HostListener, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Location } from '@angular/common';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { TemplateService } from '@admin-core/services/template/template.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { Section, TemplateDetail } from '../../assessments/assignment-model';
import { GLOBAL_DIALOG_DEFAULTS, NAVIGATION_TYPE } from '@admin-core/constants/constants';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { MatDialog } from '@angular/material/dialog';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { FormGroup } from '@angular/forms';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { TemplatePreviewStateService } from '../template-preview-state.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { TemplateNameConflictDialogComponent } from '../template-name-conflict-dialog/template-name-conflict-dialog.component';
import { AuthService } from '@admin-core/services/auth.service';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { AssessemntSource } from '../../assessments/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
import { MatDrawer } from '@angular/material/sidenav';
import { FormBuilder } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { FormArray } from '@angular/forms';
import { TriggerDrawerComponent } from '../trigger-drawer/trigger-drawer.component';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

@Component({
  selector: 'preview-template',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
    ErrorLoadingItemsComponent,
    SafeHtmlPipe,
    LoadingButtonComponent,
    MatDrawerContainer,
    MatDrawer,
    TriggerDrawerComponent,
    MatBadgeModule
  ],
  templateUrl: './preview-template.component.html',
  styleUrl: './preview-template.component.scss'
})
export class PreviewTemplateComponent implements OnInit {

  @Input() _templateFormGroup!: FormGroup;
  @Input() isAssessmentView: boolean = false;
  @Input() assessmentsFormArray!: FormArray;

  templateDetails: any;
  templateId: number = 0;
  manualDraftTemplateId: string = ''
  loading = true;
  expandedSections: Set<number> = new Set();
  hasApiError: boolean = false;
  isPublishMode: boolean = false;
  isPublishing: boolean = false;
  publishPayload: any = null;
  public dialog = inject(MatDialog);
  formIsUpdated: boolean = false;
  private formUpdatedSubscription!: Subscription;
  editAssessmentTemplate: boolean = false;
  assessmentSource: string = AssessemntSource.GENERAL
  currentPath: string = '';
  selectedEditPayload: any
  selectedIndex: number = 0;

  isDraft: boolean = false;
  @ViewChild('templateTriggerDrawer') templateTriggerDrawer!: MatDrawer;

  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private templatePreviewStateService = inject(TemplatePreviewStateService);
  private assessmentService = inject(AssessmentService);
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private templateService = inject(TemplateService);
  private rolePermissionService = inject(RolePermissionService);
  private authService = inject(AuthService);
  private confirmationDialogService = inject(ConfirmationDialogService);

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private location: Location,) {
    this.formUpdatedSubscription = this.templatePreviewStateService.formIsUpdated$.subscribe(value => {
      this.formIsUpdated = value ? true : false;
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.formIsUpdated && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  get questionsForm(): FormArray {
    if (!this.assessmentsFormArray?.length || this.selectedIndex == null) {
      return this.fb.array([]);
    }
    return this.assessmentsFormArray
      .at(this.selectedIndex)
      .get('questions') as FormArray;
  }

  hasRuleByIndex(sectionIndex: number, questionIndex: number): boolean {
    const section = this.templateDetails?.sections?.[sectionIndex];
    const question = section?.questions?.[questionIndex];

    return Array.isArray(question?.rules) && question.rules.length > 0;
  }

  openTemplateTriggerDrawer(section: any, question: any) {
    const normalizedSections = (this.templateDetails.sections || []).map((s: any) => ({
      ...s,
      section: s.section || s.sectionName,
      questions: (s.questions || []).map((q: any, qIdx: number) => ({
        ...q,
        displayOrder: q.displayOrder ?? qIdx + 1,
        displaySectionOrder: q.displaySectionOrder ?? (this.templateDetails.sections.indexOf(s) + 1)
      }))
    }));
    this.selectedEditPayload = {
      currentSectionId: section.id,
      currentQuestionId: question.id,
      sections: normalizedSections
    };
    this.templateTriggerDrawer.open();
  }

  ngOnInit() {
    if (this.router.url.includes(routeConstants.VENDORS)) {
      this.assessmentSource = AssessemntSource.VENDOR;
    }
    this.currentPath = this.router.url.split(`${routeConstants.PREVIEW_TEMPLATE}`)[0];
    this.setUserPermissions();
    if (this.isAssessmentView) {
      return
    }
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const state = history.state;
      const key = state.key;
      this.isDraft = state?.isDraft ?? false;
      this.isPublishMode = state?.isPublishMode ?? false;
      this.publishPayload = state?.publishPayload ?? null;
      this.manualDraftTemplateId = state?.manualDraftTemplateId ?? '';
      if (!id) {
        this.onInvalidId()
        return
      }

      if (state.formData) {
        this.templateDetails = state.formData;
        this.loading = false;
        return;
      }
      if (key == NAVIGATION_TYPE.TEMPLATE_DETAIL) {
        this.templateId = id ? +id : 0;
        if (this.templateId) {
          this.loadTemplateDetails();
        } else {
          this.onInvalidId()
        }
        return
      }
      else if (key == NAVIGATION_TYPE.TEMPLATE_DRAFT_DETAIL) {
        this.manualDraftTemplateId = id ?? ''
        if (this.manualDraftTemplateId) {
          this.getTemplateDraftDetails(this.manualDraftTemplateId);
        } else {
          this.onInvalidId()
        }
      }
      else {
        this.onInvalidId()
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['_templateFormGroup']) {
      if (this._templateFormGroup?.value) {
        this.templateId = this._templateFormGroup.value?.templateId;
        if (this.templateId) {
          const assessmentTemplateDetail = this.assessmentService.assessmentTemplateDetail;
          if (assessmentTemplateDetail) {
            this.templateDetails = assessmentTemplateDetail;
            this.clearValues()
          }
          else {
            this.loadTemplateDetails()
          }
        }
        else {
          this.onInvalidId(false)
        }
      }
      else {
        this.onInvalidId(false)
      }
    }
  }

  ngOnDestroy(): void {
    this.formUpdatedSubscription?.unsubscribe();
  }

  canDeactivate(): boolean {
    if (this.formIsUpdated) {
      return false
    }
    return true;
  }

  onCancel(): void {
    this.formIsUpdated = false;
    this.location.back();
  }

  async onPublish(): Promise<void> {
    if (!this.publishPayload) {
      this.snackbarService.openSnack('Invalid publish data');
      return;
    }
    const isValid = this.templateService.validateAllQuestions(this.publishPayload.sections);
    if (!isValid) {
      return;
    }

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

    this.isPublishing = true;
    try {
      let currentName = this.publishPayload.name;
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
            this.isPublishing = false;
            return;
          }
          currentName = newName;
        } else {
          nameResolved = true;
        }
      }

      this.publishPayload.name = currentName;
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const res = await this.assessmentApiHelperService.createTemplate(this.publishPayload, _url);
      if (res.success) {
        if (this.manualDraftTemplateId) {
          await this.assessmentApiHelperService.deleteManualDraftRequest(this.manualDraftTemplateId);
        }
        this.formIsUpdated = false;
        this.templatePreviewStateService.clearSnapshot();
        this.router.navigate([`${this.currentPath}/${routeConstants.TEMPLATE_LIST}`]);
      }
    } catch (error) {
      console.error('Error publishing template:', error);

    } finally {
      this.isPublishing = false;
    }
  }

  private async loadTemplateDetails(): Promise<void> {
    this.loading = true;
    this.hasApiError = false;
    try {
      const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      const templateDetails = await this.assessmentApiHelperService.getTemplateDetails(this.templateId, null, _url);
      if (templateDetails) {
        this.templateDetails = await this.templateService.processTemplatedetails(templateDetails);
        this.assessmentService.assessmentTemplateDetail = templateDetails
      } else {
        this.snackbarService.openSnack('Template not found');
        this.hasApiError = true
      }
    } catch (error) {
      console.error('Error loading template details:', error);
      this.snackbarService.openSnack('Failed to load template details');
      this.hasApiError = true
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.formIsUpdated = false
    this.location.back();
  }

  toggleSection(clickedSection: Section) {
    if (!this.templateDetails?.sections) return;

    this.templateDetails.sections.forEach((section: Section) => {
      if (section === clickedSection) {
        section.expanded = !section.expanded;
      } else {
        section.expanded = false;
      }
    });
  }

  isSectionExpanded(sectionId: number): boolean {
    return this.expandedSections.has(sectionId);
  }

  private async getTemplateDraftDetails(draftId: string): Promise<void> {
    this.loading = true;
    this.hasApiError = false;
    try {
      const draftDetails = await this.assessmentApiHelperService.getManualDraftDetails(draftId);

      if (draftDetails?.formData) {
        const draftForm = draftDetails.formData;
        const mappedDraft: TemplateDetail = {
          template: {
            templateId: draftId,
            name: draftForm.template.templateName,
            description: draftForm.template.description,
            assessmentType: draftForm.template.templateType,
            status: draftForm.template.status,
            createdOn: draftForm.createdAt,
            createdBy: 0,
            type: draftForm.template.templateType.id
          },
          sections: draftForm.assessments || [],
          totalSection: draftForm.assessments?.length || 0,
          totalQuestion: 0
        };

        this.templateDetails = await this.templateService.processTemplatedetails(mappedDraft);
        return
      }
      this.hasApiError = true;
    } catch (error) {
      console.error('Error loading draft details:', error);
      this.snackbarService.openSnack('Failed to load draft details');
      this.hasApiError = true
    } finally {
      this.loading = false;
    }
  }

  onInvalidId(showSnackbar: boolean = true) {
    if (showSnackbar) {
      this.snackbarService.openSnack('Invalid template ID');
    }
    this.hasApiError = true;
    // this.goBack();
  }

  extractFontStyles(htmlString: string): { fontFamily?: string; fontSize?: string } {
    if (!htmlString) return {};

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;


    const styledElement = tempDiv.querySelector('[style*="font"]');

    if (styledElement) {
      const style = (styledElement as HTMLElement).style;
      return {
        fontFamily: style.fontFamily || undefined,
        fontSize: style.fontSize || undefined
      };
    }

    return {};
  }


  getQuestionTextStyle(questionText: string): string {
    const styles = this.extractFontStyles(questionText);
    const styleArray: string[] = [];

    if (styles.fontFamily) {
      styleArray.push(`font-family: ${styles.fontFamily}`);
    }
    if (styles.fontSize) {
      styleArray.push(`font-size: ${styles.fontSize}`);
    }

    return styleArray.join('; ');
  }


  onHelperContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement;

    if (!link) return;

    const href = link.getAttribute('href');


    if (href && href.startsWith('filekey://')) {
      event.preventDefault();
      event.stopPropagation();

      const fileKey = href.replace('filekey://', '');
      const fileName = link.getAttribute('data-filename') ||
        link.textContent?.trim() ||
        'image';

      this.viewImageFromFileKey(fileKey, fileName);
      return;
    }


    if (href && href !== '#' && !href.startsWith('javascript:')) {
      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }


    if (href === '#' || href === '') {
      event.preventDefault();
    }
  }

  async viewImageFromFileKey(fileKey: string, fileName: string): Promise<void> {
    try {
      const params = { fileKey: fileKey };


      const imageInfo = await this.apiHelperService.getPresignedUrl(params);

      if (imageInfo?.presignedUrl) {
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: fileName || 'image',
            isTaskView: true,
          },
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          maxWidth: '100vh',
          disableClose: false,
          panelClass: 'dialog-wrapper',
          autoFocus: false,
        });
      } else {
        console.error('Failed to get presigned URL for image');
        this.snackbarService.openSnack('Failed to load image');
      }
    } catch (error) {
      console.error('Error viewing image:', error);
      this.snackbarService.openSnack('Error loading image');
    }
  }

  onDescriptionContentClick(event: MouseEvent): void {
    this.onHelperContentClick(event); // Same logic
  }

  get showHeading() {
    return this.isAssessmentView ? false : true
  }

  get showFooterSection() {
    return this.isAssessmentView ? false : this.isPublishMode
  }

  get errorTitle(): string {
    return 'Template ID not found!'
  }

  clearValues() {
    this.loading = false;
    this.hasApiError = false;
  }

  hasHelperText(helper: string | null | undefined): boolean {
    if (!helper) return false;
    const text = helper.replace(/<[^>]*>/g, '').trim();
    const cleanText = text.replace(/&nbsp;/g, '').trim();
    return cleanText.length > 0;
  }

  setUserPermissions() {
    this.editAssessmentTemplate = this.rolePermissionService.editAssessmentTemplate || this.rolePermissionService.fullAccessAssessmentTemplate;
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }
}