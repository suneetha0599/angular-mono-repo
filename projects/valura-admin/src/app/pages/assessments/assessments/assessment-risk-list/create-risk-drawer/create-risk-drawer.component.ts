import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { v1 as uuidv1 } from 'uuid';
import { Section, Question } from '../../assignment-model';
import { CustomEditorComponent } from '@valura-lib/components/custom-editor/custom-editor.component';
import { AssessmentAttachedTo } from '../../constants';

const RISK_MATRIX_5X5: Record<string, Record<string, string>> = {
  ALMOST_CERTAIN: {
    CATASTROPHIC: 'VERY_HIGH', CRITICAL: 'VERY_HIGH', SERIOUS: 'HIGH', SIGNIFICANT: 'HIGH', MINOR: 'MEDIUM',
  },
  VERY_LIKELY: {
    CATASTROPHIC: 'VERY_HIGH', CRITICAL: 'HIGH', SERIOUS: 'HIGH', SIGNIFICANT: 'MEDIUM', MINOR: 'LOW',
  },
  LIKELY: {
    CATASTROPHIC: 'HIGH', CRITICAL: 'HIGH', SERIOUS: 'MEDIUM', SIGNIFICANT: 'LOW', MINOR: 'LOW',
  },
  RATHER_UNLIKELY: {
    CATASTROPHIC: 'MEDIUM', CRITICAL: 'MEDIUM', SERIOUS: 'LOW', SIGNIFICANT: 'LOW', MINOR: 'VERY_LOW',
  },
  UNLIKELY: {
    CATASTROPHIC: 'LOW', CRITICAL: 'LOW', SERIOUS: 'LOW', SIGNIFICANT: 'VERY_LOW', MINOR: 'VERY_LOW',
  },
};

const LIKELIHOOD_SCORES_3X3: Record<string, number> = { REMOTE: 1, POSSIBLE: 2, PROBABLE: 3 };
const IMPACT_SCORES_3X3: Record<string, number> = { MINIMUM: 1, SIGNIFICANT: 2, SEVERE: 3 };

@Component({
  selector: 'app-create-risk-drawer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    LoadingButtonComponent,
    CustomEditorComponent,
  ],
  templateUrl: './create-risk-drawer.component.html',
  styleUrl: './create-risk-drawer.component.scss',
})
export class CreateRiskDrawerComponent implements OnInit, OnDestroy {
  @ViewChild(CustomEditorComponent) editorComponent!: CustomEditorComponent;
  @Input() assessmentId: number = 0;
  @Input() questionId: number = 0;
  @Input() sections: Section[] = [];
  @Input() editData: any = null;
  @Input() isEditMode: boolean = false;
  @Input() source?: string;
  @Input() hideQuestionFields = false;
  @Input() sectionContext?: { sectionId: number; sectionName: string; questionText: string };
  @Input() riskMatrix: string = 'M5';
  @Input() isVendorContext: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();
  @ViewChild('sectionSelect') sectionSelect!: MatSelect;
  @ViewChild('questionSelect') questionSelect!: MatSelect;
  @ViewChild('drawerScrollContainer') drawerScrollContainer!: ElementRef<HTMLElement>;

  riskForm!: FormGroup;
  isSaving = false;
  isLoadingDetail = false;
  isLoadingSections = false;
  isLoadingQuestions = false;
  drawerSections: Section[] = [];
  private chooseParameterSub?: Subscription;

  // Section pagination
  private sectionPage: number = 0;
  private hasMoreSections: boolean = true;
  isLoadingMoreSections: boolean = false;
  private sectionScrollHandler: any;
  private drawerScrollCloseHandler: any;
  calculatedRiskLevel: string | null = null;
  availableQuestions: Question[] = [];
  editorInitialContent: string = '';
  private initialFormValues: any = null;
  AssessmentAttachedTo = AssessmentAttachedTo;

  get descriptionControl(): FormControl {
    return this.riskForm?.get('description') as FormControl;
  }

  get is3x3(): boolean {
    return this.riskMatrix === 'M3';
  }

  get shouldHideQuestionFields(): boolean {
    if (this.hideQuestionFields) return true;
    if (this.isEditMode && (this.editData?.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR || this.editData?.attachedTo === AssessmentAttachedTo.ASSESSMENT)) return true;
    return false;
  }

  get likelihoodLevels() {
    if (this.is3x3) {
      return [
        { value: 'REMOTE', label: 'Remote' },
        { value: 'POSSIBLE', label: 'Possible' },
        { value: 'PROBABLE', label: 'Probable' },
      ];
    }
    return [
      { value: 'ALMOST_CERTAIN', label: 'Almost certain' },
      { value: 'VERY_LIKELY', label: 'Very likely' },
      { value: 'LIKELY', label: 'Likely' },
      { value: 'RATHER_UNLIKELY', label: 'Rather unlikely' },
      { value: 'UNLIKELY', label: 'Unlikely' },
    ];
  }

  get impactLevels() {
    if (this.is3x3) {
      return [
        { value: 'MINIMUM', label: 'Minimum' },
        { value: 'SIGNIFICANT', label: 'Significant' },
        { value: 'SEVERE', label: 'Severe' },
      ];
    }
    return [
      { value: 'CATASTROPHIC', label: 'Catastrophic' },
      { value: 'CRITICAL', label: 'Critical' },
      { value: 'SERIOUS', label: 'Serious' },
      { value: 'SIGNIFICANT', label: 'Significant' },
      { value: 'MINOR', label: 'Minor' },
    ];
  }

  readonly measureTypeOptions = [
    { key: 'MITIGATE', label: 'Mitigate' },
    { key: 'ACCEPT', label: 'Accept' },
    { key: 'AVOID', label: 'Avoid' },
    { key: 'TRANSFER', label: 'Transfer' },
  ];

  readonly effectOnRiskOptions = [
    { value: 'REDUCED', label: 'Reduced' },
    { value: 'ELIMINATED', label: 'Eliminated' },
    { value: 'ACCEPTED', label: 'Accepted' },
  ];

  get residualRiskOptions() {
    return [
      { value: 'HIGH', label: 'High' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'LOW', label: 'Low' },
    ];
  }

  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.chooseParameterSub?.unsubscribe();
    this.removeSectionScrollListener();
    this.removeDrawerScrollCloseListener();
  }

  onDrawerOpened(): void {
    this.resetForm();
    this.riskForm.get('chooseParameter')?.enable({ emitEvent: false });
    this.riskForm.get('sectionId')?.enable({ emitEvent: false });
    this.riskForm.get('questionId')?.enable({ emitEvent: false });
    this.riskForm.patchValue({ likelihood: '', impact: '' });
    this.calculatedRiskLevel = null;
    this.drawerSections = [];
    this.availableQuestions = [];
    this.editorInitialContent = '';
    this.editorComponent?.updateContent('<p></p>');
    this.initialFormValues = null;

    if (this.isEditMode && this.editData) {
      this.loadRiskDetail();
    } else if (!this.isEditMode && this.questionId) {
      this.preselectQuestionContext();
    }

    if (this.source === 'QUESTION_AND_RESPONSE') {
      // Use emitEvent: false to prevent the chooseParameter subscription from calling loadDrawerSections()
      this.riskForm.get('chooseParameter')?.setValue(true, { emitEvent: false });
      // Manually apply validators that the subscription would have set
      this.riskForm.get('sectionId')?.setValidators([Validators.required]);
      this.riskForm.get('questionId')?.setValidators([Validators.required]);
      this.riskForm.get('sectionId')?.updateValueAndValidity({ emitEvent: false });
      this.riskForm.get('questionId')?.updateValueAndValidity({ emitEvent: false });
      this.riskForm.get('chooseParameter')?.disable();
      this.riskForm.get('sectionId')?.disable();
      this.riskForm.get('questionId')?.disable();

      if (this.sectionContext) {
        const question: Question = {
          id: this.questionId,
          text: this.sectionContext.questionText,
          type: '', options: [], comment: false, file: false, helper: '', numeric: false, required: false,
        };
        this.drawerSections = [{
          id: this.sectionContext.sectionId,
          sectionName: this.sectionContext.sectionName,
          totalQuestion: 1,
          questions: [question],
          order: 0,
          expanded: false,
        }];
        this.availableQuestions = [question];
        this.riskForm.patchValue({
          sectionId: this.sectionContext.sectionId,
          questionId: this.questionId,
        });
        this.cdr.detectChanges();
      }
    }
  }

  private async loadRiskDetail(): Promise<void> {
    const riskId = this.editData?.riskId || this.editData?.id;
    if (!this.assessmentId || !riskId) {
      setTimeout(() => this.populateForm(), 150);
      return;
    }

    this.isLoadingDetail = true;
    this.cdr.detectChanges();

    try {
      const detail = await this.apiHelperService.getAssessmentRiskDetail(this.assessmentId, riskId);
      if (detail) {
        this.editData = {
          ...this.editData,
          ...detail,
          riskId: detail.id,
          riskTitle: detail.riskTitle,
          riskDescription: detail.description,
          questionId: detail.attachedToId,
          measureDetails: detail.measureDetail,
        };
      }
    } catch (error) {
      console.error('Error loading risk detail:', error);
    }

    // Populate form while shimmer is still visible
    this.populateForm();

    this.isLoadingDetail = false;
    this.cdr.detectChanges();
  }

  private preselectQuestionContext(): void {
    const section = this.sections.find(s =>
      (s.questions || []).some((q: any) => q.id === this.questionId)
    );
    if (section) {
      this.availableQuestions = section.questions || [];
      this.riskForm.patchValue({
        chooseParameter: false,
        sectionId: section.id,
        questionId: this.questionId,
      });
    }
  }
  private buildForm(): void {
    this.riskForm = this.fb.group({
      parameter: ['', [Validators.required]],
      description: ['', [Validators.required]],
      likelihood: ['', [Validators.required]],
      impact: ['', [Validators.required]],
      measureType: ['MITIGATE'],
      chooseParameter: [false],
      sectionId: [null],
      questionId: [null],
      mitigateMeasure: [''],
      standard: [''],
      controlCategory: [''],
      controlDescription: [''],
      effectOnRisk: [''],
      residualRisk: [''],
      measureDescription: [''],
    });

    this.chooseParameterSub?.unsubscribe();
    this.chooseParameterSub = this.riskForm.get('chooseParameter')!.valueChanges.subscribe((checked: boolean) => {
      const sectionCtrl = this.riskForm.get('sectionId')!;
      const questionCtrl = this.riskForm.get('questionId')!;
      if (checked) {
        sectionCtrl.setValidators([Validators.required]);
        questionCtrl.setValidators([Validators.required]);
        if (this.source !== 'QUESTION_AND_RESPONSE') {
          this.loadDrawerSections();
        }
      } else {
        sectionCtrl.clearValidators();
        questionCtrl.clearValidators();
        sectionCtrl.setValue(null);
        questionCtrl.setValue(null);
        sectionCtrl.markAsUntouched();
        questionCtrl.markAsUntouched();
        this.drawerSections = [];
        this.availableQuestions = [];
      }
      sectionCtrl.updateValueAndValidity();
      questionCtrl.updateValueAndValidity();
      this.cdr.detectChanges();
    });
  }

  private resetForm(): void {
    this.riskForm.reset({
      parameter: '',
      description: '',
      likelihood: '',
      impact: '',
      measureType: 'MITIGATE',
      chooseParameter: false,
      sectionId: null,
      questionId: null,
      mitigateMeasure: '',
      standard: '',
      controlCategory: '',
      controlDescription: '',
      effectOnRisk: '',
      residualRisk: '',
      measureDescription: '',
    });
  }

  private populateForm(): void {
    if (!this.editData) return;
    const md = this.editData.measureDetails;
    const measureType = this.editData.measureType || 'MITIGATE';
    const isQuestionAttached = this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION;
    const sectionId = isQuestionAttached ? (this.editData.sectionId ?? null) : null;
    const questionId = isQuestionAttached ? (this.editData.attachedToId ?? this.editData.questionId ?? null) : null;

    if (isQuestionAttached && this.editData.sectionId != null) {
      const question: Question = {
        id: this.editData.attachedToId,
        text: this.editData.questionTitle || '',
        type: '',
        options: [],
        comment: false,
        file: false,
        helper: '',
        numeric: false,
        required: false,
      };
      // Pre-populate immediately with data from the detail API so dropdowns show values at once
      this.drawerSections = [{
        id: this.editData.sectionId,
        sectionName: this.editData.sectionTitle || '',
        totalQuestion: 1,
        questions: [question],
        order: 0,
        expanded: false,
      }];
      this.availableQuestions = [question];

      // Set checkbox without triggering the subscription (which would call loadDrawerSections)
      this.riskForm.get('chooseParameter')?.setValue(true, { emitEvent: false });
      this.riskForm.get('sectionId')?.setValidators([Validators.required]);
      this.riskForm.get('questionId')?.setValidators([Validators.required]);
      this.riskForm.get('sectionId')?.updateValueAndValidity({ emitEvent: false });
      this.riskForm.get('questionId')?.updateValueAndValidity({ emitEvent: false });

      // In edit mode, show the fields as read-only — user should not change them
      if (this.isEditMode) {
        this.riskForm.get('chooseParameter')?.disable({ emitEvent: false });
        this.riskForm.get('sectionId')?.disable({ emitEvent: false });
        this.riskForm.get('questionId')?.disable({ emitEvent: false });
      }
    }

    if (this.isEditMode && (this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT || this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR)) {
      // Risk is attached to the assessment itself — show checkbox disabled/unchecked
      this.riskForm.get('chooseParameter')?.disable({ emitEvent: false });
    }

    this.riskForm.patchValue({
      parameter: this.editData.riskTitle || '',
      description: this.editData.riskDescription || '',
      likelihood: this.editData.likelihood || '',
      impact: this.editData.impact || '',
      measureType,
      sectionId,
      questionId,
      mitigateMeasure: md?.measure || '',
      standard: md?.standard || '',
      controlCategory: md?.controlCategory || '',
      controlDescription: md?.controlDescription || '',
      effectOnRisk: md?.riskEffect || '',
      residualRisk: md?.residualRisk || '',
      measureDescription: md?.description || '',
    });
    if (this.editData.likelihood && this.editData.impact) {
      this.calculatedRiskLevel = this.editData.riskLevel ||
        this.computeRiskLevel(this.editData.likelihood, this.editData.impact);
    }
    if (this.editData.riskDescription) {
      this.editorInitialContent = this.editData.riskDescription;
    }
    this.initialFormValues = this.getFormSnapshot();
    this.cdr.detectChanges();
  }

  private getFormSnapshot(): any {
    return { ...this.riskForm.value };
  }

  onDescriptionChange(data: { content: string, edited: boolean }): void {
    const html = data.content.trim();
    const descCtrl = this.riskForm?.get('description');
    if (descCtrl) {
      descCtrl.setValue(html === '<p></p>' ? '' : html, { emitEvent: false });
      descCtrl.markAsDirty();
      descCtrl.markAsTouched();
      this.cdr.detectChanges();
    }
  }

  onRiskFieldChange(): void {
    const likelihood = this.riskForm.get('likelihood')?.value;
    const impact = this.riskForm.get('impact')?.value;
    this.calculatedRiskLevel = likelihood && impact ? this.computeRiskLevel(likelihood, impact) : null;
    this.cdr.detectChanges();
  }

  private computeRiskLevel(likelihood: string, impact: string): string {
    if (this.is3x3) {
      const score = (LIKELIHOOD_SCORES_3X3[likelihood] ?? 1) * (IMPACT_SCORES_3X3[impact] ?? 1);
      if (score >= 6) return 'HIGH';
      if (score >= 3) return 'MEDIUM';
      return 'LOW';
    }
    return RISK_MATRIX_5X5[likelihood]?.[impact] ?? 'LOW';
  }


  selectMeasureType(key: string): void {
    this.riskForm.get('measureType')?.setValue(key);
    this.riskForm.patchValue({
      mitigateMeasure: '',
      standard: '',
      controlCategory: '',
      controlDescription: '',
      effectOnRisk: '',
      residualRisk: '',
      measureDescription: '',
    });
  }

  onSectionChange(sectionId: number): void {
    this.riskForm.get('questionId')?.setValue(null);
    this.availableQuestions = [];
    if (sectionId == null) return;
    const section = this.drawerSections.find(s => s.id === sectionId);
    if (!section) return;
    if (section.questions.length > 0) {
      this.availableQuestions = section.questions;
    } else {
      this.loadQuestionsForSection(section);
    }
  }

  private async loadDrawerSections(reset: boolean = true): Promise<void> {
    if (!this.assessmentId) return;
    if (reset) {
      this.sectionPage = 0;
      this.hasMoreSections = true;
      this.drawerSections = [];
      this.availableQuestions = [];
      this.isLoadingSections = true;
    } else {
      this.isLoadingMoreSections = true;
    }
    this.cdr.detectChanges();
    try {
      const res = await this.apiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        { sectionPage: this.sectionPage, sectionLimit: 20, questionLimit: 0 }
      );
      const newSections = (res?.sectionResponses || []).map((s: any) => ({
        id: s.sectionId,
        sectionName: s.sectionTitle,
        totalQuestion: s.totalQuestions ?? 0,
        questions: [],
        order: s.displayOrder ?? 0,
        expanded: false,
      }));
      this.drawerSections.push(...newSections);
      this.hasMoreSections = newSections.length === 20;
    } catch (e) {
      console.error('Error loading sections:', e);
      if (reset) this.drawerSections = [];
      this.sectionPage = Math.max(0, this.sectionPage - 1);
    } finally {
      this.isLoadingSections = false;
      this.isLoadingMoreSections = false;
      this.cdr.detectChanges();
    }
  }

  private async loadDrawerSectionsForEdit(currentSectionId: number): Promise<void> {
    this.sectionPage = 0;
    this.hasMoreSections = true;
    this.drawerSections = [];
    this.isLoadingSections = true;
    this.cdr.detectChanges();
    // Load all pages until we have the current section (or no more pages)
    try {
      let found = false;
      while (this.hasMoreSections) {
        const res = await this.apiHelperService.getAssessmentSectionDetail(
          this.assessmentId,
          { sectionPage: this.sectionPage, sectionLimit: 20, questionLimit: 0 }
        );
        const newSections = (res?.sectionResponses || []).map((s: any) => ({
          id: s.sectionId,
          sectionName: s.sectionTitle,
          totalQuestion: s.totalQuestions ?? 0,
          questions: [],
          order: s.displayOrder ?? 0,
          expanded: false,
        }));
        this.drawerSections.push(...newSections);
        this.hasMoreSections = newSections.length === 20;
        if (this.drawerSections.some(s => s.id === currentSectionId)) {
          found = true;
          break;
        }
        if (this.hasMoreSections) this.sectionPage++;
      }
    } catch (e) {
      console.error('Error loading sections for edit:', e);
    } finally {
      this.isLoadingSections = false;
      this.cdr.detectChanges();
    }
    // Load questions for the currently selected section so the question dropdown is populated
    const currentSection = this.drawerSections.find(s => s.id === currentSectionId);
    if (currentSection) {
      await this.loadQuestionsForSection(currentSection);
    }
  }

  private async loadQuestionsForSection(section: Section): Promise<void> {
    this.isLoadingQuestions = true;
    this.cdr.detectChanges();
    try {
      const res = await this.apiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section.id,
          questionPage: 0,
          questionLimit: 100,
          messagePage: 0,
          messageLimit: 0,
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section.id);
      if (sec) {
        section.questions = (sec.question || []).map((q: any) => ({
          id: q.questionId,
          text: q.questionText,
          type: q.questionType,
          options: q.options || [],
          comment: false,
          file: false,
          helper: q.helperText || '',
          numeric: false,
          required: false,
        }));
        this.availableQuestions = section.questions;
      }
    } catch (e) {
      console.error('Error loading questions for section:', e);
    } finally {
      this.isLoadingQuestions = false;
      this.cdr.detectChanges();
    }
  }

  async onSave(): Promise<void> {
    if (!this.riskForm.valid) {
      this.riskForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    try {
      const formValue = this.riskForm.value;
      const initial = this.initialFormValues;
      const changed = (key: string) => !initial || formValue[key] !== initial[key];

      const commands: any[] = [];

      if (!this.isEditMode || changed('parameter')) {
        commands.push({ type: 'updateTitle', title: formValue.parameter });
      }
      if (!this.isEditMode || changed('description')) {
        commands.push({ type: 'updateDescription', description: formValue.description });
      }
      if (!this.isEditMode || changed('likelihood')) {
        commands.push({ type: 'updateLikelihood', likelihood: formValue.likelihood });
      }
      if (!this.isEditMode || changed('impact')) {
        commands.push({ type: 'updateImpact', impact: formValue.impact });
      }
      if (!this.isEditMode || changed('likelihood') || changed('impact')) {
        commands.push({ type: 'updateRiskLevel', riskLevel: this.calculatedRiskLevel });
      }

      const measureTypeChanged = !this.isEditMode || changed('measureType');

      const measureFields = ['mitigateMeasure', 'standard', 'controlCategory', 'controlDescription', 'effectOnRisk', 'residualRisk', 'measureDescription'];
      const measureChanged = !this.isEditMode || measureFields.some(k => changed(k)) || measureTypeChanged;

      if (measureChanged) {
        if (!this.isEditMode) {
          if (formValue.measureType === 'MITIGATE') {
            commands.push({
              type: 'addMeasure',
              measure: {
                measure: formValue.mitigateMeasure,
                standard: formValue.standard,
                controlCategory: formValue.controlCategory,
                controlDescription: formValue.controlDescription,
                effectOnRisk: formValue.effectOnRisk, residualRisk: formValue.residualRisk,
              },
            });
          } else {
            commands.push({
              type: 'addMeasure',
              measure: {
                description: formValue.measureDescription,
                residualRisk: formValue.residualRisk,
              },
            });
          }
        } else {
          const md = this.editData?.measureDetails || {};
          const measureMappingId = Number(md.measureMappingId || md.id || this.editData.measureMappingId || 0);
          const hasExistingMeasure = measureMappingId > 0;
          const oldMeasureType = initial.measureType || this.editData.measureType || 'MITIGATE';

          if (hasExistingMeasure) {
            const isOldMitigate = oldMeasureType === 'MITIGATE' || ('measure' in md && md.measure);
            const deleteType = isOldMitigate ? 'deleteMitigateMeasure' : 'deleteAcceptMeasure';
            commands.push({
              type: deleteType,
              measureMappingId,
            });
          }

          if (formValue.measureType === 'MITIGATE') {
            commands.push({
              type: 'addMeasure',
              measure: {
                measure: formValue.mitigateMeasure,
                standard: formValue.standard,
                controlCategory: formValue.controlCategory,
                controlDescription: formValue.controlDescription,
                effectOnRisk: formValue.effectOnRisk, residualRisk: formValue.residualRisk,
              },
            });
          } else {
            commands.push({
              type: 'addMeasure',
              measure: {
                description: formValue.measureDescription,
                residualRisk: formValue.residualRisk,
              },
            });
          }
        }
      }

      if (measureTypeChanged) {
        commands.push({ type: 'updateMeasureType', measureType: formValue.measureType });
      }

      if (this.isEditMode && commands.length === 0) {
        this.closeDrawer();
        return;
      }

      const payload = {
        commands,
        commandId: uuidv1(),
      };

      if (this.isEditMode && this.editData?.riskId) {
        if (this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT || this.editData.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.apiHelperService.updateAssessmentRiskCommands(this.assessmentId, this.editData.riskId, payload, this.isVendorContext);
        } else {
          // Use the form's current questionId — user may have changed section/question
          const resolvedQuestionId = this.riskForm.getRawValue().questionId
            || this.editData.attachedToId
            || this.editData.questionId;
          await this.apiHelperService.updateQuestionRisk(this.assessmentId, resolvedQuestionId, this.editData.riskId, payload, this.isVendorContext);
        }
      } else if (this.questionId) {
        await this.apiHelperService.raiseQuestionRisk(this.assessmentId, this.questionId, payload, this.isVendorContext);
      } else {
        const chooseParameter = this.riskForm.get('chooseParameter')?.value;
        if (chooseParameter) {
          const selectedQuestionId = this.riskForm.get('questionId')?.value;
          await this.apiHelperService.raiseQuestionRisk(this.assessmentId, selectedQuestionId, payload, this.isVendorContext);
        } else {
          await this.apiHelperService.createAssessmentRiskCommands(this.assessmentId, payload, this.isVendorContext);
        }
      }

      const successMessage = this.isEditMode ? 'Risk updated successfully' : 'Risk created successfully';
      this.snackbarService.openSnack(successMessage, 'success');
      this.onSaved.emit();
      this.closeDrawer();
    } catch (error) {
      console.error('Error saving risk:', error);
      this.snackbarService.openSnack('Failed to save risk', 'error');
    } finally {
      this.isSaving = false;
    }
  }


  closeDrawer(): void {
    this.onClose.emit();
  }

  get hasChanges(): boolean {
    if (!this.initialFormValues) return false;
    const current = this.getFormSnapshot();
    return Object.keys(current).some(key => current[key] !== this.initialFormValues[key]);
  }

  get calculatedRiskLevelLabel(): string {
    if (!this.calculatedRiskLevel) return '';
    return this.calculatedRiskLevel
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  get saveRiskDisabled() {
    if (!this.riskForm?.valid || this.isSaving) return true;
    if (this.isEditMode) return !this.hasChanges;
    return false;
  }

  getQuestionText(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
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
      this.loadDrawerSections(false);
    }
  }

  private removeSectionScrollListener(): void {
    const panel = this.sectionSelect?.panel?.nativeElement;
    if (panel && this.sectionScrollHandler) {
      panel.removeEventListener('scroll', this.sectionScrollHandler);
    }
    this.sectionScrollHandler = undefined;
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
