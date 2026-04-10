import { Injectable, signal, computed } from '@angular/core';
import { LoadingState, ValidationError } from '../../models/task.types';
import { TaskAttachment } from '../../models/task.model';
import { RequestDataFulfillmentRecords, DsrRequestDetails, DsrFormRequestedUserDetails } from '@admin-core/models/request-management/DsrRequest';
import { User } from '@admin-core/models/user.model';
import { DocumentOption } from '../../models/dialog-config.model';

export type AssigneeType = 'APPLICATION_USER' | 'DATA_SUBJECT' | 'EXTERNAL_USER';

export interface AssigneeSelection {
  type: AssigneeType | '';
  subAssigneeId: string | number | '';
}

export interface ExternalUser {
  email: string;
  applicationUserId: number;
  name?: string;
}

export interface InternalUser {
  email: string;
  applicationUserId: number;
  name?: string;
}

export interface DocumentSearchState {
  isSearching: boolean;
  hasMore: boolean;
  currentPage: number;
  totalCount: number;
  lastSearchTerm: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskStateService {
  private readonly _submitLoading = signal<boolean>(false);
  private readonly _fileUploadInProgress = signal<boolean>(false);
  private readonly _formErrors = signal<ValidationError[]>([]);
  private readonly _uploadedFiles = signal<TaskAttachment[]>([]);
  private readonly _userMasterList = signal<User[]>([]);
  private readonly _availableDocuments = signal<DocumentOption[]>([]);
  private readonly _dataFulfillmentRecords = signal<RequestDataFulfillmentRecords[]>([]);
  private readonly _isDragOver = signal<boolean>(false);
  private readonly _isDocumentDropdownOpen = signal<boolean>(false);
  private readonly _dsrFormRequestedUser = signal<DsrFormRequestedUserDetails | null>(null);
  private readonly _dsrRequestDetails = signal<DsrRequestDetails | null>(null);
  private readonly _selectedAssigneeType = signal<AssigneeType | ''>('');
  private readonly _selectedSubAssignee = signal<string | number | ''>('');
  private readonly _currentStage = signal<string>('');

  private readonly _externalUserLoading = signal<boolean>(false);
  private readonly _externalUser = signal<ExternalUser | null>(null);
  private readonly _externalUserError = signal<string | null>(null);
  private readonly documentUploadProgress = signal<Map<string, boolean>>(new Map());

  private readonly _documentSearchTerm = signal<string>('');
  private readonly _documentSearchState = signal<DocumentSearchState>({
    isSearching: false,
    hasMore: true,
    currentPage: 1,
    totalCount: 0,
    lastSearchTerm: ''
  });
  private readonly _isDocumentAutocompleteOpen = signal<boolean>(false);
  private readonly _documentAutocompleteLoading = signal<boolean>(false);
  private readonly _selectedDocumentIds = signal<string[]>([]);

  readonly submitLoading = this._submitLoading.asReadonly();
  readonly fileUploadInProgress = this._fileUploadInProgress.asReadonly();
  readonly formErrors = this._formErrors.asReadonly();
  readonly uploadedFiles = this._uploadedFiles.asReadonly();
  readonly userMasterList = this._userMasterList.asReadonly();
  readonly availableDocuments = this._availableDocuments.asReadonly();
  readonly dataFulfillmentRecords = this._dataFulfillmentRecords.asReadonly();
  readonly isDragOver = this._isDragOver.asReadonly();
  readonly isDocumentDropdownOpen = this._isDocumentDropdownOpen.asReadonly();
  readonly dsrFormRequestedUser = this._dsrFormRequestedUser.asReadonly();
  readonly dsrRequestDetails = this._dsrRequestDetails.asReadonly();
  readonly selectedAssigneeType = this._selectedAssigneeType.asReadonly();
  readonly selectedSubAssignee = this._selectedSubAssignee.asReadonly();
  readonly currentStage = this._currentStage.asReadonly();

  readonly externalUserLoading = this._externalUserLoading.asReadonly();
  readonly externalUser = this._externalUser.asReadonly();
  readonly externalUserError = this._externalUserError.asReadonly();

  readonly documentSearchTerm = this._documentSearchTerm.asReadonly();
  readonly documentSearchState = this._documentSearchState.asReadonly();
  readonly isDocumentAutocompleteOpen = this._isDocumentAutocompleteOpen.asReadonly();
  readonly documentAutocompleteLoading = this._documentAutocompleteLoading.asReadonly();
  readonly selectedDocumentIds = this._selectedDocumentIds.asReadonly();

  private readonly _isAssigneeDropdownOpen = signal(false);
  private readonly _expandedAssigneeGroups = signal<Set<string>>(new Set());

  readonly isAssigneeDropdownOpen = this._isAssigneeDropdownOpen.asReadonly();
  readonly expandedAssigneeGroups = this._expandedAssigneeGroups.asReadonly();
  private readonly _originalFormState = signal<any>(null);
  readonly originalFormState = this._originalFormState.asReadonly();
  setOriginalFormState(state: any): void {
    this._originalFormState.set(state);
  }

  readonly hasDocumentsUploading = computed(() =>
    this.documentUploadProgress().size > 0
  );


  readonly isDataRequestGroupExpanded = computed(() =>
    this._expandedAssigneeGroups().has('DATA_SUBJECT')
  );

  readonly isApplicationUserGroupExpanded = computed(() =>
    this._expandedAssigneeGroups().has('APPLICATION_USER')
  );

  readonly hasFormErrors = computed(() => this._formErrors().length > 0);
  readonly formErrorMessage = computed(() =>
    this._formErrors().map(error => error.message).join(', ')
  );
  readonly hasUploadedFiles = computed(() => this._uploadedFiles().length > 0);
  readonly canSubmit = computed(() =>
    !this._submitLoading() && !this._fileUploadInProgress() && !this._externalUserLoading()
  );
  readonly shouldHideFileUpload = computed(() =>
    this._selectedAssigneeType() === 'DATA_SUBJECT'
  );
  readonly isDataRequestSelected = computed(() =>
    this._selectedAssigneeType() === 'DATA_SUBJECT'
  );
  readonly isExternalUserSelected = computed(() =>
    this._selectedAssigneeType() === 'EXTERNAL_USER'
  );

  readonly showSubAssigneeDropdown = computed(() =>
    this._selectedAssigneeType() === 'APPLICATION_USER'
  );

  readonly showDataSubjectAssignment = computed(() =>
    this._selectedAssigneeType() === 'DATA_SUBJECT'
  );

  readonly showExternalUserInput = computed(() =>
    this._selectedAssigneeType() === 'EXTERNAL_USER'
  );
  readonly hasValidAssigneeSelection = computed(() => {
    const type = this._selectedAssigneeType();
    if (type === 'EXTERNAL_USER') {
      return this._externalUser() !== null;
    }
    return type !== '' && this._selectedSubAssignee() !== '';
  });

  readonly filteredDocuments = computed(() => {
    const searchTerm = this._documentSearchTerm().toLowerCase();
    if (!searchTerm.trim()) {
      return this._availableDocuments();
    }
    return this._availableDocuments().filter(doc =>
      doc.name.toLowerCase().includes(searchTerm)
    );
  });

  readonly selectedDocuments = computed(() => {
    const selectedIds = this._selectedDocumentIds();
    return this._availableDocuments().filter(doc => selectedIds.includes(doc.id));
  });

  readonly selectedDocumentCount = computed(() => this._selectedDocumentIds().length);

  readonly canLoadMoreDocuments = computed(() => {
    const state = this._documentSearchState();
    return state.hasMore && !state.isSearching;
  });

  readonly documentSearchPlaceholder = computed(() => {
    const state = this._documentSearchState();
    if (state.isSearching) {
      return 'Searching...';
    }
    if (state.totalCount > 0) {
      return `Search ${state.totalCount} documents...`;
    }
    return 'Search documents...';
  });


  private readonly _internalUserLoading = signal<boolean>(false);
  private readonly _internalUserCreated = signal<User | null>(null);
  private readonly _internalUserError = signal<string | null>(null);
  private readonly _internalUserSearchTerm = signal<string>('');
  private readonly _showCreateInternalUser = signal<boolean>(false);

  readonly internalUserLoading = this._internalUserLoading.asReadonly();
  readonly internalUserCreated = this._internalUserCreated.asReadonly();
  readonly internalUserError = this._internalUserError.asReadonly();
  readonly internalUserSearchTerm = this._internalUserSearchTerm.asReadonly();
  readonly showCreateInternalUser = this._showCreateInternalUser.asReadonly();

  readonly filteredInternalUsers = computed(() => {
    const searchTerm = this._internalUserSearchTerm().toLowerCase();
    const userList = this._userMasterList();

    if (!searchTerm.trim()) {
      return userList;
    }

    return userList.filter(user => {
      const fullName = `${user.displayName}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
  });

  setInternalUserLoading(loading: boolean): void {
    this._internalUserLoading.set(loading);
  }

  setInternalUserCreated(user: User | null): void {
    this._internalUserCreated.set(user);
    this._internalUserError.set(null);
  }

  setInternalUserError(error: string | null): void {
    this._internalUserError.set(error);
    this._internalUserLoading.set(false);
  }

  setInternalUserSearchTerm(term: string): void {
    this._internalUserSearchTerm.set(term);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);
    const userExists = this._userMasterList().some(user =>
      user.email?.toLowerCase() === term.toLowerCase()
    );

    this._showCreateInternalUser.set(isEmail && !userExists);
  }

  clearInternalUserState(): void {
    this._internalUserCreated.set(null);
    this._internalUserError.set(null);
    this._internalUserLoading.set(false);
    this._internalUserSearchTerm.set('');
    this._showCreateInternalUser.set(false);
  }

  setSubmitLoading(loading: boolean): void {
    this._submitLoading.set(loading);
  }

  setFileUploadInProgress(inProgress: boolean): void {
    this._fileUploadInProgress.set(inProgress);
  }

  setFormErrors(errors: ValidationError[]): void {
    this._formErrors.set(errors);
  }

  addFormError(error: ValidationError): void {
    this._formErrors.update(errors => [...errors, error]);
  }

  clearFormErrors(): void {
    this._formErrors.set([]);
  }

  setUploadedFiles(files: TaskAttachment[]): void {
    this._uploadedFiles.set(files);
  }

  addUploadedFile(file: TaskAttachment): void {
    this._uploadedFiles.update(files => [...files, file]);
  }

  removeUploadedFile(index: number): void {
    this._uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  setUserMasterList(users: User[]): void {
    this._userMasterList.set(users);
  }


  setDocumentUploadInProgress(documentId: string, inProgress: boolean): void {
    this.documentUploadProgress.update(map => {
      const newMap = new Map(map);
      if (inProgress) {
        newMap.set(documentId, true);
      } else {
        newMap.delete(documentId);
      }
      return newMap;
    });
  }

  isDocumentUploading(documentId: string): boolean {
    return this.documentUploadProgress().get(documentId) || false;
  }

  resetDocumentUploadProgress(): void {
    this.documentUploadProgress.set(new Map());
  }











  setAvailableDocuments(documents: DocumentOption[]): void {
    this._availableDocuments.set(documents);
  }

  setDataFulfillmentRecords(records: RequestDataFulfillmentRecords[]): void {
    this._dataFulfillmentRecords.set(records);
  }

  setDragOver(isDragOver: boolean): void {
    this._isDragOver.set(isDragOver);
  }

  setDocumentDropdownOpen(isOpen: boolean): void {
    this._isDocumentDropdownOpen.set(isOpen);
  }

  setDsrFormRequestedUser(user: DsrFormRequestedUserDetails | null): void {
    this._dsrFormRequestedUser.set(user);
  }

  setDsrRequestDetails(details: DsrRequestDetails | null): void {
    this._dsrRequestDetails.set(details);
  }

  setSelectedAssigneeType(type: AssigneeType | ''): void {
    this._selectedAssigneeType.set(type);
    this._selectedSubAssignee.set('');

    if (type === 'DATA_SUBJECT') {
      this._uploadedFiles.set([]);
    }

    if (type !== 'EXTERNAL_USER') {
      this._externalUser.set(null);
      this._externalUserError.set(null);
    }
  }

  setSelectedSubAssignee(subAssigneeId: string | number | ''): void {
    this._selectedSubAssignee.set(subAssigneeId);
  }

  setCurrentStage(stage: string): void {
    this._currentStage.set(stage);
  }

  setExternalUserLoading(loading: boolean): void {
    this._externalUserLoading.set(loading);
  }

  setExternalUser(user: ExternalUser | null): void {
    this._externalUser.set(user);
    this._externalUserError.set(null);
  }


  setExternalUserError(error: string | null): void {
    this._externalUserError.set(error);
    this._externalUserLoading.set(false);
  }

  clearExternalUserError(): void {
    this._externalUserError.set(null);
  }
  clearExternalUserState(): void {
    this._externalUser.set(null);
    this._externalUserError.set(null);
    this._externalUserLoading.set(false);
  }

  setDocumentSearchTerm(term: string): void {
    this._documentSearchTerm.set(term);
  }


  setDocumentSearchState(state: DocumentSearchState): void {
    this._documentSearchState.set(state);
  }

  setDocumentAutocompleteOpen(isOpen: boolean): void {
    this._isDocumentAutocompleteOpen.set(isOpen);
  }

  setDocumentAutocompleteLoading(isLoading: boolean): void {
    this._documentAutocompleteLoading.set(isLoading);
  }

  setSelectedDocumentIds(documentIds: string[]): void {
    this._selectedDocumentIds.set(documentIds);
  }

  addSelectedDocument(documentId: string): void {
    this._selectedDocumentIds.update(ids => {
      if (!ids.includes(documentId)) {
        return [...ids, documentId];
      }
      return ids;
    });
  }

  removeSelectedDocument(documentId: string): void {
    this._selectedDocumentIds.update(ids => ids.filter(id => id !== documentId));
  }

  toggleDocumentSelection(documentId: string): void {
    this._selectedDocumentIds.update(ids => {
      if (ids.includes(documentId)) {
        return ids.filter(id => id !== documentId);
      } else {
        return [...ids, documentId];
      }
    });
  }

  clearSelectedDocuments(): void {
    this._selectedDocumentIds.set([]);
  }

  resetDocumentSearch(): void {
    this._documentSearchTerm.set('');
    this._documentSearchState.set({
      isSearching: false,
      hasMore: true,
      currentPage: 1,
      totalCount: 0,
      lastSearchTerm: ''
    });
    this._isDocumentAutocompleteOpen.set(false);
    this._documentAutocompleteLoading.set(false);
    this._availableDocuments.set([]);
  }

  getAssigneeSelection(): AssigneeSelection {
    return {
      type: this._selectedAssigneeType(),
      subAssigneeId: this._selectedSubAssignee()
    };
  }

  setAssigneeSelection(selection: AssigneeSelection): void {
    this._selectedAssigneeType.set(selection.type);
    this._selectedSubAssignee.set(selection.subAssigneeId);
  }

  getFormUserId(): number | null {
    const details = this._dsrRequestDetails();
    return details?.dsrDetails?.formUserId || null;
  }

  reset(): void {
    this._submitLoading.set(false);
    this._fileUploadInProgress.set(false);
    this._formErrors.set([]);
    this._uploadedFiles.set([]);
    this._isDragOver.set(false);
    this._isDocumentDropdownOpen.set(false);
    this._selectedAssigneeType.set('');
    this._selectedSubAssignee.set('');
    this._currentStage.set('');
    this._dsrRequestDetails.set(null);
    this._originalFormState.set(null);
    this.clearExternalUserState();
    this.resetAssigneeDropdownState();
    this.resetDocumentSearch();
  }
  setAssigneeDropdownOpen(isOpen: boolean): void {
    this._isAssigneeDropdownOpen.set(isOpen);
  }
  toggleAssigneeGroupExpansion(groupType: string): void {
    const currentExpanded = new Set(this._expandedAssigneeGroups())

    if (currentExpanded.has(groupType)) {
      currentExpanded.delete(groupType);
    } else {
      currentExpanded.add(groupType);
    }

    this._expandedAssigneeGroups.set(currentExpanded);
  }

  setExpandedAssigneeGroups(groups: Set<string>): void {
    this._expandedAssigneeGroups.set(new Set(groups));
  }

  expandAssigneeGroup(groupType: string): void {
    const currentExpanded = new Set(this._expandedAssigneeGroups());
    currentExpanded.add(groupType);
    this._expandedAssigneeGroups.set(currentExpanded);
  }

  collapseAssigneeGroup(groupType: string): void {
    const currentExpanded = new Set(this._expandedAssigneeGroups());
    currentExpanded.delete(groupType);
    this._expandedAssigneeGroups.set(currentExpanded);
  }

  collapseAllAssigneeGroups(): void {
    this._expandedAssigneeGroups.set(new Set());
  }

  expandAllAssigneeGroups(): void {
    this._expandedAssigneeGroups.set(new Set(['DATA_SUBJECT', 'APPLICATION_USER']));
  }

  resetAssigneeDropdownState(): void {
    this._isAssigneeDropdownOpen.set(false);
    this._expandedAssigneeGroups.set(new Set());
  }

  initializeAssigneeDropdown(defaultExpandedGroups: string[] = []): void {
    this._isAssigneeDropdownOpen.set(false);
    this._expandedAssigneeGroups.set(new Set(defaultExpandedGroups));
  }
}
