export interface DsrRequest {
  id: number;
  firstName: string;
  lastName: string
  requestedByType: string
  requestType: string;
  status: string
  state: string
  assignedTo: string;
  requestedOn: string;
  channel: string
  timeLeft: number;
  assignedToId: number;
  priority: string
  isLocked: boolean
  lockType: string
}


export interface DsrRequestDetails {
  rid?: number;
  thirdPartyVerifiedBy: string;
  dsVerifiedBy: string;
  stageMeta: StageMeta;
  warningMessages: WarningMessage[];
  dsrDetails: DsrDetails;
  dsrFormRequestedUserDetails: DsrFormRequestedUserDetails;
  extensionDetails: ExtensionDetails;
  requestCompleted: boolean;
  assigneeDetails: AssigneeDetails;
  processingDetails: ProcessingDetails;
  pendingTaskCount: number
  sendBackDocuments: boolean;
  completeResolution: boolean;
  specialDeletionCase: boolean;
  hideRequestInfo: boolean;
  hideImportNeeded: boolean;
}

export interface RequestTaskListParams {
  page: number;
  size: number;
  stage: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface StageMeta {
  validation: number;
  dataMapping: number;
  verification: number;
  auditAndClose: number;
  dataFulfilment: number;
}

export interface WarningMessage {
  color: string;
  message: string;
  hideMessage: boolean
}

export interface Declaration {
  declaration: string;
  declarationTimestamp: string;
}

export interface DsrDetails {
  formId: number;
  formUserId: number;
  platform: string;
  isRequestedByThirdParty: boolean;
  requestedByType: string;
  rightName: string;
  thirdPartyFirstName: string;
  thirdPartyLastName: string;
  thirdPartyRole: string;
  countryId: number;
  dataSubjectTypeId: number;
  dataSubjectType: string;
  firstPartyFirstName: string;
  firstPartyLastName: string;
  firstPartyPhoneNumber: string;
  firstPartyEmail: string;
  channel: string;
  rightId: number;
  requestDescription: string;
  requestResolutionDate: string;
  priority: string;
  status: string;
  state: string;
  isEscalated: boolean;
  declarations: Declaration[];
  thirdPartyEmail: string;
  thirdPartyPhoneNumber: string;
  requestedOn: string;
  isPaused?: boolean;
  isLocked?: boolean
  lockType: string
  canReopen: boolean
}

export interface DsrFormRequestedUserDetails {
  pid: string;
  pidType: string;
}

export interface ExtensionDetails {
  isExtended: boolean;
  extensionDays: number;
  extensionReason: string;
  extensionRequestedBy: number;
  extensionRequestedByUserName: string;
  remainingExtensionDays?: number;
  pausedReason?: string
}

export interface AssigneeDetails {
  id: number;
  name: string;
  email: string
}

export interface ValidationQuestion {
  id: number;
  question: string;
  optionName: string[];
  questionType: string;
  typeOfOptions: string[];
  helper?: string;
  legalReferenceJson: string;
  shouldDisplayChildQuestion: boolean;
  answer: string
  remarks: string
  provision: string
}

export interface ValidationSection {
  sectionName: string;
  validationQuestions: ValidationQuestion[];
}

export interface AssetInvolved {
  purpose: string;
  assetName: string;
  assetType: string;
}

export interface PdMapping {
  id: number;
  name: string;
  category: string;
  assetInvolvedList: AssetInvolved[];
}

export interface DataMapping {
  pdMappingList: PdMapping[];
  isImportNeeded: boolean;
}

export interface ProcessingDetails {
  validation: Validation;
  dataMapping: DataMapping;
  verification: Verification
}

export interface Validation {
  generalValidationQuestion: ValidationQuestion[]
  specificValidationQuestion: ValidationQuestion[]
  validationQuestion: ValidationSection[];
  rejectionReason: string
  validateRequest: boolean
}

export interface Verification {
  dsVerificationDetails: DsVerificationDetails
  thirdPartyVerificationDetails: ThirdPartyVerificationDetails
}

export interface DsVerificationDetails {
  identityVerifiedBy: {
    userId: number
    userType: string
    displayName: string
  };
  identityVerifiedDate: string;
  modeOfVerification: string;
  remarks: string
}

export interface ThirdPartyVerificationDetails {
  identityVerifiedBy: {
    userId: number
    userType: string
    displayName: string
  };
  identityVerifiedDate: string;
  modeOfVerification: string;
  remarks: string
  isVerified: string
}


export interface RequestDocuments {
  documentName: string;
  id: number
  name: string;
  url: string;
  createdAt: string;
  createdByUserType: string;
  updatedAt: string;
  through: string
  description: string
  selected: boolean
  documentRequired: boolean
  loading: boolean
  uploadedOn: string
  documentUrl: string
}

export interface DsrPageRequest {
  requestRid: number;
}
export interface RequesterType {
  name: string;
  id: number;
}

export interface CreateDsrRequestPayload {
  isDraft: boolean;
  formId: number;
  formUserId: number;
  requestedByType: string;
  platform: number;
  thirdPartyFirstName?: string;
  thirdPartyLastName?: string;
  thirdPartyRole?: string;
  countryId: number;
  dataSubjectTypeId: number;
  firstPartyFirstName: string;
  firstPartyLastName: string
  firstPartyEmail: string;
  firstPartyPhoneNumber: string;
  channel: string;
  requestRightId: number;
  requestDescription: string;
  attachments: Attachment[];
  thirdPartyEmail: string,
  thirdPartyPhoneNumber: string,
  declarations: Declaration[];
  thirdPartyVerificationDocuments: Attachment[];
  shouldLock: boolean
}


export class Attachment {
  filePath: string;
  eTag: string;
  fileName: string;

  constructor({
    filePath = '',
    eTag = '',
    fileName = ''
  }: Partial<Attachment> = {}) {
    this.filePath = filePath;
    this.eTag = eTag;
    this.fileName = fileName;
  }
}

export interface RequestDataFulfillmentRecords {
  id: number;
  name: string;
  category: string;
  foundIn: string;
  purpose: string;
  exempted: boolean;
  justification: string;
  approvalRequired: boolean;
  approved: boolean;
  actions: string
  selected: boolean
  actionLoading: boolean
  isLoading: boolean
}


export interface RequestClarification {
  clarificationId: number;
  clarificationTitle: string;
  status: string;
  assignedBy: number;
  attributesCount: number;
  exempted: string;
  updatedOn: string;
  timeLeft: number;
  formId: number;
}

export interface RequestTask {
  taskId: number;
  title: string;
  description: string;
  status: string;
  parentTaskId: number;
  assignToUserId: number;
  documentRequired: boolean;
  dueDate: string;
  assignToUserType: string;
  taskDetails: any;
  completed: boolean;
  processed: boolean;
  taskResolutionDetails: any;
  state: string;
  subTasks: RequestTask[];
  taskActionLoading: boolean;
  isLoading: boolean;
  attributesCount: number;
  exemptedCount: number;
  priority?: string;
  taskType?: string;
  documents?: string[];
  attachments?: any[];
  assigneeType?: string;
  assignedBy: string;
  assignToUserName?: string;
  createdDate?: string;
  lastUpdatedOn?: string;
  isCompleted?: boolean;
  documentAttached?: any[];
  documentUploaded?: any[];
  remarks?: string;
  updatedDate?: string;
}
export interface AuditLogs {
  id: string;
  module: string
  entityId: string;
  entityType: string;
  state: string;
  action: string;
  actorId: number;
  actorType: string;
  metadata: any;
  timestamp: string;
  actorName: string
}

export interface DraftRequestDetails {
  id: number;
  formUserId: number;
  requestedByType: string;
  platform: string;
  thirdPartyFirstName?: string;
  thirdPartyLastName?: string;
  thirdPartyRole: string;
  thirdPartyEmail: string
  thirdPartyPhoneNumber: string
  countryId: number;
  dataSubjectTypeId: number;
  firstPartyFirstName: string;
  firstPartyLastName: string
  firstPartyPhoneNumber: string;
  firstPartyEmail: string;
  channel: string;
  requestTypeId: number;
  requestDescription: string;
  attachments: Attachment[];
  declarations: any[];
  thirdPartyAttachments: Attachment[];
  shouldLock: boolean
}
