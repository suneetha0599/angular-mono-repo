export interface TriggerLabel {
  id: number;
  name: string;
  isDeleted: boolean;
}

export interface QuestionOption {
  value: string;
  saved: boolean;
  label?: string;
}

export interface SectionQuestion {
  id: string;
  text: string;
  type: string;
  helper: string;
  required: boolean;
  numeric: boolean;
  comment: boolean;
  file: boolean;
  options: QuestionOption[];
  // rule?: TriggerRule | TriggerRule[] | null;
  rules?: TriggerRule | TriggerRule[] | null;
}

export interface TemplateSection {
  id: string;
  section: string;
  description: string;
  totalQuestion: number;
  order: number;
  questions: SectionQuestion[];
  displaySectionOrder: number;
  displayOrder: number;
}

export interface TriggerEditPayload {
  currentQuestionId: string;
  currentSectionId: string;
  sections: TemplateSection[];
}

export interface TriggerSavePayload {
  questionId: string | undefined;
  sectionId: string;
  rule: TriggerRule[];
}

export interface RuleCondition {
  logic?: 'AND' | 'OR';
  rules?: RuleCondition[];
  operator?: string;
  value?: string | number | string[] | number[] | Date;
  values?: string[] | number[];
  valueTo?: string | number | Date;
  questionId?: string;
}

export interface UIEffectTargets {
  sectionIds?: string[];
  questionIds?: string[];
  sections?: string[];
  questions?: string[];
}

export interface UIEffect {
  action?: string;
  targets: UIEffectTargets;
}

export interface RiskMeasure {
  measure?: string;
  standard?: string;
  controlCategory?: string;
  controlDescription?: string;
  effectOnRisk?: string;
  residualRisk?: string;
  description?: string;
}

export interface RiskEffect {
  title?: string;
  description?: string;
  likelihood?: string;
  impact?: string;
  riskLevel?: string;
  measureType?: string;
  measure?: RiskMeasure;
  mitigate?: RiskMeasure;
  accept?: RiskMeasure;
  avoid?: RiskMeasure;
  transfer?: RiskMeasure;
}

export interface AssessmentEffect {
  name?: string;
  description?: string;
  type?: string;
  templateId?: string;
}

export interface TaskEffect {
  title?: string;
  description?: string;
  dueDate?: string | Date;
  priority?: string;
  levelOfEffort?: string;
  labels?: [];
}

export interface APIEffects {
  raiseRisks?: RiskEffect[];
  raiseRisk?: RiskEffect[];
  assessments?: AssessmentEffect[];
  assessment?: AssessmentEffect[];
  createTasks?: TaskEffect[];
  createTask?: TaskEffect[];
}

export interface TriggerRule {
  condition: RuleCondition | null;
  uiEffects?: UIEffect | null;
  apiEffects?: APIEffects;
}

export interface TemplatePaginationDetail {
  totalRecords: number;
  pageNo: number;
  loading: boolean;
  isLastPage: boolean;
}

export interface TemplateListItem {
  templateId: string;
  name: string;
}

