import { CONFIGURATION_SUB_DOMAIN } from "./constants";

//Status
export const STATUS_SUCCESS = true
export const STATUS_FAILED = false
export const STATUS_NO_RECORDS = 0
export const HTTP_STATUS_SUCCESS = 200


//API
export const EXTERNAL_AUTH_LOGIN = 'external-login/initiate';
export const EXTERNAL_AUTH_VALIDATE = 'external-login';
export const INTERNAL_AUTH_LOGIN = 'internal-login/initiate';
export const INTERNAL_AUTH_VALIDATE = 'internal-login';
export const AUTH_LOGIN = "login"
export const AUTH_FORGOT_PASSWORD = "password/forgot"
export const AUTH_RESET_PASSWORD = "auth/user/reset-password"
export const AUTH_PASSWORD = "password"
export const AUTH_VERIFY_OTP = "auth/verify-otp"
export const AUTH_RESEND_OTP = "auth/resend-otp"
export const AUTH_UPDATE_PASSWORD = "auth/update-new-password"
export const AUTH_REFRESH_TOKEN = 'refresh-token'
export const AUTH_ROLE_API = "central-auth/roles";
export const AUTH_USER_API = 'central-auth/users';
export const AUTH_DEPARTMENT_API = 'central-auth/departments';
export const IDP_LIST = 'idp'

export const COUNTRIES_LIST = `${CONFIGURATION_SUB_DOMAIN}/country`;
export const COUNTRIES_FOR_ACT = (actId: number) => `${CONFIGURATION_SUB_DOMAIN}/country/for-act/${actId}`;
export const COUNTRY_BY_ID = (countryId: number) => `${CONFIGURATION_SUB_DOMAIN}/country/${countryId}`;
export const ASSIGN_ROLE = 'users/assign-roles';
export const UNASSIGN_ROLE = 'users/unassign-roles';
export const PRIMITIVES = "central-auth/primitives";
export const ASSIGN_DEPARTMENT = (id: number) => `${AUTH_DEPARTMENT_API}/${id}/users`;
export const UNASSIGN_DEPARTMENT = (id: number) => `${AUTH_DEPARTMENT_API}/${id}/users`;

export const CREATE_RISK = "data-inventory/risk";
export const RISK_LIST = "data-inventory/risk/category";
export const CREATE_PARAMETER = `${CONFIGURATION_SUB_DOMAIN}/parameter`;
export const GET_PARAMETER = `${CONFIGURATION_SUB_DOMAIN}/parameter`;

export const KEY_NO_AUTH = 'NO_AUTH'

export const BPA = "bpa";
export const CREATE_TEMPLATE = "assessment/template";
export const CREATE_VENDOR_TEMPLATE = "assessment/template/vendor";
export const CREATE_ASSESSMENT = "assessment";
export const CREATE_VENDOR_ASSESSMENT = "assessment/vendor";
export const GET_OR_CREATE_USER = "internal-auth/get-or-create";
export const GET_OR_CREATE_INTERNAL_USER = "central-auth/internal-user/get-or-create";
export const GET_OR_CREATE_EXTERNAL_USER = "central-auth/external-user/get-or-create";
export const ASSESSMENT_TASK = "assessment/task";
export const ASSESSMENT_VENDOR_TASK = "assessment/vendor-task";
export const ASSESSMENT_RISK = "assessment/risks";
export const ASSESSMENT_VENDOR_RISK = "assessment/vendor-risks";

export type UserPurpose =
  | 'ASSESSMENT_AUTHOR'
  | 'ASSESSMENT_APPROVER'
  | 'ASSESSMENT_RESPONDENT'
  | 'VENDOR_ASSESSMENT_RESPONDENT'
  | 'ASSESSMENT_TASK'
  | 'VENDOR_ASSESSMENT_TASK'
  | 'BPA_PROCESS_OWNER'
  | 'DSR_TASK';

export const USER_PURPOSE = {
  ASSESSMENT_AUTHOR: 'ASSESSMENT_AUTHOR' as UserPurpose,
  ASSESSMENT_APPROVER: 'ASSESSMENT_APPROVER' as UserPurpose,
  ASSESSMENT_RESPONDENT: 'ASSESSMENT_RESPONDENT' as UserPurpose,
  ASSESSMENT_TASK: 'ASSESSMENT_TASK' as UserPurpose,
  VENDOR_ASSESSMENT_TASK: 'VENDOR_ASSESSMENT_TASK' as UserPurpose,
  BPA_PROCESS_OWNER: 'BPA_PROCESS_OWNER' as UserPurpose,
  DSR_TASK: 'DSR_TASK' as UserPurpose,
  VENDOR_ASSESSMENT_RESPONDENT: 'VENDOR_ASSESSMENT_RESPONDENT' as UserPurpose,
};

export const ACCEPT_RESPONSE = (questionId: number) => `assessment/respondent/${questionId}/accept`;
export const REQUEST_JUSTIFICATION = (questionId: number) => `assessment/respondent/${questionId}/justification`;
export const UPDATE_RESPONSE = (questionId: number) => `assessment/respondent/${questionId}`;


export const ASSESSMENT_TYPE = `${CONFIGURATION_SUB_DOMAIN}/assessment-type`;
export const ADD_TRIGGER = (actId: number) => `${CONFIGURATION_SUB_DOMAIN}/triggers/${actId}`;
export const EDIT_DELETE_TRIGGER = (triggerId: number) => `${CONFIGURATION_SUB_DOMAIN}/triggers/${triggerId}`;

export const ADD_VALIDATION_QUESTION = `${CONFIGURATION_SUB_DOMAIN}/validation-question`;
export const EDIT_DELETE_VALIDATION_QUESTION = (questionId: number) => `${CONFIGURATION_SUB_DOMAIN}/validation-question/${questionId}`;

export const SYNC_STATUS = `configuration/sync-status`
export const NEEDS_ACTIONS = `notifications/needs-action`

export const NOTIFICATION_LIST = 'notification-service/notification';
export const NOTIFICATION_UNREAD_COUNT = 'notification-service/notification/unread-count';
export const NOTIFICATION_MARK_READ = 'notification-service/receipt/mark-read';
export const NOTIFICATION_MARK_ALL_READ = 'notification-service/receipt/mark-all-read';

// Token Key
export const KEY_X_AUTH_TOKEN = 'X-Auth-Token'
export const KEY_X_REFRESH_TOKEN = 'X-Auth-Refresh-Token'
export const KEY_AUTHORIZATION = "Authorization"
export const ETAG = 'ETag'

//Open URL list
export const OPEN_URL_LIST = [AUTH_LOGIN, AUTH_FORGOT_PASSWORD, AUTH_RESET_PASSWORD, AUTH_REFRESH_TOKEN, EXTERNAL_AUTH_LOGIN, EXTERNAL_AUTH_VALIDATE, INTERNAL_AUTH_LOGIN, INTERNAL_AUTH_VALIDATE]

