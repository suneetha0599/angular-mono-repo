import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';

export interface SourceData {
  sourceName: string;
  type: string;
  channel: string;
  pdElements: number;
}

export interface DataInventoryItem {
  name: string;
  dataSubjects: string;
  dataElements: number;
  type: string;
  vendorName: string;
  sources: number;
  recipient: number;
}

export interface RecipientData {
  category: string;
  department: string;
  type: string;
  purpose: string;
}

@Component({
  selector: 'app-bpa-details',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    RouterModule,
    LoadingButtonComponent,
    MatTabGroup,
    MatTab,
    MatPaginatorModule,
    MatMenuModule,
    MatTableModule

  ],
  templateUrl: './bpa-details.component.html',
  styleUrl: './bpa-details.component.scss'
})
export class BpaDetailsComponent implements OnInit, AfterViewInit {
  selectedTabIndex = 0;
  displayedColumns: string[] = ['sourceName', 'type', 'channel', 'pdElements', 'actions'];


  sourceData: SourceData[] = [
    { sourceName: 'Employee Onboarding Form', type: 'External', channel: 'Form', pdElements: 20 },
    { sourceName: 'ATS System (Zoho Recruit)', type: 'External', channel: 'API', pdElements: 4 }
  ];

  dataSource = new MatTableDataSource<SourceData>(this.sourceData);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  displayedColumns2: string[] = [
    'name',
    'dataSubjects',
    'dataElements',
    'type',
    'vendorName',
    'sources',
    'recipient',
    'actions'
  ];

  dataInventory: DataInventoryItem[] = [
    {
      name: 'GreyHR',
      dataSubjects: 'Employee',
      dataElements: 20,
      type: 'External',
      vendorName: '-',
      sources: 3,
      recipient: 3
    },
    {
      name: 'Salesforce',
      dataSubjects: 'Customer',
      dataElements: 45,
      type: 'External',
      vendorName: '-',
      sources: 1,
      recipient: 5
    },
    {
      name: 'Sharepoint',
      dataSubjects: 'Vendor',
      dataElements: 50,
      type: 'External',
      vendorName: 'Mircosoft',
      sources: 2,
      recipient: 1
    }
  ];

  dataSource2 = new MatTableDataSource<DataInventoryItem>(this.dataInventory);


  displayedColumns3: string[] = ['category', 'department', 'type', 'purpose', 'actions'];

  recipientsData: RecipientData[] = [
    { category: 'Internal Department', department: 'Finance', type: 'Internal', purpose: 'Hiring workflows' },
    { category: 'IT Service Providers', department: 'Email hosting vendors', type: 'External', purpose: 'Storage & compute' },
    { category: 'Payment Processors', department: 'Stripe', type: 'External', purpose: 'Payment' },
    { category: 'Recruitment Partners', department: 'LinkedIn Recruiter', type: 'External', purpose: 'Hiring workflows' },
  ];

  dataSource3 = new MatTableDataSource<RecipientData>(this.recipientsData);


  viewDFD() {
    this.router.navigate(['/user/data-discovery/business-processing-activities']);

  }
}
