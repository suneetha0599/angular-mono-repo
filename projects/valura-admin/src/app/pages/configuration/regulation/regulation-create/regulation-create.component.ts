import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatChipsModule } from '@angular/material/chips';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { Regulation, RegulationPayload } from '@admin-core/models/configuration/regulation';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { CountryService } from '@admin-core/services/country/country.service';
import { FormElementsConfig } from '../../configuration/constants';

interface DialogData {
  regulation: number;
  viewType?: string
  regulationData?: any
}

@Component({
  selector: 'app-regulation-create',
  imports: [
    CommonModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatMenuModule,
    DragDropModule,
    LoadingButtonComponent,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './regulation-create.component.html',
  styleUrls: ['./regulation-create.component.scss'],
})
export class RegulationCreateComponent {
  form: FormGroup;
  submitLoading = false;
  isEditMode = false;
  regulationId: number | null = null;
  regulationDetails: any = null;
  currentRegulation: Regulation | null = null;
  viewType: string | null = null;

  countriesList: Array<{ id: number; name: string }> = [];

  private regulationsService = inject(RegulationsService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private countryService = inject(CountryService)


  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<RegulationCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.regulationId = data.regulation;
    this.viewType = data?.viewType || null;
    this.form = this.fb.group({
      name: ['', Validators.required],
      jurisdiction: ['', Validators.required],
      countries: [[], Validators.required],
      extensionTime: [[], Validators.required],
      respondTime: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.getCountryMasterList();
    if (this.regulationId) {
      this.isEditMode = true;
      if (this.viewType) {
        this.onViewTypeInit()
        return
      }
      this.loadRegulation(this.regulationId);
    }
  }

  onViewTypeInit() {
    if (this.viewType == FormElementsConfig.REGULATIONS) {
      const response = this.data?.regulationData ?? null;
      this.form.get('name')?.disable();
      this.form.get('jurisdiction')?.disable();
      this.form.get('extensionTime')?.disable();
      this.form.get('respondTime')?.disable();
      this.form.get('countries')?.enable();

      if (response) {
        this.patchRegulationDetails(response);
      }
    }
  }

  async getCountryMasterList() {
    const res = await this.countryService.getCountryMasterList();
    if (this.viewType) {
      const response = await this.regulationsService.getRegulationById(this.data.regulation ?? 0);
      const regulationCountriesIds = new Set((response?.countries || []).map((country: any) => country.countryId));
      this.countriesList = (res ?? []).filter(country => regulationCountriesIds.has(country.id));
      return
    }
    else {
      this.countriesList = res ?? [];
    }
  }

  async loadRegulation(id: number) {
    try {
      if (this.countriesList.length === 0) {
        await this.getCountryMasterList();
      }

      const response = await this.regulationsService.getRegulationById(id);
      if (response) {
        this.patchRegulationDetails(response);
      } else {
        this.snackbarService.openSnack('Regulation not found');
      }
    } catch (err) {
      console.error('Error loading regulation', err);
      this.snackbarService.openSnack('Failed to load regulation details');
    }
  }

  patchRegulationDetails(response: any) {
    this.regulationDetails = this.mapCountryIdsToNames(response);
    this.currentRegulation = response;

    this.form.patchValue({
      name: response.name,
      jurisdiction: response.jurisdiction,
      countries: this.regulationDetails.countries || [],
      extensionTime: response.extensionTime || null,
      respondTime: response.respondTime || null
    });
    this.updateSelectedCountriesText();
  }

  private mapCountryIdsToNames(regulation: any) {
    const mappedCountries = regulation.countries?.length ? regulation.countries.map((c: any) => ({ id: c.countryId, name: c.countryName })) : [];

    return {
      ...regulation,
      name: regulation.actName,
      countries: mappedCountries
    };
  }

  clearSearch(input: HTMLInputElement) {
    input.value = '';
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack('All fields are required');
      return;
    }
    this.submitLoading = true;

    const formValue = this.form.getRawValue();

    if (this.viewType) {  // from form configuration
      this.onUpdateRegulationInFormConfiguration(formValue)
      return
    }
    try {
      const countryIdsToSend = (formValue.countries || []).map((country: any) => country.id);
      const requestBody: RegulationPayload = {
        actName: formValue.name,
        jurisdiction: formValue.jurisdiction,
        dataSubjectRegion: "Region",
        countryIds: countryIdsToSend,
        respondTime: formValue.respondTime,
        extensionTime: formValue.extensionTime,
      };

      if (this.isEditMode && this.regulationId) {
        let response = await this.configApiHelperService.updateRegulation(
          requestBody,
          this.regulationId
        );
        const dbData = {
          ...response,
        };
        await this.regulationsService.updateRegulation(this.regulationId, dbData);
      }
      else {
        let response = await this.configApiHelperService.createRegulation(requestBody);
        const dbData = {
          ...response,
        };
        await this.regulationsService.addRegulation(dbData);
      }
      await this.regulationsService.getRegulationMasterList();
      this.resetForm();

    } catch (error) {
      console.error(error);
      // this.snackbarService.openSnack('Something went wrong');
    } finally {
      this.submitLoading = false;
    }
  }

  resetForm(): void {
    this.form.reset();
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
    this.dialogRef.close({ success: true });
  }

  compareCountries(c1: any, c2: any): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  selectedCountriesText: string = '';

  updateSelectedCountriesText() {
    const selected = this.form.get('countries')?.value || [];
    if (selected.length === 0) {
      this.selectedCountriesText = '';
    } else if (selected.length === 1) {
      this.selectedCountriesText = selected[0].name;
    } else {
      this.selectedCountriesText = `${selected[0].name} +${selected.length - 1} more`;
    }
  }

  asCountryValue(country: any) {
    return {
      id: country.id,
      name: country.name,
    };
  }

  onUpdateRegulationInFormConfiguration(formValue: any) {
    if (this.viewType == FormElementsConfig.REGULATIONS) {
      const countryDbObject = (formValue.countries || []).map((country: any) => ({ countryId: country.id, countryName: country.name }));
      const countryNames = (formValue.countries || []).map((country: any) => country.name);
      this.dialogRef.close({ success: true, data: { countries: countryDbObject, countryNames: countryNames } });
    }
    this.submitLoading = false;
  }
}
