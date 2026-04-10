import { DsrRequestDetails } from "./DsrRequest";
export interface ClarificationComment {
  id: number;
  content: string;
  authorId: number;
  author: string;
  timestamp: string;
  avatar: string;
  mention?: string;
  isReply: boolean;
  parentId?: number;
  attachments: ClarificationCommentAttachment[];
  metadata: { mentionedUserIds: number[] };
  createdAt: string;
  updatedAt?: string;
}

export interface ClarificationCommentAttachment {
  fileKey: string;
  eTag: string;
  fileName?: string;
  fileSize?: number;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
  attachments: ClarificationCommentAttachment[];
  metadata: { mentionedUserIds: number[] };
}

export interface Clarification {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  assignedToId: number;
  attachments: string[];
  resolved: boolean;
  comments: string;
  dueDate: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  name: string;
  displayName?: string;
  email?: string;
}

export interface SelectedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  id: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}
export interface DsrRequestAttachment {
  eTag: string;
  fileName: string;
  filePath: string;
}

export interface DialogData {
  requestRid: number;
  dsrFormId: number;
  dsrRequestDetails?: DsrRequestDetails;
}
