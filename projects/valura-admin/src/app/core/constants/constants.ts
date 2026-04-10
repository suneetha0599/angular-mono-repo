import { MatDialogConfig } from "@angular/material/dialog"
import { WidgetTypeString } from "./widget-types"

export const CONSENT_PURPOSES = 'Consent-Purposes'
export const CONSENT_UPSTREAM = 'Consent-Upstream'
export const CONSENT_TEMPLATE = 'Consent-Template'
export const PUBLISH_CONFIRMATION = 'Publish-Confirmation'
export const TERMS_AND_CONDITIONS = 'Terms-And-Conditions'


//LOGIN VIEW TYPE
export const LOGIN = "LOGIN"
export const SSO_AUTH = "sso-auth"
export const SSO_INTERNAL_AUTH = "sso-internal-auth"
export const SSO_EXTERNAL_AUTH = "sso-external-auth"
export const RESET_PASSWORD = "RESET_PASSWORD"
export const RESEND_LINK = "RESEND_LINK"
export const VERIFY_OTP = "VERIFY_OTP"
export const UPDATE_PASSWORD = "UPDATE_PASSWORD"
export const SUCCESS_RESET_PASSWORD = "SUCCESS_RESET_PASSWORD"

// Upload purpose
export const DSR_ATTACHMENT = "dsr_attachment"
export const DSR_DOCUMENT_UPLOAD = "dsr_document_upload"

export const ASSESSMENT_DOCUMENT_UPLOAD = 'assessment_document_upload'

export const DSR_THIRD_PARTY_VERIFICATION = "third_party_verification"
// Regex
export const EMAIL_REGEX = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$"
export const PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"

//User types
export const ADMIN_USER = "ADMIN_USER";
export const EXTERNAL_USER = "EXTERNAL_USER";
export const INTERNAL_USER = "INTERNAL_USER";

export const USER_TYPES: string[] = [INTERNAL_USER, ADMIN_USER, EXTERNAL_USER];

export const DSR_FORM_ROUTE_CODE = 'DSR_FORM'
export const FORM_CONFIGURATION_ROUTE_CODE = 'FORM_CONFIGURATION'
export const REQUEST_MANAGEMENT = 'REQUEST_MANAGEMENT'
export const TASK_MANAGEMENT = 'TASK_MANAGEMENT'
export const ASSET = 'ASSET'
export const BPA = 'BPA'
export const COLLECTION_POINT = 'COLLECTION_POINT'
export const VENDORS = 'VENDORS'
export const ASSESSMENTS = 'ASSESSMENTS'
export const TEMPLATES = 'TEMPLATES'


export const DSR_CONVERSATION_ATTACHMENT = 'DSR_CONVERSATION_ATTACHMENT'

export const TASK_CONVERSATION_ATTACHMENT = 'TASK_CONVERSATION_ATTACHMENT';
export const TASK_ATTACHMENT = 'TASK_ATTACHMENT';
export const QUESTIONNAIRE_ATTACHMENT = 'QUESTIONNAIRE_ATTACHMENT';
export const QUESTIONNAIRE_CONVERSATION_ATTACHMENT = 'QUESTIONNAIRE_CONVERSATION_ATTACHMENT';
export const ASSESSMENT_TASK_CONVERSATION_ATTACHMENT = 'ASSESSMENT_TASK_CONVERSATION_ATTACHMENT'

//DRAFT KEY
export const BPA_MANUAL_DRAFT_KEY = "MANUAL_BPA_REQUEST"
export const BPA_DRAFT_KEY = "BPA_DRAFT_REQUEST"
export const ASSESSMENT_MANUAL_DRAFT_KEY = "MANUAL_ASSESSMENT_REQUEST"
export const TEMPLATE_MANUAL_DRAFT_KEY = "MANUAL_TEMPLATE_REQUEST"
export const EMAIL_TEMPLATE_DRAFT_KEY = "MANUAL_EMAIL_REQUEST"
export const FORM_CONFIGURATION_DRAFT_KEY = "FORM_CONFIGURATION_REQUEST"
export const MANUAL_VENDOR_TEMPLATE_REQUEST = "MANUAL_VENDOR_TEMPLATE_REQUEST"
export const MANUAL_VENDOR_ASSESSMENT_REQUEST = "MANUAL_VENDOR_ASSESSMENT_REQUEST"

export const ASSESSMENT_TYPES = [
  { label: "LIA", key: "LIA" },
  { label: "TIA", key: "TIA" },
  { label: "DPIA", key: "DPIA" }
];

export const RISK_MATRIX = [
  { key: 'M3', label: '3 x 3 matrix' },
  { key: 'M5', label: '5 x 5 matrix' }
];

export const TYPES = [
  { value: 'TEXT', label: WidgetTypeString.TEXT_FIELD },
  { value: 'TEXTAREA', label: WidgetTypeString.TEXT_AREA },
  { value: 'SINGLE_SELECT', label: WidgetTypeString.DROPDOWN },
  { value: 'MULTI_SELECT', label: WidgetTypeString.MULTI_SELECT },
  { value: 'CHECK_BOX', label: WidgetTypeString.CHECKBOX },
  { value: 'RADIO', label: WidgetTypeString.RADIO_BUTTON },
  // { value: 'DATE_ONLY', label: WidgetTypeString.DATE },
  { value: 'FILE_UPLOAD', label: WidgetTypeString.FILE_INPUT },
  { value: 'YES_NO', label: WidgetTypeString.YES_NO }
];

export enum AUDIT_LOG_MODULE {
  COMMON = 'COMMON',
  DSR = 'DSR',
  DATA_DISCOVERY = 'DataInventory',
  AUTH = 'Auth',
  TASK_MANAGEMENT = 'TaskManagement',
  ASSESSMENT = 'Assessments',
  ASSET = 'DataInventory',
  CONFIGURATION = 'Configuration'
}

export enum AUDIT_LOG_ENTITY_TYPE {
  USER = 'USER',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
  USER_ROLE = 'USER_ROLE',
  DEPARTMENT_ASSIGNMENT = 'DEPARTMENT_ASSIGNMENT',
  USER_PERMISSION = 'USER_PERMISSION',
  DSR_REQUEST = 'REQUEST_MANAGEMENT',
  TASK = 'TASK_MANAGEMENT',
  ASSESSMENT = 'ASSESSMENT',
  VENDOR_ASSESSMENT = 'VENDOR_ASSESSMENT',
  ASSET = 'ASSET',
  VENDOR = 'VENDOR',
  COLLECTION_POINT = 'COLLECTION_POINT',
  REGULATION = 'REGULATION_CONFIGURATION',
  EMAIL = 'EMAIL_CONFIGURATION',
  PERSONAL_DATA_ELEMENTS = 'PERSONAL_DATA_ELEMENTS',
  DATA_SUBJECTS = 'DATA_SUBJECTS',
  DEPARTMENT_MANAGEMENT = 'DEPARTMENT_MANAGEMENT',
  FORM_CONFIGURATION = 'FORM_CONFIGURATION',
}

export const ACTIVITY = {
  ACTOR_SYSTEM: 'System',
  ACTOR_USER: 'User',
  ACTOR_DS: 'DS',
  ACTOR_THIRD_PARTY: 'Third Party'
}

export const ACTIVITY_LOG_ACTOR = {
  ADMIN_USER: 'ADMIN_USER',
  SYSTEM: 'SYSTEM',
  APP_USER: 'APP_USER',
  DS: 'DS',
  THIRD_PARTY: 'THIRD_PARTY'
}

// Risk Summary Constants
export const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
  'parameterId': 'Parameter',
  'category': 'Category',
  'description': 'Description',
  'likelihood': 'Likelihood',
  'impact': 'Impact'
};

export const LIKELIHOOD_SCORES = {
  'REMOTE': 1,
  'POSSIBLE': 2,
  'PROBABLE': 3
} as const;

export const IMPACT_SCORES = {
  'MINIMUM': 1,
  'SIGNIFICANT': 2,
  'SEVERE': 3
} as const;

export const RISK_LEVEL_CLASSES = {
  'HIGH': 'text-red-800 bg-red-100',
  'MEDIUM': 'text-yellow-800 bg-yellow-100',
  'LOW': 'text-green-700 bg-green-100'
} as const;


// Worker Constants
export const BPA_WORKER = {
  INIT: 'INIT',
  SAVE_BPA: 'SAVE_BPA',
  STOP: 'STOP'
}

//Document through filters
export enum DocumentThrough {
  DSR_ATTACHMENT = "DSR_ATTACHMENT",
  DSR_DOCUMENT_UPLOAD = "DSR_DOCUMENT_UPLOAD",
  FULFILLMENT_DOCUMENTS = "FULFILLMENT_DOCUMENTS",
  SUPPORTING_DOCUMENTS = "SUPPORTING_DOCUMENTS",
  THIRD_PARTY_ATTACHMENT = "THIRD_PARTY_ATTACHMENT",
}

export enum ActiveStaus {
  ACTIVE = "ACTIVE",
  IN_ACTIVE = "IN_ACTIVE"
}

//Configuration sub domains
export const CONFIGURATION_SUB_DOMAIN = "configuration";

export const GLOBAL_DIALOG_DEFAULTS: MatDialogConfig = {
  width: '26%',
  maxHeight: '70vh',
  autoFocus: false,
};

export enum PRIORITY_OPTION {
  LOW = 'LOW',
  MEDIUM = "MEDIUM",
  HIGH = 'HIGH',
}

export const PRIORITY_OPTIONS = [
  { id: 1, label: 'Low', value: PRIORITY_OPTION.LOW, selected: false, disabled: false },
  { id: 3, label: 'Medium', value: PRIORITY_OPTION.MEDIUM, selected: false, disabled: false },
  { id: 4, label: 'High', value: PRIORITY_OPTION.HIGH, selected: false, disabled: false },
];

export enum EFFORT_LEVEL {
  MINIMAL = 'MINIMAL',
  MINOR = "MINOR",
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL'
}

export const EFFORT_LEVELS = [
  { id: 1, label: 'Minimal', value: EFFORT_LEVEL.MINIMAL, selected: false, disabled: false },
  { id: 3, label: 'Minor', value: EFFORT_LEVEL.MINOR, selected: false, disabled: false },
  { id: 4, label: 'Moderate', value: EFFORT_LEVEL.MODERATE, selected: false, disabled: false },
  { id: 5, label: 'Major', value: EFFORT_LEVEL.MAJOR, selected: false, disabled: false },
  { id: 6, label: 'Critical', value: EFFORT_LEVEL.CRITICAL, selected: false, disabled: false },
];

export const TASK_TYPES = [
  { value: 'FEATURE', label: 'Feature' },
  { value: 'BUG', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Enhancement' },
  { value: 'DOCUMENTATION', label: 'Documentation' }
];

export const DSR_FIELD_DISPLAY_KEYS = [
  { key: "ALL", value: "All", displayFor: "BOTH" },
  { key: "DATA_SUBJECT_TYPE", value: "Data Subject Type", displayFor: "BOTH" },
  { key: "NAME", value: "Name", displayFor: "BOTH" },
  { key: "RESIDENCY", value: "Residency", displayFor: "BOTH" },
  { key: "EMAIL", value: "Email", displayFor: "BOTH" },
  { key: "PHONE_NUMBER", value: "Phone Number", displayFor: "BOTH" },
  { key: "REQUEST_TYPE", value: "Request Type", displayFor: "BOTH" },
  { key: "REQUEST_CHANNEL", value: "Request Channel", displayFor: "BOTH" },
  { key: "THROUGH", value: "Through", displayFor: "BOTH" },
  { key: "RAISED_ON", value: "Raised On", displayFor: "BOTH" },
  { key: "EXPIRES_ON", value: "Expires On", displayFor: "BOTH" },
  { key: "DESCRIPTION", value: "Description", displayFor: "BOTH" },
  { key: "ASSIGNED_TO", value: "Assigned To", displayFor: "BOTH" },
  { key: "STATUS", value: "Status", displayFor: "BOTH" },
  { key: "PRIORITY", value: "Priority", displayFor: "BOTH" },
  { key: "THIRD_PARTY_NAME", value: "Third Party Name", displayFor: "THIRD_PARTY" },
  { key: "THIRD_PARTY_ROLE", value: "Third Party Role", displayFor: "THIRD_PARTY" },
  { key: "THIRD_PARTY_EMAIL", value: "Third Party Email", displayFor: "THIRD_PARTY" },
  { key: "THIRD_PARTY_PHONE_NO", value: "Third Party Phone number", displayFor: "THIRD_PARTY" },
  { key: "EXTENSION_REASON", value: "Extension Reason", displayFor: "BOTH" },
  { key: "EXTENSION_REQUESTED_BY", value: "Extension Requested By", displayFor: "BOTH" },
  { key: "PAUSED_REASON", value: "Paused Reason", displayFor: "BOTH" }
];

export interface Channel {
  id: number | string;
  label: string;
  description?: string;
  displayInForm: boolean;
  isEdited: boolean;
  isEditedInDraft?: boolean;
}

export enum NAVIGATION_TYPE {
  EMAIL = 'EMAIL',
  TASK_DETAIL = 'TASK_DETAIL',
  TEMPLATE_DETAIL = 'TEMPLATE_DETAIL',
  TEMPLATE_DRAFT_DETAIL = 'TEMPLATE_DRAFT_DETAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  INVITE_RESET_PASSWORD = "INVITE_RESET_PASSWORD",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",

}

export enum PLATFORM {
  CENTRAL_AUTH = "CENTRAL_AUTH",
  CORE = "CORE"
}


export enum SET_PASSWORD_NAVIGATION_TYPE {
  LOGIN = 1,
  FORGOT_PASSWORD = 2
}

export enum PAGINATION_SIZE {
  PAGE_SIZE_10 = 10,
  PAGE_SIZE_20 = 20
}

export const FIRST_PAGE = 1;

export enum NOTIFICATION_MESSAGE_TYPE {
  NOTIFICATION_COUNT = "NOTIFICATION_COUNT",
  DSR = "DSR",
  DSR_CONVERSATION = "DSR_CONVERSATION",
  RESPONDENT_AS_AUTHOR_SUBMITTED = "RESPONDENT_AS_AUTHOR_SUBMITTED"
}