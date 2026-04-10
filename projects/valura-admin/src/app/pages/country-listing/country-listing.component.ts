import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { CountryService } from '@admin-core/services/country/country.service';
import { Country } from '@admin-core/models/configuration/regulation';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
@Component({
  selector: 'app-country-listing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './country-listing.component.html',
  styleUrl: './country-listing.component.scss'
})
export class CountryListingComponent implements OnInit {
  currentPath: string = '';
  countries: Country[] = [];
  isLoading: boolean = true;
  displayedColumns: string[] = ['sno', 'name', 'countryCode', 'phoneCode', 'actions'];

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    name: '',
    countryCode: '',
    countryPhoneCode: '',
    id: 0
  }));
  hasApiError: boolean = false;
  countryFullAcess: boolean = false;

  private configApiHelperService = inject(ConfigApiHelperService);
  constructor(
    private router: Router,
    private apiHelperService: ApiHelperService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private countryService: CountryService
  ) { }

  private rolePermissionService = inject(RolePermissionService);

  ngOnInit(): void {
    this.countryService.clearCountryNavigationState()
    this.onInitPage();
    this.loadCountries();
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.countryFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  viewCountryDetails(country: Country): void {
    this.setCurrentRequestList()
    this.router.navigate([`${this.currentPath}/details/${country.id}`]);
  }
  setCurrentRequestList(): void {
    if (!this.countries || !this.countries.length) {
      return;
    }

    const countryList = this.countries.map(item => ({
      countryId: item.id
    }));

    this.countryService.setDsrRequestRid(countryList);
  }

  editCountry(country: Country): void {
    this.router.navigate([`${this.currentPath}/details/${country.id}`]);
  }

  async loadCountries(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasApiError = false;
      const response = await this.countryService.getCountryMasterList();
      if (!response) {
        this.hasApiError = true;
        return
      }
      if (response) {
        this.countries = response;
      } else {
        this.countries = [];
        this.snackbarService.openSnack('Failed to load countries');
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading countries');
      console.error('Error:', error);
      this.countries = [];
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteCountry(country: Country): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,

      data: {
        type: 'confirmation',
        title: 'Confirm Country Deletion',
        content: 'Are you sure you want to delete this country?',
        confirmationDetail: country.name,
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
        const response = await this.countryService.deleteCountryWithApi(country.id, this.configApiHelperService);

        if (response) {
          this.countries = this.countries.filter(c => c.id !== country.id);

          const message = response.message || 'Country deleted successfully';
          this.snackbarService.openSnack(message);
        } else {
          this.snackbarService.openSnack('Failed to delete country');
        }
      } catch (error) {
        this.snackbarService.openSnack('Error deleting country');
        console.error('Error:', error);
      }
    });

  }

  addCountry(): void {
    this.router.navigate([`${this.currentPath}/${routeConstants.COUNTRY_MANAGEMENT_CREATION}`]);
  }

  get showRequestList() {
    return this.countries?.length
  }
}
