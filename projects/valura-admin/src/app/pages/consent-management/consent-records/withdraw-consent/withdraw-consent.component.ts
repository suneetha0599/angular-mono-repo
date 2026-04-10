import { Component, OnInit, ViewChild } from '@angular/core';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckbox } from '@angular/material/checkbox';
@Component({
  selector: 'app-withdraw-consent',
  imports: [
    FormsModule,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatTooltip,
    LoadingButtonComponent,
    MatOption,
    MatSelect,
    MatMiniFabButton,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatSort,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSortHeader,
    MatCheckbox,


  ],
  templateUrl: './withdraw-consent.component.html',
  styleUrl: './withdraw-consent.component.scss'
})
export class WithdrawConsentComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) { }
  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      confirmEmail: [''],
      phone: [''],
      purpose: [[]]
    });

  }
  displayedColumns = [
    'select',
    'Attributes',
    'Category',
    'Consent ID',
    'Purposes',
    'Upstream sources',
    'Actions'
  ];
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource([
    {
      attributes: 'First Name, Email',
      category: 'Personal Identifiers',
      consentId: 'CNS-00123',
      purposes: ['Marketing', 'Audit'],
      upstreamSources: 'CRM, HRMS',
      actions: 'revoke',
    },
    {
      attributes: 'Phone, Address',
      category: 'Contact Info',
      consentId: 'CNS-00145',
      purposes: ['Research'],
      upstreamSources: 'Salesforce',
      actions: 'revoke',
    },
    {
      attributes: 'First Name, Email',
      category: 'Personal Identifiers',
      consentId: 'CNS-00123',
      purposes: ['Marketing', 'Audit'],
      upstreamSources: 'CRM, HRMS',
      actions: 'revoke',
    },
    {
      attributes: 'Phone, Address',
      category: 'Contact Info',
      consentId: 'CNS-00145',
      purposes: ['Research'],
      upstreamSources: 'Salesforce',
      actions: 'revoke',
    },
    {
      attributes: 'First Name, Email',
      category: 'Personal Identifiers',
      consentId: 'CNS-00123',
      purposes: ['Marketing', 'Audit'],
      upstreamSources: 'CRM, HRMS',
      actions: 'revoke',
    },
    {
      attributes: 'Phone, Address',
      category: 'Contact Info',
      consentId: 'CNS-00145',
      purposes: ['Research'],
      upstreamSources: 'Salesforce',
      actions: 'revoke',
    },
    {
      attributes: 'First Name, Email',
      category: 'Personal Identifiers',
      consentId: 'CNS-00123',
      purposes: ['Marketing', 'Audit'],
      upstreamSources: 'CRM, HRMS',
      actions: 'revoke',
    },
    {
      attributes: 'Phone, Address',
      category: 'Contact Info',
      consentId: 'CNS-00145',
      purposes: ['Research'],
      upstreamSources: 'Salesforce',
      actions: 'revoke',
    }
  ]);

  tooltip = "Data Usage\n  This data is collected solely for identification purpose"
  ngAfterViewInit() {


  }
  revokeAll() {

  }

  onCancel() {

  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }


  dataStatus: 'initial' | 'found' | 'not-found' = 'initial';

  findDataSubject() {
    const data = this.dataSource.data; // Get the actual data array

    if (data && data.length > 0) {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataStatus = 'found';
    } else {
      this.dataStatus = 'not-found';
    }
  }


}
