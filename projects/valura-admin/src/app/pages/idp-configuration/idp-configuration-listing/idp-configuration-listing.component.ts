import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { AddIdpComponent } from '../add-idp-config/add-idp-config.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatMenuModule } from '@angular/material/menu';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'app-idp-configuration-listing',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    LoadingButtonComponent,
    MatMenuModule
  ],
  templateUrl: './idp-configuration-listing.component.html',
  styleUrl: './idp-configuration-listing.component.scss'
})
export class IdpConfigurationListingComponent implements OnInit {

  isLoading = true;

  displayedColumns: string[] = ['id', 'displayName', 'idpType', 'active', 'actions'];

  idpList: any[] = [];

  shimmerDataSource = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    sno: '',
    displayName: '',
    type: '',
    status: ''
  }));

  constructor(
    private apiHelperService: ApiHelperService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadIdpList();
  }

  async loadIdpList(): Promise<void> {
    try {
      this.isLoading = true;
      const res = await this.apiHelperService.getIdpList();

      this.idpList = Array.isArray(res) ? res : [];
    } catch (error) {
      console.error('Error loading IDP list:', error);
      this.idpList = [];
    } finally {
      this.isLoading = false;
    }
  }
  addClient(): void {
    const dialogRef = this.dialog.open(AddIdpComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.loadIdpList();
      }
    });
  }


  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }


  viewDetails(row: any): void {
    this.dialog.open(AddIdpComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        mode: 'edit',
        idpId: row.id
      }
    });
  }

  async deleteIdp(row: any): Promise<void> {

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm IDP Deletion',
        content: 'Are you sure you want to delete this IDP?',
        confirmationDetail: row.displayName,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      try {

        const response = await this.apiHelperService.deleteIdp(row.id);
        if (response) {

          this.loadIdpList()
        }
      } catch (error) {

        console.error('Error:', error);
      }
    });
  }

}
