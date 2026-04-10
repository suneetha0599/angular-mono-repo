import { MatDateFormats } from '@angular/material/core';

export const QUESTION_OPERATOR_MAP: Record<string, string[]> = {
  TEXT: ['EQUALS', 'NOT_EQUALS', 'NOT_EMPTY'],
  TEXTAREA: ['EQUALS', 'NOT_EQUALS', 'NOT_EMPTY'],
  NUMERIC: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'ANY_OF', 'NOT_EMPTY'],
  DATE_ONLY: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NOT_EMPTY'],
  SINGLE_SELECT: ['EQUALS', 'NOT_EQUALS', 'ANY_OF', 'NOT_EMPTY'],
  RADIO: ['EQUALS', 'NOT_EQUALS', 'ANY_OF', 'NOT_EMPTY'],
  MULTI_SELECT: ['ANY_OF', 'ALL_OF', 'NONE_OF', 'NOT_EMPTY'],
  CHECK_BOX: ['ANY_OF', 'ALL_OF', 'NONE_OF', 'NOT_EMPTY'],
  FILE_UPLOAD: ['NOT_EMPTY'],
  YES_NO: ['EQUALS', 'NOT_EQUALS', 'ANY_OF', 'NOT_EMPTY'],
};

export const SELECT_TYPES = [
  'SINGLE_SELECT',
  'RADIO',
  'MULTI_SELECT',
  'CHECK_BOX',
  'YES_NO'
];

export const SINGLE_VALUE_TYPES = [
  'SINGLE_SELECT',
  'RADIO',
  'YES_NO'
];

export const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'l, LTS' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

export type TriggerType = 'display' | 'risk' | 'assessment' | 'task';

export const TRIGGER_OPTIONS: { key: TriggerType; label: string }[] = [
  { key: 'display', label: 'Display' },
  { key: 'risk', label: 'Risk' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'task', label: 'Task' }
];

export enum LikelihoodLevel {
  REMOTE = 'REMOTE',
  POSSIBLE = 'POSSIBLE',
  PROBABLE = 'PROBABLE'
}
export const likelihood = [
  { value: LikelihoodLevel.REMOTE, label: 'Remote' },
  { value: LikelihoodLevel.POSSIBLE, label: 'Possible' },
  { value: LikelihoodLevel.PROBABLE, label: 'Probable' },
]
export enum ImpactLevel {
  MINIMUM = 'MINIMUM',
  SIGNIFICANT = 'SIGNIFICANT',
  SEVERE = 'SEVERE'
}
export const impactLevels = [
  { value: ImpactLevel.MINIMUM, label: 'Minimum' },
  { value: ImpactLevel.SIGNIFICANT, label: 'Significant' },
  { value: ImpactLevel.SEVERE, label: 'Severe' }
];


export const RISK_OPTIONS = [
  { key: 'AVOID', label: 'Avoid' },
  { key: 'ACCEPT', label: 'Accept' },
  { key: 'MITIGATE', label: 'Mitigate' },
  { key: 'TRANSFER', label: 'Transfer' }
];

export const RESIDUAL_RISK = [
  { key: 'HIGH', label: 'High' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
]

export const RISK_EFFECTS = [
  { key: 'REDUCED', label: 'Reduced' },
  { key: 'ELIMINATED', label: 'Eliminated' },
  { key: 'ACCEPTED', label: 'Accepted' },
]

export const LIKELIHOOD_SCORE_MAP: Record<string, number> = {
  REMOTE: 1,
  POSSIBLE: 2,
  PROBABLE: 3
};

export const IMPACT_SCORE_MAP: Record<string, number> = {
  MINIMUM: 1,
  SIGNIFICANT: 2,
  SEVERE: 3
};

export const RISK_LEVEL_THRESHOLDS = {
  HIGH: 6,
  MEDIUM: 3
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
