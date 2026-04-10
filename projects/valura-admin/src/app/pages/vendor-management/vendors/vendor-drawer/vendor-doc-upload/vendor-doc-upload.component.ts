import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ETAG } from '@admin-core/constants/api-constants';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { FILE_UPLOAD_ACCEPT, VENDOR_FILE_UPLOAD_ACCEPT, VENDOR_FILE_UPLOAD_SUPPORTED_TEXT } from '@admin-core/constants/file-upload.constants';
import { Attachment } from '@admin-core/models/request-management/DsrRequest';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CustomFileUploadComponent } from '@valura-lib/components//custom-file-upload/custom-file-upload.component';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { v1 as uuidv1 } from 'uuid';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

export interface DocumentUpload {
  fileKey: string;           // internal key or S3 key
  documentName: string;      // optional name,
  attachmentUrl: string;     // existing S3 key 
  description?: string;
  documentType?: string;
  effectiveStartDate?: number;
  effectiveEndDate?: number;
  fileName: string;          // original uploaded filename
  fileUrl?: string;          // full uploaded URL
}
@Component({
  selector: 'app-vendor-doc-upload',
  imports: [LoadingButtonComponent, MatDatepickerModule, MatDatepickerToggle, MatLabel, MatFormFieldModule, MatSelectModule, MatIconModule, ReactiveFormsModule, MatInputModule, CustomMatErrorComponent, CommonModule, MatTooltipModule, CustomFileUploadComponent],
  templateUrl: './vendor-doc-upload.component.html',
  styleUrl: './vendor-doc-upload.component.scss'
})
export class VendorDocUploadComponent {
  @Input() documentData: any;
  @Input() viewMode: boolean = false;
  @Input() vendorId!: number;

  @Output() onClose = new EventEmitter();
  @Output() onUpload = new EventEmitter();
  @Output() onDelete = new EventEmitter();
  @Output() onEdit = new EventEmitter();
  @Output() removedFiles = new EventEmitter<string[]>();

  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);

  documentForm!: FormGroup;
  uploadedFile: DocumentUpload[] = [];
  isSubmitLoading: boolean = false;
  isUploading: boolean = false;
  removedFileUrls: string[] = [];
  today: Date = new Date();
  readonly fileUploadAccept = VENDOR_FILE_UPLOAD_ACCEPT;
  readonly fileUploadSupportedText = VENDOR_FILE_UPLOAD_SUPPORTED_TEXT;
  requestAttachments: any[] = [];
  uploadedRequestAttachments: any[] = [];
  tooltip = " Upload a supporting document."
  fileUploadInProgress: any;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private httpService: HttpService,
  ) { }

  ngOnInit() {
    this.today.setHours(0, 0, 0, 0);
    this.documentForm = this.fb.group({
      documentName: ['', Validators.required],
      documentType: [''],
      description: [''],
      effectiveDate: [''],
      expiryDate: [''],
      attachmentUrl: [[]],
    },
      {
        validators: this.dateValidator
      });

  }

  ngOnChanges() {
    if (!this.documentForm) return;

    if (this.documentForm && this.documentData) {

      this.documentForm.patchValue({
        documentName: this.documentData.documentName || this.documentData.row?.documentName || '',
        documentType: this.documentData?.documentType || this.documentData.row?.documentType || '',
        description: this.documentData.description || this.documentData.row?.description || '',
        effectiveDate: this.documentData.effectiveDate || this.documentData.row?.effectiveDate || '',
        expiryDate: this.documentData.expiryDate || this.documentData.row?.expiryDate || '',
        attachmentUrl: this.documentData?.attachmentUrl ?? this.documentData?.row?.attachmentUrl ?? [],
      });

      const fileList = this.documentData?.attachmentUrl ?? this.documentData?.row?.attachmentUrl ?? [];
      this.uploadedFile = fileList.map((f: any) => ({
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileKey: f.fileUrl,
        documentName: f.fileName
      }));
      this.requestAttachments = [...this.documentForm.value.attachmentUrl];
      this.uploadedRequestAttachments = [...this.requestAttachments]
    } else {
      this.documentForm.reset();
      this.uploadedFile = [];
    }
  }

  get documentName() {
    return this.documentForm.get('documentName') as FormControl;
  }
  get attachmentUrl() {
    return this.documentForm.get('attachmentUrl') as FormControl;
  }

  async uploadDocument() {
    if (this.documentForm.invalid) {
      this.snackbarService.openSnack('Please fill mandatory fields');
      this.documentForm.markAllAsTouched();
      return;
    }

    this.isSubmitLoading = true;
    let processedAttachments: any[] = [];
    if (this.requestAttachments) {
      const processed = await this.processAttachmentData();
      if (processed) {
        processedAttachments = processed
      }
    }
    const data = this.documentForm.value;
    const isUpdate = !!this.documentData?.documentId;

    const commands: any[] = [];

    if (isUpdate) {
      const existing = this.documentData;

      const updatePayload: any = {
        id: existing.documentId
      };

      if (data.documentName !== existing.documentName) {
        updatePayload.name = data.documentName;
      }

      if (data.description !== existing.description) {
        updatePayload.description = data.description;
      }

      if (data.documentType !== existing.documentType) {
        updatePayload.documentId = data.documentType;
      }

      const newStart = this.normalizeDateOnly(data.effectiveDate);
      const existingStart = this.normalizeDateOnly(existing.effectiveDate);
      if (newStart !== existingStart) {
        updatePayload.effectiveStartDate = data.effectiveDate
          ? this.formatDateTime(data.effectiveDate)
          : null;
      }

      const newEnd = this.normalizeDateOnly(data.expiryDate);
      const existingEnd = this.normalizeDateOnly(existing.expiryDate);
      if (newEnd !== existingEnd) {
        updatePayload.effectiveEndDate = data.expiryDate
          ? this.formatDateTime(data.expiryDate)
          : null;
      }

      // Attachments diff
      const existingFiles = existing?.attachmentUrl || [];
      const newFiles = (processedAttachments || []).map((file: any) => ({
        fileName: file.fileName,
        fileKey: file.filePath
      }));

      const existingUrls = existingFiles.map((f: any) => f.fileUrl);

      const addedFiles = newFiles.filter(
        (file: any) => !existingUrls.includes(file.fileUrl)
      );

      if (addedFiles.length) {
        updatePayload.addAttachments = addedFiles.map((file: any) => ({
          fileName: file.fileName,
          fileKey: file.fileKey
        }));
      }
      if (this.removedFileUrls.length) {
        updatePayload.removeAttachmentKeys = this.removedFileUrls;
      }

      commands.push({ updateDocument: updatePayload });

    } else {

      commands.push({
        addDocument: {
          name: data.documentName,
          description: data.description,
          documentId: data.documentType,
          effectiveStartDate: data.effectiveDate ? this.formatDateTime(data.effectiveDate) : null,
          effectiveEndDate: data.expiryDate ? this.formatDateTime(data.expiryDate) : null,
          addAttachments: (processedAttachments || []).map((file: any) => ({
            fileName: file.fileName,
            fileKey: file.filePath
          }))
        }
      });
    }

    try {
      const payload = {
        commandId: uuidv1(),
        commands: commands
      };

      await this.apiHelperService.updateVendor(payload, this.vendorId);

      this.snackbarService.openSnack('Document saved successfully');

      this.onUpload.emit({ success: true });

      this.handleClose();

    } catch (error) {
      console.error(error);
      this.snackbarService.openSnack('Failed to save document');
    } finally {
      this.isSubmitLoading = false;
    }
  }


  onclick(event: any) {
    event.target.value = ''
  }

  async getImageEtag(presignedUrl: string, file: File): Promise<any> {
    try {
      let res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
      if (res && this.httpService.isHttpSuccess(res?.status)) {
        return res
      }
      return null;
    } catch (error) {
      console.error('Error in getImageEtag:', error);
      throw error;
    }
  }
  async viewDocument(file: any) {
    const params = {
      "fileKey": file.fileUrl ?? file.fileKey,
    }
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(file.fileName) || '',
          isTaskView: true
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((result: any) => {
      });
    }

    else {
      console.error('Failed to get presigned URL');
    }
  }

  onDocNameClick(doc: DocumentUpload) {
    if (!doc) {
      console.error("No fileKey found for document", doc);
      return;
    }
    this.viewDocument(doc);
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }


  removeFile(fileIndex: number) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Document?',
        confirmationDetail: this.documentForm.value.attachmentUrl[fileIndex].fileName,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const removedFile = this.documentForm.value.attachmentUrl[fileIndex];

      if (removedFile?.fileKey) {
        this.removedFileUrls.push(removedFile.fileKey);
      }

      this.uploadedFile.splice(fileIndex, 1);

      // update form
      this.documentForm.get('attachmentUrl')?.setValue(
        this.uploadedFile.length
          ? this.uploadedFile.map(f => ({ fileName: f.fileName, fileUrl: f.fileUrl }))
          : []
      );

      this.removedFiles.emit(this.removedFileUrls);
    });
  }

  dateValidator(group: FormGroup) {
    const start = group.get('effectiveDate')?.value;
    const end = group.get('expiryDate')?.value;

    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    if (endDate < startDate) return { invalidDateRange: true };

    return null;
  }

  handleClose() {
    this.documentForm.reset();
    this.uploadedFile = [];
    this.isSubmitLoading = false;
    this.isUploading = false;
    this.requestAttachments = [];
    this.uploadedRequestAttachments = [];
    this.onClose.emit();
  }

  onEditDocument(row: any) {
    this.viewMode = false;
    this.onEdit.emit(row);
  }

  async deleteDocument(row: any) {
    this.onDelete.emit({
      documentId: row.documentId
    });
  }

  formatDateTime(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('.')[0];
  }

  normalizeDateOnly(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; //only date
  }

  onUploadPresignedUrl(event: any) {
    this.requestAttachments = [...event.selectedFiles];
  }

  async onRemoveFile(event: any) {
    const updatedFiles = [...event.selectedFiles];

    // find removed files
    const removed = this.requestAttachments.filter(
      (oldFile: any) =>
        !updatedFiles.some((newFile: any) => newFile.fileUrl === oldFile.fileUrl)
    );

    removed.forEach((file: any) => {
      if (file.fileUrl) {
        this.removedFileUrls.push(file.fileUrl);
      }
    });

    // update current state
    this.requestAttachments = updatedFiles;
    this.removedFiles.emit(this.removedFileUrls);

  }

  uploadStatus(event: any) {
    this.fileUploadInProgress = event.fileUploadInProgress;
    this.isUploading = event.fileUploadInProgress;
  }

  get label() {
    return this.viewMode ? 'Attachments' : 'Add Attachments';
  }

  async processAttachmentData(): Promise<Attachment[] | null> {
    const attachments = this.requestAttachments;
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedFiles: Attachment[] = [];

    for (const att of attachments) {
      if (att.eTag && att.filePath) {
        processedFiles.push(new Attachment({
          filePath: att.filePath,
          eTag: att.eTag,
          fileName: att.fileName,
        }));
        continue;
      }

      if (att.file && att.presignedUrl && att.fileKey) {
        const res: any = await this.getImageEtag(att.file, att.presignedUrl);
        if (res) {
          processedFiles.push(new Attachment({
            filePath: att.fileKey,
            eTag: res.headers.get(ETAG),
            fileName: att.fileName || att.file.name,
          }));
        } else {
          this.isSubmitLoading = false;
          return null;
        }
      }
    }

    return processedFiles;
  }
}
