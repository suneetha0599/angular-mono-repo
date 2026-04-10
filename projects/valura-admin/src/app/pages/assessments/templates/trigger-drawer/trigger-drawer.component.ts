import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { CUSTOM_DATE_FORMATS, EFFORT_LEVELS, PRIORITY_OPTIONS, QUESTION_OPERATOR_MAP, RESIDUAL_RISK, RISK_EFFECTS, RISK_OPTIONS, SELECT_TYPES, TRIGGER_OPTIONS, TriggerType } from './constants';
import { RuleBuilderService } from '@admin-core/services/template/rule-builder/rule-builder.service';
import { AssessmentType } from '@admin-core/models/assessment/assessment';
import { MatAutocompleteModule, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { AssessmentTypeService } from '@admin-core/services/assessment-type/assessment-type.service';
import { CustomMatErrorComponent } from "@valura-lib/components//custom-mat-error/custom-mat-error.component";
import { FIRST_PAGE, PAGE_SIZE, Status } from '../constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { CustomEditorComponent } from "@valura-lib/components//custom-editor/custom-editor.component";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { impactLevels, likelihood, SINGLE_VALUE_TYPES } from './constants';
import { TemplatePaginationDetail, TemplateListItem, TriggerEditPayload, TriggerLabel, TriggerRule, TriggerSavePayload, APIEffects } from './trigger-drawer.models';
import { buildTriggerForm, calculateRiskLevel, normalizeConditionForUI, TRIGGER_FORM_DEFAULTS, extractRiskFormValues, extractAssessmentFormValues, extractTaskFormValues, extractDisplayFormValues, normalizeRuleCondition, flattenRules, findSectionIdsFromQuestions } from './trigger-utils';
import { createConditionGroup, addConditionBlock, addGroupBlock, removeBlock as removeBlockHelper, addConditionToGroupAt, removeConditionFromGroupAt, updateConnectorStates, generateExpression as generateExpressionHelper, getGlobalConditionNumber as getGlobalConditionNumberHelper, buildConditions as buildConditionsHelper, parseConditionsIntoForm, getConnectorControl as getConnectorControlHelper } from './trigger-condition.helpers';
import { filterLabels, addTypedLabelToForm, removeLabelAt, toggleLabelSelection, isLabelSelected as isLabelSelectedHelper, getLabelDisplayName } from './trigger-label.helpers';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { AssessemntSource } from '../../assessments/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';

@Component({
  selector: 'app-trigger-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatIconModule, LoadingButtonComponent, MatDatepickerModule, MatAutocompleteModule, CustomMatErrorComponent, CustomEditorComponent, MatChipsModule, MatProgressSpinnerModule, FormsModule, MatTableModule,
    MatTooltipModule, EllipsisTooltipDirective],
  templateUrl: './trigger-drawer.component.html',
  styleUrl: './trigger-drawer.component.scss',
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }],
})
export class TriggerDrawerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editData!: TriggerEditPayload;
  @Input() assessmentSource: string = AssessemntSource.GENERAL;
  @Input() isViewOnly: boolean = false;


  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<TriggerSavePayload>();

  @ViewChild(MatSelect) templateSelect!: MatSelect;
  @ViewChild('labelInput', { read: MatAutocompleteTrigger }) labelInputTrigger!: MatAutocompleteTrigger;

  _trigger: TriggerType = 'display';
  form: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  rulesList: TriggerRule[] = [];
  editorInitialContent = '';
  riskEditorInitialContent = '';
  isPreviewMode = false;
  triggerOptions = TRIGGER_OPTIONS;
  likelihoodList = likelihood;
  impactLevel = impactLevels;
  riskOptions = RISK_OPTIONS;
  residualRisk = RESIDUAL_RISK;
  riskEffects = RISK_EFFECTS;
  priorityOptions = PRIORITY_OPTIONS;
  effortLevels = EFFORT_LEVELS;
  displayedHeaders = ['trigger', 'description', 'action'];
  readonly separatorKeysCodes = [13, 188];
  minToDateFilter = new Date();

  assessmentTypes: AssessmentType[] = [];
  templateList: TemplateListItem[] = [];
  templatePaginationDetail: TemplatePaginationDetail = { totalRecords: 0, pageNo: 0, loading: false, isLastPage: false, };

  availableLabels: TriggerLabel[] = [];
  filteredLabelsList: TriggerLabel[] = [];
  labelSearchTerm = '';
  readonly labelsLoading = signal<boolean>(false);
  editorInitialContentAssesmet: any;
  viewMode: boolean = false;

  private firstConnectorSub?: Subscription;
  private scrollHandler?: (event: Event) => void;
  private cachedQuestionText: string | null = null;
  private cachedQuestionId: string | null = null;

  private assessmentTypeService = inject(AssessmentTypeService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private destroyRef = inject(DestroyRef);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private ruleBuilderService = inject(RuleBuilderService)


  constructor(private fb: FormBuilder, private cdk: ChangeDetectorRef) {
    this.form = buildTriggerForm(this.fb, this.createCondition.bind(this));
  }

  ngOnInit() {
    this.watchFirstConnector();
    this.getAssessmentTypeList();
    this.watchMeasureType();
    this.watchRiskCalculation();
    this.loadAvailableLabels();
    if (this.isViewOnly) {
      this.form.disable({ emitEvent: false });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editData'] && changes['editData'].currentValue) {
      this.rulesList = [];
      this.editingIndex = null;
      this.showForm = false;
      this.cachedQuestionText = null;
      this.cachedQuestionId = null;
      this.resetDrawerState();
      this.loadExistingRules();
    }
    if (this.isViewOnly) {
      this.form.disable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.firstConnectorSub?.unsubscribe();
    this.removeScrollListener();
  }


  get trigger(): TriggerType {
    return this._trigger;
  }

  set trigger(value: TriggerType) {
    this._trigger = value;
    this.updateAssessmentValidators();
    this.updateTaskValidators();
    this.updateRiskValidators();
  }


  get template() { return this.editData; }

  get currentQuestion() {
    const section = this.currentSection;
    if (!section) return null;
    return section.questions?.find((q: any) => q.id === this.editData?.currentQuestionId);
  }

  get currentSection() {
    const sectionId = this.editData?.currentSectionId;
    if (sectionId == null) return null;
    return this.allSections.find((s: any) => s.id === sectionId);
  }

  get allSections() { return this.editData?.sections || []; }

  get currentSectionIndex(): number {
    const section = this.currentSection;
    if (!section) return -1;
    return this.allSections.findIndex((s: any) => s.id === section.id);
  }

  get currentQuestionIndex(): number {
    const section = this.currentSection;
    if (!section) return -1;
    return section.questions.findIndex((q: any) => q.id === this.currentQuestion?.id);
  }

  get blocks(): FormArray { return this.form.get('blocks') as FormArray; }
  get connectorsArray(): FormArray { return this.form.get('connectors') as FormArray; }
  get conditions(): FormArray { return this.form.get('conditions') as FormArray; }

  get assessmentName() { return this.form.get('assessmentName') as FormControl; }
  get assessmentDescription() { return this.form.get('assessmentDescription') as FormControl; }
  get descriptionControl() { return this.form.get('taskDescription') as FormControl; }
  get taskTitleControl() { return this.form.get('taskTitle') as FormControl; }
  get riskDescription() { return this.form.get('description') as FormControl; }
  get riskParameter() { return this.form.get('riskParameter') as FormControl; }

  get likelihoodControl() { return this.form.get('likelihood') as FormControl; }
  get severityControl() { return this.form.get('severity') as FormControl; }
  get riskLevelControl() { return this.form.get('riskLevel') as FormControl; }

  get assementType() { return this.form.get('assessmentType') as FormControl }
  get templateId() { return this.form.get('templateId') as FormControl }

  get questionText(): string {
    const questionId = this.currentQuestion?.id ?? null;
    if (questionId === this.cachedQuestionId && this.cachedQuestionText !== null) {
      return this.cachedQuestionText;
    }
    const html = this.currentQuestion?.text || '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    this.cachedQuestionId = questionId;
    this.cachedQuestionText = doc.body.textContent || '';
    return this.cachedQuestionText;
  }

  get filteredSections() {
    const entire = this.form.value.entireSection;
    const currentIndex = this.currentSectionIndex;
    if (currentIndex === -1) return [];
    if (entire) {
      return this.allSections.filter((_: any, i: number) => i > currentIndex);
    }
    return this.allSections.filter((_: any, i: number) => i >= currentIndex);
  }


  get alreadyUsedSubQuestionIds(): Set<string> {
    const usedIds = new Set<string>();
    const currentQuestionId = this.editData?.currentQuestionId;
    for (const section of this.allSections) {
      for (const question of section.questions || []) {
        if (question.id === currentQuestionId) continue;
        const rawRules = question.rules;
        if (!rawRules) continue;
        const rulesArray = Array.isArray(rawRules) ? rawRules : [rawRules];

        for (const ruleWrapper of rulesArray) {
          const innerRule = (ruleWrapper as any).rule ? (ruleWrapper as any).rule : ruleWrapper;
          const targets = innerRule.uiEffects?.targets;
          if (!targets) continue;
          const questionIds = targets.questionIds || targets.questions || [];
          questionIds.forEach((id: string) => usedIds.add(id));
        }
      }
    }
    this.rulesList.forEach((rule, index) => {
      if (index === this.editingIndex) return;
      const targets = rule.uiEffects?.targets;
      if (!targets) return;
      const questionIds = targets.questionIds || targets.questions || [];
      questionIds.forEach((id: string) => usedIds.add(id));
    });
    return usedIds;
  }

  get alreadySelectedSection(): Set<string> {
    const usedIds = new Set<string>();
    const currentQuestionId = this.editData?.currentQuestionId;
    for (const section of this.allSections) {
      for (const question of section.questions || []) {
        if (question.id === currentQuestionId) continue;
        const rawRules = question.rules;
        if (!rawRules) continue;
        const rulesArray = Array.isArray(rawRules) ? rawRules : [rawRules];

        for (const ruleWrapper of rulesArray) {
          const innerRule = (ruleWrapper as any).rule ? (ruleWrapper as any).rule : ruleWrapper;
          const targets = innerRule.uiEffects?.targets;
          if (!targets) continue;
          const sectionId = targets?.sectionIds || targets?.sections || [];
          sectionId.forEach((id: string) => usedIds.add(id));
        }
      }
    }
    this.rulesList.forEach((rule, index) => {
      if (index === this.editingIndex) return;
      const targets = rule.uiEffects?.targets;
      if (!targets) return;
      const sectionId = targets.sectionIds || targets.sections || [];
      sectionId.forEach((id: string) => usedIds.add(id));
    });
    return usedIds;
  }

  isAlreadySubQuestion(questionId: string): boolean {
    return this.alreadyUsedSubQuestionIds.has(questionId);
  }


  isAlreadySelectedSection(sectionId: string): boolean {
    return this.alreadySelectedSection.has(sectionId)
  }

  addNewRule() {
    this.editingIndex = null;
    this.resetDrawerState();
    this.showForm = true;
  }

  editRule(index: number) {
    this.editingIndex = index;
    this.loadRuleIntoForm(this.rulesList[index]);
    this.showForm = true;
  }

  viewRule(index: number) {
    this.viewMode = true;
    this.editingIndex = index;
    this.loadRuleIntoForm(this.rulesList[index]);
    this.showForm = true;
  }

  get isViewOnlyValue(): boolean {
    return this.isViewOnly && this.viewMode;
  }

  deleteRule(index: number) {
    this.confirmationDialogService
      .showDialog('Delete Rule', 'Are you sure you want to delete this rule?', 'Delete', 'Cancel')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.rulesList = this.rulesList.filter((_, i) => i !== index);
          this.emitAllRules();
        }
      });
  }

  cancelForm() {
    this.showForm = false;
    this.editingIndex = null;
    this.resetDrawerState();
    this.viewMode = false;
  }

  hasValidConditions(): boolean {
    if (!this.blocks || this.blocks.length === 0) {
      return false;
    }

    const isConditionValid = (cond: AbstractControl): boolean => {
      const operator = cond.get('operator')?.value;
      const value = cond.get('value')?.value;
      const valueTo = cond.get('valueTo')?.value;

      if (!operator) return false;

      if (operator === 'NOT_EMPTY') return true;

      if (operator === 'BETWEEN') {
        return value !== null && value !== '' &&
          valueTo !== null && valueTo !== '';
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== '';
    };

    return this.blocks.controls.some(block => {
      const type = block.get('type')?.value;

      if (type === 'condition') {
        return isConditionValid(block);
      }

      if (type === 'group') {
        const conditions = block.get('conditions') as FormArray;
        if (!conditions || conditions.length === 0) return false;

        return conditions.controls.some(cond => isConditionValid(cond));
      }

      return false;
    });
  }

  saveRule() {
    if (!this.hasValidConditions()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if ((this.trigger === 'assessment' || this.trigger === 'task') && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const condition = buildConditionsHelper(this.blocks, this.connectorsArray, this.ruleBuilderService);
    const ui = this.trigger === 'display' ? this.ruleBuilderService.buildDisplayEffect(this.form.value) : null;

    const apiEffects: APIEffects = { raiseRisks: [], assessments: [], createTasks: [] };

    if (this.trigger === 'risk') {
      apiEffects.raiseRisks = this.ruleBuilderService.buildRiskEffect(this.form.getRawValue()).raiseRisks;
    }
    if (this.trigger === 'assessment') {
      apiEffects.assessments = this.ruleBuilderService.buildAssessmentEffect(this.form.getRawValue()).assessments;
    }
    if (this.trigger === 'task') {
      apiEffects.createTasks = this.ruleBuilderService.buildTaskEffect(this.form.getRawValue()).tasks;
    }

    const newRule = { condition, uiEffects: ui, apiEffects };
    if (this.editingIndex !== null) {
      this.rulesList[this.editingIndex] = newRule;
    } else {
      this.rulesList.push(newRule);
    }

    this.emitAllRules();
    this.showForm = false;
    this.editingIndex = null;
    this.resetDrawerState();
  }

  get questionsForSelectedSection() {
    const selectedSectionIds: string[] = this.form.value.sectionId || [];
    if (!selectedSectionIds.length) return [];

    const currentSectionIdx = this.currentSectionIndex;
    const currentQuestionIdx = this.currentQuestionIndex;

    let result: any[] = [];

    selectedSectionIds.forEach((sectionId) => {
      const sectionIndex = this.allSections.findIndex((s: any) => s.id === sectionId);
      const section = this.allSections[sectionIndex];
      if (!section) return;

      if (sectionIndex === currentSectionIdx) {
        result.push(...section.questions.filter((_: any, i: number) => i > currentQuestionIdx));
      }
      if (sectionIndex > currentSectionIdx) {
        result.push(...section.questions);
      }
    });

    return result;
  }

  getSelectedSectionsWithQuestions() {
    const selectedIds = this.form.value.sectionId || [];
    const currentSectionIdx = this.currentSectionIndex;
    const currentQuestionIdx = this.currentQuestionIndex;
    return this.filteredSections.filter(section => selectedIds.includes(section.id))
      .map(section => {
        const sectionIndex = this.allSections.findIndex((s: any) => s.id === section.id);
        let questions = section.questions || []
        if (sectionIndex === currentSectionIdx) {
          questions = questions.filter((_: any, i: number) => i > currentQuestionIdx);
        }
        return {
          order: section.order,
          id: section.id,
          questions,
          startIndex: sectionIndex === currentSectionIdx ? currentQuestionIdx + 1 : 0
        };
      });
  }

  close() {
    this.onClose.emit();
    this.viewMode = false;
  }

  trackByRuleIndex(index: number): number { return index; }

  getRuleTriggerType(rule: TriggerRule): string {
    const api = rule.apiEffects || {};
    if ((api.raiseRisks || api.raiseRisk || []).length) return 'Risk';
    if ((api.assessments || api.assessment || []).length) return 'Assessment';
    if ((api.createTasks || api.createTask || []).length) return 'Task';
    if (rule.uiEffects?.action) return 'Display';
    return 'Display';
  }

  getSelectedQuestionNames(): string {
    const selectedIds = this.form.get('targetQuestionId')?.value || [];
    const allSelectedQuestions = this.getSelectedSectionsWithQuestions()
      .flatMap(section => section.questions);
    return allSelectedQuestions
      .filter(q => selectedIds.includes(q.id))
      .map(q => q.text.replace(/<[^>]*>/g, ''))
      .join(', ');
  }

  getSelectedSectionNames(): string {
    const selectedIds = this.form.get('sectionId')?.value || [];

    return this.filteredSections
      .filter(section => selectedIds.includes(section.id))
      .map(section => section.section)
      .join(', ');
  }

  getRuleDescription(rule: TriggerRule): string {
    const api = rule.apiEffects || {};
    const risks = api.raiseRisks || api.raiseRisk || [];
    if (risks.length) return risks[0]?.title || '';

    const assessments = api.assessments || api.assessment || [];
    if (assessments.length) return assessments[0]?.name || '';

    const tasks = api.createTasks || api.createTask || [];
    if (tasks.length) return tasks[0]?.title || '';

    if (rule.uiEffects?.action) {
      const targets = rule.uiEffects.targets || {};
      const sectionIds = targets.sectionIds || targets.sections || [];
      const questionIds = targets.questionIds || targets.questions || [];
      const parts: string[] = [];
      if (sectionIds.length) {
        const sectionNums = sectionIds.map(id => {
          const idx = this.allSections.findIndex((s: any) => s.id === id);
          return idx >= 0 ? `S${idx + 1}` : null;
        }).filter(Boolean);
        if (sectionNums.length) parts.push(sectionNums.join(', '));
      }
      if (questionIds.length) {
        const questionNums = questionIds.map(qId => {
          for (let si = 0; si < this.allSections.length; si++) {
            const qi = this.allSections[si].questions?.findIndex((q: any) => q.id === qId);
            if (qi >= 0) return `S${si + 1}-Q${qi + 1}`;
          }
          return null;
        }).filter(Boolean);
        if (questionNums.length) parts.push(questionNums.join(', '));
      }
      return parts.join(', ');
    }

    return '';
  }


  createCondition(): FormGroup {
    return createConditionGroup(this.fb, this.currentQuestion?.id);
  }

  addCondition() {
    if (this.isSingleValueType() && this.blocks.length > 0) return;
    addConditionBlock(this.blocks, this.connectorsArray, this.fb, this.currentQuestion?.id);
    this.watchFirstConnector();
  }

  addGroup() {
    addGroupBlock(this.blocks, this.connectorsArray, this.fb, this.currentQuestion?.id);
    this.watchFirstConnector();
  }

  removeBlock(index: number) {
    removeBlockHelper(this.blocks, this.connectorsArray, index);
  }

  addConditionToGroup(index: number) {
    addConditionToGroupAt(this.blocks, this.fb, index, this.currentQuestion?.id);
  }

  removeConditionFromGroup(groupIndex: number, condIndex: number) {
    removeConditionFromGroupAt(this.blocks, groupIndex, condIndex);
  }

  generateExpression(): string {
    return generateExpressionHelper(this.blocks, this.connectorsArray);
  }

  getGlobalConditionNumber(blockIndex: number, conditionIndex?: number): number {
    return getGlobalConditionNumberHelper(this.blocks, blockIndex, conditionIndex);
  }

  getConnectorControl(index: number) {
    return getConnectorControlHelper(this.connectorsArray, index);
  }

  getConditionsArray(block: any): FormArray {
    return block.get('conditions') as FormArray;
  }

  asFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }


  getSelectedQuestion() { return this.currentQuestion; }

  isMultiSelect(): boolean {
    const t = this.currentQuestion?.type;
    return t === 'MULTI_SELECT' || t === 'CHECKBOX';
  }

  isSelectType(): boolean {
    return SELECT_TYPES.includes(this.currentQuestion?.type ?? '');
  }

  isSingleValueType(): boolean {
    return SINGLE_VALUE_TYPES.includes(this.currentQuestion?.type ?? '');
  }

  isNumericType(): boolean {
    return this.currentQuestion?.numeric === true;
  }

  isDateType(): boolean {
    return this.currentQuestion?.type === 'DATE_ONLY';
  }

  isBetween(cond: any) { return cond.value.operator === 'BETWEEN'; }
  isMultiValueOperator(cond: any) { return ['ANY_OF', 'ALL_OF', 'NONE_OF'].includes(cond.value.operator); }
  isNoValueOperator(cond: any) { return cond.get('operator')?.value === 'NOT_EMPTY'; }

  onOperatorChange(cond: any): void {
    const valueControl = cond.get('value');
    if (!valueControl) return;
    const isMulti = this.isMultiValueOperator(cond);
    const currentValue = valueControl.value;
    if (this.isMultiSelect() && !Array.isArray(currentValue)) {
      valueControl.setValue([]);
    } else if (isMulti && !Array.isArray(currentValue)) {
      valueControl.setValue([]);
    } else if (!isMulti && Array.isArray(currentValue)) {
      if (this.isMultiSelect()) {
        valueControl.setValue([]);
      } else {
        valueControl.setValue('');
      }
    }
  }

  getAvailableOperators(): string[] {
    let operators: string[] = [];
    if (this.isNumericType()) {
      operators = QUESTION_OPERATOR_MAP['NUMERIC'] || [];
    } else {
      operators = QUESTION_OPERATOR_MAP[this.currentQuestion?.type ?? ''] || [];
    }
    if (this.currentQuestion?.required) {
      operators = operators.filter(op => op !== 'NOT_EMPTY');
    }
    return operators;
  }

  getAvailableOptions(conditionIndex: number) {
    const usedValues = this.conditions.controls
      .filter((_, i) => i !== conditionIndex)
      .flatMap(c => c.value.value || []);

    return this.currentQuestion?.options?.filter(
      (o: any) => !usedValues.includes(o.value)
    ) || [];
  }

  convertToArray(control: AbstractControl<any, any>) {
    const valueControl = control.get('value');
    if (!valueControl) return;
    const raw = valueControl.value;
    if (!raw) return;
    const arr = raw.toString().split(',').map((v: string) => Number(v.trim())).filter((v: number) => !isNaN(v));
    valueControl.setValue(arr);
  }


  selectPriority(priority: string): void { this.form.patchValue({ priority }); }
  selectEffortLevel(effort: string): void { this.form.patchValue({ effortLevel: effort }); }

  onDescriptionChange(data: { content: string, edited: boolean }): void {
    const cleaned = (data.content || '').trim();
    const isEmpty = cleaned === '' || cleaned === '<p></p>' || cleaned === '<p><br></p>';
    const value = isEmpty ? '' : cleaned;

    if (this._trigger === 'risk') {
      this.riskDescription.setValue(value, { emitEvent: false });
      this.riskDescription.markAsDirty();
      this.riskDescription.updateValueAndValidity();
    } else if (this._trigger === 'task') {
      this.descriptionControl.setValue(value, { emitEvent: false });
      this.descriptionControl.markAsDirty();
      this.descriptionControl.updateValueAndValidity();
    }
    else {
      this.assessmentDescription.setValue(value, { emitEvent: false });
      this.assessmentDescription.markAsDirty();
      this.assessmentDescription.updateValueAndValidity();
    }
  }


  onSearchLabels(query: string): void {
    this.filteredLabelsList = filterLabels(this.availableLabels, query);
  }

  addTypedLabel(event: MatChipInputEvent): void {
    const result = addTypedLabelToForm(this.form, this.availableLabels, event);
    this.availableLabels = result.updatedLabels;
    this.labelSearchTerm = result.searchTerm;
    this.filteredLabelsList = this.availableLabels;
  }

  removeLabel(index: number): void {
    removeLabelAt(this.form, index);
  }

  selectLabel(labelObj: any): void {
    toggleLabelSelection(this.form, labelObj);
    this.labelSearchTerm = '';
    this.filteredLabelsList = [...this.availableLabels];
  }

  isLabelSelected(label: any): boolean {
    return isLabelSelectedHelper(this.form, label);
  }

  getLabelName(labelObj: any): string {
    return getLabelDisplayName(this.availableLabels, labelObj);
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


  async getAssessmentTypeList() {
    if (this.assessmentTypes?.length) return;
    const res = await this.assessmentTypeService.getAssessmentTypeMasterList();
    this.assessmentTypes = res ?? [];
  }

  async getFormTemplateList(page: number = FIRST_PAGE) {
    const type = this.form.get('assessmentType')?.value;
    if (this.templatePaginationDetail.loading || !type) return;
    if (this.templatePaginationDetail.isLastPage && page !== FIRST_PAGE) return;

    this.templatePaginationDetail.loading = true;
    this.templatePaginationDetail.pageNo = page;

    const params = { page, size: PAGE_SIZE, type: type ?? 0, status: Status.ACTIVE };
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    const res = await this.assessmentApiHelperService.getTemplateList(params, _url);

    if (res) {
      const newData = res?.templates ?? [];
      this.templatePaginationDetail.totalRecords = res?.totalRecords ?? 0;

      if (page === FIRST_PAGE) {
        this.templateList = newData;
      } else {
        this.templateList = [...(this.templateList || []), ...newData];
      }
      this.templatePaginationDetail.isLastPage =
        this.templateList.length >= this.templatePaginationDetail.totalRecords;
    }

    this.templatePaginationDetail.loading = false;
  }

  onAssessmentTypeChange() {
    this.templateList = [];
    this.templatePaginationDetail.pageNo = 0;
    this.templatePaginationDetail.isLastPage = false;
    this.getFormTemplateList(FIRST_PAGE);
  }

  onTemplateDropdownOpen(opened: boolean) {
    if (!opened) {
      this.removeScrollListener();
      return;
    }
    setTimeout(() => {
      const panel = this.templateSelect.panel?.nativeElement;
      if (!panel) return;
      this.removeScrollListener();
      this.scrollHandler = this.onTemplateScroll.bind(this);
      panel.addEventListener('scroll', this.scrollHandler);
    });
  }

  onTemplateScroll(event: Event) {
    const panel = event.target as HTMLElement;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 10;
    if (atBottom && !this.templatePaginationDetail.loading) {
      this.getFormTemplateList(this.templatePaginationDetail.pageNo + 1);
    }
  }

  trackByTemplate(_index: number, item: any) { return item.templateId; }


  private loadExistingRules() {
    this.rulesList = flattenRules(this.currentQuestion?.rules ?? []);
  }

  private loadRuleIntoForm(rule: any) {
    this.resetDrawerState();
    if (!rule) return;

    // Condition
    const normalizedCondition = normalizeRuleCondition(rule);
    if (normalizedCondition) {
      const formattedCondition = normalizeConditionForUI(normalizedCondition, this.currentQuestion?.id);
      parseConditionsIntoForm(formattedCondition, this.blocks, this.connectorsArray, this.fb, this.currentQuestion?.id);
      updateConnectorStates(this.connectorsArray);
      this.watchFirstConnector();
    }

    // Display effect
    const displayValues = extractDisplayFormValues(
      rule,
      (qIds) => findSectionIdsFromQuestions(this.allSections, qIds)
    );
    if (displayValues) {
      this.trigger = 'display';
      this.form.patchValue(displayValues);
    }

    // Risk effect
    const riskValues = extractRiskFormValues(rule);
    if (riskValues) {
      this.trigger = 'risk';
      this.riskEditorInitialContent = riskValues['description'] || '';
      this.form.patchValue(riskValues);
      this.updateRiskLevel();
      this.form.updateValueAndValidity();
    }

    // Assessment effect
    const assessmentValues = extractAssessmentFormValues(rule);
    if (assessmentValues) {
      this.trigger = 'assessment';
      this.form.patchValue(assessmentValues);
      this.form.updateValueAndValidity();
      this.form.markAsPristine();
      this.getFormTemplateList();
      this.editorInitialContentAssesmet = assessmentValues['assessmentDescription'] || '';
    }

    // Task effect
    const taskValues = extractTaskFormValues(rule);
    if (taskValues) {
      this.trigger = 'task';

      this.loadAvailableLabels().then(() => {
        const rawLabels = taskValues['labels'] || [];
        const resolvedLabels = rawLabels.map((label: any) => {
          if (typeof label === 'object' && label !== null) {
            return label;
          }
          return this.availableLabels.find((al: any) => al.id === label) || { id: label, name: '', isDeleted: false };
        });
        resolvedLabels.forEach((taskLabel: any) => {
          if (taskLabel?.id == 0) {
            this.availableLabels.push({ id: taskLabel.id ?? 0, name: taskLabel.name, isDeleted: false });
          }
        });
        this.filteredLabelsList = [...this.availableLabels];
        this.editorInitialContent = taskValues['description'] || '';

        this.form.patchValue({
          taskTitle: taskValues['taskTitle'],
          taskDescription: taskValues['taskDescription'],
          dueDate: taskValues['dueDate'],
          priority: taskValues['priority'],
          effortLevel: taskValues['effortLevel'],
          labels: resolvedLabels
        });
        this.form.updateValueAndValidity();
        this.form.markAsPristine();
      });
    }

    if (this.isViewOnly || this.viewMode) {
      this.form.disable({ emitEvent: false });
      this.form.get('sectionId')?.enable({ emitEvent: false });
      this.form.get('entireSection')?.enable({ emitEvent: false });
      this.form.get('targetQuestionId')?.enable({ emitEvent: false });
    }
  }


  private resetDrawerState() {
    this.blocks.clear();
    this.connectorsArray.clear();
    this.form.patchValue({ ...TRIGGER_FORM_DEFAULTS });
    this._trigger = 'display';
    this.editorInitialContent = '';
    this.riskEditorInitialContent = '';
    this.updateAssessmentValidators();
    this.updateTaskValidators();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.editorInitialContentAssesmet = ''
    this.updateRiskValidators();
  }

  private emitAllRules() {
    this.onSave.emit({
      questionId: this.currentQuestion?.id,
      sectionId: this.editData.currentSectionId,
      rule: [...this.rulesList]
    });
  }



  private updateAssessmentValidators() {
    if (!this.form) return;
    const requiredFields = ['assessmentName', 'assessmentType', 'templateId'];

    requiredFields.forEach(field => {
      const control = this.form.get(field);
      if (!control) return;

      if (this._trigger === 'assessment') {
        control.setValidators(Validators.required);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  private updateTaskValidators(): void {
    const titleControl = this.form.get('taskTitle') as FormControl;
    const descriptionControl = this.form.get('taskDescription') as FormControl;
    if (!titleControl || !descriptionControl) return;

    if (this._trigger === 'task') {
      titleControl.setValidators([Validators.required]);
      descriptionControl.setValidators([Validators.required]);
    } else {
      titleControl.clearValidators();
      descriptionControl.clearValidators();
      titleControl.setErrors(null);
      descriptionControl.setErrors(null);
    }

    titleControl.updateValueAndValidity({ emitEvent: false });
    descriptionControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateRiskValidators() {
    const titleControl = this.form.get('riskParameter') as FormControl;
    const descriptionControl = this.form.get('description') as FormControl;
    const likelihoodControl = this.form.get('likelihood') as FormControl;
    const severityControl = this.form.get('severity') as FormControl;
    const riskLevelControl = this.form.get('riskLevel') as FormControl;

    if (!titleControl || !descriptionControl) return;

    if (this._trigger === 'risk') {
      titleControl.setValidators([Validators.required]);
      descriptionControl.setValidators([Validators.required]);
      likelihoodControl.setValidators([Validators.required]);
      severityControl.setValidators([Validators.required]);
      riskLevelControl.setValidators([Validators.required]);

    } else {
      titleControl.clearValidators();
      descriptionControl.clearValidators();
      likelihoodControl.clearValidators();
      severityControl.clearValidators();
      riskLevelControl.clearValidators();
      titleControl.setErrors(null);
      descriptionControl.setErrors(null);
      likelihoodControl.setErrors(null);
      severityControl.setErrors(null);
      riskLevelControl.setErrors(null);
    }

    titleControl.updateValueAndValidity({ emitEvent: false });
    descriptionControl.updateValueAndValidity({ emitEvent: false });
  }


  private watchFirstConnector() {
    if (this.firstConnectorSub) {
      this.firstConnectorSub.unsubscribe();
    }
    if (this.connectorsArray.length === 0) return;
    const firstControl = this.connectorsArray.at(0);
    this.firstConnectorSub = firstControl.valueChanges.subscribe(value => {
      for (let i = 1; i < this.connectorsArray.length; i++) {
        this.connectorsArray.at(i).setValue(value, { emitEvent: false });
      }
    });
  }

  private watchMeasureType() {
    const measureControl = this.form.get('measureType');
    const mitigationControl = this.form.get('mitigateMeasure');

    measureControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      if (value === 'MITIGATE') {
        mitigationControl?.setValidators(Validators.required);
      } else {
        mitigationControl?.clearValidators();
      }
      mitigationControl?.updateValueAndValidity();
    });
  }

  private watchRiskCalculation() {
    const likelihoodControl = this.form.get('likelihood');
    const severityControl = this.form.get('severity');
    const riskLevelControl = this.form.get('riskLevel');

    riskLevelControl?.disable({ emitEvent: false });

    likelihoodControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateRiskLevel());
    severityControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateRiskLevel());
    this.updateRiskLevel();
  }

  private updateRiskLevel() {
    const likelihoodVal = this.form.get('likelihood')?.value;
    const impact = this.form.get('severity')?.value;
    const riskLevelControl = this.form.get('riskLevel');

    if (likelihoodVal && impact) {
      riskLevelControl?.setValue(calculateRiskLevel(likelihoodVal, impact), { emitEvent: false });
    } else {
      riskLevelControl?.setValue('', { emitEvent: false });
    }
  }



  private async loadAvailableLabels(): Promise<void> {
    if (this.labelsLoading()) return;
    this.labelsLoading.set(true);

    try {
      const res = await this.assessmentApiHelperService.getAllAssessmentTaskLabels();
      const labelsFromApi = Array.isArray(res) ? res : [];

      this.availableLabels = labelsFromApi
        .filter((l: any) => !l.isDeleted)
        .map((l: any) => ({ id: l.id, name: l.name, isDeleted: false }));

      this.filteredLabelsList = [...this.availableLabels];
    } catch (error) {
      console.error('Failed to load labels', error);
      this.availableLabels = [];
      this.filteredLabelsList = [];
    } finally {
      this.labelsLoading.set(false);
    }
  }


  private removeScrollListener() {
    if (this.scrollHandler) {
      const panel = this.templateSelect?.panel?.nativeElement;
      if (panel) {
        panel.removeEventListener('scroll', this.scrollHandler);
      }
      this.scrollHandler = undefined;
    }
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }
}
