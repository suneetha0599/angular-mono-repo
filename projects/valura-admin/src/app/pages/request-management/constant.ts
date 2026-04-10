import { WidgetTypeString } from "../../core/constants/widget-types";

export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'CREATED_AT';
export const HEADER_ACTION = 'ACTION';
export const HEADER_ID = 'HEADER_ID';
export const THIRD_PARTY = 'THIRD_PARTY';
export const SELF = 'SELF';
export const HEADER_THROUGH = 'HEADER_THROUGH';
export const HEADER_CATEGORY = 'HEADER_CATEGORY';

export const HEADER_REQUEST_TYPE = "HEADER_REQUEST_TYPE"

export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;

export const ALL = "ALL"
export const PRIORITY = "PRIORITY"
export const LOE = "LOE"
export const OPEN = "OPEN"
export const DRAFTS = "DRAFT"

export const REQUEST_MANAGEMENT_HEADER = [
    { key: '', headerName: 'Request ID', sortable: false, filter: false, columnDef: 'id' },
    { key: HEADER_NAME, headerName: 'Data Subject Name', sortable: false, filter: false, columnDef: 'name', maxWidth: '150px' },
    { key: HEADER_THROUGH, headerName: 'Through', sortable: false, filter: false, columnDef: 'requestedByType' },
    { key: HEADER_REQUEST_TYPE, headerName: 'Request Type', sortable: false, filter: false, columnDef: 'requestRightId' },
    { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status', width: '150px' },
    { key: '', headerName: 'Assigned To', sortable: false, filter: false, columnDef: 'assignedToId' },
    { key: HEADER_DATE, headerName: 'Raised On', sortable: false, filter: false, columnDef: 'requestedOn' },
    { key: '', headerName: 'Request Channel', sortable: false, filter: false, columnDef: 'channel' },
    { key: '', headerName: 'Time Left', sortable: false, filter: false, columnDef: 'timeLeft' },
    // { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
]


export const DOWNLOAD_COLUMNS = [
    { key: 'requestId', label: 'Request ID' },
    { key: 'requestedOn', label: 'Requested On' },
    { key: 'through', label: 'Through' },
    { key: 'thirdPartyName', label: 'Third Party Name' },
    { key: 'dataSubjectName', label: 'Data Subject Name' },
    { key: 'dataSubjectCategory', label: 'Data Subject Category' },
    { key: 'region', label: 'Region' },
    { key: 'right', label: 'Right' },
    { key: 'rightSimplified', label: 'Right Simplified' },
    { key: 'description', label: 'Description' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'timeLeft', label: 'Time Left' },
    { key: 'extensionPeriod', label: 'Extension Period' },
    { key: 'extensionPeriodReason', label: 'Extension Period Reason' },
    { key: 'requestPausedDays', label: 'Request Paused Days' },
    { key: 'requestPausedReason', label: 'Request Paused Reason' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status' },
    { key: 'verificationStatusOfApplicant', label: 'Verification Status Of Applicant' },
    { key: 'thirdPartyEmail', label: 'Third Party Email' },
    { key: 'thirdPartyPhoneNo', label: 'Third Party Phone No' },
    { key: 'authorizationProof', label: 'Authorization Proof' },
    { key: 'verificationOfTheThirdParty', label: 'Verification Of The Third Party' },
    { key: 'dataSubjectEmail', label: 'Data Subject Email' },
    { key: 'dataSubjectPhone', label: 'Data Subject Phone' },
    { key: 'verificationMode', label: 'Verification Mode' },
    { key: 'verificationStatus', label: 'Verification Status' },
    { key: 'verifiedDate', label: 'Verified Date' },
    { key: 'platform', label: 'Platform' },
    { key: 'documents', label: 'Documents' },
    { key: 'regulation', label: 'Regulation' },
    { key: 'provision', label: 'Provision' },
    { key: 'expiresOn', label: 'Expires On' },
    { key: 'closedDate', label: 'Closed Date' },
];


export const REQUEST_MANAGEMENT_DATA_SUBJECT_DETAIL = [
    { key: '', headerName: 'Request ID', sortable: true, filter: false, columnDef: 'formId' },
    { key: HEADER_NAME, headerName: 'Data Subject Name', sortable: false, filter: false, columnDef: 'name' },
    { key: HEADER_THROUGH, headerName: 'Through', sortable: false, filter: false, columnDef: 'requestedBy' },
    { key: '', headerName: 'Request Type', sortable: false, filter: false, columnDef: 'requestType' },
    { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
    { key: '', headerName: 'Assigned To', sortable: false, filter: false, columnDef: 'assigneeName' },
    { key: HEADER_DATE, headerName: 'Raised On', sortable: false, filter: false, columnDef: 'requestedOn' },
    { key: '', headerName: 'Request Channel', sortable: false, filter: false, columnDef: 'channel' },
    { key: '', headerName: 'Time Left', sortable: false, filter: false, columnDef: 'timeLeft' },
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
export const REQUEST_FULFILLED = 'DATA_FULFILLED';
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
    ACTIVE = 'ACTIVE',
    IN_ACTIVE = "IN_ACTIVE",
    PENDING = "PENDING",
    APPROVED = "APPROVED"
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
    REJECT_FORM = "REJECT_FORM",
    REOPEN_REQUEST = "REOPEN_REQUEST"
}

//REQUEST Display stage
export enum RequestDisplayStage {
    REQUEST_VERIFICATION = "REQUEST_VERIFICATION",
    REQUEST_VALIDATION = "REQUEST_VALIDATION",
    DATA_DISCOVERY = "DATA_MAPPING",
    REQUEST_FULFILLMENT = "REQUEST_FULFILLMENT",
    AUDIT_AND_CLOSE = "AUDIT_AND_CLOSE",
    ACTIVITY_LOG = "ACTIVITY_LOG",
}

//REQUEST Task stage
export enum RequestTaskStage {
    REQUEST_VERIFICATION = "VERIFICATION",
    REQUEST_VALIDATION = "VALIDATION",
    DATA_DISCOVERY = "DATA_MAPPING",
    REQUEST_FULFILLMENT = "DATA_FULFILLMENT",
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
    // { id: 3, key: RequestLeftSection.DOCUMENTS, label: "Request Documents" }
]

export const REQUEST_VERIFICATION_NOTE_HEADER = [
    { id: 1, key: '', headerName: 'ID', sortable: false, filter: false, columnDef: 'id' },
    { id: 2, key: '', headerName: 'Title', sortable: false, filter: false, columnDef: 'title' },
    { id: 3, key: '', headerName: 'description', sortable: false, filter: false, columnDef: 'description' },
    { id: 4, key: HEADER_DATE, headerName: 'Time', sortable: false, filter: false, columnDef: 'createdAt' },
]

export const REQUEST_DATA_FULFILLMENT_HEADER = [
    { id: 1, key: HEADER_ID, headerName: 'Task ID', sortable: true, columnDef: 'taskId' },
    { id: 2, key: HEADER_NAME, headerName: 'Task Title', sortable: true, columnDef: 'title' },
    { id: 4, key: HEADER_STATUS, headerName: 'Status', sortable: true, columnDef: 'status', width: '140px', },
    { id: 5, key: PRIORITY, headerName: 'Priority', sortable: true, columnDef: 'priority' },
    { id: 6, key: '', headerName: 'Assignee', sortable: true, columnDef: 'assigneeToUserName' },
    { id: 7, key: LOE, headerName: 'LOE', sortable: true, columnDef: 'levelOfEffort' },
    { id: 8, key: HEADER_DATE, headerName: 'Due Date', sortable: true, columnDef: 'dueDate' },
    { id: 9, key: HEADER_DATE, headerName: 'Created On', sortable: true, columnDef: 'createdOn' },
    { id: 10, key: HEADER_ACTION, headerName: 'Actions', sortable: false, columnDef: 'actions', stickyEnd: true },
];

export const HEADER_EXPAND = 'expand';

export const DATA_DISCOVERY_HEADER = [
    { id: 1, headerName: '', columnDef: 'expand', key: HEADER_EXPAND, sortable: false },
    { id: 2, headerName: 'Personal Data Elements', columnDef: 'name', sortable: true },
    { id: 3, headerName: 'Data Category', columnDef: 'category', key: HEADER_CATEGORY, sortable: true },
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

export const RequestValidationQuestionsTypes = {
    ...WidgetTypeString
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
    PRIORITY_CHANGE = "PRIORITY_CHANGE",
    PAUSE_REQUEST = "PAUSE_REQUEST",
    RESUME_REQUEST = "RESUME_REQUEST",
    REOPEN_REQUEST = "REOPEN_REQUEST",
    TASK_REOPEN_REQUEST = "TASK_REOPEN_REQUEST"
}
export enum RequestThrough {
    SELF = "Self",
    THIRD_PARTY = "Third Party",
}
export const dsrRequestTypes = [
    { name: RequestThrough.SELF, key: SELF, selected: false },
    { name: RequestThrough.THIRD_PARTY, key: THIRD_PARTY, selected: false }
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
export const statusList = [
    { id: 1, name: 'Open', value: Status.OPEN, selected: false, disabled: false },
    { id: 2, name: 'Draft', value: Status.DRAFT, selected: false, disabled: false },
    { id: 3, name: 'In Progress', value: Status.IN_PROGRESS, selected: false, disabled: false },
    { id: 4, name: 'On Hold', value: Status.ON_HOLD, selected: false, disabled: false },
    { id: 5, name: 'Escalated', value: Status.ESCALATED, selected: false, disabled: false },
    { id: 6, name: 'Pending', value: Status.PENDING, selected: false, disabled: false },
    { id: 7, name: 'Approved', value: Status.APPROVED, selected: false, disabled: false },
    { id: 8, name: 'Rejected', value: Status.REJECTED, selected: false, disabled: false },
    { id: 9, name: 'Completed', value: Status.COMPLETED, selected: false, disabled: false },
    { id: 10, name: 'Cancelled', value: Status.CANCELLED, selected: false, disabled: false },
];

// Task-specific states that roll up to IN_PROGRESS
export const TASK_SPECIFIC_STATES = [
    { key: CLARIFICATION_TASK_CREATED, label: 'Task Created', value: 'TASK_CREATED' },
    { key: CLARIFICATION_TASK_COMPLETED, label: 'Task Completed', value: 'TASK_COMPLETED' },
    { key: CLARIFICATION_DATA_DISCOVERED, label: 'Data Discovered', value: 'DATA_DISCOVERED' }
];

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


export enum RequestLockType {
    DS_APPROVAL_PENDING = "DS_APPROVAL_PENDING",
    SPECIAL_DELETION = "SPECIAL_DELETION",
}


export enum RequestFormViewType {
    DSR = "DSR",
    FORM_CONFIGURATION = "FORM_CONFIGURATION",
}

export const RequestStageTab = {
    VERIFICATION_STAGE_DETAIL: "VERIFICATION_STAGE_DETAIL",
    VALIDATION_STAGE_DETAIL: "VALIDATION_STAGE_DETAIL",
    DATA_MAPPING_STAGE_DETAIL: "DATA_MAPPING_STAGE_DETAIL",
    DATA_FULFILLMENT_STAGE_DETAIL: "DATA_FULFILLMENT_STAGE_DETAIL",
    CONVERSATION: "DSR_CONVERSATION",
    ATTACHMENT: "ATTACHMENT",
    TASKS: "TASKS",

}

export const VERIFICATION_TABS = [
    { id: 0, key: RequestStageTab.VERIFICATION_STAGE_DETAIL, label: 'Verification Details' },
    { id: 1, key: RequestStageTab.CONVERSATION, label: 'Conversations' },
    { id: 2, key: RequestStageTab.ATTACHMENT, label: 'Attachments' },
    { id: 3, key: RequestStageTab.TASKS, label: ' Tasks ' },
];
export const VALIDATION_TABS = [
    { id: 1, key: RequestStageTab.VALIDATION_STAGE_DETAIL, label: 'Review Request' },
    { id: 2, key: RequestStageTab.CONVERSATION, label: 'Conversations' },
    { id: 3, key: RequestStageTab.ATTACHMENT, label: 'Attachments' },
    { id: 4, key: RequestStageTab.TASKS, label: ' Tasks ' },
];
export const DATA_MAPPING_TABS = [
    { id: 1, key: RequestStageTab.DATA_MAPPING_STAGE_DETAIL, label: 'Data Mapping Details' },
    { id: 2, key: RequestStageTab.CONVERSATION, label: 'Conversations' },
    { id: 3, key: RequestStageTab.ATTACHMENT, label: 'Attachments' },
    { id: 4, key: RequestStageTab.TASKS, label: ' Tasks ' },
];
export const FULFILLMENT_TABS = [
    { id: 1, key: RequestStageTab.DATA_FULFILLMENT_STAGE_DETAIL, label: 'Fulfillment Details' },
    { id: 2, key: RequestStageTab.CONVERSATION, label: 'Conversations' },
    { id: 3, key: RequestStageTab.ATTACHMENT, label: 'Attachments' },
    { id: 4, key: RequestStageTab.TASKS, label: ' Tasks ' },
];

export const WEB_FORM = "Web Form";

export enum RequestFilterKey {
    STATUS = 'STATUS',
    ASSIGNED_TO = 'ASSIGNED_TO',
    DATA_SUBJECT_TYPE = 'DATA_SUBJECT_TYPE',
    CHANNEL = 'CHANNEL',
    THROUGH = 'THROUGH',
    REQUEST_TYPE = 'REQUEST_TYPE',
    COUNTRY = 'COUNTRY',
    FROM_DATE = 'REQUEST_TYPE',
    TO_DATE = 'TO_DATE',
}

