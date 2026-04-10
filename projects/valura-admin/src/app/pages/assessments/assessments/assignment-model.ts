import { AssessmentType } from "@admin-core/models/assessment/assessment";

export interface AssessmentApiResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: AssessmentData;
  error: any;
}

export interface AssessmentData {
  regulationList: any[];
  id: number;
  title: string;
  description: string;
  assessmentTypeId: number;
  templateId: number;
  templateName: string;
  assessmentType: AssessmentType;

  classification: string;
  riskMatrix: string;

  dueDate: string;
  assessmentAge: number;

  uuid: string;

  author: Author;

  status: string;
  state: string;
  triggerReason: string;

  createdAt: string;

  bpaId: number;
  bpaName: string;

  assessmentTaskCount: number;
  assessmentTaskSummary: TaskSummary;
  assessmentQuestionSummary: TaskSummary

  riskSummary: RiskSummary;
  totalRiskCount: number;

  processedFor: ProcessedFor;

  approverDetails: ApproverDetail[];
  respondentDetails: RespondentDetail[];

  triggerMappings: TriggerMapping[];

  risks: any[];
  assessmentLink: string
  approver: boolean;
  approvalRequested: boolean
  needsAction: any
  selfRespondent: boolean

  respondentType: string
  processingFor: string
  isApprover: boolean
  isAuthor: boolean
  isRespondent: boolean
}


export interface Author {
  userId: number;
  userType: string;
  displayName: string;
  email: string
}

export interface TaskSummary {
  PENDING: number;
  COMPLETED: number;
  ANSWERED: number;
}

export interface RiskSummary {
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
}

export interface ProcessedFor {
  assets: any[];
  bpa: {
    bpaId: number;
    bpaName: string;
  };
}

export interface ApproverDetail {
  approverMappingId: number;
  approver: UserRef;
  status: string;
  approvedAt: string;
  rejectedAt: string;
  comment: string;
  level: number;
  displayName: string;
}

export interface RespondentDetail {
  respondentMappingId: number;
  respondent: UserRef;
  displayName: string;
}

export interface UserRef {
  userId: number;
  userType: string;
  displayName: string;
}

export interface TriggerMapping {
  triggerId: number;
  triggerMappingId: number;
}

export interface Assessment {
  id: number;
  name: string;
  bpaName: string;
  status: string;
  createdOn: string;
  trigger: AssessmentTrigger[];
  owner: any;
  dueDate: string;
  totalApprovers: number;
  riskMatrix: string;
  description: string;
  daysLeft: string;
  updatedAt: string;
  assessmentLink: string;
  approvers: Approver[];
  respondents: Approver[];
  approver: boolean;
  approvalRequested: boolean
  needsAction: {
    actionType: string[]
  }
  selfRespondent: boolean;
  assessmentType: AssessmentType
  assessmentTypeId: number;
}

export interface Approver {
  userId: number;
  userType: string;
  displayName: string;
}

export interface TemplateDetails {
  template: Template;
  sections: SectionWrapper[];
}

export interface RiskDetails {
  highRiskCount: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  risks: any;
  totalRiskCount: number;
}

export interface Template {
  templateId: any;
  name: string;
  type: number;
  assessmentType: AssessmentType
  description: string;
  status: string;
  createdOn: string;
  createdBy: number;
}

export interface TemplateDetail {
  sections: Section[];
  template: Template;
  totalSection: number
  totalQuestion: number
}

export interface SectionWrapper {
  sections: Section;
}

export interface Section {
  id: number;
  sectionName: string;
  totalQuestion: number;
  questions: Question[];
  order: number;
  expanded: boolean
}

export interface Question {
  id: number;
  comment: boolean;
  file: boolean;
  helper: string;
  numeric: boolean;
  options: Option[];
  required: boolean;
  text: string;
  type: string;
}

export interface Option {
  value: string;
  saved: boolean;
}

export interface AssessmentTrigger {
  assessmentTriggerMappingId: number,
  triggerId: number,
  selectionReason: string
}