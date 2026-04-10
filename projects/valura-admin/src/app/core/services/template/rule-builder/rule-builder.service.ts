import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RuleBuilderService {

  buildDisplayEffect(formValue: any) {

    const sections = formValue.entireSection
      ? (formValue.sectionId || [])
      : [];

    const questions = !formValue.entireSection
      ? (formValue.targetQuestionId || [])
      : [];

    return {
      action: 'DISPLAY',
      targets: {
        sections,
        questions
      }
    };
  }

  buildRiskEffect(formValue: any) {

    const riskPayload: any = {
      title: formValue.riskParameter,
      description: formValue.description,
      likelihood: formValue.likelihood,
      impact: formValue.severity,
      riskLevel: formValue.riskLevel,
      measureType: formValue.measureType
    };

    if (formValue.measureType === 'ACCEPT' || formValue.measureType === 'AVOID' || formValue.measureType === 'TRANSFER') {
      riskPayload.measure = {
        description: formValue.measureDescription,
        residualRisk: formValue.residualRisk
      };
    }

    if (formValue.measureType === 'MITIGATE') {
      riskPayload.measure = {
        measure: formValue.mitigateMeasure,
        standard: formValue.standard,
        controlCategory: formValue.controlCategory,
        controlDescription: formValue.controlDescription,
        effectOnRisk: formValue.effectOnRisk,
        residualRisk: formValue.residualRisk
      };
    }

    return {
      raiseRisks: [riskPayload]
    };
  }

  buildRule(cond: any) {

    const formatDate = (val: any) =>
      val instanceof Date
        ? val.toISOString().split('T')[0]
        : val;

    if (cond.operator === 'BETWEEN') {
      return {
        operator: cond.operator,
        value: [
          formatDate(cond.value),
          formatDate(cond.valueTo)
        ]
      };
    }

    if (Array.isArray(cond.value)) {
      return {
        operator: cond.operator,
        value: cond.value
      };
    }

    if (cond.operator === 'NOT_EMPTY') {
      return {
        operator: cond.operator
      };
    }

    return {
      operator: cond.operator,
      value: formatDate(cond.value)
    };
  }

  buildAssessmentEffect(formValue: any) {
    return {
      assessments: [
        {
          name: formValue.assessmentName,
          description: formValue.assessmentDescription,
          type: formValue.assessmentType,
          templateId: formValue.templateId
        }
      ]
    };
  }


  buildTaskEffect(formValue: any) {
    const isTaskEmpty =
      !formValue.taskTitle &&
      !formValue.taskDescription &&
      !formValue.dueDate &&
      !formValue.priority &&
      !formValue.effortLevel &&
      (!formValue.labels || formValue.labels.length === 0);
    if (isTaskEmpty) {
      return { tasks: [] };
    }
    return {
      tasks: [
        {
          title: formValue.taskTitle,
          description: formValue.taskDescription,
          dueDate: formValue.dueDate,
          priority: formValue.priority,
          levelOfEffort: formValue.effortLevel,
          labels: formValue.labels.map((s: any) => {
            if (typeof s === 'number') return s;
            return s.id ? s : { id: 0, name: s.name };
          })
        }
      ]
    };
  }
}
