import { Component, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { routes as routeConstants } from '../../core/constants/routes';
import { Router } from '@angular/router';
import { CONSENT_PURPOSE_CATEGORIES, CONSENT_FORMS_HEADER, CONSENT_PURPOSE_HEADER, CONSENT_RECORDS_HEADER, CONSENT_STATUS_COMPLETED, CONSENT_STATUS_ESCALATED, CONSENT_STATUS_INPROGRESS, CONSENT_STATUS_REJECTED, CONSENT_STATUS_UNVERIFIED, CONSENT_TEMPLATES_HEADER, HEADER_ACTIONS, HEADER_NAME, HEADER_STATUS, tempPurposeData, CONSENT_TEMPLATES_CATEGORIES, tempTemplatesData, tempFormData, tempRecordsData, CONSENT_FORMS_CATEGORIES, CONSENT_RECORDS_CATEGORIES, isConsentPurpose, isConsentRecords, isConsentForms, isConsentTemplates } from './constants';
import { ConsentForms, ConsentPurpose, ConsentRecords, ConsentTemplates } from '../../core/models/consent-management/consent';

const { USER, CONSENT_MANAGEMENT_PURPOSE, CONSENT_MANAGEMENT_TEMPLATES, CONSENT_MANAGEMENT_FORMS, CONSENT_MANAGEMENT_RECORDS, CONSENT_MANAGEMENT_CREATE } = routeConstants

@Component({
  selector: 'app-consent-management',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule,
    MatMenuModule, MatButtonModule, MatTabsModule, NgClass, LoadingButtonComponent,],
  templateUrl: './consent-management.component.html',
  styleUrl: './consent-management.component.scss'
})
export class ConsentManagementComponent {

  dataSource = new MatTableDataSource<any>();
  pageTitle: string = '';
  createBtnTitle: string = '';
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_NAME = HEADER_NAME;
  HEADER_STATUS = HEADER_STATUS;
  HEADER_ACTIONS = HEADER_ACTIONS;
  categories: any = [];

  selectedTabIndex: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(private router: Router) {
    this.setUpPageInfo()
  }

  ngOnInit(): void {
    this.setTableInfo()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getStatusClass(status: number): string {
    switch (status) {
      case CONSENT_STATUS_INPROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case CONSENT_STATUS_ESCALATED:
        return 'bg-red-100 text-red-600';
      case CONSENT_STATUS_COMPLETED:
        return 'bg-green-100 text-green-700';
      case CONSENT_STATUS_REJECTED:
        return 'bg-red-200 text-red-700';
      case CONSENT_STATUS_UNVERIFIED:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }

  getStatus(status: number): string {
    switch (status) {
      case CONSENT_STATUS_INPROGRESS:
        return `In progress`;
      case CONSENT_STATUS_ESCALATED:
        return `Escalated`;
      case CONSENT_STATUS_COMPLETED:
        return `Completed`;
      case CONSENT_STATUS_REJECTED:
        return `Rejected`;
      case CONSENT_STATUS_UNVERIFIED:
        return `Unverified`;
      default:
        return ``;
    }
  }

  setUpPageInfo() {
    this.createBtnTitle = `Create`
    if (isConsentPurpose(this.router.url)) {
      this.pageTitle = "Purpose";
      this.createBtnTitle = `${this.createBtnTitle} purpose`
    }
    else if (isConsentTemplates(this.router.url)) {
      this.pageTitle = "Templates"
      this.createBtnTitle = `${this.createBtnTitle} templates`
    }
    else if (isConsentForms(this.router.url)) {
      this.pageTitle = "Forms"
      this.createBtnTitle = `${this.createBtnTitle} forms`
    }
    else if (isConsentRecords(this.router.url)) {
      this.pageTitle = "Records"
      this.createBtnTitle = `${this.createBtnTitle} records`
    }
  }

  setTableInfo() {
    if (isConsentPurpose(this.router.url)) {
      this.tableHeaders = CONSENT_PURPOSE_HEADER;
      this.categories = CONSENT_PURPOSE_CATEGORIES;

      this.dataSource = new MatTableDataSource<ConsentPurpose>;
      this.dataSource.data = tempPurposeData;
    }
    else if (isConsentTemplates(this.router.url)) {
      this.tableHeaders = CONSENT_TEMPLATES_HEADER;
      this.categories = CONSENT_TEMPLATES_CATEGORIES;

      this.dataSource = new MatTableDataSource<ConsentTemplates>;
      this.dataSource.data = tempTemplatesData;
    }
    else if (isConsentForms(this.router.url)) {
      this.tableHeaders = CONSENT_FORMS_HEADER;
      this.categories = CONSENT_FORMS_CATEGORIES;

      this.dataSource = new MatTableDataSource<ConsentForms>;
      this.dataSource.data = tempFormData;
    }
    else if (isConsentRecords(this.router.url)) {
      this.tableHeaders = CONSENT_RECORDS_HEADER;
      this.categories = CONSENT_RECORDS_CATEGORIES;

      this.dataSource = new MatTableDataSource<ConsentRecords>;
      this.dataSource.data = tempRecordsData;
    }
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
  }

  create() {
    let url = `${USER}`;
    if (isConsentPurpose(this.router.url)) {
      url = `${url}/${CONSENT_MANAGEMENT_PURPOSE}`
    }
    else if (isConsentTemplates(this.router.url)) {
      url = `${url}/${CONSENT_MANAGEMENT_TEMPLATES}`
    }
    else if (isConsentForms(this.router.url)) {
      url = `${url}/${CONSENT_MANAGEMENT_FORMS}`
    }
    else if (isConsentRecords(this.router.url)) {
      url = `${url}/${CONSENT_MANAGEMENT_RECORDS}`
    }
    this.router.navigate([`${url}/${CONSENT_MANAGEMENT_CREATE}`]);
  }
}
