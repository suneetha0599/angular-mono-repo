import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CountryService } from '@admin-core/services/country/country.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
@Component({
  selector: 'app-country-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './country-form.component.html',
  styleUrls: ['./country-form.component.scss']
})
export class CountryFormComponent implements OnInit {
  private apiHelperService = inject(ApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);

  private snackbarService = inject(SnackbarService);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private countryService = inject(CountryService);

  form: FormGroup;
  submitLoading = false;
  isDataLoading = false;
  countryData: any = null;
  countryId: number | null = null;

  isEditMode = false;
  hasApiError: boolean = false;

  private originalName: string = '';
  private originalCountryPhoneCode: string = '';
  private originalCountryCode: string = '';
  private originalPhoneNumberLength: number = 0;

  currentRequestDetails = {
    countryId: 0,
    index: 0
  }

  private navigationDirection: 'prev' | 'next' | null = null;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      countryPhoneCode: ['', [Validators.required]],
      countryCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]],
      phoneNumberLength: [10, [Validators.required, Validators.min(1)]]
    });
  }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async (params) => {
      const countryIdParam = params.get('id');
      if (countryIdParam) {
        this.isEditMode = true;
        this.countryId = Number(countryIdParam);

        if (!this.countryId || isNaN(this.countryId)) {
          this.snackbarService.openSnack('Invalid country ID');
          this.goBack();
          return;
        }
        await this.loadCountryDetails();
      }
    });
  }

  async goToPrevRequest() {
    this.currentRequestDetails.index--;

    if (this.countryService.getPrevRequestShifted()) {
      const prevList = this.countryService.getPrevRequestRid();
      this.countryService.setDsrRequestRid(prevList);

      this.currentRequestDetails.index = prevList.length - 1;
      this.countryService.setPrevRequestShifted('false');
      this.countryService.setPrevRequestPage(0, true);
    }

    const country = this.countryService.getNextOrPrevRequestRid(
      this.currentRequestDetails.index
    );

    if (country) {
      this.navigateToCountry(country.countryId);
    }
  }


  async goToNextRequest() {
    this.currentRequestDetails.index++;

    if (this.countryService.getNextRequestShifted()) {
      const nextList = this.countryService.getNextRequestRid();
      this.countryService.setDsrRequestRid(nextList);

      this.currentRequestDetails.index = 0;
      this.countryService.setNextRequestShifted('false');
      this.countryService.setNextRequestPage(0, true);
    }

    const country = this.countryService.getNextOrPrevRequestRid(
      this.currentRequestDetails.index
    );

    if (country) {
      this.navigateToCountry(country.countryId);
    }
  }
  navigateToCountry(countryId: number) {
    this.router.navigate(
      ['/admin/countries/details/', countryId]
    );
  }


  get disablePrevBtn(): boolean {
    return (
      this.currentRequestDetails.index === 0 &&
      !this.countryService.getPrevRequestShifted()
    );
  }

  get disableNextBtn(): boolean {
    const listLength = this.countryService.getDsrRequestRid()?.length ?? 0;
    return (
      this.currentRequestDetails.index === listLength - 1 &&
      !this.countryService.getNextRequestShifted()
    );
  }


  private async loadCountryDetails(): Promise<void> {
    if (!this.countryId) return;
    this.hasApiError = false;
    this.isDataLoading = true;
    try {
      const countryResponse = await this.countryService.getCountryById(this.countryId);
      if (!countryResponse) { this.hasApiError = true; return }
      if (countryResponse) {
        this.countryData = countryResponse;
        this.populateForm();
        this.storeOriginalData();
      } else {
        this.snackbarService.openSnack('Failed to load country details');
        this.goBack();
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading country details');
      console.error('Error:', error);
      this.hasApiError = true;
    } finally {
      this.isDataLoading = false;
    }
  }

  private populateForm(): void {
    if (!this.countryData) return;

    this.form.setValue({
      name: this.countryData.name || '',
      countryPhoneCode: this.countryData.countryPhoneCode || '',
      countryCode: this.countryData.countryCode || '',
      phoneNumberLength: this.countryData.phoneNumberLength || 10
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private storeOriginalData(): void {
    this.originalName = this.form.get('name')?.value?.trim() || '';
    this.originalCountryPhoneCode = this.form.get('countryPhoneCode')?.value?.trim() || '';
    this.originalCountryCode = this.form.get('countryCode')?.value?.trim() || '';
    this.originalPhoneNumberLength = this.form.get('phoneNumberLength')?.value || 0;
  }

  get hasChanges(): boolean {
    if (!this.isEditMode) return true;

    const currentName = this.form.get('name')?.value?.trim() || '';
    const currentCountryPhoneCode = this.form.get('countryPhoneCode')?.value?.trim() || '';
    const currentCountryCode = this.form.get('countryCode')?.value?.trim() || '';
    const currentPhoneNumberLength = this.form.get('phoneNumberLength')?.value || 0;

    return (
      currentName !== this.originalName ||
      currentCountryPhoneCode !== this.originalCountryPhoneCode ||
      currentCountryCode !== this.originalCountryCode ||
      currentPhoneNumberLength !== this.originalPhoneNumberLength
    );
  }

  get canSave(): boolean {
    if (!this.isEditMode) {
      return this.isFormValid;
    }
    return this.isFormValid && this.hasChanges;
  }

  async onSubmit(): Promise<void> {
    this.markFormGroupTouched();

    if (this.form.invalid) {
      return;
    }

    if (this.isEditMode && !this.hasChanges) {
      this.snackbarService.openSnack('No changes to save');
      return;
    }

    this.submitLoading = true;

    try {
      if (this.isEditMode && this.countryId) {
        const updatedData: any = {
          name: this.form.get('name')?.value?.trim(),
          countryPhoneCode: this.form.get('countryPhoneCode')?.value?.trim(),
          countryCode: this.form.get('countryCode')?.value?.trim(),
          phoneNumberLength: this.form.get('phoneNumberLength')?.value
        };

        const result = await this.countryService.updateCountryWithApi(
          this.countryId,
          updatedData,
          this.configApiHelperService
        );

        if (result) {
          this.countryData = { ...this.countryData, ...updatedData };
          this.storeOriginalData();
          this.goBack();
        } else {
          this.snackbarService.openSnack('Failed to update country');
        }
      } else {
        const newCountryData: any = {
          actId: 1, // Default actId
          name: this.form.get('name')?.value?.trim(),
          countryPhoneCode: this.form.get('countryPhoneCode')?.value?.trim(),
          countryCode: this.form.get('countryCode')?.value?.trim(),
          phoneNumberLength: this.form.get('phoneNumberLength')?.value
        };

        const result = await this.countryService.createCountryWithApi(
          newCountryData,
          this.configApiHelperService
        );

        if (result) {
          this.resetForm();
          this.goBack();
        } else {
          this.snackbarService.openSnack('Failed to create country');
        }
      }
    } catch (error) {
      console.error('Error saving country:', error);
      this.snackbarService.openSnack('Failed to save country');
    } finally {
      this.submitLoading = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    if (this.isEditMode) {
      this.form.patchValue({
        name: this.originalName,
        countryPhoneCode: this.originalCountryPhoneCode,
        countryCode: this.originalCountryCode,
        phoneNumberLength: this.originalPhoneNumberLength
      });
    } else {
      this.form.reset({
        phoneNumberLength: 10
      });
    }

    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Country Details' : 'Create Country';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Save Changes' : 'Save Country';
  }

  get showCancelButton(): boolean {
    return !this.isEditMode;
  }

  get resetButtonText(): string {
    return this.isEditMode ? 'Reset' : 'Clear';
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        const requiredLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at most ${requiredLength} characters`;
      }
      if (control.errors['min']) {
        const minValue = control.errors['min'].min;
        return `${this.getFieldLabel(fieldName)} must be at least ${minValue}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Country name',
      countryPhoneCode: 'Phone code',
      countryCode: 'Country code',
      phoneNumberLength: 'Phone number length'
    };
    return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  goBack(): void {
    this.location.back();
  }

  get nameControl(): FormControl {
    return this.form.get('name') as FormControl;
  }

  get countryCodeControl(): FormControl {
    return this.form.get('countryCode') as FormControl;
  }

  get countryPhoneCodeControl(): FormControl {
    return this.form.get('countryPhoneCode') as FormControl;
  }
}
