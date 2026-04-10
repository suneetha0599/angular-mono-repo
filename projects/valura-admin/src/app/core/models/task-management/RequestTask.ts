export interface TaskMeta {
  id: number;
  type: 'QUESTION' | 'MITIGATION' | string;
}
export interface TaskDetails {
  taskId: number;
  title: string;
  description: string;
  status: string;
  parentTaskId: number;
  assignToUserId: number;
  isAssigned: boolean
  dueDate: string;
  createdDate: string;
  taskType: string;
  priority: string;
  documentRequired: boolean;
  documentAttached: any[];
  taskResolution: TaskResolution[];
  lastUpdatedOn: string;
  isCompleted: boolean;
  assignToUserName: string;
  assignToUserType: string;
  state: string;
  taskMeta?: TaskMeta;
  taskLabelMappings?: TaskLabel[];
  dsrDetail: DsrDetails;
  levelOfEffort: string;
  createdBy: number;
  createdByUserName?: string;
  visibleFieldNames: any;
  attachedToId?: number;
}

export interface TaskLabel {
  labelId?: number;
  labelName?: string;
  name?: string;
}

export interface TaskResolution {
  documentUploaded: DocumentUpload[];
  remarks: string;
  remarkedAt: string;
  remarkedBy: string;
  reopenRemarks: string
}

export interface DsrDetails {
  id: number;
  channel: string
  description: string
  email: string
  expiresOn: string
  name: string;
  phoneNumber: string;
  requestType: string;
  requestedOn: string;
  role: string;
  through: string;
  documentAttached: any[];
  dataSubjectType: string;
  country?: string
  thirdPartyRole: string;
  thirdPartyPhoneNo?: string
  thirdPartyEmail?: string
  thirdPartyName?: string
  documentsList: any[]
  isRequestedByThirdParty?: boolean
  dsrFormUserDetails?: {
    pid: string;
    pidType: string;
  };
}

export interface DocumentUpload {
  fileKey: string;
  remark: string;
  uploadedByUsername: string;
  uploadedAt: string;
  uploadedBy: number;
  formattedUploadedAt?: string;
}

export interface documentAttached {
  documentUrl: string
}

export interface SelectedFile {
  file: File;
  remark: string;
}

export interface TaskId {
  id: number;
}