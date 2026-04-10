import { Injectable, inject } from '@angular/core';
import { TaskApiService } from '../task-api/task-api.service';
import { TaskStateService } from '../task-state/task-state.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { DOCUMENT_CONFIG } from '../../constants/task.constants';
import { DocumentOption } from '../../models/dialog-config.model';

export interface DocumentSearchResult {
  documents: DocumentOption[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly taskApiService = inject(TaskApiService);
  private readonly taskStateService = inject(TaskStateService);
  private readonly snackbarService = inject(SnackbarService);

  private uploadedDocumentUrls = new Map<string, string>();


  private currentRequestRid: number | null = null;
  private isLoading: boolean = false;
  private isRiskMitigation: boolean = false;



  getUploadedDocumentKeys(): string[] {
    return [];
  }

  async processSelectedDocumentsForSubmission(): Promise<string[]> {
    const selectedDocumentIds = this.taskStateService.selectedDocumentIds();
    const documentKeys: string[] = [];

    for (const documentId of selectedDocumentIds) {
      const availableDocuments = this.taskStateService.availableDocuments();
      const document = availableDocuments.find(doc => doc.id === documentId);

      if (document) {
        const documentUrl = document.url || document.fullPath || document.name;
        if (documentUrl) {
          documentKeys.push(documentUrl);
        }
      }
    }

    return documentKeys;
  }


  private extractFileNameFromPath(path: string): string {
    if (!path) {
      console.warn('Document path is empty, returning default filename');
      return 'Unknown Document.pdf';
    }

    const parts = path.split('/');
    const fileName = parts[parts.length - 1];

    if (!fileName.includes('.')) {
      const pathLower = path.toLowerCase();
      if (pathLower.includes('.pdf')) return fileName + '.pdf';
      if (pathLower.includes('.doc')) return fileName + '.doc';
      if (pathLower.includes('.docx')) return fileName + '.docx';
      if (pathLower.includes('.jpg') || pathLower.includes('.jpeg')) return fileName + '.jpg';
      if (pathLower.includes('.png')) return fileName + '.png';

      console.warn('No file extension found, defaulting to .pdf');
      return fileName + '.pdf';
    }

    return fileName;
  }

  private getFileExtension(fileName: string): string {
    if (!fileName) return 'pdf';

    const parts = fileName.split('.');
    if (parts.length < 2) {
      console.warn('No extension found in filename:', fileName);
      return 'pdf';
    }

    const extension = parts[parts.length - 1].toLowerCase();
    return extension || 'pdf';
  }

  private getContentTypeFromExtension(extension: string): string {
    const contentTypeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel'
    };

    const contentType = contentTypeMap[extension.toLowerCase()];

    if (!contentType) {
      console.warn('Unknown file extension:', extension, 'defaulting to application/pdf');
      return 'application/pdf';
    }
    return contentType;
  }

  async initializeDocumentList(requestRid: number, forceLoad: boolean = false, isRiskMitigation: boolean = false): Promise<void> {
    if (!forceLoad && this.isLoading || this.currentRequestRid === requestRid) {
      return;
    }
    this.currentRequestRid = requestRid;
    this.isRiskMitigation = isRiskMitigation;
    this.isLoading = true;
    this.taskStateService.resetDocumentSearch();

    try {
      await this.loadInitialDocuments();
    } finally {
      this.isLoading = false;
    }
  }

  async loadInitialDocuments(): Promise<void> {
    if (!this.currentRequestRid || this.isRiskMitigation) {
      return;
    }

    const params = {
      page: 1,
      size: 10
    };

    try {
      const data = await this.taskApiService.getDocumentList(this.currentRequestRid, params);
      if (data?.documents) {
        const documentOptions = data.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.name.split('/').pop() || doc.name,
          fullPath: doc.name,
          url: doc.url
        }));

        this.taskStateService.setAvailableDocuments(documentOptions);

        this.taskStateService.setDocumentSearchState({
          isSearching: false,
          hasMore: data.hasMore || false,
          currentPage: 1,
          totalCount: data.totalCount || documentOptions.length,
          lastSearchTerm: ''
        });
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      this.snackbarService.openSnack('Failed to load documents');
    }
  }

  async loadMoreDocuments(): Promise<void> {
    const searchState = this.taskStateService.documentSearchState();

    if (!searchState.hasMore || this.isLoading || !this.currentRequestRid || this.isRiskMitigation) {
      return;
    }

    this.isLoading = true;
    const nextPage = searchState.currentPage + 1;

    try {
      const params = {
        page: nextPage,
        size: DOCUMENT_CONFIG.PAGE_SIZE
      };

      const data = await this.taskApiService.getDocumentList(this.currentRequestRid, params);
      if (data?.documents) {
        const documentOptions: DocumentOption[] = data.documents.map(doc => ({
          id: doc.id.toString(),
          name: doc.name.split('/').pop() || doc.name,
          fullPath: doc.name,
          url: doc.url
        }));

        const currentDocs = this.taskStateService.availableDocuments();
        this.taskStateService.setAvailableDocuments([...currentDocs, ...documentOptions]);

        this.taskStateService.setDocumentSearchState({
          isSearching: false,
          hasMore: data.hasMore || false,
          currentPage: nextPage,
          totalCount: data.totalCount || (currentDocs.length + documentOptions.length),
          lastSearchTerm: ''
        });
      }
    } catch (error) {
      console.error('Failed to load more documents:', error);
      this.snackbarService.openSnack('Failed to load more documents');
    } finally {
      this.isLoading = false;
    }
  }
  getSelectedDocumentUrls(): string[] {
    const selectedIds = this.taskStateService.selectedDocumentIds();
    const availableDocuments = this.taskStateService.availableDocuments();

    return selectedIds
      .map(id => {
        const document = availableDocuments.find(doc => doc.id === id);
        return document?.url;
      })
      .filter((url): url is string => !!url);
  }

  reset(): void {
    this.currentRequestRid = null;
    this.isLoading = false;
    this.isRiskMitigation = false;
    this.uploadedDocumentUrls.clear();
    this.taskStateService.setAvailableDocuments([]);
    this.taskStateService.resetDocumentSearch();
  }
}
