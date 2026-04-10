import { Component, inject, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { EmailTemplatePayload } from '../email-configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { EmailPreviewDialogComponent } from '../email-preview-dialog/email-preview-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, EMAIL_TEMPLATE_DRAFT_KEY, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { TextStyle } from '@tiptap/extension-text-style';
import { templateType, module as emailModule } from '../../general-configuration/constant';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { FormControl } from '@angular/forms';
import { EmailService } from '@admin-core/services/email.service';
import { EmailConfiguration } from '@admin-core/models/configuration/EmailConfiguration';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { TemplateRef } from '@angular/core';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
        renderHTML: (attributes: any) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`
          };
        }
      }
    };
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      }
    };
  }
});

@Component({
  selector: 'app-email-configuration-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    ErrorLoadingItemsComponent,
    CustomEditorComponent
  ],
  templateUrl: './email-configuration-create.component.html',
  styleUrl: './email-configuration-create.component.scss'
})
export class EmailConfigurationCreateComponent implements OnInit, AfterViewInit, OnDestroy {


  emailForm!: FormGroup;

  triggerEvents: { value: string; label: string }[] = [];
  emailConfiguration!: EmailConfiguration;
  module = emailModule;
  templateType = templateType;
  templateId: number | null = null;
  isEditMode: boolean = false;
  initialFormValue: any = null;
  hasFormChanged: boolean = false;
  isLoading: boolean = false;
  draftId: string | null = null;
  isDraftMode: boolean = false;
  isSavingTemplate: boolean = false;
  isSavingDraft: boolean = false;
  prevId: number | null = null;
  nextId: number | null = null;
  selectedEmailElementList: any = [];
  hasApiError: boolean = false;
  prevSelectedTriggerEvent: string = '';
  isFinalSaved: boolean = false;

  private apiHelperService = inject(ApiHelperService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private el = inject(ElementRef);
  private emailNavigationService = inject(EmailService);
  showPopup: boolean = false;
  @ViewChild('overrideDialog') overrideDialog!: TemplateRef<any>;
  private pendingPayload!: EmailTemplatePayload;

  constructor(private fb: FormBuilder) { }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        entityId: this.templateId,
        audit_log_module: AUDIT_LOG_MODULE.CONFIGURATION,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.EMAIL
      }
    })
  }

  ngOnInit() {
    this.onInitPage();
  }

  async onInitPage() {
    this.initForm();
    this.checkEditMode();
  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {

  }

  initForm() {
    this.emailForm = this.fb.group({
      name: ['', Validators.required],
      triggerEvent: ['', Validators.required],
      templateType: ['', Validators.required],
      module: ['', Validators.required],
      emailSubject: ['', Validators.required],
      emailBody: ['', Validators.required]
    });
  }



  private checkEditMode() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.resetFormState();
        this.updateNavButtons();
        const id = params['id'];
        if (isNaN(+id)) {
          this.draftId = id;
          this.isDraftMode = true;
          this.loadDraftForEdit(this.draftId!);
        } else {
          this.templateId = +id;
          this.isEditMode = true;
          this.loadTemplateForEdit(this.templateId);
        }
      }
    });
  }

  private getStyledBody(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('p').forEach(el => {
      el.style.margin = '0 0 16px 0';
      el.style.color = '#4a5568';
      el.style.lineHeight = '1.8';
    });

    doc.querySelectorAll('strong').forEach(el => {
      el.style.color = '#1C2B70';
      el.style.fontWeight = '600';
    });

    doc.querySelectorAll('span').forEach(el => {
      el.style.backgroundColor = '#FEF3C7';
      el.style.padding = '2px 6px';
      el.style.borderRadius = '4px';
    });

    return doc.body.innerHTML;
  }



  private mapTemplateType(value: string) {
    return this.templateType.find(t =>
      t.value === value || t.label === value
    )?.value ?? null;
  }

  private mapModule(value: string) {
    return this.module.find(m =>
      m.value === value || m.label === value
    )?.value ?? null;
  }

  private async loadDraftForEdit(draftId: string) {
    this.isLoading = true;
    try {
      const response = await this.apiHelperService.getManualDraftDetails(draftId);
      if (response && response.formData) {
        this.emailForm.patchValue({
          name: response.formData.name,
          triggerEvent: response.formData.triggerEvent,
          templateType: this.mapTemplateType(response.formData.templateType),
          module: this.mapModule(response.formData.module),
          emailSubject: response.formData.emailSubject,
          emailBody: response.formData.htmlContent || '',
          subject: response.formData.emailSubject || '',
          body: response.formData.htmlContent || ''
        });
        this.isLoading = false;


        this.initialFormValue = this.emailForm.value;
        this.trackFormChanges();
        await this.loadEmailConfiguration();
        this.setEmailPlaceHolders();
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.location.back();
  }

  private getTriggerDescription(triggerId: string): string {
    const trigger = this.triggerEvents.find(t => t.value === triggerId);
    return trigger ? trigger.label : '';
  }

  private async loadTemplateForEdit(templateId: number) {
    this.hasApiError = false;
    this.isLoading = true;
    try {
      const templateData = await this.apiHelperService.getEmailTemplateById(templateId);
      if (!templateData) { this.hasApiError = true; return }
      if (templateData) {
        this.emailForm.patchValue({
          triggerEvent: templateData.template.triggerId,
          name: templateData.template.name,
          templateType: templateData.template.templateType,
          module: templateData.template.module,
          emailSubject: templateData.template.subject,
          emailBody: templateData.template.body || '',
          subject: templateData.template.subject || '',
          body: templateData.template.body || ''
        });
        this.isLoading = false;
        this.prevSelectedTriggerEvent = this.emailForm.value.triggerEvent ?? '';
        this.initialFormValue = this.emailForm.value;
        this.trackFormChanges();
        await this.loadEmailConfiguration();
        this.setEmailPlaceHolders();
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      this.hasApiError = true
    } finally {
      this.isLoading = false;
    }
  }

  private trackFormChanges() {
    this.emailForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  private checkFormChanges() {
    if ((!this.isEditMode && !this.isDraftMode) || !this.initialFormValue) {
      this.hasFormChanged = true;
      return;
    }
    this.hasFormChanged = JSON.stringify(this.emailForm.value) !== JSON.stringify(this.initialFormValue);
  }

  async loadEmailConfiguration() {
    const moduleName = this.moduleControl.value;
    if (!moduleName) {
      return
    }
    try {
      const params = {
        module: moduleName
      }
      const config = await this.apiHelperService.getEmailConfiguration(params);
      if (config) {
        if (config.triggerEvents) {
          this.triggerEvents = config.triggerEvents.map((event: any) => ({
            value: event.trigger,
            label: event.description
          }));
        }
        if (config && !this.emailConfiguration) {
          this.emailConfiguration = config;
        }
      }
    } catch (error) {
      console.error('Failed to load email configuration:', error);
    }
  }


  onEditorContentChange(data: { content: string, edited: boolean }) {
    this.emailForm.patchValue({ emailBody: data.content }, { emitEvent: false });
    if (data.edited) {
      this.checkFormChanges();
    }
  }

  onPreview() {
    if (!this.emailForm.valid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.dialog.open(EmailPreviewDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      data: {
        subject: this.emailForm.get('emailSubject')?.value,
        htmlContent: this.emailForm.get('emailBody')?.value
      }
    });

  }

  onOverrideYes() {
    this.dialog.closeAll();
    this.onSave(this.pendingPayload);
  }

  onOverrideNo() {
    this.dialog.closeAll();
  }

  private async onSave(payload: EmailTemplatePayload) {
    try {
      if (this.isEditMode && this.templateId) {
        await this.apiHelperService.updateEmailTemplate(this.templateId, payload);
      } else {
        await this.apiHelperService.saveEmailTemplate(payload);
        if (this.isDraftMode && this.draftId) {
          try {
            await this.apiHelperService.deleteManualDraft(this.draftId);
          } catch (error) {
            console.error('Failed to delete draft:', error);
          }
        }
      }
      this.location.back();

    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }

  async onSaveTemplate() {
    this.emailForm.markAllAsTouched();
    if (!this.emailForm.valid) {
      this.scrollToFirstInvalidControl();
      return;
    }

    if (this.isEmailBodyEmpty()) {
      this.emailForm.get('emailBody')?.setErrors({ 'required': true });
      this.emailForm.get('emailBody')?.markAsTouched();
      this.scrollToFirstInvalidControl();
      return;
    }

    this.isSavingTemplate = true;
    const triggerEvent = this.emailForm.get('triggerEvent')?.value || ''
    const payload: EmailTemplatePayload = {
      name: this.emailForm.get('name')?.value || '',
      triggerId: triggerEvent,
      notificationType: "MODULE",
      templateType: this.emailForm.get('templateType')?.value || '',
      body: this.emailForm.get('emailBody')?.value || '',
      htmlContent: this.getStyledBody(this.emailForm.get('emailBody')?.value || ''),
      module: this.emailForm.get('module')?.value || '',
      subject: this.emailForm.get('emailSubject')?.value || '',
    };

    this.pendingPayload = payload;
    const triggerEventIsChanged = this.prevSelectedTriggerEvent ? (triggerEvent ? (this.prevSelectedTriggerEvent !== triggerEvent) : false) : true;

    try {
      if ((this.isDraftMode && this.draftId) || triggerEventIsChanged) {
        const res = await this.apiHelperService.checkDuplicateEmailTemplate(this.emailForm.get('triggerEvent')?.value);
        this.isFinalSaved = true;
        if (res?.triggerIdExists) {
          this.dialog.open(this.overrideDialog, {
            width: '400px',
            panelClass: 'dialog-wrapper',
          });
        } else {
          await this.onSave(payload);
          this.isFinalSaved = true;
        }
      }
      else {
        await this.onSave(payload);
        this.isFinalSaved = true;
      }

    } catch (error) {
      this.isFinalSaved = false;
      console.error('Failed to save/update template:', error);
    } finally {
      this.isSavingTemplate = false;
    }
  }

  private scrollToFirstInvalidControl() {
    setTimeout(() => {
      const firstInvalidControl = this.el.nativeElement.querySelector(
        '.ng-invalid, .email-body-error'
      );

      if (firstInvalidControl) {
        const scrollContainer = this.el.nativeElement.querySelector('.overflow-auto');
        if (scrollContainer) {
          const nameValid = this.emailForm.get('name')?.valid;
          const triggerEventValid = this.emailForm.get('triggerEvent')?.valid;
          const emailSubjectValid = this.emailForm.get('emailSubject')?.valid;
          const emailBodyInvalid = this.emailForm.get('emailBody')?.invalid;

          const onlyEmailBodyInvalid = nameValid && triggerEventValid && emailSubjectValid && emailBodyInvalid;

          if (onlyEmailBodyInvalid) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          } else {
            const elementPosition = firstInvalidControl.offsetTop;
            const offset = 100;
            scrollContainer.scrollTo({
              top: elementPosition - offset,
              behavior: 'smooth'
            });
          }
        } else {
          firstInvalidControl.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }, 100);
  }

  getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  isEmailBodyEmpty(): boolean {
    const htmlContent = this.emailForm.get('emailBody')?.value || '';
    const plainText = this.getPlainTextFromHtml(htmlContent).trim();
    return plainText.length === 0;
  }

  async onSaveToDraft() {
    this.emailForm.get('name')?.markAsTouched();
    this.emailForm.get('triggerEvent')?.markAsTouched();
    this.emailForm.get('emailSubject')?.markAsTouched();

    const basicFieldsValid =
      this.emailForm.get('name')?.valid &&
      this.emailForm.get('triggerEvent')?.valid &&
      this.emailForm.get('emailSubject')?.valid;

    if (!basicFieldsValid) {
      return;
    }

    this.isSavingDraft = true;
    const triggerId = this.emailForm.get('triggerEvent')?.value || ''

    const draftPayload = {
      key: EMAIL_TEMPLATE_DRAFT_KEY,
      formData: {
        name: this.emailForm.get('name')?.value || '',
        triggerEvent: triggerId,
        emailSubject: this.emailForm.get('emailSubject')?.value || '',
        htmlContent: this.emailForm.get('emailBody')?.value || '',
        notificationType: "MODULE",
        templateType: this.emailForm.get('templateType')?.value || '',
        triggerId: triggerId,
        module: this.emailForm.get('module')?.value || '',
        triggerDescription: this.getTriggerDescription(triggerId),
      }
    };

    try {
      if (this.isDraftMode && this.draftId) {
        await this.apiHelperService.saveManualDraftPut(draftPayload, this.draftId);
      } else {
        await this.apiHelperService.saveManualDraftPost(draftPayload);
      }
      this.location.back();
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      this.isSavingDraft = false;
    }
  }

  private formatTriggerEventLabel(event: string): string {
    return event
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get nameControl(): FormControl {
    return this.emailForm.get('name') as FormControl;
  }

  get triggerEventControl(): FormControl {
    return this.emailForm.get('triggerEvent') as FormControl;
  }

  get templateTypeControl(): FormControl {
    return this.emailForm.get('templateType') as FormControl;
  }

  get moduleControl(): FormControl {
    return this.emailForm.get('module') as FormControl;
  }

  get emailSubjectControl(): FormControl {
    return this.emailForm.get('emailSubject') as FormControl;
  }

  private updateNavButtons() {
    this.prevId = this.emailNavigationService.getPrev();
    this.nextId = this.emailNavigationService.getNext();
  }

  goPrev() {
    if (!this.prevId) return;
    this.navigateTo(this.prevId);
  }

  goNext() {
    if (!this.nextId) return;
    this.navigateTo(this.nextId);
  }

  private navigateTo(id: number) {
    this.emailNavigationService.moveTo(id);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id },
      queryParamsHandling: 'merge'
    });
  }

  private resetFormState() {
    this.emailForm.reset();
    this.initialFormValue = null;
    this.hasFormChanged = false;
  }

  async onChangeModule(event: MatSelectChange) {
    this.triggerEvents = []
    await this.loadEmailConfiguration()
    this.setEmailPlaceHolders();
  }

  setEmailPlaceHolders() {
    if (this.moduleControl.value == this.module[0].value) {
      const templateList = [...(this.emailConfiguration?.dsrEmailElementList ?? []), ...(this.emailConfiguration?.conversationEmailElementList ?? [])]
      this.selectedEmailElementList = templateList;
    }
    else if (this.moduleControl.value == this.module[1].value) {
      this.selectedEmailElementList = this.emailConfiguration?.dsrEmailElementList ?? []
    }
    else if (this.moduleControl.value == this.module[2].value) {
      this.selectedEmailElementList = this.emailConfiguration?.assessmentEmailElementList ?? []
    }
    else if (this.moduleControl.value == this.module[3].value) {
      const templateList = [...(this.emailConfiguration?.taskEmailElementList ?? []), ...(this.emailConfiguration?.conversationEmailElementList ?? [])]
      this.selectedEmailElementList = templateList
    }
    else if (this.moduleControl.value == this.module[4].value) {
      this.selectedEmailElementList = this.emailConfiguration?.authEmailElementList ?? []
    }
  }
}
