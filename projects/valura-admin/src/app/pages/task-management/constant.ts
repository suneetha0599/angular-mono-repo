import { Status } from "../request-management/constant";

export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'HEADER_DATE';
export const HEADER_ACTION = 'HEADER_ACTION';
export const HEADER_ID = 'HEADER_ID';
export const HEADER_EXCEMPTED = 'HEADER_EXCEMPTED';
export const HEADER_DESC = 'HEADER_DESC';
export const HEADER_SELECT = 'HEADER_SELECT';
export const HEADER_NOTE = 'HEADER_NOTE'
export const HEADER_PRIORITY = 'HEADER_PRIORITY'
export const HEADER_LOE = 'levelOfEffort';
export const HEADER_ASSIGNEE = 'HEADER_ASSIGNEE';

export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;


export const ALL = "ALL"
export const TASK_MANAGEMENT_HEADER = [
  { id: 1, key: '', headerName: 'Task ID', sortable: true, filter: false, columnDef: 'taskId', maxWidth: '80px' },
  { id: 2, key: HEADER_NAME, headerName: 'Task Title', sortable: false, filter: false, columnDef: 'title', maxWidth: '150px' },
  { id: 3, key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: false, columnDef: 'status', width: '140px', },
  { id: 4, key: HEADER_PRIORITY, headerName: 'Priority', sortable: true, filter: false, columnDef: 'priority', width: '' },
  { id: 5, key: HEADER_ASSIGNEE, headerName: 'Assignee', sortable: false, filter: true, columnDef: 'assigneeToUserName', width: '' },
  { id: 6, key: '', headerName: 'LOE', sortable: false, filter: true, columnDef: 'levelOfEffort', width: '', },
  { id: 7, key: HEADER_DATE, headerName: 'Due Date', sortable: true, filter: false, columnDef: 'dueDate', width: '', },
  { id: 8, key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn', width: '', },
  // { id: 6, key: HEADER_DESC, headerName: 'Description', sortable: false, filter: false, columnDef: 'description', width: '' },
  // { id: 7, key: '', headerName: 'Type', sortable: false, filter: false, columnDef: 'taskType', width: '' },

  { id: 9, key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', width: '', stickyEnd: true }
];

export const CLARIFICATION_MANAGEMENT_HEADER = [
  { id: 1, key: '', headerName: 'Clarification ID', sortable: true, filter: false, columnDef: 'clarificationId', width: '80px' },
  { id: 2, key: HEADER_NAME, headerName: 'Clarification Title', sortable: false, filter: false, columnDef: 'clarificationTitle', width: '200px' },
  { id: 3, key: '', headerName: 'Assigned By', sortable: false, filter: false, columnDef: 'assignedBy', width: '150px' },
  { id: 4, key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status', width: '200px' },
  { id: 5, key: '', headerName: 'Attribute', sortable: false, filter: false, columnDef: 'attributesCount' },
  { id: 6, key: HEADER_DATE, headerName: 'Updated on', sortable: false, filter: false, columnDef: 'updatedOn', width: '200px' },
  { id: 7, key: '', headerName: 'Exempted', sortable: false, filter: false, columnDef: 'exempted', width: '200px' },
  { id: 8, key: '', headerName: 'Time left', sortable: false, filter: false, columnDef: 'timeLeft' },
  // { id: 9, key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions' }
];

export const TASK_MANAGEMENT_RECORD_HEADER = [
  { id: 1, key: HEADER_ID, headerName: 'SNo', sortable: true, filter: false, columnDef: 'id' },
  { id: 2, key: '', headerName: 'Attributes', sortable: true, filter: false, columnDef: 'name' },
  { id: 3, key: '', headerName: 'Category', sortable: true, filter: false, columnDef: 'category' },
  { id: 4, key: '', headerName: 'Found in', sortable: true, filter: false, columnDef: 'foundIn' },
  { id: 5, key: '', headerName: 'Purpose', sortable: true, filter: false, columnDef: 'purpose' },
  { id: 6, key: HEADER_EXCEMPTED, headerName: 'Exempted', sortable: true, filter: false, columnDef: 'exempted' },
  { id: 7, key: '', headerName: 'Justification', sortable: true, filter: false, columnDef: 'justification' },
  { id: 8, key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true }
] as const;

export const TASK_MANAGEMENT_DOCUMENT_UPLOAD_HEADER = [
  { id: 1, key: HEADER_ID, headerName: 'Doc name', sortable: true, filter: false, columnDef: 'fileKey' },
  { id: 2, key: '', headerName: 'Uploaded by', sortable: true, filter: false, columnDef: 'uploadedByUsername' },
  { id: 3, key: '', headerName: 'Date', sortable: true, filter: false, columnDef: 'uploadedAt' },
  // { id: 4, key: HEADER_NOTE, headerName: 'Note', sortable: true, filter: false, columnDef: 'remark' }
];


export enum RequestLeftSection {
  DETAILS = "DETAILS",
  ATTACHMENTS = "ATTACHMENTS",
  DOCUMENTS = "DOCUMENTS",
}

export const REQUEST_LEFT_DETAILS = [
  { id: 1, key: RequestLeftSection.DETAILS, label: "Details" },
  { id: 2, key: RequestLeftSection.ATTACHMENTS, label: "Documents" },
  { id: 3, key: RequestLeftSection.DOCUMENTS, label: "Request Documents" }
]


export enum DataFulfillmentRecord {
  ATTRIBUTES = "ATTRIBUTES",
  CATEGORY = "CATEGORY",
  FOUNDIN = "FOUNDIN",
  PURPOSES = "PURPOSES",
  EXEMPTED = "EXEMPTED",
  JUSTIFICATION = "JUSTIFICATION",
  ACTIONS = "ACTIONS",
  EXEMPTED_KEY = "exempted",
  APPROVED_KEY = "approved"
}


export const dataFullFillmentDetails = {
  "attributes": ["Adhar card", "Pan Card", "Full name", "Email iD"],
  "category": ["Contact", "Financial", "Identity number", "Personal identifier"],
  "foundIn": ["Job portals", "Payrolls", "CRM Emails", "HRMS"],
  "purposes": ["Communication", "Hiring", "Employment", "Tax and salary"],
  "exemption": [{ key: DataFulfillmentRecord.EXEMPTED_KEY, label: "Exempted" }, { key: "not-exempted", label: "Not Exempted" }],
  "actions": [{ key: DataFulfillmentRecord.APPROVED_KEY, label: "Approved" }, { key: "rejected", label: "Rejected" }]
}

//dialog types
export enum TaskDialogTypes {
  TASK = "TASK",
  CLARIFICATION = "CLARIFICATION",
}

export enum ClarificationStatus {
  COMPLETED = 'COMPLETED',
}

export const TASK_DETAILS = (taskId: number) => `tm/task/${taskId}`;

//TASK STATE
export enum TaskStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  CLOSED = "CLOSED",
  REOPENED = "REOPENED",
  SEND_FOR_REVIEW = "SEND_FOR_REVIEW"
}

export enum TaskPriority {
  HIGH = "HIGH",
  LOW = "LOW",
  MEDIUM = "MEDIUM"
}


export const statusList = [
  { id: 1, name: 'Open', value: TaskStatus.OPEN, selected: false, disabled: false },
  { id: 2, name: 'In Progress', value: TaskStatus.IN_PROGRESS, selected: false, disabled: false },
  { id: 3, name: 'On Hold', value: TaskStatus.ON_HOLD, selected: false, disabled: false },
  { id: 4, name: 'Closed', value: TaskStatus.CLOSED, selected: false, disabled: false },
  { id: 5, name: 'Reopened', value: TaskStatus.REOPENED, selected: false, disabled: false },
];


export enum TaskType {
  ASSESSMENT = "ASSESSMENT",
}

export type ActivityLogUI = {
  id?: string;
  user: string;
  action: string;
  comment?: string;
  time: string;
};

export const ACTIVITY = {
  ACTOR_SYSTEM: 'System',
  ACTOR_USER: 'User',
  ACTOR_DS: 'DS',
  ACTOR_THIRD_PARTY: 'Third Party'
}

// Request task action
export enum TaskStatusAction {
  CLOSE_TASK = "CLOSE_TASK",
  PUT_ON_HOLD = "PUT_ON_HOLD",
  RESUME_TASK = "RESUME_TASK",
  REOPEN_TASK = "REOPEN_TASK",
  SEND_FOR_REVIEW="SEND_FOR_REVIEW"
}

//UI purpose
export enum TaskDisplayStatusAction {
  SEND_BACK = "SEND_BACK",
  REOPEN = "REOPEN",
  CLOSE = "CLOSE",
  SUBMIT_FOR_REVIEW = "SUBMIT_FOR_REVIEW",
  HOLD = "HOLD",
  RESUME_TASK = "RESUME_TASK"
}

export const TaskStatusActionApiMap = {
  [TaskDisplayStatusAction.SEND_BACK]: TaskStatusAction.REOPEN_TASK,
  [TaskDisplayStatusAction.REOPEN]: TaskStatusAction.REOPEN_TASK,
  [TaskDisplayStatusAction.CLOSE]: TaskStatusAction.CLOSE_TASK,
  [TaskDisplayStatusAction.SUBMIT_FOR_REVIEW]: TaskStatusAction.SEND_FOR_REVIEW,
  [TaskDisplayStatusAction.HOLD]: TaskStatusAction.PUT_ON_HOLD,
  [TaskDisplayStatusAction.RESUME_TASK]: TaskStatusAction.RESUME_TASK
}


