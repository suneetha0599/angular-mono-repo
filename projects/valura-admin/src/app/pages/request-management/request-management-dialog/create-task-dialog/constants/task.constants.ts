import { PriorityOption, } from '../models/dialog-config.model';

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' }
];

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  SUPPORTED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
};

export const DOCUMENT_CONFIG = {
  FIRST_PAGE: 1,
  PAGE_SIZE: 10
};

export const FORM_VALIDATION_CONFIG = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500
};

export const UI_CONFIG = {
  DIALOG_MIN_WIDTH: '700px',
  DIALOG_MAX_WIDTH: '780px',
  DIALOG_MAX_HEIGHT: '90vh',
  MAX_VISIBLE_DOCUMENT_NAMES: 3
};

export const DATE_FORMATS = {
  DISPLAY_FORMAT: 'DD/MM/YYYY',
  API_FORMAT: 'YYYY-MM-DDTHH:mm:ss',
  MOMENT_INPUT_FORMAT: 'l, LTS'
};

export const TOOLTIP_MESSAGES = {
  FILE_UPLOAD: 'File Upload\nThis data is collected for task documentation purposes',
  DOCUMENT_SELECTION: 'Select documents to associate with this task',
  PRIORITY_SELECTION: 'Set task priority level',
  DUE_DATE: 'Select when this task should be completed'
};

export const STAGE_ENUM = {
  VERIFICATION: 'VERIFICATION',
  VALIDATION: 'VALIDATION',
  DATA_MAPPING: 'DATA_MAPPING',
  DATA_FULFILLMENT: 'DATA_FULFILLMENT'
} as const;

export type StageEnum = typeof STAGE_ENUM[keyof typeof STAGE_ENUM];

export const STAGE_ENUM_QUERY = {
  VERIFICATION: 'VERIFICATION',
  VALIDATION: 'VALIDATION',
  DATA_MAPPING: 'DATA_MAPPING',
  DATA_FULFILLMENT: 'DATA_FULFILLMENT'
} as const;

export const STAGE_ENUM_CREATE = {
  VERIFICATION: 'VERIFICATION',
  VALIDATION: 'VALIDATION',
  DATA_MAPPING: 'DATA_MAPPING',
  DATA_FULFILLMENT: 'DATA_FULFILLMENT'
} as const;


export const convertToApiStageFormat = (stage: string): string => {
  const normalizedStage = stage.toUpperCase();

  const validApiStages: Record<string, string> = {
    // Direct mappings
    'VERIFICATION': 'VERIFICATION',
    'VALIDATION': 'VALIDATION',
    'DATA_MAPPING': 'DATA_MAPPING',
    'DATA_FULFILLMENT': 'DATA_FULFILLMENT',

    // RequestTaskStage to backend enum mappings
    'REQUEST_VERIFICATION': 'VERIFICATION',
    'REQUEST_VALIDATION': 'VALIDATION',
    'DATA_DISCOVERY': 'DATA_MAPPING',
    'REQUEST_FULFILLMENT': 'DATA_FULFILLMENT'
  };

  return validApiStages[normalizedStage] || 'VERIFICATION';
};


export const convertToQueryStageFormat = (stage: string): string => {
  const normalizedStage = stage.toUpperCase();

  const validQueryStages: Record<string, string> = {
    'VERIFICATION': STAGE_ENUM_QUERY.VERIFICATION,
    'VALIDATION': STAGE_ENUM_QUERY.VALIDATION,
    'DATA_MAPPING': STAGE_ENUM_QUERY.DATA_MAPPING,
    'DATA_FULFILLMENT': STAGE_ENUM_QUERY.DATA_FULFILLMENT
  };

  return validQueryStages[normalizedStage] || STAGE_ENUM_QUERY.VERIFICATION;
};
