import { ProcessedAttachment } from "./task.model";
import { TaskAttachment } from "./task.model";
import { RequestDataFulfillmentRecords } from "../../@admin-coremodels/request-management/DsrRequest";

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  type: string;
  assignTo: number;
  assigneeId?: string;
  documentAttached: string[];
}


export interface ApplicationUserTaskRequest extends CreateTaskRequest {
  stage?: string;
  documentRequired: boolean;
  userId: number;
  assignToUserType: string;
  actorType: string;
  documentAttached: string[];
  notificationData?: {
    notifyTo: string;
    subject: string;
    body: string;
  } | null;
}


export interface TaskFormData {
  title: string;
  description: string;
  dueDate: Date | null;
  priority: string;
  taskType: string;
  assigneeType: string;
  assignee: string | number;
  documentType: string;
  documentRequired: boolean;
  attachments: TaskAttachment[];
}

export interface FileUploadParams {
  fileName: string;
  contentType: string;
  purpose: string;
}
export interface DocumentListResponse {
  documents: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  totalCount?: number;
  hasMore?: boolean;
  currentPage?: number;
}
export interface DataFulfillmentRecordsResponse {
  recordList: RequestDataFulfillmentRecords[];
}

export interface DocumentAttachment {
  documentUrl: string;
  status: 'ADDED' | 'DELETED' | '';
}

export interface UpdateTaskRequest {
  taskId: number;
  title: string;
  description: string;
  priority: string;
  parentTaskId: number;
  dueDate?: string;
  assignTo: number;
  assignToUserType: string;
  documentRequired: boolean;
  documentAttached?: DocumentAttachment[];
  taskMeta?: {
    id: number;
    type: string;
  };
  notificationData?: {
    notifyTo: string;
    subject: string;
    body: string;
  } | null;
}
