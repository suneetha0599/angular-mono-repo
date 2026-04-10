import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AccessRecord, AssessmentStatus, createAssessmentCommandType, Status } from "./constants";
import { v1 as uuidv1 } from 'uuid';
import { AssessmentService } from "@admin-core/services/assessment/assessment.service";

export const buildAssessmentForm = (fb: FormBuilder, initialSections: any[] = []) => {
  const assessments = fb.array(
    initialSections.map((section: any, i: number) => buildSection(fb, section, i))
  );

  let form: FormGroup = fb.group({
    overview: fb.group({
      bpa: [''],
      type: ['', Validators.required],
      title: ['', Validators.required],
      template: ['', Validators.required],
      description: [''],
      author: ['', Validators.required],
      approver1: [[], Validators.required],
      approver2: [[]],
      approver3: [[]],
      respondentType: [''],
      respondent: ['', Validators.required],
      risk: [''],
      completeBy: [''],
      previousTemplate: [''],
      clarification: [''],
      processingFor: ['processingActivity'],
      authorAsRespondent: [false]
    }),
    trigger: fb.group({
      regulation: [''],
      reason: [''],
      triggerList: fb.array([]),
      tenpTriggerList: fb.array([])
    }),
    assessments: assessments,
  });
  return form;
}

export const buildSection = (fb: FormBuilder, sectionData: any = {}, index: number = 0): FormGroup => {
  return fb.group({
    order: [sectionData.order || index + 1],
    id: [sectionData.id || 0],
    section: [sectionData.section || '', Validators.required],
    description: [sectionData.description || ''],
    totalQuestion: [sectionData.totalQuestion || 0],
    questions: fb.array(
      (sectionData.questions || []).map((q: any, i: number) => buildQuestion(fb, q, i))
    )
  });
};

export const buildQuestion = (fb: FormBuilder, questionData: any = {}, index: number = 0): FormGroup => {
  const options = fb.array(
    (questionData.options || []).map((opt: any) =>
      fb.group({ value: opt.option || '', saved: true })
    )
  );

  return fb.group({
    order: [questionData.order || index + 1],
    id: [questionData.id || 0],
    text: [questionData.text || '', Validators.required],
    type: [questionData.type || '', Validators.required],
    helper: [questionData.helper || ''],
    required: [questionData.required || false],
    numeric: [questionData.numeric || false],
    comment: [questionData.comment || false],
    file: [questionData.file || false],
    options: options
  });
};

export const buildAssessmentPayloadForEdit = (
  createAssessmentFormValue: any,
  currentUser: any,
  extras?: {
    deletedSections?: any[];
    deletedQuestions?: any[];
  }
) => {

  const assessments = createAssessmentFormValue?.assessments ?? [];
  const sectionsPayload = assessments.map((section: any, sectionIndex: number) => {
    const questions = section.questions ?? [];

    return {
      sectionId: section.id || 0,
      sectionTitle: section.section || '',
      description: section.description || '',
      totalQuestion: section.totalQuestion || 0,
      order: sectionIndex + 1,
      isDeleted: false,
      questions: questions.map((q: any, qIndex: number) => ({
        questionId: q.id || 0,
        order: qIndex + 1,
        questionName: q.text || '',
        helper: q.helper || '',
        type: (q.type || 'TEXT').toUpperCase(),
        required: !!q.required,
        comment: !!q.comment,
        file: !!q.file,
        numeric: !!q.numeric,
        isDeleted: false,
        options: (q.options ?? []).map((opt: any) => ({
          value: opt.value ?? opt.option ?? '',
          saved: true
        }))
      }))
    };
  });

  const deletedQuestions = extras?.deletedQuestions ?? [];

  deletedQuestions.forEach((dq: any) => {
    const sec = sectionsPayload.find((s: { sectionId: any; }) => s.sectionId === dq.sectionId);

    const deletedQ = {
      questionId: dq.id || dq.questionId || 0,
      order: dq.order ?? 0,
      questionName: dq.text || '',
      helper: dq.helper || '',
      type: (dq.type || 'TEXT').toUpperCase(),
      required: !!dq.required,
      comment: !!dq.comment,
      file: !!dq.file,
      numeric: !!dq.numeric,
      isDeleted: true,
      options: (dq.options ?? []).map((opt: any) => ({
        value: opt.value ?? opt.option ?? '',
        saved: true
      }))
    };

    if (sec) sec.questions.push(deletedQ);
  });

  const deletedSections = extras?.deletedSections ?? [];

  deletedSections.forEach((ds: any) => {
    sectionsPayload.push({
      sectionId: ds.id || ds.sectionId || 0,
      sectionTitle: ds.section || ds.sectionTitle || '',
      description: ds.description || '',
      totalQuestion: ds.totalQuestion || 0,
      order: ds.order ?? 0,
      isDeleted: true,
      questions: (ds.questions ?? []).map((q: any) => ({
        questionId: q.id || q.questionId || 0,
        order: q.order ?? 0,
        questionName: q.text || '',
        helper: q.helper || '',
        type: (q.type || 'TEXT').toUpperCase(),
        required: !!q.required,
        comment: !!q.comment,
        file: !!q.file,
        numeric: !!q.numeric,
        isDeleted: true,
        options: (q.options ?? []).map((opt: any) => ({
          value: opt.value ?? opt.option ?? '',
          saved: true
        }))
      }))
    });
  });

  const overView = createAssessmentFormValue.overview;
  const template = overView.template;
  const previousTemplate = overView?.previousTemplate

  const overViewPayLoad = {
    owner: overView.author,
    approver: Array.isArray(overView.approver) ? overView.approver : [overView.approver],
    respondent: Array.isArray(overView.respondent) ? overView.respondent : [overView.respondent],
    riskMatrix: overView.risk,
    dueDate: overView.completeBy,
    title: overView.title,
    description: overView.description,
    bpaId: overView.bpa?.bpaId
  };

  const templatePayload: any[] = [];

  if (previousTemplate && previousTemplate.templateId !== template.templateId) {
    templatePayload.push({
      parentId: previousTemplate.templateId,
      name: previousTemplate.name,
      type: previousTemplate.type,
      description: previousTemplate.description,
      templateId: previousTemplate.templateId,
      status: previousTemplate.status,
      isDeleted: true,
      shouldSaveAsMaster: false
    });
  }

  templatePayload.push({
    parentId: template.templateId,
    name: template.name,
    type: template.type,
    description: template.description,
    templateId: template.templateId,
    status: template.status,
    isDeleted: false,
    shouldSaveAsMaster: false
  });



  const trigger = createAssessmentFormValue.trigger;
  const triggerList = trigger.triggerList ?? [];
  const tempTriggerList = trigger.tenpTriggerList ?? [];

  const selectedTriggers = triggerList.filter((t: any) => t.selected);

  const updatedOrNew = selectedTriggers.map((t: any) => {
    const old = tempTriggerList.find((o: any) => o.triggerId === t.id);

    const regulation = t.regulationId ?? old?.actId ?? null;

    let isUpdated = false;

    if (!old) {
      isUpdated = true;
    } else {
      const oldReason = old.selectionReason ?? '';
      const newReason = t.reason ?? '';

      const oldReg = old.actId ?? old.regulationId;
      const newReg = t.regulationId ?? oldReg;
      if (oldReason !== newReason || oldReg !== newReg) {
        isUpdated = true;
      }
    }

    return {
      assessmentTriggerMappingId: old?.assessmentTriggerMappingId ?? 0,
      triggerId: t.id,
      regulationId: regulation,
      selectionReason: t.reason ?? '',
      isUpdated,
      isDeleted: false
    };
  });

  const deleted = tempTriggerList
    .filter((old: any) =>
      !selectedTriggers.some((s: any) => s.id === old.triggerId)
    )
    .map((old: any) => ({
      assessmentTriggerMappingId: old.assessmentTriggerMappingId,
      triggerId: old.triggerId,
      regulationId: old.actId ?? old.regulationId,
      selectionReason: old.selectionReason ?? '',
      isUpdated: false,
      isDeleted: true
    }));

  const triggersPayload = {
    triggers: [...updatedOrNew, ...deleted]
  };

  return {
    ...overViewPayLoad,
    sections: sectionsPayload,
    template: templatePayload,
    ...triggersPayload
  };
};

export const patchAssessmentForm = async (fb: FormBuilder, form: FormGroup, data: any) => {
  if (!data) return;
  let templates: any[] = [];

  if (data.overview) {
    let template: any;
    if (data.overview.template) {
      let templateName = data.overview.template;
      const selectedTemplate = templates?.find((t: any) => t.name === templateName);
      if (selectedTemplate) {
        templateName = selectedTemplate.name;
      }

      form.get('overview.template')?.patchValue(templateName);
    }

    form.get('overview')?.patchValue({
      bpa: data.overview.bpa || '',
      type: data.overview.type || '',
      title: data.overview.title || '',
      template: data.overview.template || '',
      description: data.overview.description || '',
      author: data.overview.author || '',
      approver1: data.overview.approver1 || [],
      approver2: data.overview.approver2 || [],
      approver3: data.overview.approver3 || [],
      respondent: data.overview.respondent || null,
      risk: data.overview.risk || '',
      completeBy: data.overview.completeBy || '',
      clarification: data.overview.clarification || '',
      processingFor: data.overview.processingFor || '',
      respondentType: data.overview.respondentType || '',
      authorAsRespondent: data.overview.authorAsRespondent || false
    });
  }

  if (data.trigger) {
    const triggerGroup = form.get('trigger') as FormGroup;
    if (!triggerGroup) return;

    const regulationArray = data.trigger.regulation || [];
    const regulationValue = Array.isArray(regulationArray) ? regulationArray[0] : regulationArray;

    triggerGroup.patchValue({
      regulation: regulationArray,
      reason: data.trigger.reason || ''
    });

    const triggerListArray = triggerGroup.get('triggerList') as FormArray;
    const triggerList = Array.isArray(data.trigger.triggerList) ? data.trigger.triggerList : [];

    patchTriggers(fb, triggerListArray, triggerList);
  }

  if (data.assessments) {
    patchQuestionnaire(fb, form, data);
  }
};


export const buildAssessmentsPayload = (
  createAssessmentFormValue: any,
  currentUser: any,
  assessmentId: any,
  isVendorAssessment: boolean = false
) => {
  const overView = createAssessmentFormValue.overview || {};
  const template = overView?.template;
  const completeBy = overView?.completeBy
    ? new Date(overView.completeBy).toISOString().split('Z')[0].split('.')[0]
    : null;

  const trigger = createAssessmentFormValue.trigger || {};
  const triggerList = trigger?.triggerList ?? [];

  const approversPayload = [overView.approver1, overView.approver2, overView.approver3]
    .flatMap((approvers, index) =>
      (Array.isArray(approvers) ? approvers : []).map((user: any) => ({
        level: index + 1,
        approver: {
          userId: user.applicationUserId || user.userId,
          userType: user.userType
        }
      }))
    );

  const respondentsPayload = [overView?.respondent || overView?.author]
    .flat()
    .filter(r => r && (r.userId || r.applicationUserId))
    .map((r: any) => ({
      userId: r.userId || r.applicationUserId || currentUser.userId,
      userType: r.userType || currentUser.userType
    }));

  const commandsPayload: any[] = [];

  if (overView.title) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateTitle,
      title: overView.title
    });
  }

  if (overView.description) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateDescription,
      description: overView.description
    });
  }

  if (completeBy) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateDueDate,
      dueDate: completeBy
    });
  }

  if (overView?.bpa?.bpaId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateBpaId,
      bpaId: overView.bpa.bpaId
    });
  }

  if (overView.risk) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateRiskMatrix,
      riskMatrix: overView.risk
    });
  }

  if (template?.templateId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateTemplateId,
      templateId: template.templateId
    });
  }

  if (overView?.type?.id) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateAssessmentTypeId,
      assessmentTypeId: overView.type.id
    });
  }

  if (overView?.clarification) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateClassification,
      classification: overView.clarification
    });
  }

  if (overView?.bpa?.assetId) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddAssetIds,
      assetIds: [overView.bpa.assetId]
    });
  }

  if (approversPayload.length) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddApprovers,
      approvers: approversPayload
    });
  }

  if (respondentsPayload.length) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddRespondents,
      respondents: respondentsPayload
    });
  }
  const authorId = overView?.author?.userId || overView?.author?.applicationUserId;
  if (authorId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateAuthor,
      author: {
        userId: authorId,
        userType: overView?.author?.userType
      }
    });
  }

  if (!isVendorAssessment) {
    const triggerIds = triggerList
      .filter((t: any) => t.selected)
      .map((t: any) => t.id);

    if (triggerIds.length) {
      commandsPayload.push({
        type: createAssessmentCommandType.AddTriggerIds,
        triggerIds
      });
    }

    if (trigger.reason) {
      commandsPayload.push({
        type: createAssessmentCommandType.UpdateTriggerReason,
        triggerReason: trigger.reason
      });
    }
  }

  const vendorId = overView?.bpa?.vendorId ?? overView?.bpa?.id;
  if (isVendorAssessment && vendorId) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddVendorIds,
      vendorIds: [vendorId]
    });
  }

  return {
    assessmentId: assessmentId || 0,
    commandId: uuidv1(),
    commands: commandsPayload
  };
};

// export const patchTriggers = (fb: FormBuilder, formArray: FormArray, triggers: any[]) => {
//   triggers.forEach(item => {
//     const group = fb.group({
//       id: [item.id || ''],
//       name: [item.name || ''],
//       label: [item.label || ''],
//       regulationId: [item.actId || ''],
//       source: [item.source || ''],
//       selected: [item.selected || false],
//       reason: [item.reason || ''],
//       assessmentTriggerMappingId: [item.assessmentTriggerMappingId || 0],
//       readonly: [item.readonly || false],
//     });
//     // group.get('selected')?.valueChanges.subscribe((checked: boolean) => {
//     //   const reasonCtrl = group.get('reason');
//     //   if (checked) {
//     //     reasonCtrl?.setValidators([Validators.required]);
//     //   } else {
//     //     reasonCtrl?.clearValidators();
//     //     reasonCtrl?.setValue('');
//     //   }
//     //   reasonCtrl?.updateValueAndValidity();
//     // });
//     formArray.push(group);
//   });
// };

export const patchTriggers = (
  fb: FormBuilder,
  formArray: FormArray,
  triggers: any[]
) => {
  const existingMap = new Map(
    formArray.controls.map(c => [c.get('id')?.value, c])
  );

  triggers.forEach(item => {
    const id = item.id ?? item.triggerId;
    const regulationId = item.regulationId ?? item.actId;

    if (!id || !regulationId) return;

    if (existingMap.has(id)) {
      const group = existingMap.get(id) as FormGroup;
      group.patchValue({
        id,
        name: item.name ?? item.triggerName ?? '',
        label: item.label ?? '',
        regulationId,
        source: item.source ?? '',
        selected: !!item.selected,
        reason: item.reason ?? '',
        assessmentTriggerMappingId: item.assessmentTriggerMappingId ?? 0,
        readonly: !!item.readonly
      });
    } else {
      const group = fb.group({
        id: [id],
        name: [item.name ?? item.triggerName ?? ''],
        label: [item.label ?? ''],
        regulationId: [regulationId],
        source: [item.source ?? ''],
        selected: [!!item.selected],
        reason: [item.reason ?? ''],
        assessmentTriggerMappingId: [item.assessmentTriggerMappingId ?? 0],
        readonly: [!!item.readonly]
      });
      formArray.push(group);
    }
  });
};

export const patchQuestionnaire = (fb: FormBuilder, form: FormGroup, data: any) => {
  if (!form) return;

  const assessmentsArray = form.get('assessments') as FormArray;
  assessmentsArray.clear();

  const sections = data.sections || data.assessments;
  if (Array.isArray(sections)) {
    sections.forEach((sectionData: any, i: number) => {
      const sectionGroup = buildSection(fb, {
        order: sectionData.order || i + 1,
        id: sectionData.id,
        section: sectionData.section || sectionData.sectionTitle || sectionData.sectionName || '',
        description: sectionData.description || '',
        totalQuestion: sectionData.totalQuestion || 0,
        questions: (sectionData.questions || []).map((q: any, qIndex: number) => ({
          order: q.order || qIndex + 1,
          id: q.id || 0,
          text: q.questionName || q.text || '',
          type: q.type || '',
          helper: q.helper || '',
          required: !!q.required,
          comment: !!q.comment,
          file: !!q.file,
          numeric: !!q.numeric,
          options: (q.options || []).map((opt: any) => ({
            option: opt.value || opt.option || ''
          }))
        }))
      }, i);

      assessmentsArray.push(sectionGroup);
    });
  }
}

export const patchAssessmentFormForEdit = (
  fb: FormBuilder,
  form: FormGroup,
  data: any
) => {
  // if (!data?.assessment) return;

  const assessment = data._assessmentData;
  const assessmentDetail = data._assessmentDetail;

  const assessmentTemplate = assessment?.templateId ? {
    templateId: assessment.templateId,
    name: assessment?.templateName,
    type: assessment?.assessmentTypeId
  } : '';
  let bpa: any = '';
  let processedFor = '';
  const assessmentProcessedFor = assessment?.processedFor;
  if (assessmentProcessedFor?.bpa?.bpaId) {
    const _bpa = assessmentProcessedFor.bpa;
    bpa = {
      bpaId: _bpa.bpaId,
      name: _bpa?.bpaName
    };
    processedFor = AccessRecord.PROCESSING_ACTIVITY;
  } else if (assessmentProcessedFor?.assets?.length) {
    const asset = assessmentProcessedFor.assets[0];
    bpa = {
      assetId: asset.assetId ?? asset.id,
      name: asset.assetName ?? asset.name
    };
    processedFor = AccessRecord.ASSET;
  } else if (assessmentProcessedFor?.vendors?.length) {
    const vendor = assessmentProcessedFor.vendors[0];
    bpa = {
      vendorId: vendor.vendorId ?? vendor.id,
      id: vendor.id ?? vendor.vendorId,
      name: vendor.vendorName ?? vendor.name
    };
    processedFor = AccessRecord.VENDOR;
  }
  const level1Approver = (assessment?.approverDetails ?? []).filter((level1: any) => level1.level === 1).map((level1: any) => level1.approver);
  const level2Approver = (assessment?.approverDetails ?? []).filter((level2: any) => level2.level === 2).map((level2: any) => level2.approver);
  const level3Approver = (assessment?.approverDetails ?? []).filter((level3: any) => level3.level === 3).map((level3: any) => level3.approver);

  form.get('overview')?.patchValue({
    bpa: bpa || [],
    type: assessmentDetail?.type || [],
    title: assessment?.title || '',
    template: assessmentTemplate || '',
    description: assessment?.description || '',
    author: assessment?.author,
    approver1: level1Approver ?? [],
    approver2: level2Approver ?? [],
    approver3: level3Approver ?? [],
    respondentType: assessmentDetail?.respondentType,
    respondent: assessment?.respondentDetails?.[assessment.respondentDetails.length - 1]?.respondent,
    risk: assessment?.riskMatrix || '',
    completeBy: assessment?.dueDate || '',
    clarification: assessmentDetail?.clarification || '',
    processingFor: processedFor || ''
  });

  form.get('overview')?.get('previousTemplate')?.setValue(assessmentTemplate);

  if (assessment.triggerMappings?.length) {
    const triggerGroup = form.get('trigger') as FormGroup;
    if (!triggerGroup) return;
    const triggers = assessment.triggerMappings || [];
    const actIds = triggers.map((t: any) => t.actId);
    triggerGroup.get('regulation')?.patchValue(actIds.length ? actIds : null);
    const tenpTriggerList = triggerGroup.get('tenpTriggerList') as FormArray;
    tenpTriggerList.clear();

    triggerGroup.get('reason')?.patchValue(
      assessment.triggerReason ?? ''
    );

    triggers.forEach((tr: any) => {
      tenpTriggerList.push(
        fb.group(tr)
      );
    });
  }

  const respondentId = data?._assessmentData?.respondentDetails?.find((a: any) => a.respondent).respondent?.userId
  const authorId = data?._assessmentData?.author?.applicationUserId ?? data?._assessmentData?.author?.userId;
  if (authorId && respondentId && authorId === respondentId) {
    const overview = form.get('overview') as FormGroup;
    overview.get('authorAsRespondent')?.setValue(true, { emitEvent: true });
    overview.get('respondent')?.disable();
    overview.get('respondentType')?.disable();
  }
  const assessmentsArray = form.get('assessments') as FormArray;
  assessmentsArray.clear();
  // const sections = data?._assessmentData?.templateDetails?.sections || [];
  // sections.forEach((section: any, index: number) => {
  //   const sectionGroup = fb.group({
  //     id: [section.id],
  //     order: [section.order || index + 1],
  //     section: [section.sectionName || ''],
  //     description: [section.description || ''],
  //     totalQuestion: [section.totalQuestion || 0],
  //     questions: fb.array(
  //       (section.questions || []).map((q: any, qIndex: number) =>
  //         fb.group({
  //           id: [q.id],
  //           order: [q.order || qIndex + 1],
  //           text: [q.text],
  //           type: [q.type],
  //           helper: [q.helper],
  //           required: [q.required],
  //           comment: [q.comment],
  //           file: [q.file],
  //           numeric: [q.numeric],
  //           options: fb.array(
  //             (q.options || []).map((opt: any) =>
  //               fb.group({
  //                 option: [opt.value || opt.option || '']
  //               })
  //             )
  //           ),
  //           // response details added for edit mode
  //           responseDetails: [q.responseDetails || []],
  //           status: [q.status || '']
  //         })
  //       )
  //     )
  //   });

  //   assessmentsArray.push(sectionGroup);
  // });
};


export const buildAssessmentPayloadForDraft = (createAssessmentFormValue: any, createdDetails: any) => {
  return {
    ...createAssessmentFormValue,
    overview: {
      ...createAssessmentFormValue.overview,
      bpaId: (createAssessmentFormValue.overview?.bpa?.bpaId ?? 0),
      bpaName: (createAssessmentFormValue.overview?.bpa?.name ?? '')
    },
    createdAt: createdDetails?.createdAt ? createdDetails.createdAt : new Date().toISOString(),
    status: '',
    createdBy: createdDetails?.createdBy ?? 0,
  }
}

export const buildEditAssessmentsPayload = (initialFormValue: any, createAssessmentFormValue: any, currentUser: any, assessmentId: any, assessmentService: AssessmentService, isVendorAssessment: boolean = false) => {
  const overView = createAssessmentFormValue.overview || {};
  const template = overView?.template;

  const completeBy = overView?.completeBy
    ? new Date(overView.completeBy).toISOString().split('Z')[0].split('.')[0]
    : null;

  const trigger = createAssessmentFormValue.trigger || {};
  const triggerList = trigger?.triggerList ?? [];

  const currentApprovers = assessmentService.currentApproverList ?? [];

  const approversPayload = [overView.approver1, overView.approver2, overView.approver3]
    .flatMap((approvers, levelIndex) =>
      (Array.isArray(approvers) ? approvers : [])
        .filter((user: any) => user)
        .filter((user: any) => {
          const userId = user.applicationUserId || user.userId;
          return !currentApprovers.some(
            (c: any) =>
              c.level === levelIndex + 1 &&
              c.approver.userId === userId
          );
        })
        .map((user: any) => ({
          level: levelIndex + 1,
          approver: {
            userId: user.applicationUserId || user.userId,
            userType: user.userType
          }
        }))
    );

  const currentRespondents = assessmentService.currentRespondentList ?? [];
  const respondentsPayload = [overView?.respondent || overView?.author]
    .flat()
    .filter(r => r && (r.userId || r.applicationUserId) && !r.respondentMappingId)
    .filter((r: any) => {
      const userId = r.userId || r.applicationUserId;
      return !currentRespondents.some(
        (c: any) => (c.respondent?.userId || c.respondent?.applicationUserId) === userId &&
          c.respondent?.userType === r.userType
      );
    })
    .map((r: any) => ({
      userId: r.userId || r.applicationUserId || currentUser.userId,
      userType: r.userType || currentUser.userType
    }));

  const commandsPayload: any[] = [];

  if (overView.title && overView.title !== initialFormValue.title) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateTitle,
      title: overView.title
    });
  }

  if (overView.description && overView.description !== initialFormValue.description) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateDescription,
      description: overView.description
    });
  }

  if (completeBy && overView?.completeBy !== initialFormValue.dueDate) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateDueDate,
      dueDate: completeBy
    });
  }

  const oldBpaId = initialFormValue?.processedFor?.bpa?.bpaId;
  if (overView?.bpa?.bpaId && overView.bpa.bpaId !== oldBpaId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateBpaId,
      bpaId: overView.bpa.bpaId
    });
  }

  if (overView.risk && overView.risk !== initialFormValue.riskMatrix) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateRiskMatrix,
      riskMatrix: overView.risk
    });
  }

  if (template?.templateId && template.templateId !== initialFormValue.templateId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateTemplateId,
      templateId: template.templateId
    });
  }

  if (overView?.type?.id && overView.type.id !== initialFormValue.assessmentTypeId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateAssessmentTypeId,
      assessmentTypeId: overView.type.id
    });
  }

  if (overView?.clarification && overView.clarification !== initialFormValue.classification) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateClassification,
      classification: overView.clarification
    });
  }

  const oldAssetId = initialFormValue?.processedFor?.bpa?.assetId;
  if (overView?.bpa?.assetId && overView.bpa.assetId !== oldAssetId) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddAssetIds,
      assetIds: [overView.bpa.assetId]
    });
  }
  const authorId = overView?.author?.userId || overView?.author?.applicationUserId;
  const oldAuthorId = initialFormValue?.author?.userId;
  if (authorId && authorId !== oldAuthorId) {
    commandsPayload.push({
      type: createAssessmentCommandType.UpdateAuthor,
      author: {
        userId: authorId,
        userType: overView?.author?.userType
      }
    });
  }

  if (!isVendorAssessment) {
    const tempTriggerList = trigger?.tenpTriggerList ?? [];

    const triggerIds = triggerList
      .filter((t: any) => t.selected)
      .map((t: any) => t.id);

    const newTriggerIds = triggerIds.filter(
      (id: any) => !tempTriggerList.some((old: any) => old.triggerId === id)
    );

    if (newTriggerIds.length && newTriggerIds.length !== initialFormValue.triggerMappings) {
      commandsPayload.push({
        type: createAssessmentCommandType.AddTriggerIds,
        triggerIds: newTriggerIds
      });
    }

    const deletedTriggerMappingIds = tempTriggerList
      .filter((old: any) => !triggerIds.includes(old.triggerId))
      .map((old: any) => old.triggerMappingId ?? old.assessmentTriggerMappingId)
      .filter((id: any) => !!id);

    if (deletedTriggerMappingIds.length) {
      commandsPayload.push({
        type: createAssessmentCommandType.DeleteTriggerIds,
        triggerMappingIds: deletedTriggerMappingIds
      });
    }

    if (trigger.reason && trigger.reason !== initialFormValue.triggerReason) {
      commandsPayload.push({
        type: createAssessmentCommandType.UpdateTriggerReason,
        triggerReason: trigger.reason
      });
    }
  }

  const vendorId = overView?.bpa?.vendorId ?? overView?.bpa?.id;
  if (isVendorAssessment && vendorId) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddVendorIds,
      vendorIds: [vendorId]
    });
  }

  const oldApprovers = (initialFormValue?.approverDetails || []).map((a: any) => ({
    level: a.level,
    userId: a.approver.userId
  }));
  const newApprovers = (approversPayload || []).map((a: any) => ({
    level: a.level,
    userId: a.approver.userId
  }));
  const hasNewApprovers = newApprovers.some(
    (n: any) =>
      !oldApprovers.some(
        (o: any) => o.level === n.level && o.userId === n.userId
      )
  );
  if (hasNewApprovers) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddApprovers,
      approvers: approversPayload
    });
  }

  const oldRespondents = (initialFormValue?.respondentDetails || []).map(
    (r: any) => r.respondent.userId
  );
  const newRespondents = (respondentsPayload || []).map(
    (r: any) => r.userId
  );
  const hasNewRespondents = newRespondents.some(
    (id: any) => !oldRespondents.includes(id)
  );
  if (hasNewRespondents) {
    commandsPayload.push({
      type: createAssessmentCommandType.AddRespondents,
      respondents: respondentsPayload
    });
  }

  // Respondent delete
  if (assessmentService.currentRespondentList?.length) {
    const deletedRespondentList: any[] = [];
    const respondent = overView?.respondent ?? null;

    assessmentService.currentRespondentList.forEach((user: any) => {
      const r = user.respondent;
      const userId = r.userId || r.applicationUserId;

      const userExist = respondent
        ? (respondent.userId || respondent.applicationUserId) === userId &&
        respondent.userType === r.userType
        : false;

      if (!userExist) {
        deletedRespondentList.push(user.respondentMappingId);
      }
    });

    if (deletedRespondentList.length) {
      commandsPayload.push({
        type: createAssessmentCommandType.DeleteRespondents,
        respondentMappingIds: deletedRespondentList
      });
    }
  }

  // Approver delete
  if (assessmentService.deletedApproverList?.length) {
    commandsPayload.push({
      type: createAssessmentCommandType.DeleteApprovers,
      approverMappingIds: assessmentService.deletedApproverList
    });
  }

  return {
    assessmentId: assessmentId || 0,
    commandId: uuidv1(),
    commands: commandsPayload
  };
};


export const buildDeleteAssessmentCommand = (assessmentId: number) => {
  const deleteCommand = {
    commandId: uuidv1(),
    commands: [
      {
        type: createAssessmentCommandType.DeleteAssessment,
        assessmentId: assessmentId
      }
    ]
  }
  return deleteCommand
}


export const buildApproveQuestionResponseCommand = (questionId: number) => {
  const command = {
    commandId: uuidv1(),
    commands: [
      {
        type: createAssessmentCommandType.ApproveQuestionResponse,
        questionId: questionId
      }
    ]
  }
  return command
}

export const buildAssessmentActionUpdateCommand = (action: string, reason: string = '') => {
  const command = {
    commandId: uuidv1(),
    commands: [
      {
        type: createAssessmentCommandType.PerformAssessmentAction,
        action: action,
        reason: reason
      }
    ]
  }
  return command
}

export const statusColors = (status: string): string => {
  switch (status) {
    case AssessmentStatus.OPEN:
      return `#FFF4E5`;
    case AssessmentStatus.IN_PROGRESS:
      return `#E5F6FD`;
    case AssessmentStatus.UNDER_REVIEW:
      return `#D8E7FF`;
    case AssessmentStatus.PENDING_APPROVAL:
      return `#FFF4E5`;
    case AssessmentStatus.APPROVED:
      return `#EDF7ED`;
    case AssessmentStatus.COMPLETED:
      return `#EDF7ED`;
    case AssessmentStatus.CANCELLED:
      return `#FFDAD6`;
    default:
      return `#FFF4E5`;
  }
};

export const statusTextColors = (status: string): string => {
  switch (status) {
    case AssessmentStatus.OPEN:
      return `#663C00`;
    case AssessmentStatus.IN_PROGRESS:
      return `#014361`;
    case AssessmentStatus.UNDER_REVIEW:
      return `#0E1962`;
    case AssessmentStatus.PENDING_APPROVAL:
      return `#663C00`;
    case AssessmentStatus.APPROVED:
      return `#1E4620`;
    case AssessmentStatus.COMPLETED:
      return `#1E4620`;
    case AssessmentStatus.CANCELLED:
      return `#410002`;
    default:
      return `#EDF7ED`;
  }
};
