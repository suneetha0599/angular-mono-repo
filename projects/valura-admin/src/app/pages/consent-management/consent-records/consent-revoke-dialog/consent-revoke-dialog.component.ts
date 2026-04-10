import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-consent-revoke-dialog',
  imports: [
    LoadingButtonComponent,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSort,
    MatTable,
    MatHeaderCellDef
  ],
  templateUrl: './consent-revoke-dialog.component.html',
  styleUrl: './consent-revoke-dialog.component.scss'
})
export class ConsentRevokeDialogComponent {

  isEffected = true;
  Continue() {

  }

  onCancel() {

  }

  displayedColumns = ['type', 'sensitivity']



  data = new MatTableDataSource([
    {
      'type': 'Name',
      'sensitivity': 'high',
    },
    {
      'type': 'Email',
      'sensitivity': 'high',
    },
  ]);

  onUpdateDS() {

  }

  onForceRevoke() {

  }
}
