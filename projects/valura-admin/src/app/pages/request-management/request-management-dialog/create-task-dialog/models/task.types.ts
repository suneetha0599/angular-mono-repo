export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DialogType = 'DATA_FULFILLMENT_TASK' | 'TASK_MANAGEMENT_TASK' | 'DATA_FULFILLMENT_VIEW';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ValidationError = {
  field: string;
  message: string;
};
