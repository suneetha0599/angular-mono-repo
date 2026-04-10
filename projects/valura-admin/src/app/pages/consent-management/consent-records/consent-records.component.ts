import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatHeaderCellDef, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {
  MatIconButton,
  MatMiniFabButton
} from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { Router } from '@angular/router';

type CONSENT_RECORD = {
  id: string;
  templateName: string;
  upstreamSources: string;
  status: string;
  purpose: string;
  dataSubject: string;
  method: string;
  requestedOn: string;
  performedBy: string;
};

@Component({
  selector: 'app-consent-records',
  standalone: true,
  imports: [
    LoadingButtonComponent,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatMiniFabButton,
    MatPaginator,
    MatRow,
    MatRowDef,
    MatSort,
    MatTab,
    MatTabGroup,
    MatTable,
    MatSortHeader,
    MatHeaderCellDef,

  ],
  templateUrl: './consent-records.component.html',
  styleUrl: './consent-records.component.scss',
})
export class ConsentRecordsComponent implements OnInit, AfterViewInit {
  selectedTabIndex: number = 0;

  displayedColumns = [
    'id',
    'templateName',
    'upstreamSources',
    'status',
    'purpose',
    'dataSubject',
    'method',
    'requestedOn',
    'performedBy',
  ];

  displayColumns = [
    'id',
    'templateName',
    'upstreamSources',
    'status',
    'timeStamp',
    'dataSubject',
    'action',
  ];


  dataSource = new MatTableDataSource<CONSENT_RECORD>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {

  }
  constructor(private router: Router) { }
  data = new MatTableDataSource([
    {
      id: 'C_123',
      templateName: 'Email Marketing',
      upstreamSources: 'Source name 1',
      status: 'Pending',
      method: 'Automatic',
      timeStamp: '05.07.2025',
      dataSubject: 'DS name/ ID',
      action: ' view',
    },
    {
      id: 'C_124',
      templateName: 'Email Marketing',
      upstreamSources: 'Source name 1',
      status: 'Pending',
      method: 'Automatic',
      timeStamp: '06.06.2025',
      dataSubject: 'DS name/ ID',
      action: ' view',
    },
  ]);
  ngAfterViewInit() {
    this.dataSource.data = [
      {
        id: 'C_123',
        templateName: 'Email Marketing',
        upstreamSources: 'Source name 1',
        status: 'Pending',
        purpose: 'Marketing',
        dataSubject: 'DS name/ ID',
        method: 'Automatic',
        requestedOn: '05.07.2025',
        performedBy: 'DS',
      },
    ];


    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator._changePageSize(this.dataSource.paginator.pageSize);
    if (this.data.paginator) {
      this.data.paginator._changePageSize(this.data.paginator.pageSize);
    }

  }




  withDrawConsent() {
    this.router.navigate(['/user/consent-management/withdraw-consent']);
  }

  onActionClick(row: any) {
    this.router.navigate(['/user/consent-management/consent-details'], {
      state: { rowData: row },
    });
  }

}
