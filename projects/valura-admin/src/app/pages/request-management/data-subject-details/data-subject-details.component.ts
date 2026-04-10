import { Component, inject, ViewChild } from '@angular/core';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import {
  MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableModule
} from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FIRST_PAGE, HEADER_DATE, HEADER_NAME, HEADER_STATUS, HEADER_THROUGH, REQUEST_MANAGEMENT_DATA_SUBJECT_DETAIL } from '../constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DatePipe, Location, NgStyle } from '@angular/common';
import { formatStatus, statusColors, statusTextColors } from '../request-utils';
import { RequestDataSubject, RequestDataSubjectForm } from '@admin-core/models/request-management/RequestDataSubject';
import { PAGE_SIZE } from '../../task-management/constant';
import { routes as routeConstants } from '@admin-core/constants/routes';

const { USER, REQUEST_MANAGEMENT, DSRR, REQUEST_MANAGEMENT_DETAILS } = routeConstants
@Component({
  selector: 'app-data-subject-details',
  imports: [MatIcon, MatCard, MatTable, MatColumnDef, MatHeaderCell, MatCell, MatCellDef, MatHeaderCellDef, MatHeaderRow,
    MatRow, MatHeaderRowDef, MatRowDef, MatPaginator, MatTableModule, MatSortModule, MatPaginatorModule, DatePipe, NgStyle,],
  templateUrl: './data-subject-details.component.html',
  styleUrl: './data-subject-details.component.scss'
})

export class DataSubjectDetailsComponent {

  requesterName!: string;
  requesterEmail!: string;
  requestData!: RequestDataSubject;
  // requestRid: any;
  tableHeaders = REQUEST_MANAGEMENT_DATA_SUBJECT_DETAIL
  displayedColumns = this.tableHeaders.map(col => col.columnDef);
  private apiHelperService = inject(ApiHelperService);
  dataSource = new MatTableDataSource<RequestDataSubjectForm>();
  HEADER_DATE = HEADER_DATE;
  HEADER_STATUS = HEADER_STATUS;
  HEADER_NAME = HEADER_NAME;
  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  HEADER_THROUGH = HEADER_THROUGH

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.setTablePaginator()
  }

  constructor(private route: ActivatedRoute, private location: Location, private router: Router,) { }


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // const requestRid = params['requestRid'];
      this.requesterName = params['requesterName'] || '';
      this.requesterEmail = params['requesterEmail'] || '';

      if (this.requesterEmail) {
        this.fetchRequestDetails();
      }
    });
  }

  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
  }

  async fetchRequestDetails(pageNo: number = FIRST_PAGE) {
    let params = {
      page: pageNo,
      size: this.pageSize,
    }
    const data = await this.apiHelperService.fetchRequestDetails(this.requesterEmail, params);
    this.pageNo = pageNo
    if (data) {
      this.requestData = data
      this.dataSource = new MatTableDataSource(data.dsrForms);
      this.dataSource.sort = this.sort;
      if (pageNo == FIRST_PAGE) {
        this.totalItems = this.requestData.totalRequestCount;
        if (this.paginator) {
          this.paginator.firstPage();
        }
      }
    }
  }

  formatText(value: string): string {
    if (!value) return '';

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = (event.pageIndex + 1)
      this.fetchRequestDetails(this.pageNo)
    }
  }

  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status)
  }

  getStatusText(status: string): string {
    return formatStatus(status)
  }

  goBack() {
    this.location.back()
  }

  get completedRequestCount() {
    return ((this.requestData?.totalRequestCount ?? 0) - ((this.requestData?.inProgressRequestCount ?? 0) + (this.requestData?.openRequestCount ?? 0)))
  }

  goToRequestDetails(request: RequestDataSubjectForm) {
    const requestId = request.formId;
    return this.router.navigate([`${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_MANAGEMENT_DETAILS}/${requestId}`])
  }

  get displayName() {
    return `${this.requesterName} ${this.requesterEmail ? `(${this.requesterEmail})` : ''}`
  }

  requestRaisedName(requestData: RequestDataSubjectForm) {
    return `${requestData.firstName} ${requestData.lastName ? requestData.lastName : ''}`
  }
}
