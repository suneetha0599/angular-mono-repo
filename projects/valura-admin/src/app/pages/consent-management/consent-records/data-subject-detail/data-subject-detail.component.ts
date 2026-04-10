import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-data-subject-detail',
  imports: [
    MatTabGroup,
    MatTab,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    MatSort,
    MatHeaderCellDef,
    MatPaginator
  ],
  templateUrl: './data-subject-detail.component.html',
  styleUrl: './data-subject-detail.component.scss'
})
export class DataSubjectDetailComponent {
  consentDetails: any;

  displayColumns = [
    'id',
    'templateName',
    'upstreamSources',
    'status',
    'timeStamp',
  ];
  constructor(private router: Router, public dialog: MatDialog) {
    const navigation = this.router.getCurrentNavigation();
    this.consentDetails = navigation?.extras?.state?.['consent'];
  }

  isFullscreen = false;

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
  selectedTabIndex = 0;

}
