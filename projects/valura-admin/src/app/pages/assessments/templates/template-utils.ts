import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AssessmentService } from "@admin-core/services/assessment/assessment.service";
import { Status } from "./constants";
import { AssessmentType } from "@admin-core/models/assessment/assessment";
import { objectControlValidation } from "@admin-core/utils/validators-util";
import { v1 as uuid1 } from 'uuid';
import { ApiHelperService } from "@admin-core/services/network/assessment/api-helper.service";

export const buildTemplateForm = (fb: FormBuilder, initialSections: any[] = []) => {
  const assessments = fb.array(
    initialSections.map((section: any, i: number) => buildSection(fb, section, i))
  );

  let form: FormGroup = fb.group({
    template: fb.group({
      templateName: ['', Validators.required],
      description: [''],
      templateType: [null, [objectControlValidation()]],
      status: [Status.INACTIVE]
    }),
    assessments: assessments,
  });
  return form;
}

export const buildSection = (fb: FormBuilder, sectionData: any = {}, index: number = 0): FormGroup => {
  return fb.group({
    order: [sectionData?.order || index + 1],
    id: [sectionData?.id ?? 0],
    section: [sectionData.section || '', Validators.required],
    description: [sectionData.description],
    totalQuestion: [sectionData.totalQuestion || 0],
    displaySectionOrder: [index + 1],
    questions: fb.array(
      (sectionData.questions || []).map((q: any, questionIndex: number) => buildQuestion(fb, q, questionIndex, index))
    )
  });
};

export const buildQuestion = (fb: FormBuilder, questionData: any = {}, index: number = 0, sectionIndex: number): FormGroup => {
  const options = fb.array(
    (questionData.options || []).map((opt: any) =>
      fb.group({ value: opt.option || '', saved: true })
    )
  );

  return fb.group({
    order: [questionData?.order || index + 1],
    id: [questionData?.id ?? 0],
    text: [questionData.text || '', Validators.required],
    type: [questionData.type || '', Validators.required],
    helper: [questionData.helper || ''],
    required: [questionData.required || false],
    numeric: [questionData.numeric || false],
    comment: [questionData.comment || false],
    file: [questionData.file || false],
    options: options,
    rules: [questionData.rules || questionData.rule || []],
    displayOrder: [index + 1],
    displaySectionOrder: [sectionIndex + 1],
  });
};
export const buildTemplatePayload = async (form: FormGroup, assessmentService: AssessmentService, apiHelperService: ApiHelperService, includeDeleted: boolean = true, onWarning?: (msg: string) => void) => {
  const templateGroup = form.get('template') as FormGroup;
  const assessmentsArray = form.get('assessments') as FormArray;
  const getDeletedQuestionsForSection = async (sectionId: number) => {
    const deletedQuestions = assessmentService.deletedQuestionsList
      .filter((q: { sectionId: number; }) => q.sectionId === sectionId);
    return Promise.all(deletedQuestions.map(async (q: any, idx: number | undefined) => ({
      ...(await prepareQuestionPayload(q, idx, apiHelperService, onWarning)),
      isDeleted: true
    })));
  };
  const tempSections = await Promise.all(assessmentsArray.controls.map(async (sectionCtrl, sectionIndex) => {
    const sectionForm = sectionCtrl as FormGroup;
    const sectionId = sectionForm.get('id')?.value ?? 0;
    const activeQuestions = await Promise.all((sectionForm.get('questions') as FormArray).controls.map((questionCtrl, questionIndex) =>
      prepareQuestionPayload((questionCtrl as FormGroup).value, questionIndex, apiHelperService, onWarning)
    ));

    let finalQuestions = [...activeQuestions];

    if (includeDeleted) {
      const deletedQuestions = await getDeletedQuestionsForSection(sectionId);
      finalQuestions = [...finalQuestions, ...deletedQuestions];
    }

    return {
      order: sectionIndex + 1,
      id: sectionId,
      sectionTitle: sectionForm.get('section')?.value || '',
      description: sectionForm.get('description')?.value || '',
      totalQuestion: finalQuestions.length,
      initialVisibility: true,
      assignDetail: {
        userId: 0,
        userType: "FORM_USER"
      },
      isDeleted: false,
      questions: finalQuestions,
    };
  }));
  const { hiddenSections, hiddenQuestions } =
    evaluateInitialVisibility(tempSections);
  const activeSections = tempSections.map(section => {

    section.initialVisibility =
      !hiddenSections.has(section.id);

    section.questions = section.questions.map((q: any) => ({
      ...q,
      initialVisibility:
        !hiddenQuestions.has(q.questionId)
    }));

    return section;
  });


  const deletedSections = await Promise.all(assessmentService.deletedSectionsList.map(async (section: { sectionId: any; id: any; section: any; sectionTitle: any; }, index: number) => {
    const sectionId = section.sectionId ?? section.id ?? 0;

    const deletedQuestions = await getDeletedQuestionsForSection(sectionId);

    return {
      order: activeSections.length + index + 1,
      sectionId,
      sectionTitle: section.section || section.sectionTitle || '',
      totalQuestion: deletedQuestions.length,
      assignDetail: {
        userId: 0,
        userType: "FORM_USER"
      },
      isDeleted: true,
      questions: deletedQuestions
    };
  }));
  const finalSections = includeDeleted ? [...activeSections, ...deletedSections] : [...activeSections];
  const validSectionIds = new Set(
    finalSections.map(s => s.id ?? s.sectionId)
  );

  const validQuestionIds = new Set(
    finalSections.flatMap(s =>
      s.questions.map((q: any) => q.questionId ?? q.id)
    )
  );

  const filterRuleTargets = (singleRule: any) => {
    if (!singleRule?.uiEffects?.targets) return;
    const targets = singleRule.uiEffects.targets;

    targets.sections = (targets.sections || [])
      .filter((id: string) => validSectionIds.has(id));
    targets.questions = (targets.questions || [])
      .filter((id: string) => validQuestionIds.has(id));
  };

  finalSections.forEach(section => {
    section.questions.forEach((q: any) => {
      const rules = q.rules;
      if (!rules) return;

      if (Array.isArray(rules)) {
        rules.forEach((r: any) => filterRuleTargets(r));
      } else {
        filterRuleTargets(rules);
      }
    });
  });
  return {
    name: templateGroup.get('templateName')?.value || '',
    description: templateGroup.get('description')?.value || '',
    type: templateGroup.get('templateType')?.value?.id ?? 0,
    // status: templateGroup.get('status')?.value || Status.INACTIVE,
    status: Status.ACTIVE,
    isDeleted: false,
    sections: finalSections
  };
};

export const prepareQuestionPayload = async (question: any, questionIndex: number = 0, apiHelperService?: ApiHelperService, onWarning?: (msg: string) => void) => {
  const { rules: _rules, rule: _rule, ...rest } = question || {};
  return {
    ...rest,
    order: questionIndex + 1,
    initialVisibility: true,
    questionId: question?.id || 0,
    questionName: question?.text ?? '',
    helper: question?.helper ?? '',
    type: (question?.type === 'YES_NO' ? 'RADIO' : (question?.type || 'TEXT')).toUpperCase(),
    required: !!question?.required,
    comment: !!question?.comment,
    file: !!question?.file,
    numeric: !!question?.numeric,
    options: (question?.options ?? []).map((option: any) => ({
      value: option?.value || '',
      saved: true,
      label: ''
    })) || [],
    isDeleted: question?.isDeleted ?? false,
    rules: await normalizeRuleForBackend(question?.rules || question?.rule, apiHelperService, onWarning) || []
  };
}

export const patchTemplateForm = (fb: FormBuilder, form: FormGroup, data: any) => {
  if (data.template) {
    const templateType: AssessmentType = { id: data.template.type || (data.template?.templateType?.id ?? '') || '', name: (data.template?.templateType?.name ?? '') };

    form.get('template')?.patchValue({
      templateName: data.template.templateName || data.template.name || '',
      description: data.template.description || '',
      templateType: templateType,
      status: data.template.status || Status.INACTIVE
    });
  }

  const assessmentsArray = form.get('assessments') as FormArray;
  assessmentsArray.clear();

  const sections = data.sections || data.assessments
  if (sections && Array.isArray(sections)) {
    sections.forEach((sectionData: any, i: number) => {
      const sectionGroup = buildSection(fb, {
        order: sectionData.order,
        id: sectionData.id,
        section: sectionData.sectionName || sectionData.section,
        description: sectionData.description,
        totalQuestion: sectionData.totalQuestion,
        questions: (sectionData.questions || []).map((q: any, qIndex: number) => ({
          order: (q?.order ?? 0),
          id: (q?.id ?? 0),
          text: q.text,
          type: q.type,
          helper: q.helper,
          required: q.required,
          comment: q.comment,
          file: q.file,
          numeric: q.numeric,
          options: (q.options || []).map((opt: any) => ({ option: opt.value })),
          rules: q.rules || q.rule || null,
          displayOrder: [qIndex + 1],
          displaySectionOrder: [i + 1],
        }))
      }, i);

      assessmentsArray.push(sectionGroup);
    });
  }
};

export const statusColors = (status: string): string => {
  switch (status) {
    case Status.ACTIVE:
      return `#EDF7ED`;
    case Status.INACTIVE:
      return `#FFDAD6`;
    default:
      return `#FFF4E5`;
  }
}

export const statusTextColors = (status: string): string => {
  switch (status) {
    case Status.ACTIVE:
      return `#1E4620`;
    case Status.INACTIVE:
      return `#410002`;
    default:
      return `#EDF7ED`;
  }
}


export const buildDraftFromTemplateDetails = (
  fb: FormBuilder,
  templateDetails: any
): FormGroup => {

  const form = buildTemplateForm(fb, []);
  patchTemplateForm(fb, form, templateDetails);

  const templateGroup = form.get('template') as FormGroup;
  templateGroup.patchValue({
    templateName:
      (templateGroup.get('templateName')?.value || ''),
    status: Status.INACTIVE
  });

  const sections = form.get('assessments') as FormArray;

  const sectionIdMap = new Map<any, any>();
  const questionIdMap = new Map<any, any>();



  sections.controls.forEach((sectionCtrl, sectionIndex) => {
    const sectionGroup = sectionCtrl as FormGroup;

    const oldSectionId = sectionGroup.get('id')?.value;
    const newSectionId = uuid1();
    sectionIdMap.set(oldSectionId, newSectionId);

    sectionGroup.get('id')?.setValue(newSectionId);
    sectionGroup.get('order')?.setValue(sectionIndex + 1);

    const questions = sectionGroup.get('questions') as FormArray;

    questions.controls.forEach((questionCtrl, questionIndex) => {
      const questionGroup = questionCtrl as FormGroup;

      const oldQuestionId = questionGroup.get('id')?.value;
      const newQuestionId = uuid1();
      questionIdMap.set(oldQuestionId, newQuestionId);
      questionGroup.get('id')?.setValue(newQuestionId);
      questionGroup.get('order')?.setValue(questionIndex + 1);
    });
  });


  sections.controls.forEach(sectionCtrl => {

    const sectionGroup = sectionCtrl as FormGroup;
    const questions = sectionGroup.get('questions') as FormArray;

    questions.controls.forEach(questionCtrl => {
      const questionGroup = questionCtrl as FormGroup;
      let rule = questionGroup.get('rules')?.value;
      if (!rule) return;

      const remapTargets = (singleRule: any) => {
        const targets = singleRule?.uiEffects?.targets;
        if (!targets) return;

        targets.questionIds = targets.questionIds || targets.questions || [];
        targets.sectionIds = targets.sectionIds || targets.sections || [];

        if (Array.isArray(targets.questionIds)) {
          targets.questionIds = targets.questionIds.map((id: any) =>
            questionIdMap.get(id) || id
          );
        }
        if (Array.isArray(targets.sectionIds)) {
          targets.sectionIds = targets.sectionIds.map((id: any) =>
            sectionIdMap.get(id) || id
          );
        }
      };

      if (Array.isArray(rule)) {
        rule.forEach((r: any) => {
          const unwrapped = r.rule ? r.rule : r;
          remapTargets(unwrapped);
        });
      } else {
        const actualRule = rule.rule ? rule.rule : rule;
        remapTargets(actualRule);
        if (rule.rule) {
          rule.rule = actualRule;
        } else {
          rule = actualRule;
        }
      }

      questionGroup.get('rules')?.setValue(rule);
    });
  });

  return form;
};

const collectDisplayTargets = (rule: any, hiddenSections: Set<string>, hiddenQuestions: Set<string>) => {
  if (!rule?.uiEffects) return;

  const effect = rule.uiEffects;
  if (effect.action !== 'DISPLAY') return;

  const targets = effect.targets || {};
  (targets.sections || []).forEach((id: string) => {
    hiddenSections.add(id);
  });
  (targets.questions || []).forEach((id: string) => {
    hiddenQuestions.add(id);
  });
};

const evaluateInitialVisibility = (sections: any[]) => {
  const hiddenSections = new Set<string>();
  const hiddenQuestions = new Set<string>();

  sections.forEach(section => {
    section.questions?.forEach((q: any) => {
      const rules = q.rules;
      if (!rules) return;

      if (Array.isArray(rules)) {
        rules.forEach((r: any) => collectDisplayTargets(r, hiddenSections, hiddenQuestions));
      } else {
        collectDisplayTargets(rules, hiddenSections, hiddenQuestions);
      }
    });
  });

  return { hiddenSections, hiddenQuestions };
};

const INVALID_CONDITION = Symbol('INVALID_CONDITION');

const normalizeSingleRule = async (singleRule: any, apiHelperService?: ApiHelperService) => {
  let normalizedCondition: any = null;

  const condition = singleRule.condition;

  if (condition) {
    if (condition.group) {
      normalizedCondition = {
        logic: condition.group.logic || 'AND',
        rules: (condition.group.rules || []).map(
          (r: any) => r.rule || r
        )
      };
    } else if (condition.logic && Array.isArray(condition.rules)) {
      normalizedCondition = {
        logic: condition.logic,
        rules: condition.rules
      };
    } else if (condition.rule && condition.rule.operator) {
      normalizedCondition = {
        logic: 'AND',
        rules: [condition.rule]
      };
    } else if (condition.operator) {
      normalizedCondition = {
        logic: 'AND',
        rules: [condition]
      };
    } else if (!condition.operator && !condition.logic && !condition.group && !condition.rule) {
      normalizedCondition = INVALID_CONDITION;
    } else {
      normalizedCondition = condition;
    }
  }

  const ui = singleRule.uiEffects;
  let normalizedUi = null;

  if (ui && ui.action) {
    const targets = ui.targets || {};
    normalizedUi = {
      action: ui.action,
      targets: {
        sections: targets.sections || targets.sectionIds || [],
        questions: targets.questions || targets.questionIds || []
      }
    };
  }

  const api = singleRule.apiEffects;
  let normalizedApi = null;

  if (api) {
    let risks = api.raiseRisks || api.raiseRisk || [];
    risks = risks.map((risk: any) => {
      const measureWrapper = risk?.measure || {};
      const flatMeasure =
        measureWrapper?.mitigate ||
        measureWrapper?.accept ||
        measureWrapper?.avoid ||
        measureWrapper?.transfer ||
        measureWrapper;
      return { ...risk, measure: flatMeasure };
    });

    let tasks = api.createTasks || api.createTask || [];
    tasks = await Promise.all(tasks.map(async (task: any) => {
      const normalized = { ...task };
      if (normalized?.dueDate) {
        normalized.dueDate = new Date(normalized.dueDate).toISOString();
      }
      const rawLabels = normalized.labels || normalized.labelIds || [];
      const existingIds: number[] = [];
      const newLabels: { name: string }[] = [];
      for (const label of rawLabels) {
        if (typeof label === 'object' && label !== null) {
          if (label.id === 0 && label.name) {
            newLabels.push({ name: label.name });
          } else if (label.id) {
            existingIds.push(label.id);
          }
        } else if (typeof label === 'number' && label > 0) {
          existingIds.push(label);
        }
      }
      let createdIds: number[] = [];
      if (newLabels.length > 0 && apiHelperService) {
        const res = await apiHelperService.addLabels({ labels: newLabels });
        createdIds = (res?.data?.labels || []).map((l: any) => l.id).filter(Boolean);
      }
      normalized.labelIds = [...existingIds, ...createdIds];
      delete normalized.labels;
      return normalized;
    }));

    normalizedApi = {
      raiseRisks: risks,
      assessments: api.assessments || api.assessment || [],
      createTasks: tasks
    };
  }

  return {
    condition: normalizedCondition === INVALID_CONDITION ? null : normalizedCondition,
    uiEffects: normalizedUi,
    apiEffects: normalizedApi,
    _invalid: normalizedCondition === INVALID_CONDITION
  };
};

const normalizeRuleForBackend = async (rule: any, apiHelperService?: ApiHelperService, onWarning?: (msg: string) => void): Promise<any> => {
  if (!rule) return null;

  if (Array.isArray(rule)) {
    const normalized = await Promise.all(rule.map(r => {
      const unwrapped = r.rule ? r.rule : r;
      return normalizeSingleRule(unwrapped, apiHelperService);
    }));
    const invalid = normalized.filter(r => r._invalid);
    // if (invalid.length > 0 && onWarning) {
    //   onWarning(`${invalid.length} rule(s) with incomplete conditions were removed.`);
    // }
    return normalized
      .filter(r => !r._invalid)
      .map(({ _invalid, ...rest }) => rest);
  }

  const actualRule = rule.rule ? rule.rule : rule;
  const result = await normalizeSingleRule(actualRule, apiHelperService);
  // if (result._invalid) {
  //   onWarning?.('A rule with an incomplete condition was removed.');
  //   return [];
  // }
  const { _invalid, ...rest } = result;
  return rest;
};

export const stripHtml = (html: string) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent?.trim() || '';
}
