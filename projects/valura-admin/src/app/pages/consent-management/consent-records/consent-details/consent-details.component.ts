import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ConsentRevokeDialogComponent } from '../consent-revoke-dialog/consent-revoke-dialog.component';
import { routes as routeConstants } from '../@admin-coreconstants/routes';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
interface PurposeRow {
  type: string;
  sensitivity: 'High' | 'Medium' | 'Low';
  category: string;
}
@Component({
  selector: 'app-consent-details',
  imports: [
    FormsModule, LoadingButtonComponent, ReactiveFormsModule, MatTable, MatColumnDef, MatSort, MatHeaderCell, MatHeaderCellDef,
    MatCell, MatCellDef, MatHeaderRowDef, MatHeaderRow, MatRow, MatRowDef
  ],
  templateUrl: './consent-details.component.html',
  styleUrl: './consent-details.component.scss'
})
export class ConsentDetailsComponent {
  consentDetails: any;
  displayedColumns: string[] = ['type', 'sensitivity', 'category'];
  dataSource = new MatTableDataSource<PurposeRow>([
    {
      type: 'Marketing',
      sensitivity: 'High',
      category: '12 months',
    },
    {
      type: 'Employee onboarding',
      sensitivity: 'Medium',
      category: '7 years',
    },
    {
      type: 'Retargeting ads',
      sensitivity: 'Low',
      category: 'Until revoked',
    },
  ]);
  currentPath: string = '';

  constructor(private router: Router, private dialog: MatDialog) { }

  revokeConsent() {
    this.dialog.open(ConsentRevokeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-panel',
    });
  }

  ngOnInit() {
    const state = history.state;
    this.consentDetails = state.rowData;
    this.onInitPage()
    if (!this.consentDetails) {

      console.warn('No consent data found. Redirecting...');
      // this.router.navigate(['/user/consent-management/consent-records']);
    }
  }

  onClickDataSubject() {
    this.router.navigate([`${this.currentPath}/${routeConstants.DATA_SUBJECT_DETAILS}`], { state: { consent: this.consentDetails } });
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }
}
