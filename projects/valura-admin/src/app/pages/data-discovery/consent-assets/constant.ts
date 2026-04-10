import { WidgetTypeString } from '@admin-core/constants/widget-types';

export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'CREATED_AT';
export const HEADER_ACTION = 'ACTION';
export const HEADER_ID = 'HEADER_ID';
export const HEADER_DESCRIPTION = 'HEADER_DESCRIPTION';
export const HEADER_HOSTING_TYPE = 'HEADER_HOSTING_TYPE';
export const HEADER_SYSTEM_OWNER = 'HEADER_SYSTEM_OWNER';


export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;


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

export const ASSET_HEADER = [
  { key: '', headerName: 'Asset ID', sortable: true, filter: false, columnDef: 'assetId' },
  { key: HEADER_NAME, headerName: 'Asset Name', sortable: true, filter: false, columnDef: 'name' },
  // { key: 'HEADER_DESCRIPTION', headerName: 'Description', sortable: false, filter: false, columnDef: 'description' },
  { key: '', headerName: 'Asset Type', sortable: true, filter: false, columnDef: 'assetType' },
  { key: '', headerName: 'Asset Category', sortable: false, filter: false, columnDef: 'assetCategory' },
  { key: '', headerName: 'Department', sortable: false, filter: false, columnDef: 'departmentName' },
  { key: HEADER_SYSTEM_OWNER, headerName: 'Asset Owner', sortable: false, filter: false, columnDef: 'systemOwnerName' },
  { key: HEADER_HOSTING_TYPE, headerName: 'Hosting Type', sortable: false, filter: false, columnDef: 'hostingType' },
  { key: '', headerName: 'Vendor Name', sortable: false, filter: false, columnDef: 'vendorName' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
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

export enum Status {
  ESCALATED = 'ESCALATED',
  OPEN = "OPEN",
  DRAFT = 'DRAFT',
  ON_HOLD = 'ON HOLD',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

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
  { stage: 3, key: RequestDisplayStage.DATA_DISCOVERY, title: 'Data mapping', active: false, completed: 0, event: RequestAction.DATA_DISCOVERY },
  { stage: 4, key: RequestDisplayStage.REQUEST_FULFILLMENT, title: 'Request Fulfillment', active: false, completed: 0, event: RequestAction.REQUEST_FULFILLMENT },
  { stage: 5, key: RequestDisplayStage.AUDIT_AND_CLOSE, title: 'Audit and close', active: false, completed: 0, event: RequestAction.AUDIT_AND_CLOSE }
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

export const TAB_HEADER_DETAILS = [
  { name: "All Assets", count: 0, key: ALL },
  { name: "Drafts", count: 0, key: DRAFTS }
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

export const STATUS = [
  { label: 'Active', key: 'ACTIVE' },
  { label: 'Inactive', key: 'IN_ACTIVE' }
];


export const COLLECTION_TYPE = [
  { label: 'Direct', key: 'DIRECT' },
  { label: 'Indirect', key: 'INDIRECT' }
];

export const HOSTING_SITE = [
  { label: 'Cloud', key: 'CLOUD' },
  { label: 'On-premises', key: 'ON_PREMISES' },
  // { label: 'Backup', key: 'BACKUP' }
];
