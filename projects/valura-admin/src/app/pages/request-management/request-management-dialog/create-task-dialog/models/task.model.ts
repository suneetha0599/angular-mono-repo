import { PriorityLevel } from "./task.types";


export interface TaskAttachment {
  file: File;
  fileName: string;
  fileKey: string;
  presignedUrl: string;
  fileSize?: number;
  serverPath?: string;
  eTag?: string;
  isExisting?: boolean;
}
export interface ProcessedAttachment {
  fileKey: string;
  eTag: string;
  fileName: string;
  fileSize: number;
  serverPath?: string;
}
export interface UploadValidation {
  isValid: boolean;
  hasFileKey: boolean;
  hasETag: boolean;
  hasValidSize: boolean;
  errorMessage?: string;
}
export interface RequestDataFulfillmentRecords {
  id: string;
  exempted: boolean;
  approved: boolean;
  approvalRequired: boolean;
  actions?: string;
  actionLoading?: boolean;
}
