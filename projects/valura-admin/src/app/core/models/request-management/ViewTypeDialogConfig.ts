import { DsrRequestDetails, ExtensionDetails, ValidationQuestion } from "./DsrRequest";

export interface ViewTypeDialogConfig {
  dialogType: string;
  requestId: string;
  dialogTitle: string;
  positiveButtonLabel: string;
  negativeButtonLabel: string;

  extensionDetails: ExtensionDetails;
  eventName?: string;
  stage?: string;
  validationQuestions?: ValidationQuestion[];
  dsrRequestDetails: DsrRequestDetails;
  emailTemplateData: {
    recipientEmail: string;
    dataSubjectName: string;
    taskTitle?: string; // Add optional properties for task-related data
    taskDescription?: string;
    dueDate?: string;
    stage?: string;
  };

  event: string;
  cancelRequest?: boolean;
  remarks: string
  typeOfRequest: string
  templateId: string
  extensionDays: number
  deliveryMethod: string
  exemptionBasis: string
  dataProtectionAuthority: string
  completionDetails: string
  submissionDate: string
  lawReference: string
  complaintDescription: string
  resolutionSummary: string
  taskAction?: string
  displayMessage?: string
}
