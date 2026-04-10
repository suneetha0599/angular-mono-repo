import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, output, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { VENDOR_DOCUMENT_HEADERS, VendorDocumentKey } from '../../constant';
import { EllipsisTooltipDirective } from 'app/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentUpload } from '../../vendor-drawer/vendor-doc-upload/vendor-doc-upload.component';
import { MatDialog } from '@angular/material/dialog';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DocViewerDialogComponent } from @admin - page / request - management / request - management - dialog / doc - viewer - dialog / doc - viewer - dialog.component';

@Component({
  selector: 'vendor-document',
  imports: [MatTableModule, ItemNotFoundComponent, MatIconModule, CommonModule, EllipsisTooltipDirective, MatTooltipModule],
  templateUrl: './vendor-document.component.html',
  styleUrl: './vendor-document.component.scss'
})
export class VendorDocumentComponent {

  @Input() documentDataSource!: MatTableDataSource<any>;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  documentHeaders = VENDOR_DOCUMENT_HEADERS;
  VendorDocumentKey = VendorDocumentKey;
  displayedDocumentHeaders = this.documentHeaders.map(h => h.columnDef);

  private apiHelperService = inject(ApiHelperService);

  constructor(public dialog: MatDialog) { }
  onEditDocument(row: any) {
    this.edit.emit(row);
  }

  deleteDocument(row: any) {
    this.delete.emit(row);
  }

  onViewDocument(row: any) {
    this.view.emit(row)
  }
  getAttachmentDisplay(row: any) {
    const files = row?.attachmentUrl || [];

    if (files.length <= 1) return;

    // if (files.length === 1) {
    //   return files[0].fileName;
    // }

    return `+${files.length - 1}`;
  }

  getAttachmentTooltip(row: any): string {
    const files = row?.attachmentUrl || [];
    return files.map((f: any) => f.fileName).join(', ');
  }
  onDocNameClick(doc: DocumentUpload) {
    if (!doc) {
      console.error("No fileKey found for document", doc);
      return;
    }
    this.viewDocument(doc.fileUrl, doc.fileName);
  }

  async viewDocument(file: any, fileName: string) {
    const params = {
      "fileKey": file,
    }
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: fileName || '',
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
}
