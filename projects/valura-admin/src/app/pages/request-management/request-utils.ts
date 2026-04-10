import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { WidgetTypeString } from "@admin-core/constants/widget-types";
import { RequestLockType, Status } from "./constant";
import { DsrDetails, DsrRequest, DsrRequestDetails, RequestDataFulfillmentRecords, RequestDocuments, ValidationQuestion, ValidationSection } from "@admin-core/models/request-management/DsrRequest";

export const formatStatus = (status: string): string => {
    return status?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

export const displayStatusText = (status: string): string => {
    if (!status) return '';
    const formatted = status?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    const parts = formatted.split(' ');
    return parts[parts.length - 1];
}

export const statusColors = (status: string): string => {
    switch (status) {
        case Status.ESCALATED:
            return `#D8E7FF`;
        case Status.OPEN:
            return `#FFF4E5`;
        case Status.IN_PROGRESS:
            return `#E5F6FD`;
        case Status.REJECTED:
            return `#FFDAD6`;
        case Status.COMPLETED:
            return `#EDF7ED`;
        case Status.CANCELLED:
            return `#FFDAD6`;
        case Status.DRAFT:
            return `#FFF4E5`;
        case Status.ON_HOLD:
            return `#D8E7FF`
        case Status.ACTIVE:
            return `#D8E7FF`;
        case Status.APPROVED:
            return `#EDF7ED`;
        case Status.PENDING:
            return `#FFF4E5`;
        default:
            return `#FFF4E5`;
    }
}

export const statusTextColors = (status: string): string => {
    switch (status) {
        case Status.ESCALATED:
            return `#0E1962`;
        case Status.OPEN:
            return `#663C00`;
        case Status.IN_PROGRESS:
            return `#014361`;
        case Status.REJECTED:
            return `#410002`;
        case Status.COMPLETED:
            return `#1E4620`;
        case Status.CANCELLED:
            return `#410002`;
        case Status.DRAFT:
            return `#663C00`;
        case Status.ON_HOLD:
            return `#0E1962`
        case Status.ACTIVE:
            return `#014361`;
        case Status.IN_ACTIVE:
            return `#410002`;
        case Status.APPROVED:
            return `#1E4620`;
        case Status.PENDING:
            return `#663C00`;
        default:
            return `#EDF7ED`;
    }
}

export const buildDocumentAttachmentForm = (fb: FormBuilder, document: RequestDocuments | null = null) => {
    let form: FormGroup = fb.group({
        documentName: new FormControl(document?.name ?? '', [Validators.required]),
        description: new FormControl(document?.description ?? ''),
        documentRequired: new FormControl(document?.documentRequired ?? ''),
    });
    return form;
};

export const buildRequestForm = (fb: FormBuilder, validationQuestionList: any = []) => {

    let form: FormGroup = fb.group({
        verification: fb.group({
            documentAttachment: fb.array([]),
            notes: fb.group({
                title: new FormControl('', [Validators.required]),
                description: new FormControl(''),
            })
        }),
        requestValidation: fb.group({
            validationSectionList: fb.array([]),
            documentReviewed: new FormControl('', [Validators.required]),
        }),
        dataRecovery: fb.group({}),
        requestFulfillment: fb.group({
            requestRid: new FormControl(''),
            parentTaskId: new FormControl(''),
            dataFullFillmentRecords: fb.array([]),
            requestFulfillmentVerified: new FormControl('', [Validators.required]),
        }),
        auditClose: fb.group({}),
    });
    return form;
}


export const buildValidationFormArray = (fb: FormBuilder, validationSection: ValidationSection, stageCompleted: boolean = false) => {
    const questions = validationSection.validationQuestions ?? [];

    const validQuestions = questions.filter((q: any) => {
        const hasText = q?.question?.trim().length > 0;
        const hasOptions = Array.isArray(q?.optionName) && q.optionName.some((opt: any) => !!opt?.trim());
        return hasText || hasOptions;
    });

    let form: FormGroup = fb.group({
        validationQuestions: fb.array(validationSection.validationQuestions.map((question: any) => buildValidationForm(fb, question, stageCompleted))),
        sectionName: [validationSection.sectionName],
        showSectionName: [validQuestions.length > 0],
    })
    return form
};

export const buildValidationForm = (
    fb: FormBuilder,
    question: ValidationQuestion,
    stageCompleted: boolean = false
) => {
    let questionType = question.questionType;
    // ? question.questionType.toLowerCase()
    // : question.questionType;

    let optionName = (question.optionName ?? []).map(option => {
        return option.toLowerCase();
    }); // VAL-422

    let questionForm: FormGroup = fb.group({
        id: [question.id],
        question: [question.question],
        optionName: [optionName],
        questionType: [questionType],
        typeOfOptions: [question.typeOfOptions],
        legalReferenceJson: [question.legalReferenceJson],
        shouldDisplayChildQuestion: [question.shouldDisplayChildQuestion],
        helper: [question.helper ?? ''],
        provision: [question.provision ?? '']
    });

    switch (questionType) {
        case WidgetTypeString.RADIO_BUTTON: {
            questionForm.addControl('answer', new FormControl({ value: question?.answer ?? '', disabled: stageCompleted }, [Validators.required]));
            questionForm.addControl('remarks', new FormControl({ value: question?.remarks ?? '', disabled: stageCompleted }));
            return questionForm;
        }
        case WidgetTypeString.TEXT_FIELD:
        case WidgetTypeString.TEXT_AREA: {
            questionForm.addControl('answer', new FormControl({ value: question?.answer ?? '', disabled: stageCompleted }, []));
            questionForm.addControl('remarks', new FormControl({ value: question?.remarks ?? '', disabled: stageCompleted }));
            return questionForm;
        }
        default: {
            questionForm.addControl('answer', new FormControl({ value: question?.answer ?? '', disabled: stageCompleted }, []));
            questionForm.addControl('remarks', new FormControl({ value: question?.remarks ?? '', disabled: stageCompleted }));
            return questionForm;
        }
    }
};

export const buildDataFullFillmentForm = (fb: FormBuilder, data: RequestDataFulfillmentRecords | null = null) => {
    let form: FormGroup = fb.group({
        recordId: new FormControl(data?.id ?? 0),
        selected: new FormControl(data?.selected ?? ''),
        attributes: new FormControl(data?.name ?? '', [Validators.required]),
        category: new FormControl(data?.category ?? '', [Validators.required]),
        foundIn: new FormControl(data?.foundIn ?? '', [Validators.required]),
        purposes: new FormControl(data?.purpose ?? '', [Validators.required]),
        exempted: new FormControl(data?.exempted ?? '', [Validators.required]),
        justification: new FormControl(data?.justification ?? '', [Validators.required]),
        actions: new FormControl(data?.actions ?? '', [Validators.required]),
        approved: new FormControl(data?.approved ?? false, []),
        readOnly: new FormControl(true, [Validators.required]),
        actionReadOnly: new FormControl(false, [Validators.required]),
        approvalRequired: new FormControl(data?.approvalRequired ?? false, []),
    });
    return form;
};

export const recipientDetails = (dsrRequestDetails: DsrRequestDetails | null) => {
    const recipientEmail = dsrRequestDetails?.dsrFormRequestedUserDetails?.pid ?? '';
    let userName = ''
    const dsrDetails = dsrRequestDetails?.dsrDetails;
    if (dsrDetails?.isRequestedByThirdParty) {
        userName = `${dsrDetails?.thirdPartyFirstName ? `${dsrDetails.thirdPartyFirstName} ${dsrDetails.thirdPartyLastName ? dsrDetails.thirdPartyLastName : ``}` : ``}`;
    }
    else {
        userName = `${dsrDetails?.firstPartyFirstName ? `${dsrDetails.firstPartyFirstName} ${dsrDetails.firstPartyLastName ? dsrDetails.firstPartyLastName : ``}` : ``}`;
    }
    return { recipientEmail, dataSubjectName: userName ?? '' }
}

export const requestLockMessage = (dsrRequest: DsrRequest | DsrDetails | null) => {
    switch (dsrRequest?.lockType) {
        case RequestLockType.SPECIAL_DELETION:
            return `This request has been kept on hold for 2 days!`;
        case RequestLockType.DS_APPROVAL_PENDING:
            return `DS/Third Party has not agreed to the request!`;
        default:
            return ``;
    }
}

export const requestDetailLockMessage = (dsrRequest: DsrRequestDetails | null) => {
    return dsrRequest?.dsrDetails?.isLocked ? requestLockMessage(dsrRequest?.dsrDetails ?? null) :
        (dsrRequest?.specialDeletionCase ? `This request will be kept on hold for 2 days!` : ``);
}
