import { FormBuilder, FormArray, FormGroup, AbstractControl } from '@angular/forms';
import { IMPACT_SCORE_MAP, LIKELIHOOD_SCORE_MAP, RISK_LEVEL_THRESHOLDS } from './constants';

export function buildTriggerForm(
  fb: FormBuilder,
  createCondition: () => FormGroup
): FormGroup {
  return fb.group({
    conditions: fb.array([createCondition()]),
    sectionId: [[]],
    targetQuestionId: [[]],
    entireSection: [false],
    riskParameter: [''],
    description: [''],
    likelihood: [''],
    severity: [''],
    riskLevel: [''],
    blocks: fb.array([]),
    connectors: fb.array([]),
    assessmentName: [''],
    assessmentDescription: [''],
    assessmentType: [''],
    templateId: [''],
    measureType: [null],
    mitigateMeasure: [''],
    standard: [''],
    controlCategory: [''],
    controlDescription: [''],
    effectOnRisk: [''],
    residualRisk: [''],
    measureDescription: [''],
    taskDescription: [''],
    taskTitle: [''],
    dueDate: [''],
    priority: ['MEDIUM'],
    effortLevel: [null],
    labels: [[]],
  });
}

export const TRIGGER_FORM_DEFAULTS = {
  sectionId: [],
  targetQuestionId: [],
  entireSection: false,
  riskParameter: '',
  description: '',
  likelihood: '',
  severity: '',
  riskLevel: '',
  assessmentName: '',
  assessmentDescription: '',
  assessmentType: '',
  templateId: '',
  measureType: null,
  mitigateMeasure: '',
  standard: '',
  controlCategory: '',
  controlDescription: '',
  effectOnRisk: '',
  residualRisk: '',
  measureDescription: '',
  taskDescription: '',
  taskTitle: '',
  dueDate: '',
  priority: '',
  effortLevel: '',
  labels: []
};


export function normalizeConditionForUI(condition: any, questionId: string | any) {
  if (!condition) return null;

  if (!condition.rules) {
    return {
      ...condition,
      questionId: questionId,
      value: condition.value ?? condition.values ?? '',
      valueTo: condition.valueTo ?? ''
    };
  }

  return {
    logic: condition.logic,
    rules: condition.rules.map((r: any) => ({
      questionId: questionId,
      operator: r.operator,
      value: r.value ?? r.values ?? '',
      valueTo: r.valueTo ?? ''
    }))
  };
}

export function calculateRiskLevel(likelihood: string, impact: string): string {
  const likelihoodScore = LIKELIHOOD_SCORE_MAP[likelihood] ?? 0;
  const impactScore = IMPACT_SCORE_MAP[impact] ?? 0;

  const riskScore = likelihoodScore * impactScore;

  if (riskScore >= RISK_LEVEL_THRESHOLDS.HIGH) return 'HIGH';
  if (riskScore >= RISK_LEVEL_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

export function normalizeTargets(targets: any) {
  return {
    sectionIds: targets?.sectionIds || targets?.sections || [],
    questionIds: targets?.questionIds || targets?.questions || []
  };
}

export function extractRiskFormValues(rule: any): Record<string, any> | null {
  const apiEffects = rule.apiEffects || {};
  const risks = apiEffects.raiseRisks || apiEffects.raiseRisk || [];
  if (!Array.isArray(risks) || !risks.length) return null;

  const risk = risks[0];
  const measureWrapper = risk?.measure || {};
  const measure =
    measureWrapper?.mitigate ||
    measureWrapper?.accept ||
    measureWrapper?.avoid ||
    measureWrapper?.transfer ||
    measureWrapper;

  return {
    riskParameter: risk?.title || '',
    description: risk?.description || '',
    likelihood: risk?.likelihood || '',
    severity: risk?.impact || '',
    riskLevel: risk?.riskLevel || '',
    measureType: risk?.measureType || '',
    mitigateMeasure: measure?.measure || '',
    standard: measure?.standard || '',
    measureDescription: measure?.description || measure?.controlDescription || '',
    controlCategory: measure?.controlCategory || '',
    controlDescription: measure?.controlDescription || '',
    effectOnRisk: measure?.effectOnRisk || '',
    residualRisk: measure?.residualRisk || ''
  };
}

export function extractAssessmentFormValues(rule: any): Record<string, any> | null {
  const apiEffects = rule.apiEffects || {};
  const assessments = apiEffects.assessments || apiEffects.assessment || [];
  if (!Array.isArray(assessments) || !assessments.length) return null;

  const assessment = assessments[0];
  return {
    assessmentName: assessment?.name || '',
    assessmentDescription: assessment?.description || '',
    assessmentType: assessment?.type || '',
    templateId: assessment?.templateId || ''
  };
}

export function extractTaskFormValues(rule: any): Record<string, any> | null {
  const apiEffects = rule.apiEffects || {};
  const tasks = apiEffects.createTasks || apiEffects.createTask || apiEffects.tasks || apiEffects.task || [];
  if (!Array.isArray(tasks) || !tasks.length) return null;

  const task = tasks[0];
  return {
    taskTitle: task?.title || '',
    taskDescription: task?.description || '',
    dueDate: task?.dueDate ? new Date(task.dueDate) : '',
    priority: task?.priority || 'MEDIUM',
    effortLevel: task?.effortLevel || task?.levelOfEffort || null,
    labels: task?.labels || task?.labelIds || [],
    description: task?.description || ''
  };
}

export function extractDisplayFormValues(
  rule: any,
  findSectionIdsFn: (questionIds: string[]) => string[]
): Record<string, any> | null {
  if (!rule.uiEffects) return null;

  const targets = normalizeTargets(rule.uiEffects.targets || {});
  const questionIds = targets.questionIds || [];
  let sectionIds = targets.sectionIds || [];

  if (!sectionIds.length && questionIds.length) {
    sectionIds = findSectionIdsFn(questionIds);
  }

  return {
    sectionId: sectionIds,
    targetQuestionId: questionIds,
    entireSection: !questionIds.length
  };
}

export function normalizeRuleCondition(rule: any): any {
  if (!rule?.condition) return null;

  let normalizedCondition: any;
  if (rule.condition.group) {
    normalizedCondition = {
      logic: rule.condition.group.logic,
      rules: rule.condition.group.rules.map((r: any) => r.rule || r)
    };
  } else if (rule.condition.logic && Array.isArray(rule.condition.rules)) {
    normalizedCondition = rule.condition;
  } else if (rule.condition.rule && rule.condition.rule.operator) {
    normalizedCondition = {
      logic: 'AND',
      rules: [rule.condition.rule]
    };
  } else if (rule.condition.operator) {
    normalizedCondition = rule.condition;
  } else {
    normalizedCondition = rule.condition;
  }

  return normalizedCondition;
}

export function flattenRules(rawRule: any): any[] {
  if (!rawRule) return [];
  const rulesArray = Array.isArray(rawRule) ? rawRule : [rawRule];
  return rulesArray.map((r: any) => {
    const wrapper = r.rule ? r.rule : r;
    return wrapper.rule ? wrapper.rule : wrapper;
  });
}

export function findSectionIdsFromQuestions(allSections: any[], questionIds: string[]): string[] {
  if (!questionIds?.length) return [];
  const sectionIds = new Set<string>();

  allSections.forEach((section: any) => {
    const hasQuestion = section.questions?.some((q: any) =>
      questionIds.includes(q.id)
    );
    if (hasQuestion) {
      sectionIds.add(section.id);
    }
  });

  return Array.from(sectionIds);
}
