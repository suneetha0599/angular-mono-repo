import { Component, inject } from '@angular/core';
import { MatColumnDef, MatTableDataSource } from "@angular/material/table";
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatTableModule } from '@angular/material/table';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import moment from 'moment';
import { UserService } from '@admin-core/services/user/user.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-download',
  imports: [LoadingButtonComponent, MatTableModule, CommonModule, MatColumnDef, ItemNotFoundComponent, ErrorLoadingItemsComponent],
  templateUrl: './download.component.html',
  styleUrl: './download.component.scss'
})
export class DownloadComponent {
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;
  submitLoading = false;

  downloadList: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  private downloadEndpoint: string = 'dataprocessor/logs';
  exportTypeFilter: string = '';

  private userService = inject(UserService);
  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private route = inject(ActivatedRoute);

  tableHeaders = [
    { columnDef: 'user', headerName: 'User' },
    { columnDef: 'timeStamp', headerName: 'TimeStamp' },
    { columnDef: 'status', headerName: 'Status' },
    { columnDef: 'action', headerName: 'Action' },
  ];

  displayedColumns = this.tableHeaders.map((x) => x.columnDef);
  requestLoading: boolean = false;
  hasApiError: boolean = false;

  ngOnInit() {
    const routeEndpoint = this.route.snapshot.data['downloadEndpoint'];
    if (routeEndpoint) {
      this.downloadEndpoint = routeEndpoint;
    }
    this.exportTypeFilter = this.route.snapshot.data['exportType'] || '';
    this.loadDownload();
  }

  capitalizeFirstLetter(word: string): string {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private formatTimestamp(dateString: string): string {
    return moment(dateString).format('MMM DD, YYYY [at] h:mm A');
  }

  async loadDownload() {
    this.requestLoading = true;
    this.hasApiError = false;
    try {
      const useAssessmentApi = this.downloadEndpoint.startsWith('assessment/exports');
      let res: any;

      if (useAssessmentApi) {
        const params: any = { page: this.pageIndex + 1, size: this.pageSize };
        if (this.exportTypeFilter) {
          params['exportType'] = this.exportTypeFilter;
        }
        res = await this.assessmentApiHelperService.getExportLogs(params);
      } else {
        res = await this.apiHelperService.getDownloadList(this.downloadEndpoint);
      }

      if (!res || res.success === false) {
        this.hasApiError = true;
        return;
      }

      const items = res?.data?.items || res?.items || [];

      if (Array.isArray(items)) {
        this.downloadList = await Promise.all(
          items.map(async (d: any) => ({
            id: d.id || d.requestId,
            user: d.userId ? (await this.userService.getUserById(+(d.userId)))?.displayName : '-',
            timeStamp: this.formatTimestamp(d.createdAt),
            status: this.capitalizeFirstLetter(d.status),
            excelS3Key: d.excelS3Key || d.fileKey,
            downloadUrl: d.downloadUrl || '',
            failureReason: d.failureReason || '',
            loading: false
          }))
        );

        this.totalItems = res?.data?.totalItems || res?.totalItems || this.downloadList.length;
      } else {
        this.downloadList = [];
        this.totalItems = 0;
      }

      this.dataSource = new MatTableDataSource(this.downloadList);
    } catch (error) {
      console.error('Error loading export data:', error);
      this.snackbarService.openSnack('Failed to load export data');
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
    }
  }


  async downloadFile(row: any) {
    row.loading = true;
    try {
      let fileUrl = row.downloadUrl;

      if (!fileUrl && row.excelS3Key) {
        const imageInfo: any = await this.apiHelperService.getPresignedUrl({ fileKey: row.excelS3Key });
        fileUrl = imageInfo?.presignedUrl;
      }

      if (fileUrl) {
        const response = await fetch(fileUrl, { method: 'GET' });

        if (!response.ok) throw new Error('Failed to download file');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;

        const filename =
          row.fileName ||
          `download_${new Date().getTime()}.xlsx`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        this.snackbarService.openSnack("Invalid file URL");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      this.snackbarService.openSnack("Unable to download this file");
    } finally {
      row.loading = false;
    }
  }
}
