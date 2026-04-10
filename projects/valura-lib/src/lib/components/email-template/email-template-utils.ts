import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApiHelperService } from "@admin-coreservices/network/api-helper.service";
import { ViewTypeDialogConfig } from "@admin-coremodels/request-management/ViewTypeDialogConfig";
import { EmailTemplateId, EmailTriggerEvent, openTemplateVariables } from "@admin-coreconstants/email-template-constants";
import moment from "moment";

export const buildEmailTemplateForm = (fb: FormBuilder, emailTemplate: any | null = null) => {
    let form: FormGroup = fb.group({
        subject: ['', Validators.required],
        content: ['', Validators.required],
        outerHtmlContent: [''],
        recipientEmail: [{ value: '', disabled: true }]
    });
    return form;
};

export const getEmailTemplate = async (apiHelperService: ApiHelperService, data: ViewTypeDialogConfig) => {
    let templateObject = null
    try {
        const res = await apiHelperService.getEmailTemplateById(data.templateId);
        if (res) {
            const template = { ...res.template, templateVariables: res.templateVariables }
            const processedSubject = replaceTemplateVariables(template, true, data);
            const processedContent = replaceTemplateVariables(template, false, data, processedSubject);

            const templateData = {
                subject: processedSubject,
                content: processedContent,
                recipientEmail: data.emailTemplateData?.recipientEmail || 'user@example.com'
            }

            const renderedContent = updateRenderedContent(templateData, data);
            templateObject = { template, templateData, renderedContent }
        }
    }
    catch (error) {
        console.error('Error loading email template:', error);
    } finally {
        return templateObject
    }
}

export const replaceTemplateVariables = (templateData: any, isSubject: boolean = false, data: ViewTypeDialogConfig, subjectValue: string = '',): string => {
    let text: string = isSubject ? templateData.subject || 'Decision on Your Data Request' : (templateData.body || templateData.content);
    if (!text) return '';
    // Remove title tags from content (not subject)
    if (!isSubject) {
        text = text.replace(/<title>.*?<\/title>/gis, '');
    }



    const baseVariables = prepareBaseVariables(templateData, data)

    let result = text;

    Object.entries(baseVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        if (isSubject) {
            result = result.replace(regex, value);
        } else {
            result = result.replace(regex, `${openTemplateVariables.includes(key) ? value : `<span class="${valueHasVariable(value) ? 'edit-variable' : 'template-variable'}" data-variable="${key}" contenteditable="false">${value}</span>`}`);
        }
    });

    // Only replace {{SUBJECT}} if we're not processing the subject itself
    if (!isSubject) {
        const subjectToUse = subjectValue || templateData.subject || '';
        const subjectRegex = new RegExp(`{{SUBJECT}}`, 'g');
        result = result.replace(subjectRegex, subjectToUse);
    }

    return result;
}

export const updateRenderedContent = (templateData: any, data: ViewTypeDialogConfig) => {
    const processedSubject = replaceTemplateVariables(templateData, true, data);
    const renderedContent = replaceTemplateVariables(templateData, false, data, processedSubject);
    return renderedContent
}

export const getFinalEmailContent = (emailContent: string, protectedVariables: string[], outerHtmlContent: string) => {
    let content = emailContent;
    // Remove template variable spans and keep only the content
    protectedVariables.forEach(variable => {
        const regex = new RegExp(`<span class="(.*?)" data-variable="${variable}" contenteditable="false">(.*?)</span>`, 'g');
        content = content.replace(regex, '$2');
    });
    if (outerHtmlContent) {
        const finalBody = replaceBodyContent(outerHtmlContent, content)
        return finalBody
    }
    return content;
}

export const getEmailPayload = (notifyTo: string, subject: string, body: string) => {
    return {
        'notificationData': {
            'notifyTo': notifyTo,
            'subject': subject,
            'body': body
        }
    }
}

export const prepareBaseVariables = (templateData: any, data: ViewTypeDialogConfig) => {
    let baseVariables: object = {
        'RequestId': data.requestId || 'REQ-001',
        'DataSubjectName': data.emailTemplateData.dataSubjectName || 'User',
    }
    if (data.templateId === EmailTriggerEvent.DSR_REQUEST_REJECTED) {
        const currentRemarks = data.remarks
        baseVariables = {
            ...baseVariables,
            'RequestType': data.typeOfRequest || 'Data Request',
            'Reason': currentRemarks || '{{Reason}}'
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_DEADLINE_EXTENDED) {
        const currentRemarks = data.remarks
        baseVariables = {
            ...baseVariables,
            'RequestType': data.typeOfRequest || 'Data Request',
            'Remarks': currentRemarks || '{{Remarks}}',
            'RequestResolutionDate': data.extensionDays
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_FULFILLED) {
        baseVariables = {
            ...baseVariables,
            'RightName': data.typeOfRequest || '{{RightName}}',
            'CompletionDetails': data.completionDetails || '{{CompletionDetails}}',
            'DeliveryMethod': data.deliveryMethod || '{{DeliveryMethod}}',
            'ExemptionBasis': data.exemptionBasis || '{{ExemptionBasis}}',
            'DataProtectionAuthority': data.dataProtectionAuthority || '{{DataProtectionAuthority}}',
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_DATA_MAPPING_COMPLETED) {
        baseVariables = {
            ...baseVariables,
            'DataSubjectName': data.emailTemplateData.dataSubjectName || '{{DataSubjectName}}',
            'RequestType': data.typeOfRequest || '{{RequestType}}',
            'RequestDescription': data.completionDetails || '{{RequestDescription}}',
        }
    }
    else if (data.templateId === EmailTemplateId.GRIEVANCE_RESOLUTION) {
        const today = moment().format('DD/MM/YYYY');
        baseVariables = {
            ...baseVariables,
            'SubmissionDate': today || '{{SubmissionDate}}',
            'LawReference': data.lawReference || '{{LawReference}}',
            'ComplaintDescription': data.complaintDescription || '{{ComplaintDescription}}',
            'ResolutionSummary': data.resolutionSummary || '{{ResolutionSummary}}',
            'DataProtectionAuthority': data.dataProtectionAuthority || '{{DataProtectionAuthority}}',
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_CLOSED) {
        const today = moment().format('DD/MM/YYYY');
        baseVariables = {
            ...baseVariables,
            'DataSubjectName': data.emailTemplateData.dataSubjectName || '{{DataSubjectName}}',
            'RequestType': data.typeOfRequest || '{{RequestType}}',
            'RequestDescription': data.completionDetails || '{{RequestDescription}}',
            'SubmissionDate': today || '{{SubmissionDate}}',
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_DS_IDENTITY_VERIFIED) {

        baseVariables = {
            ...baseVariables,
            'RequestType': data.typeOfRequest || 'Data Request',
            'AdditionalInformation': '{{AdditionalInformation}}',
            'DaysToRespond': '{{DaysToRespond}}',
        }
    }
    else if (data.templateId === EmailTemplateId.ADDITIONAL_DETAILS_NEEDED) {

        baseVariables = {
            ...baseVariables,
            'RequestType': data.typeOfRequest || 'Data Request',
            'AdditionalInformation': '{{AdditionalInformation}}',
            'DaysToRespond': '{{DaysToRespond}}',
        }
    }
    else if (data.templateId === EmailTriggerEvent.DSR_REQUEST_VALIDATED) {
        const today = moment().format('DD/MM/YYYY');
        const requestedDate = moment(data.dsrRequestDetails.dsrDetails.requestedOn).format('DD/MM/YYYY');
        baseVariables = {
            ...baseVariables,
            'RequestType': data.typeOfRequest || 'Data Request',
            'RequestedOn': requestedDate || '{{RequestedOn}}',
            'ValidationDate': today,
            'PrivacyContactEmail': data.dsrRequestDetails?.assigneeDetails?.email || '{{PrivacyContactEmail}}'
        }
    }
    return baseVariables
};

export const replaceBodyContent = (html: any, content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.body.innerHTML = content;
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

const valueHasVariable = (content: string) => {
    const isWrapped = /^\{\{[^}]+\}\}$/.test(content);
    return isWrapped
}