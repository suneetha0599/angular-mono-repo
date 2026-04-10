import { WidgetTypeString } from '@admin-coreconstants/widget-types';

export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'CREATED_AT';
export const HEADER_ACTION = 'ACTION';
export const HEADER_ID = 'HEADER_ID';
export const HEADER_DESCRIPTION = 'HEADER_DESCRIPTION';
export const HEADER_HOSTING_TYPE = 'HEADER_HOSTING_TYPE';
export const HEADER_AGE = 'HEADER_AGE';
export const HEADER_TRIGGER = 'HEADER_TRIGGER';
export const BPA_NAME = 'BPA_NAME';
export const OWNER_NAME = 'OWNER_NAME';
export const DETAILS = 'DETAILS'
export const QUESTION_AND_RESPONSE = 'QUESTION_AND_RESPONSE'
export const TASKS = 'TASKS'
export const RISK_AND_MEASURES = 'RISK_AND_MEASURES'
export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;

export const ACTIVITY = {
  ACTOR_SYSTEM: 'System',
  ACTOR_USER: 'User',
  ACTOR_DS: 'DS',
  ACTOR_THIRD_PARTY: 'Third Party'
}

export const APPROVER_COLUMNS = [
  { columnDef: 'name', header: 'Approver Name', width: "100px" },
  { columnDef: 'status', header: 'Status', width: "50px" },
  { columnDef: 'dateOfApproval', header: 'Date of Approval', width: "100px" },
  { columnDef: 'comment', header: 'Comments', width: "200px" },
  { columnDef: 'actions', header: 'Actions', width: "90px" },
];

export enum AssessmentDetailsKey {
  DETAILS = "DETAILS",
  QUESTION_AND_RESPONSE = "QUESTION_AND_RESPONSE",
  RISK_AND_MEASURES = "RISK_AND_MEASURES",
  TASKS = "TASKS",
  DISCUSSION_LOG = "DISCUSSION_LOG",
  APPROVERS = "APPROVERS",
  RELATED_ASSESSMENT = "RELATED_ASSESSMENT",
  ACTIVITY_LOG = "ACTIVITY_LOG"
}

export const TAB_HEADER_DETAILS = [
  { key: AssessmentDetailsKey.DETAILS, name: 'Details' },
  { key: AssessmentDetailsKey.QUESTION_AND_RESPONSE, name: 'Question & Response' },
  { key: AssessmentDetailsKey.DISCUSSION_LOG, name: 'Discussion Log' },
  { key: AssessmentDetailsKey.RISK_AND_MEASURES, name: 'Risk & Measures' },
  { key: AssessmentDetailsKey.TASKS, name: 'Tasks' },
]

export const APPROVAL_TAB_HEADER_DETAILS = [
  { key: AssessmentDetailsKey.APPROVERS, name: 'Approvals' },
]

export const OTHER_TAB_HEADER_DETAILS = [
  { key: AssessmentDetailsKey.RELATED_ASSESSMENT, name: 'Related Assessment' },
  { key: AssessmentDetailsKey.ACTIVITY_LOG, name: 'Activity Log' },
]

export enum ASSESSMENT_MODE {
  EDIT = 'EDIT',
  VIEW = 'VIEW'
}

export const CREATE_ASSET_STEP2_HEADER = [
  { key: '', headerName: 'ID', sortable: false, filter: false, columnDef: 'id' },
  { key: HEADER_NAME, headerName: 'Category', sortable: false, filter: false, columnDef: 'categoryName' },
  { key: '', headerName: 'Department', sortable: false, filter: false, columnDef: 'departmentName' },
  { key: '', headerName: 'Type', sortable: false, filter: false, columnDef: 'type' },
  { key: '', headerName: 'Purpose', sortable: false, filter: false, columnDef: 'purpose' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
]

export const BPA_DETAIL_HEADER = [
  { key: '', headerName: 'ID', sortable: false, filter: false, columnDef: 'id' },
  { key: HEADER_NAME, headerName: 'Business process name', sortable: false, filter: false, columnDef: 'name' },
  { key: HEADER_STATUS, headerName: 'Risk', sortable: false, filter: false, columnDef: 'risk' },
  { key: '', headerName: 'Process owner', sortable: false, filter: false, columnDef: 'owner' },
  { key: '', headerName: 'Associated Department', sortable: false, filter: false, columnDef: 'department' },
  { key: '', headerName: ' DS involved', sortable: false, filter: false, columnDef: 'dsInvolved' },
]

export const ASESSMENT_TASK_HEADER = [
  { columnDef: 'taskId', headerName: 'Task ID', sortable: true },
  { columnDef: 'taskType', headerName: 'Task Type', sortable: true },
  { columnDef: 'title', headerName: 'Title', sortable: true },
  // { columnDef: 'description', headerName: 'Description', sortable: true },
  { columnDef: 'assignedTo', headerName: 'Assigned To', sortable: true },
  { columnDef: 'status', headerName: 'Status', sortable: true },
  { columnDef: 'dueDate', headerName: 'Due Date', sortable: true },
  { columnDef: 'priority', headerName: 'Priority', sortable: true },
  { columnDef: 'action', headerName: 'Action', sortable: false },
];

export enum CreateAssetStep2 {
  RECIPIENT = "RECIPIENT",
  SOURCE = "SOURCE",
  STORAGE_AND_HOSTING_LOCATION = "STORAGE_AND_HOSTING_LOCATION",
  DATA_SUBJECT_ELEMENT = "DATA_SUBJECT_ELEMENT"
}

export const CREATE_ASSET_STEP2_TAB = [
  { id: 1, key: CreateAssetStep2.RECIPIENT, label: "Recipient" },
  { id: 2, key: CreateAssetStep2.SOURCE, label: "Source" },
  { id: 3, key: CreateAssetStep2.STORAGE_AND_HOSTING_LOCATION, label: "Storage and Hosting Location" },
  { id: 4, key: CreateAssetStep2.DATA_SUBJECT_ELEMENT, label: "Data Subject & Elements" }
]



//temp data
export const PDElementsData: any = [
  { id: 1, categoryName: 'Internal Department', departmentName: 'Finance', type: 'Internal', purpose: 'Hiring workflows' },
  { id: 2, categoryName: 'IT Service Providers', departmentName: 'Email hosting vendors', type: 'External', purpose: 'Storage & compute' },
  { id: 3, categoryName: 'Payment Processors', departmentName: 'Stripe', type: 'External', purpose: 'Payment' },
  { id: 4, categoryName: 'Recruitment Partners', departmentName: 'LinkedIn Recruiter', type: 'External', purpose: 'Hiring workflows' },
]

export const mockBpaData: any = [
  { id: 1, name: 'Recruitment Process', risk: 'Low', owner: 'Alex Morgan', department: 'Human resource', dsInvolved: '0–100' },
  { id: 2, name: 'Employee onboarding', risk: 'Medium', owner: 'Jordan Lee', department: 'Human resource', dsInvolved: '100–200' },
  { id: 3, name: 'Employee Payroll Processing', risk: 'High', owner: 'Taylor Smith', department: 'Accounts', dsInvolved: '1000+' },
  { id: 4, name: 'Marketing campaign', risk: 'Critical', owner: 'Jamie Chen', department: 'Sales', dsInvolved: '500–1000' },
  { id: 5, name: 'Health and wellness', risk: 'Critical', owner: 'Casey Johnson', department: 'Human resource', dsInvolved: '100–500' }
];



export const THIRD_PARTY = 'THIRD_PARTY';




export const ALL = "ALL"
export const PRIORITY = "PRIORITY"
export const OPEN = "OPEN"
export const DRAFTS = "DRAFTS"

export const ASSESSMENT_DOWNLOAD_ALL_COLUMNS = [
  { key: 'assessmentId', label: 'Assessment ID' },
  { key: 'assessmentName', label: 'Assessment Name' },
  { key: 'assessmentAge', label: 'Assessment Age' },
  { key: 'status', label: 'Status' },
  { key: 'state', label: 'State' },
  { key: 'createdOn', label: 'Created On' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'assessmentTypeId', label: 'Assessment Type ID' },
  { key: 'ownerUserId', label: 'Owner User ID' },
  { key: 'ownerUserType', label: 'Owner User Type' },
  { key: 'bpaId', label: 'BPA ID' },
  { key: 'bpaName', label: 'BPA Name' },
  { key: 'departmentId', label: 'Department ID' },
  { key: 'assets', label: 'Assets' },
  { key: 'vendors', label: 'Vendors' },
];

const VENDOR_EXCLUDED_KEYS = ['assets', 'bpaId', 'bpaName'];
const ASSESSMENT_EXCLUDED_KEYS = ['vendors'];

export const ASSESSMENT_DOWNLOAD_COLUMNS = ASSESSMENT_DOWNLOAD_ALL_COLUMNS.filter(
  c => !ASSESSMENT_EXCLUDED_KEYS.includes(c.key)
);

export const VENDOR_DOWNLOAD_COLUMNS = ASSESSMENT_DOWNLOAD_ALL_COLUMNS.filter(
  c => !VENDOR_EXCLUDED_KEYS.includes(c.key)
);


export const ASSESSMENT_HEADER = [
  { key: '', headerName: ' Assessment ID', sortable: true, filter: false, columnDef: 'id' },
  { key: HEADER_NAME, headerName: 'Name', sortable: true, filter: false, columnDef: 'name', maxWidth: '180px' },
  { key: '', headerName: 'Access the Record', sortable: false, filter: false, columnDef: 'processedFor' },
  //  Assessment ID, Name,  Access the Record, Author, Assessment Age, Created on, Due Date, Status, Action
  // { key: BPA_NAME, headerName: 'Linked BPA', sortable: true, filter: false, columnDef: 'bpaName', maxWidth: '150px', },
  { key: OWNER_NAME, headerName: 'Author', sortable: false, filter: false, columnDef: 'owner' },
  { key: HEADER_AGE, headerName: ' Assessment Age', sortable: true, filter: false, columnDef: 'assessmentAge' },
  { key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn' },
  { key: HEADER_DATE, headerName: 'Due Date', sortable: true, filter: false, columnDef: 'dueDate' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: false, columnDef: 'status' },
  // { key: HEADER_TRIGGER, headerName: 'Trigger', sortable: true, filter: false, columnDef: 'trigger' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export const ASSESSMENT_DRAFT_HEADER = [
  { key: HEADER_NAME, headerName: 'Name', sortable: true, filter: false, columnDef: 'name', maxWidth: '180px' },
  { key: '', headerName: 'Access the Record', sortable: true, filter: false, columnDef: 'processingFor' },
  // { key: '', headerName: 'Linked BPA', sortable: true, filter: false, columnDef: 'bpaName', maxWidth: '150px', },
  { key: OWNER_NAME, headerName: 'Author', sortable: true, filter: false, columnDef: 'owner' },
  { key: HEADER_AGE, headerName: ' Assessment Age', sortable: true, filter: false, columnDef: 'assessmentAge' },
  { key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn' },
  { key: HEADER_DATE, headerName: 'Due Date', sortable: true, filter: false, columnDef: 'dueDate' },
  // { key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: false, columnDef: 'status' },
  // { key: HEADER_TRIGGER, headerName: 'Trigger', sortable: true, filter: false, columnDef: 'trigger' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];




export const REQUEST_MANAGEMENT_DATA_SUBJECT_DETAIL = [
  { key: '', headerName: 'Request ID', sortable: true, filter: false, columnDef: 'formId' },
  { key: HEADER_NAME, headerName: 'Name', sortable: false, filter: false, columnDef: 'name' },
  { key: '', headerName: 'Through', sortable: false, filter: false, columnDef: 'requestedBy' },
  { key: '', headerName: 'Request type', sortable: false, filter: false, columnDef: 'requestType' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
  { key: '', headerName: 'Assigned to', sortable: false, filter: false, columnDef: 'assignedTo' },
  { key: HEADER_DATE, headerName: 'Requested on', sortable: false, filter: false, columnDef: 'requestedOn' },
  { key: '', headerName: 'Channel', sortable: false, filter: false, columnDef: 'channel' },
  { key: '', headerName: 'Time left', sortable: false, filter: false, columnDef: 'daysLeft' },
]


//REQUEST STATE
export const NEW = 'NEW';
export const FORM_SUBMITTED = 'FORM_SUBMITTED';
export const ASSIGNED = 'ASSIGNED';
export const DS_IDENTITY_VERIFIED = 'DS_IDENTITY_VERIFIED';
export const REQUEST_VERIFICATION_PENDING = 'REQUEST_VERIFICATION_PENDING';
export const DOCUMENT_REQUESTED_FOR_FURTHER_VERIFICATION = 'DOCUMENT_REQUESTED_FOR_FURTHER_VERIFICATION';
export const DOCUMENT_RECEIVED = 'DOCUMENT_RECEIVED';
export const DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED';
export const FORM_REJECTED = 'FORM_REJECTED';
export const INVALID_REQUEST = 'INVALID_REQUEST';
export const REQUEST_VALIDATED = 'REQUEST_VALIDATED';
export const DATA_DISCOVERED = 'DATA_DISCOVERED';
export const TASK_CREATED = 'TASK_CREATED';
export const TASK_COMPLETED = 'TASK_COMPLETED';
export const AUDITED = 'AUDITED';
export const REQUEST_FULFILLED = 'REQUEST_FULFILLED';
export const CLOSED = 'CLOSED';
export const REQUEST_CANCELLED = 'REQUEST_CANCELLED';


export enum AssessmentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
export const formatStatus = (status: string): string => {
  return status?.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export const displayStatusText = (status: string): string => {
  if (!status) return '';

  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

//REQUEST STAGING
export enum RequestAction {
  SUBMIT_FORM = "SUBMIT_FORM",
  SAVE_DRAFT = "SAVE_DRAFT",
  VERIFY_THIRD_PARTY = "VERIFY_THIRD_PARTY",
  VERIFY_DS_IDENTITY = "VERIFY_DS_IDENTITY",
  DOCUMENT_REQUEST = "DOCUMENT_REQUEST",
  UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT",
  DOCUMENT_NOT_UPLOAD_ON_TIME = "DOCUMENT_NOT_UPLOAD_ON_TIME",
  DOCUMENT_VERIFY = "DOCUMENT_VERIFY",
  VALIDATE_REQUEST = "VALIDATE_REQUEST",
  DATA_DISCOVERY = "DATA_MAPPING",
  CREATE_TASK = "CREATE_TASK",
  REQUEST_FULFILLMENT = "DATA_FULFILLMENT",
  AUDIT_AND_CLOSE = "AUDIT_AND_CLOSE",
  CANCEL_REQUEST = "CANCEL_REQUEST",
  REJECT_FORM = "REJECT_FORM"
}

//REQUEST Display stage
export enum RequestDisplayStage {
  REQUEST_VERIFICATION = "REQUEST_VERIFICATION",
  REQUEST_VALIDATION = "REQUEST VALIDATION",
  DATA_DISCOVERY = "DATA_MAPPING",
  REQUEST_FULFILLMENT = "REQUEST_FULFILLMENT",
  AUDIT_AND_CLOSE = "AUDIT_AND_CLOSE",
  ACTIVITY_LOG = "ACTIVITY_LOG",
}
export const REQUEST_STAGES = [
  { stage: 1, key: RequestDisplayStage.REQUEST_VERIFICATION, title: 'Identity Verification', active: false, completed: 0, event: RequestAction.VERIFY_DS_IDENTITY },
  { stage: 2, key: RequestDisplayStage.REQUEST_VALIDATION, title: 'Request Validation', active: false, completed: 0, event: RequestAction.VALIDATE_REQUEST },
  { stage: 3, key: RequestDisplayStage.DATA_DISCOVERY, title: 'Data Mapping', active: false, completed: 0, event: RequestAction.DATA_DISCOVERY },
  { stage: 4, key: RequestDisplayStage.REQUEST_FULFILLMENT, title: 'Request Fulfillment', active: false, completed: 0, event: RequestAction.REQUEST_FULFILLMENT },
  { stage: 5, key: RequestDisplayStage.AUDIT_AND_CLOSE, title: 'Audit and Close', active: false, completed: 0, event: RequestAction.AUDIT_AND_CLOSE }
];

export enum RequestLeftSection {
  DETAILS = "DETAILS",
  ATTACHMENTS = "ATTACHMENTS",
  DOCUMENTS = "DOCUMENTS",
}

export const REQUEST_LEFT_DETAILS = [
  { id: 1, key: RequestLeftSection.DETAILS, label: "Request Details" },
  { id: 2, key: RequestLeftSection.ATTACHMENTS, label: "Documents" },
  { id: 3, key: RequestLeftSection.DOCUMENTS, label: "Request Documents" }
]

export const REQUEST_VERIFICATION_NOTE_HEADER = [
  { id: 1, key: '', headerName: 'ID', sortable: false, filter: false, columnDef: 'id' },
  { id: 2, key: '', headerName: 'Title', sortable: false, filter: false, columnDef: 'title' },
  { id: 3, key: '', headerName: 'description', sortable: false, filter: false, columnDef: 'description' },
  { id: 4, key: HEADER_DATE, headerName: 'Time', sortable: false, filter: false, columnDef: 'createdAt' },
]

export const REQUEST_DATA_FULFILLMENT_HEADER = [
  { id: 1, key: HEADER_ID, headerName: 'ID', sortable: false, filter: false, columnDef: 'taskId' },
  { id: 2, key: HEADER_NAME, headerName: 'Task', sortable: false, filter: false, columnDef: 'title' },
  // { id: 3, key: '', headerName: 'Action items', sortable: false, filter: false, columnDef: 'actionItems' },
  { id: 4, key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
  { id: 5, key: '', headerName: 'Attributes', sortable: false, filter: false, columnDef: 'attributesCount' },
  { id: 6, key: '', headerName: 'Exempted', sortable: false, filter: false, columnDef: 'exemptedCount' },
  { id: 7, key: HEADER_DATE, headerName: 'Due date', sortable: false, filter: false, columnDef: 'dueDate' },
  { id: 8, key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export const HEADER_EXPAND = 'expand';

export const DATA_DISCOVERY_HEADER = [
  { id: 1, headerName: '', columnDef: 'expand', key: HEADER_EXPAND, sortable: false },
  { id: 2, headerName: 'Name', columnDef: 'name', sortable: true },
  { id: 3, headerName: 'Category', columnDef: 'category', sortable: true },
  { id: 4, headerName: 'Asset Count', columnDef: 'assetCount', sortable: true }
];

export const DATA_DISCOVERY_ASSET_HEADER = [
  { id: 1, key: '', headerName: 'Asset ID', sortable: false, filter: false, columnDef: 'assetId' },
  { id: 2, key: '', headerName: 'Asset Name', sortable: false, filter: false, columnDef: 'assetName' },
  { id: 3, key: '', headerName: 'Asset Type', sortable: false, filter: false, columnDef: 'assetType' },
  { id: 4, key: '', headerName: 'Location', sortable: false, filter: false, columnDef: 'location' },
  { id: 5, key: '', headerName: 'Records Found', sortable: false, filter: false, columnDef: 'recordsFound' }
];

export enum DataFulfillmentRecord {
  ID = "ID",
  ATTRIBUTES = "ATTRIBUTES",
  CATEGORY = "CATEGORY",
  FOUNDIN = "FOUNDIN",
  PURPOSES = "PURPOSES",
  EXEMPTED = "EXEMPTED",
  JUSTIFICATION = "JUSTIFICATION",
  ACTIONS = "ACTIONS",
  EXEMPTED_KEY = "exempted",
  APPROVE_KEY = "APPROVE",
  REJECT_KEY = "REJECT"
}

export const REQUEST_DATA_FULFILLMENT_RECORD_HEADER = [
  { id: 1, key: DataFulfillmentRecord.ID, headerName: 'ID', sortable: false, filter: false, columnDef: 'id', width: '50px' },
  { id: 2, key: DataFulfillmentRecord.ATTRIBUTES, headerName: 'Attributes', sortable: false, filter: false, columnDef: 'name', },
  { id: 3, key: DataFulfillmentRecord.CATEGORY, headerName: 'Category', sortable: false, filter: false, columnDef: 'category', },
  { id: 4, key: DataFulfillmentRecord.FOUNDIN, headerName: 'Found in', sortable: false, filter: false, columnDef: 'foundIn', },
  { id: 5, key: DataFulfillmentRecord.PURPOSES, headerName: 'Purposes', sortable: false, filter: false, columnDef: 'purpose', },
  { id: 6, key: DataFulfillmentRecord.EXEMPTED, headerName: 'Exempted', sortable: false, filter: false, columnDef: 'exempted', },
  { id: 7, key: DataFulfillmentRecord.JUSTIFICATION, headerName: 'Justification', sortable: false, filter: false, columnDef: 'justification', width: '320px' },
  { id: 8, key: DataFulfillmentRecord.ACTIONS, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', width: '130px' },
];

export const dataFullFillmentDetails = {
  "attributes": ["Adhar card", "Pan Card", "Full name", "Email iD"],
  "category": ["Contact", "Financial", "Identity number", "Personal identifier"],
  "foundIn": ["Job portals", "Payrolls", "CRM Emails", "HRMS"],
  "purposes": ["Communication", "Hiring", "Employment", "Tax and salary"],
  "exemption": [{ key: DataFulfillmentRecord.EXEMPTED_KEY, label: "Exempted" }, { key: "not-exempted", label: "Not Exempted" }],
  "actions": [{ key: DataFulfillmentRecord.APPROVE_KEY, label: "Approved" }, { key: DataFulfillmentRecord.REJECT_KEY, label: "Rejected" }]
}


export const REQUEST_VERIFIC_DOCUMENTS = "REQUEST_VERIFIC_DOCUMENTS"
export const REQUEST_VERIFIC_NOTES = "REQUEST_VERIFIC_NOTES"

export const RequestValidationQuestionsTypes = {
  BOOLEAN: "boolean",
  SINGLE_SELECT: WidgetTypeString.RADIO_BUTTON
}

//dialog types
export enum RequestDialogTypes {
  REQUEST_VALIDATION_CANCEL = "REQUEST_VALIDATION_CANCEL",
  DATA_FULFILLMENT_TASK = "DATA_FULFILLMENT_TASK",
  DATA_FULFILLMENT_VIEW = "DATA_FULFILLMENT_VIEW",
  TASK_MANAGEMENT_TASK = "TASK_MANAGEMENT_TASK",
  ESCALATE_REQUEST = "ESCALATE_REQUEST",
  EXTEND_PERIOD = 'EXTEND_PERIOD',
  VERIFY_DS_IDENTITY = "VERIFY_DS_IDENTITY",
  VERIFY_THIRD_PARTY = "VERIFY_THIRD_PARTY",
  VALIDATE_REQUEST = "VALIDATE_REQUEST",
  ASSIGNEE_CHANGE = "ASSIGNEE_CHANGE",
  PRIORITY_CHANGE = "PRIORITY_CHANGE"
}

export const dsrRequestTypes = [
  { name: 'Self', key: 'SELF', selected: false },
  { name: 'Third party', key: 'THIRD_PARTY', selected: false }
];

export const DATA_FULFILLMENT_TABLE_HEADER = [
  { key: '', headerName: 'SNo', sortable: true, filter: false, columnDef: 'sno' },
  { key: '', headerName: 'Attributes', sortable: true, filter: false, columnDef: 'attributes' },
  { key: '', headerName: 'Category', sortable: true, filter: false, columnDef: 'category' },
  { key: '', headerName: 'Found in', sortable: true, filter: false, columnDef: 'foundIn' },
  { key: '', headerName: 'Purpose', sortable: true, filter: false, columnDef: 'purpose' },
  { key: '', headerName: 'Exempted', sortable: true, filter: false, columnDef: 'exempted' },
  { key: '', headerName: 'Justification', sortable: true, filter: false, columnDef: 'justification' },
  { key: '', headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions' }
] as const;

// Updated clarification state constants to match backend mapping
export const CLARIFICATION_DRAFT = 'DRAFT';
export const CLARIFICATION_OPEN = 'OPEN';
export const CLARIFICATION_ON_HOLD = 'ON_HOLD';
export const CLARIFICATION_REJECTED = 'REJECTED';
export const CLARIFICATION_IN_PROGRESS = 'IN_PROGRESS';
export const CLARIFICATION_COMPLETED = 'COMPLETED';
export const CLARIFICATION_CANCELLED = 'CANCELLED';
export const CLARIFICATION_ESCALATED = 'ESCALATED';

// Specific task states that map to IN_PROGRESS status
export const CLARIFICATION_TASK_CREATED = 'TASK_CREATED';
export const CLARIFICATION_TASK_COMPLETED = 'TASK_COMPLETED';
export const CLARIFICATION_DATA_DISCOVERED = 'DATA_DISCOVERED';

// Updated clarification state options array aligned with backend
export const CLARIFICATION_STATES = [
  { key: CLARIFICATION_DRAFT, label: 'Draft', value: 'DRAFT' },
  { key: CLARIFICATION_OPEN, label: 'Open', value: 'OPEN' },
  { key: CLARIFICATION_ON_HOLD, label: 'On Hold', value: 'ON_HOLD' },
  { key: CLARIFICATION_IN_PROGRESS, label: 'In Progress', value: 'IN_PROGRESS' },
  { key: CLARIFICATION_COMPLETED, label: 'Completed', value: 'COMPLETED' },
  { key: CLARIFICATION_REJECTED, label: 'Rejected', value: 'REJECTED' },
  { key: CLARIFICATION_CANCELLED, label: 'Cancelled', value: 'CANCELLED' },
  { key: CLARIFICATION_ESCALATED, label: 'Escalated', value: 'ESCALATED' }
];

// Task-specific states that roll up to IN_PROGRESS
export const TASK_SPECIFIC_STATES = [
  { key: CLARIFICATION_TASK_CREATED, label: 'Task Created', value: 'TASK_CREATED' },
  { key: CLARIFICATION_TASK_COMPLETED, label: 'Task Completed', value: 'TASK_COMPLETED' },
  { key: CLARIFICATION_DATA_DISCOVERED, label: 'Data Discovered', value: 'DATA_DISCOVERED' }
];
// Request task action
export enum RequestTaskAction {
  VERIFY = "Verify",
  RESOLVE_TASK = "Resolve-Task",
  RE_OPEN = "Re-Open"
}

//verification method
export const EMAIL_VERIFICATION = 'email'
export const PHONE_VERIFICATION = 'phone'

export enum TaskManagementDialogTypes {
  TASK = "TASK",
  CLARIFICATION = "CLARIFICATION",
}

export enum StageMetaData {
  PROGRESS_STAGE = 0,
  CURRENT_STAGE = 1,
  REJECTED = -1,
  COMPLETED = 2
}

export const ASSET_TYPE = [
  { label: 'Internal', key: 'INTERNAL' },
  { label: 'External', key: 'EXTERNAL' }
];


export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = "IN_ACTIVE",
}

export const OVERVIEW = "overview"
export const RISK = "risk"
export const ROLE = "role"


export enum AccessRecord {
  PROCESSING_ACTIVITY = 'processingActivity',
  ASSET = "asset",
  VENDOR = "vendor",
}

export enum AccessRecordLabel {
  PROCESSING_ACTIVITY = 'Processing activity',
  ASSET = "Asset",
  VENDOR = "Vendor",
}

export enum createAssessmentCommandType {
  UpdateTitle = 'updateTitle',
  UpdateDescription = 'updateDescription',
  UpdateDueDate = 'updateDueDate',
  UpdateBpaId = 'updateBpaId',
  UpdateRiskMatrix = 'updateRiskMatrix',
  UpdateTemplateId = 'updateTemplateId',
  UpdateAssessmentTypeId = 'updateAssessmentTypeId',
  UpdateClassification = 'updateClassification',
  AddAssetIds = 'addAssetIds',
  AddApprovers = 'addApprovers',
  AddRespondents = 'addRespondents',
  UpdateAuthor = 'updateAuthor',
  AddTriggerIds = 'addTriggerIds',
  UpdateTriggerReason = 'updateTriggerReason',
  DeleteAssessment = 'deleteAssessment',
  DeleteRespondents = 'deleteRespondents',
  DeleteApprovers = 'deleteApprovers',
  DeleteTriggerIds = 'deleteTriggerIds',
  ApproveQuestionResponse = 'approveQuestionResponse',
  AddVendorIds = 'addVendorIds',
  DeleteVendorIds = 'deleteVendorIds',
  PerformAssessmentAction = 'performAssessmentAction'
}

export enum TaskStatusAction {
  PUT_ON_HOLD = "PUT_ON_HOLD",
  RESUME_TASK = "RESUME_TASK",
  CLOSE_TASK = "CLOSE_TASK",
  REOPEN_TASK = "REOPEN_TASK",
  SEND_FOR_REVIEW = "SEND_TASK"
}

export enum TaskDisplayStatusAction {
  CLOSE = "CLOSE",
  SUBMIT_FOR_REVIEW = "SUBMIT_FOR_REVIEW",
  HOLD = "HOLD",
  RESUME_TASK = "RESUME_TASK",
  REOPEN = "REOPEN"
}

export const TaskStatusActionApiMap: Record<string, string> = {
  [TaskDisplayStatusAction.CLOSE]: TaskStatusAction.CLOSE_TASK,
  [TaskDisplayStatusAction.SUBMIT_FOR_REVIEW]: TaskStatusAction.SEND_FOR_REVIEW,
  [TaskDisplayStatusAction.HOLD]: TaskStatusAction.PUT_ON_HOLD,
  [TaskDisplayStatusAction.RESUME_TASK]: TaskStatusAction.RESUME_TASK,
  [TaskDisplayStatusAction.REOPEN]: TaskStatusAction.REOPEN_TASK
};

export const ACTIONS_REQUIRING_REASON: string[] = [
  TaskDisplayStatusAction.HOLD,
  TaskDisplayStatusAction.REOPEN
];

export enum AssessmentQuestionStatus {
  ACCEPTED = "ACCEPTED",
  PENDING = "PENDING",
}

export enum AssessemntSource {
  GENERAL = "GENERAL",
  VENDOR = "VENDOR",
}

export enum AssessementAction {
  COMPLETE_ASSESSMENT = "COMPLETE_ASSESSMENT",
  REJECT_ASSESSMENT = "REJECT_ASSESSMENT",
}

export enum AssessmentAttachedTo {
  ASSESSMENT_RISK = 'RISK',
  ASSESSMENT = 'ASSESSMENT',
  ASSESSMENT_QUESTION = 'QUESTION',
  ASSESSMENT_TASK = 'TASK',
  ASSESSMENT_VENDOR_RISK = 'VENDOR_RISK',
  ASSESSMENT_VENDOR = 'VENDOR_ASSESSMENT',
  ASSESSMENT_VENDOR_QUESTION = 'VENDOR_QUESTION',
  ASSESSMENT_VENDOR_TASK = 'VENDOR_TASK'

}
