import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DashboardDetails } from '@admin-core/models/dashboardDetails';
import { EchartsComponent } from './echarts/echarts.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatOptionModule,
    EchartsComponent,
    LoadingButtonComponent,
    NgTemplateOutlet
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private apiHelperService = inject(ApiHelperService);
  DashboardDetails?: DashboardDetails
  dsrData: any = { total: 0, completed: 0, pending: 0 };
  isLoading: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getDsrData()
    setInterval(() => {
      this.next();
    }, 6000);
  }


  tabs = [
    { title: 'LIA', completed: '12k', pending: 10 },
    { title: 'PIA', completed: '8k', pending: 15 },
    { title: 'RA', completed: '5k', pending: 12 }
  ];


  next() {
    this.selectedTab = (this.selectedTab + 1) % this.tabs.length;
  }

  prev() {
    this.selectedTab = (this.selectedTab - 1 + this.tabs.length) % this.tabs.length;
  }

  async getDsrData() {
    this.isLoading = true;
    try {
      const response = await this.apiHelperService.getDashboardDetails();
      if (response) {
        this.DashboardDetails = response;
      }
      // this.dsrData = {
      //   total: this.DashboardDetails?.totalReceivedDsrRequests,
      //   completed: this.DashboardDetails?.totalCompletedDsrRequests,
      //   pending: this.DashboardDetails?.pendingDsrRequests,
      // };
    } catch (error) {
      console.error("Error fetching dashboard details:", error);
    } finally {
      this.isLoading = false;
    }
  }
  selectedTab = 0;
  displayedColumns: string[] = [
    'sourceSystem',
    'recipient',
    'dataElements',
    'riskLevel',
    'purposes',
    'legalBasis'
  ];

  displayedPdColumns: string[] = [
    'personalDataElement',
    'category',
    'purpose',
    'classification'
  ];

  dataSource = new MatTableDataSource([
    {
      sourceSystem: 'CRM',
      recipient: 'Mailchimp',
      dataElements: 'Email, first name',
      riskLevel: 'Low',
      purposes: 'Marketing Emails',
      legalBasis: 'Consent'
    },
    {
      sourceSystem: 'HRMS',
      recipient: 'Payroll System',
      dataElements: 'PAN, Bank account, Adhar card, Form + 2',
      riskLevel: 'Medium',
      purposes: 'Salary',
      legalBasis: 'Contractual'
    },
    {
      sourceSystem: 'Website',
      recipient: 'Analytics Tool',
      dataElements: 'ID, Device Info',
      riskLevel: 'High',
      purposes: 'Usage Analytics',
      legalBasis: 'Consent'
    },
    {
      sourceSystem: 'HRMS',
      recipient: 'Payroll System',
      dataElements: 'Email, first name',
      riskLevel: 'Low',
      purposes: 'Salary',
      legalBasis: 'Contractual'
    },
    {
      sourceSystem: 'CRM',
      recipient: 'Mailchimp',
      dataElements: 'Email, first name',
      riskLevel: 'High',
      purposes: 'Marketing Emails',
      legalBasis: 'Consent'
    }
  ]);

  personalDataElementDatasource = new MatTableDataSource([
    {
      "personalDataElement": "Email Address",
      "category": "Personal identifiers",
      "purpose": "Employment",
      "classification": "Personal"
    },
    {
      "personalDataElement": "Bank Account No.",
      "category": "Financial",
      "purpose": "Salary",
      "classification": "Critical"
    },
    {
      "personalDataElement": "Mobile Number",
      "category": "Contact",
      "purpose": "Communication",
      "classification": "Personal"
    },
    {
      "personalDataElement": "Resume",
      "category": "Contact",
      "purpose": "Employment",
      "classification": "Critical"
    },
    {
      "personalDataElement": "Full name",
      "category": "Personal identifiers",
      "purpose": "Employment",
      "classification": "Sensitive"
    }
  ]);
}
