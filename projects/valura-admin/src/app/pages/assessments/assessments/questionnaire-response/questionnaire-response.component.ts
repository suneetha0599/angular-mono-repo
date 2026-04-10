import { DSR_DOCUMENT_UPLOAD } from '@admin-core/constants/constants';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UPDATE_RESPONSE } from '@admin-core/constants/api-constants';
import { EXTERNAL_USER, INTERNAL_USER } from '@admin-core/constants/constants';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { FileDropDirective } from '@valura-lib/directives/file-drop/file-drop.directive';
import { firstValueFrom } from 'rxjs';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { FILE_UPLOAD_ACCEPT } from '@admin-core/constants/file-upload.constants';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

export interface ResponseFile {
  fileKey: string
}

@Component({
  selector: 'app-questionnaire-response',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatTooltipModule,
    FileDropDirective
  ],
  templateUrl: './questionnaire-response.component.html',
  styleUrl: './questionnaire-response.component.scss'
})
export class QuestionnaireResponseComponent {
  @Input() query: any;

  TEXT: string = 'TEXT';
  TEXTAREA: string = 'TEXTAREA';
  SINGLE_SELECT: string = 'SINGLE_SELECT';
  CHECK_BOX: string = 'CHECK_BOX';
  RADIO: string = 'RADIO';
  DATE_ONLY: string = 'DATE_ONLY';
  FILE_UPLOAD: string = 'FILE_UPLOAD';
  fileUploadInProgress = false;
  allAttachments: any[] = [];
  previousResponse: any = null;
  previousUserType: string = '';
  requestRid: number = 0;
  readonly fileUploadAccept = FILE_UPLOAD_ACCEPT;

  constructor(
    private snackbarService: SnackbarService,
    private httpService: HttpService,
    private apiHelperService: ApiHelperService,
    public dialog: MatDialog,

  ) { }

  ngOnInit() {
    this.loadLastResponse();
    this.loadPreviousResponse();
  }


  onDocNameClick(doc: ResponseFile) {
    if (!doc?.fileKey) {
      console.error('No fileKey found for document', doc);
      return;
    }
    this.viewDocument(doc.fileKey, doc.fileKey);
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }

  async viewDocument(file: any, fileName: string) {
    const params = {
      fileKey: file,
    };
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(fileName) || '',
          requestRid: this.requestRid,
          isTaskView: true,
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false,
      });
      dialogRef.afterClosed().subscribe((result) => { });
    } else {
      console.error('Failed to get presigned URL');
    }
  }

  private loadPreviousResponse() {
    if (!this.query?.responseDetails?.length) {
      this.previousResponse = null;
      this.previousUserType = '';
      return;
    }


    const externalOrInternalResponses = this.query.responseDetails
      .filter((response: any) => response.userType === EXTERNAL_USER || response.userType === INTERNAL_USER)
      .sort((a: any, b: any) => b.version - a.version);

    if (externalOrInternalResponses.length > 0) {
      this.previousResponse = externalOrInternalResponses[0].response;
      this.previousUserType = externalOrInternalResponses[0].userType;
    } else {
      this.previousResponse = null;
      this.previousUserType = '';
    }
  }

  shouldShowPreviousResponse(): boolean {

    if (!this.previousResponse || this.previousResponse === '' || this.previousResponse === '[]') {
      return false;
    }


    if (!(this.previousUserType === EXTERNAL_USER || this.previousUserType === INTERNAL_USER)) {
      return false;
    }


    if (this.query?.responseDetails?.length > 0) {
      const allUserTypes = this.query.responseDetails.map((response: any) => response.userType);
      const uniqueUserTypes = [...new Set(allUserTypes)];


      if (uniqueUserTypes.length === 1) {
        return false;
      }
    }

    return true;
  }



  getPreviousResponse(): string {
    return this.previousResponse || '';
  }


  formatPreviousCheckboxResponse(): string {
    if (!this.previousResponse) return '';

    const parsed = this.parseJSON(this.previousResponse, []);
    return Array.isArray(parsed) ? parsed.join(', ') : this.previousResponse;
  }


  getPreviousAttachments(): any[] {
    if (!this.previousResponse) return [];

    try {
      const parsed = this.parseJSON(this.previousResponse, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private parseJSON(data: any, fallback: any = ''): any {
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      if (typeof data === 'string') data = JSON.parse(data);
      return data ?? fallback;
    } catch {
      return fallback;
    }
  }

  private loadLastResponse() {
    const res = this.query?.responseDetails?.[this.query.responseDetails.length - 1];
    if (!res) return;

    if (res.tempResponse === undefined) {
      res.tempResponse = (this.query.type === this.CHECK_BOX || this.query.type === this.FILE_UPLOAD)
        ? this.parseJSON(res.response, [])
        : this.parseJSON(res.response, '');
    }

    if (this.query.type === this.FILE_UPLOAD) {
      this.allAttachments = Array.isArray(res.tempResponse) ? [...res.tempResponse] : [];
    }

    if (this.query.type === this.CHECK_BOX && typeof res.response === 'string') {
      res.tempResponse = this.parseJSON(res.response, []);
    }
  }


  toggleCheckbox(res: any, value: string) {
    res.tempResponse = Array.isArray(res.tempResponse) ? res.tempResponse : [];
    const idx = res.tempResponse.indexOf(value);
    idx > -1 ? res.tempResponse.splice(idx, 1) : res.tempResponse.push(value);
  }

  formatCheckboxResponse(): string {
    const res = this.query?.responseDetails?.[this.query.responseDetails.length - 1]?.response;
    const parsed = this.parseJSON(res, []);
    return Array.isArray(parsed) ? parsed.join(', ') : '';
  }

  onClick(event: any) { event.target.value = ''; }

  private validateFile(file: File): boolean {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowed.includes(file.type)) {
      this.snackbarService.openSnack('Only JPG, JPEG, PNG files are allowed');
      return false;
    }
    if (file.size > maxSize) {
      this.snackbarService.openSnack('File size exceeds 5MB');
      return false;
    }
    return true;
  }

  handleFiles(fileList: FileList, res: any) {
    res.tempResponse = Array.isArray(res.tempResponse) ? res.tempResponse : [];

    Array.from(fileList).forEach(file => {
      if (!this.validateFile(file)) return;

      if (res.tempResponse.some((f: any) => f.fileName === file.name)) {
        this.snackbarService.openSnack(`${file.name} is already added`);
        return;
      }

      res.tempResponse.push({
        file: file,
        fileName: file.name
      });
    });

    this.allAttachments = [...res.tempResponse];
  }

  onFileDropped(event: any, res: any) {
    this.handleFiles(event as FileList, res);
  }

  onFileBrowse(event: Event, res: any) {
    this.handleFiles((event.target as HTMLInputElement).files!, res);
  }

  removeFile(res: any, index: number) {
    if (Array.isArray(res.tempResponse)) res.tempResponse.splice(index, 1);
    this.allAttachments = [...res.tempResponse];
  }

  async saveResponse(resp: any): Promise<boolean | null> {
    try {
      let finalResponse: any;

      if (this.query.type !== this.FILE_UPLOAD) {
        finalResponse =
          this.query.type === this.CHECK_BOX
            ? JSON.stringify(resp.tempResponse || [])
            : resp.tempResponse;
      } else if (this.query.type === this.FILE_UPLOAD) {
        const uploadedFiles: any[] = [];

        for (const fileObj of resp.tempResponse || []) {
          if (fileObj.fileKey && !fileObj.file) {
            uploadedFiles.push({
              fileKey: fileObj.fileKey,
              fileName: fileObj.fileName || this.getFileName(fileObj.fileKey),
              fileSize: fileObj.fileSize || 0,
              remark: fileObj.remark || '',
              serverPath: fileObj.serverPath || '',
              eTag: fileObj.eTag || '',
            });
            continue;
          }
          if (fileObj.file) {
            try {
              const uploadedData = await this.uploadPresignedUrl(fileObj.file);
              uploadedFiles.push({
                fileKey: uploadedData.fileKey,
                fileName: uploadedData.fileName,
                fileSize: uploadedData.fileSize,
                remark: fileObj.remark || '',
                serverPath: uploadedData.serverPath,
                eTag: uploadedData.eTag,
              });

            } catch (uploadError) {
              console.error(`Error uploading file ${fileObj.file.name}:`, uploadError);
              this.snackbarService.openSnack(`Failed to upload ${fileObj.file.name}`);
            }
          }
        }

        finalResponse = JSON.stringify(
          uploadedFiles.map((f) => ({
            fileKey: f.fileKey,
          }))
        );
      }

      const res = await firstValueFrom(
        this.httpService.httpPut({
          queryUrl: UPDATE_RESPONSE(this.query.id),
          body: { response: finalResponse },
          showSnackBar: true,
          showSnackBarOnError: true,
          showLoadingBar: true
        })
      );

      Object.assign(this.query, res.data.question);


      this.query.isEdit = false;


      this.loadLastResponse();
      this.loadPreviousResponse();

      return true;
    } catch (error) {
      console.error('Error in saveResponse:', error);
      this.snackbarService.openSnack('Failed to save response');
      return null;
    }
  }

  getDisplayFileName(file: any): string {
    if (file?.fileName) return file.fileName;
    if (file?.fileKey) {
      const parts = file.fileKey.split('/');
      return parts[parts.length - 1];
    }

    return '';
  }

  async uploadPresignedUrl(file: any): Promise<any> {
    const params = {
      fileName: file.name,
      contentType: file.type,
      purpose: DSR_DOCUMENT_UPLOAD
    };

    try {
      const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
      if (imageInfo) {
        const uploadResult = await this.getImageEtag(imageInfo.presignedUrl, file);
        if (uploadResult) {
          const serverPath = this.extractServerPathFromPresignedUrl(imageInfo.presignedUrl);
          return {
            fileKey: imageInfo.fileKey,
            eTag: uploadResult.headers?.get('ETag') || uploadResult.headers?.get('etag'),
            serverPath: serverPath,
            fileName: file.name,
            fileSize: file.size,
            presignedUrl: imageInfo.presignedUrl
          };
        }
      }
      throw new Error('Failed to get presigned URL');
    } catch (error) {
      console.error('Error in uploadPresignedUrl:', error);
      throw error;
    }
  }

  async getImageEtag(presignedUrl: string, file: File): Promise<any> {
    try {
      let res: any = await this.apiHelperService.getImageEtag(
        presignedUrl,
        file
      );
      if (res && this.httpService.isHttpSuccess(res?.status)) {
        return res;
      }
      return null;
    } catch (error) {
      console.error('Error in getImageEtag:', error);
      throw error;
    }
  }

  private extractServerPathFromPresignedUrl(presignedUrl: string): string {
    try {
      const url = new URL(presignedUrl);

      return `${url.origin}${url.pathname}`;
    } catch (error) {
      console.error('Error extracting server path from presigned URL:', error);
      return '';
    }
  }

  cancelEdit(res: any) {
    res.tempResponse = res.response;
    this.query.isEdit = false;
    this.loadLastResponse();
    this.loadPreviousResponse();
  }

  getAssociatedFiles(associatedFiles: any): any[] {
    if (!associatedFiles) return [];

    try {

      if (Array.isArray(associatedFiles)) {
        return associatedFiles;
      }


      if (typeof associatedFiles === 'string') {

        if (associatedFiles.trim() === '') return [];

        const parsed = JSON.parse(associatedFiles);
        return Array.isArray(parsed) ? parsed : [];
      }

      return [];
    } catch (error) {
      console.error('Error parsing associated files:', error);
      return [];
    }
  }
}
