
import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  inject,
  signal,
  OnInit,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import {
  Risk,
  RiskCategory,
  LikelihoodLevel,
  ImpactLevel,
  RiskLevel,
  CreateRiskRequest,
  RiskParameter,
  CategoryOption,
  LevelOption,
} from '../models/risk-summary-model';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import {
  FIELD_DISPLAY_NAMES,
  LIKELIHOOD_SCORES,
  IMPACT_SCORES,
  RISK_LEVEL_CLASSES
} from '@admin-core/constants/constants';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { ParameterService } from '@admin-core/services/parameter/parameter.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-risk-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    TextFieldModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './risk-dialog.component.html',
  styleUrls: ['./risk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskDialogComponent implements OnInit {
  readonly riskForm: FormGroup;
  protected readonly newParameterControl = new FormControl('');
  protected readonly parameters = signal<RiskParameter[]>([]);
  protected readonly isLoadingParameters = signal<boolean>(false);
  protected readonly isAddingParameter = signal<boolean>(false);
  protected readonly showAddParameterForm = signal<boolean>(false);
  protected readonly searchText = signal<string>('');
  public editData: any = null;
  public isEditMode = false;

  protected readonly filteredParameters = computed(() => {
    const params = this.parameters();
    const search = this.searchText().toLowerCase().trim();

    if (!Array.isArray(params)) {
      return [];
    }

    if (!search) {
      return params;
    }

    return params.filter(param =>
      param && param.name && (
        param.name.toLowerCase().includes(search) ||
        (param.description && param.description.toLowerCase().includes(search))
      )
    );
  });

  protected readonly shouldShowCreateButton = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const params = this.parameters();

    if (!search || search.length < 2 || !Array.isArray(params)) {
      return false;
    }

    const exactMatch = params.some(param =>
      param && param.name && param.name.toLowerCase() === search
    );

    return !exactMatch;
  });
  protected readonly riskCategories: CategoryOption[] = [
    { value: RiskCategory.PROCESSING_RISK, label: 'Processing Risk' },
    { value: RiskCategory.TRANSFER_RISK, label: 'Transfer Risk' },
    { value: RiskCategory.AI_RISK, label: 'AI Risk' }
  ];
  protected readonly likelihoodLevels: LevelOption[] = [
    { value: LikelihoodLevel.REMOTE, label: 'Remote' },
    { value: LikelihoodLevel.POSSIBLE, label: 'Possible' },
    { value: LikelihoodLevel.PROBABLE, label: 'Probable' }
  ];
  protected readonly impactLevels: LevelOption[] = [
    { value: ImpactLevel.MINIMUM, label: 'Minimum' },
    { value: ImpactLevel.SIGNIFICANT, label: 'Significant' },
    { value: ImpactLevel.SEVERE, label: 'Severe' }
  ];



  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<RiskDialogComponent>);
  private readonly apiHelperService = inject(ApiHelperService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly parameterService = inject(ParameterService);
  protected readonly fromAssessment: boolean = false;

  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly isSubmitting = signal<boolean>(false);
  private readonly hasFormErrors = signal<boolean>(false);
  private readonly formErrorMessage = signal<string>('');
  private readonly formValidationSignal = signal<boolean>(false);
  private readonly formValues = signal<any>({});
  protected readonly questionId: number | null = null;
  private configApiHelperService = inject(ConfigApiHelperService);
  riskOptions = [
    { key: 'AVOID', label: 'Avoid' },
    { key: 'ACCEPT', label: 'Accept' },
    { key: 'MITIGATE', label: 'Mitigate' },
    { key: 'TRANSFER', label: 'Transfer' }
  ];

  constructor() {
    if (this.dialogData) {
      if (this.dialogData.questionId) {
        this.questionId = this.dialogData.questionId || null;
      }
      if (this.dialogData.editData) {
        this.isEditMode = true;
        this.editData = this.dialogData.editData;
      }
      if (this.dialogData.fromAssessment) {
        this.fromAssessment = true;
      }
    }


    this.riskForm = this.initializeForm();
    this.setupFormSubscriptions();
    this.setupFormControlEffects();
    if (this.fromAssessment) {
      this.riskForm.get('category')?.clearValidators();
      this.riskForm.get('category')?.setValue(null);
      this.riskForm.get('category')?.updateValueAndValidity();
      // this.riskForm.get('measureType')?.setValidators(Validators.required);
      // this.riskForm.get('measureType')?.updateValueAndValidity();
    }
  }

  async ngOnInit(): Promise<void> {
    this.parameters.set([]);
    this.isLoadingParameters.set(true);

    await this.loadParametersMasterList();

    if (this.isEditMode && this.editData) {
      this.riskForm.patchValue({
        parameterId: this.editData.parameter,
        category: this.editData.category,
        description: this.editData.description,
        likelihood: this.editData.likelihood,
        impact: this.editData.impact,
        measureType: this.editData.measureType || ''
      });
    }
  }


  get parameterIdControl(): FormControl {
    return this.riskForm.get('parameterId') as FormControl;
  }

  get categoryControl(): FormControl {
    return this.riskForm.get('category') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.riskForm.get('description') as FormControl;
  }

  get likelihoodControl(): FormControl {
    return this.riskForm.get('likelihood') as FormControl;
  }

  get impactControl(): FormControl {
    return this.riskForm.get('impact') as FormControl;
  }

  protected async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.hasFormErrors.set(false);

    if (this.isEditMode) {
      this.updateRisk();
    } else {

      try {
        const apiRequest = this.createApiRequestFromForm();
        let response;

        if (this.questionId) {
          response = await firstValueFrom(this.apiHelperService.createQuestionRisk(this.questionId, apiRequest));
        } else {
          response = await firstValueFrom(this.apiHelperService.createRisk(apiRequest));
        }

        if (response.success) {
          const riskData = this.createRiskFromForm();
          if (response.data && typeof response.data === 'string') {
            riskData.id = response.data;
          }
          this.dialogRef.close(riskData);
        } else {
          throw new Error(response.message || 'Failed to create risk');
        }
      } catch (error) {
        this.handleSubmissionError(error);
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  private async updateRisk() {
    const apiRequest = this.createApiRequestFromForm();
    this.isSubmitting.set(true);

    try {
      const response = await this.apiHelperService.updateRisk(apiRequest, this.editData.id);
      if (response?.message) {
        this.dialogRef.close();
      } else {
        throw new Error(response?.message || "Failed to update risk");
      }
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.riskForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  protected getFieldError(fieldName: string): string {
    const field = this.riskForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    }

    return '';
  }

  protected hasParameterCategoryRowErrors(): boolean {
    return this.hasParameterErrors() || this.hasCategoryErrors();
  }

  protected hasDescriptionRowErrors(): boolean {
    const descriptionControl = this.riskForm?.get('description');
    return !!(descriptionControl?.errors && descriptionControl?.touched);
  }

  protected hasLikelihoodImpactRowErrors(): boolean {
    return this.hasLikelihoodErrors() || this.hasImpactErrors();
  }

  protected hasParameterErrors(): boolean {
    const parameterControl = this.riskForm?.get('parameterId');
    return !!(parameterControl?.errors && parameterControl?.touched);
  }

  protected hasCategoryErrors(): boolean {
    const categoryControl = this.riskForm?.get('category');
    return !!(categoryControl?.errors && categoryControl?.touched);
  }

  protected hasLikelihoodErrors(): boolean {
    const likelihoodControl = this.riskForm?.get('likelihood');
    return !!(likelihoodControl?.errors && likelihoodControl?.touched);
  }

  protected hasImpactErrors(): boolean {
    const impactControl = this.riskForm?.get('impact');
    return !!(impactControl?.errors && impactControl?.touched);
  }

  protected getRiskLevelClass(riskLevel: RiskLevel): string {
    return RISK_LEVEL_CLASSES[riskLevel] || RISK_LEVEL_CLASSES['LOW'];
  }



  private initializeForm(): FormGroup {
    return this.fb.group({
      parameterId: ['', [Validators.required]],
      category: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      likelihood: ['', [Validators.required]],
      impact: ['', [Validators.required]],
      measureType: ['']
    });
  }

  private setupFormSubscriptions(): void {
    this.formValidationSignal.set(this.riskForm.valid);
    this.formValues.set(this.riskForm.value);

    this.riskForm.statusChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formValidationSignal.set(this.riskForm.valid);
      this.updateFormErrors();
    });

    this.riskForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      this.formValidationSignal.set(this.riskForm.valid);
      this.formValues.set(value);
    });

    this.newParameterControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.newParameterValue.set(value || '');
    });
  }

  private setupFormControlEffects(): void {
    effect(() => {
      this.updateParameterInputState();
      this.updateNewParameterInputState();
    });
  }

  private updateParameterInputState(): void {
    const parameterControl = this.riskForm.get('parameterId');
    if (this.isParameterInputDisabled()) {
      parameterControl?.disable();
    } else {
      parameterControl?.enable();
    }
  }

  private updateNewParameterInputState(): void {
    if (this.isNewParameterInputDisabled()) {
      this.newParameterControl.disable();
    } else {
      this.newParameterControl.enable();
    }
  }

  private updateFormErrors(): void {
    if (this.riskForm.invalid && this.hasAnyTouchedFields()) {
      const firstError = this.getFirstFormError();
      this.hasFormErrors.set(!!firstError);
      this.formErrorMessage.set(firstError);
    } else {
      this.hasFormErrors.set(false);
      this.formErrorMessage.set('');
    }
  }

  private hasAnyTouchedFields(): boolean {
    return Object.keys(this.riskForm.controls).some(key =>
      this.riskForm.get(key)?.touched
    );
  }

  private getFirstFormError(): string {
    const controls = this.riskForm.controls;

    if (controls['parameterId'].invalid && controls['parameterId'].touched) {
      return 'Parameter is required';
    }
    if (controls['category'].invalid && controls['category'].touched) {
      return 'Category is required';
    }
    if (controls['description'].invalid && controls['description'].touched) {
      const descriptionErrors = controls['description'].errors;
      if (descriptionErrors?.['required']) return 'Description is required';
      if (descriptionErrors?.['minlength']) return 'Enter more than 10 characters';
      if (descriptionErrors?.['maxlength']) return 'Description cannot exceed 500 characters';
    }
    if (controls['likelihood'].invalid && controls['likelihood'].touched) {
      return 'Likelihood is required';
    }
    if (controls['impact'].invalid && controls['impact'].touched) {
      return 'Impact is required';
    }

    return 'Please fill in all required fields';
  }

  private getFieldDisplayName(fieldName: string): string {
    return FIELD_DISPLAY_NAMES[fieldName] || fieldName;
  }


  calculateRiskLevel(likelihood: LikelihoodLevel, impact: ImpactLevel): RiskLevel {
    const likelihoodScore = this.getLikelihoodScore(likelihood);
    const impactScore = this.getImpactScore(impact);
    const riskScore = likelihoodScore * impactScore;

    if (riskScore >= 6) {
      return RiskLevel.HIGH;
    }
    if (riskScore >= 3) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  private getLikelihoodScore(likelihood: LikelihoodLevel): number {
    return LIKELIHOOD_SCORES[likelihood] || 1;
  }

  private getImpactScore(impact: ImpactLevel): number {
    return IMPACT_SCORES[impact] || 1;
  }

  private getLikelihoodLabel(likelihood: LikelihoodLevel): string {
    const option = this.likelihoodLevels.find(level => level.value === likelihood);
    return option?.label || 'Unknown';
  }

  private getImpactLabel(impact: ImpactLevel): string {
    const option = this.impactLevels.find(level => level.value === impact);
    return option?.label || 'Unknown';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.riskForm.controls).forEach(key => {
      const control = this.riskForm.get(key);
      control?.markAsTouched();
    });
    this.updateFormErrors();
  }

  private createApiRequestFromForm(): CreateRiskRequest {
    const formValue = this.riskForm.value;
    const parameterIdValue = formValue.parameterId;
    if (!parameterIdValue) {
      throw new Error('Parameter is required');
    }

    // const parameterId = parseInt(parameterIdValue);
    // if (isNaN(parameterId)) {
    //   throw new Error('Invalid parameter selected');
    // }

    const categoryType = this.mapCategoryToServerFormat(formValue.category);

    const apiRequest = {
      parameter: parameterIdValue,
      description: formValue.description,
      likelihood: formValue.likelihood,
      impact: formValue.impact,
      categoryType: this.fromAssessment ? null : this.mapCategoryToServerFormat(formValue.category)
    };
    return apiRequest;
  }

  private mapCategoryToServerFormat(category: RiskCategory): string {
    switch (category) {
      case RiskCategory.PROCESSING_RISK:
        return 'PROCESSING';
      case RiskCategory.TRANSFER_RISK:
        return 'TRANSFER';
      case RiskCategory.AI_RISK:
        return 'AI';
      default:
        return 'PROCESSING';
    }
  }

  private async loadParametersMasterList(): Promise<void> {
    try {
      const parameters = await this.parameterService.getParameterMasterList();
      this.parameters.set(parameters);

    } catch (error) {
      this.parameters.set([]);
    } finally {
      this.isLoadingParameters.set(false);
    }
  }


  protected onShowAddParameterForm(): void {
    this.showAddParameterForm.set(true);
    this.newParameterControl.setValue('');

    setTimeout(() => {
      const input = document.querySelector('#newParameterInput') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  protected onCancelAddParameter(): void {
    this.showAddParameterForm.set(false);
    this.newParameterControl.setValue('');
  }

  protected async onAddParameter(): Promise<void> {
    const parameterName = this.newParameterControl.value?.trim();
    if (!parameterName || parameterName.length < 2) {
      return;
    }

    this.isAddingParameter.set(true);
    const parameterData = { name: parameterName };
    this.configApiHelperService.createParameter(parameterData)
      .subscribe({
        next: async (res: any) => {
          const newParameter = res.data;
          await this.parameterService.addParameter(newParameter)
          await this.loadParametersMasterList();
          this.riskForm.patchValue({ parameterId: newParameter.id });

          this.showAddParameterForm.set(false);
          this.newParameterControl.setValue('');
          this.isAddingParameter.set(false);
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isAddingParameter.set(false);
        },
      });
  }


  protected onParameterNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onAddParameter();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancelAddParameter();
    }
  }

  protected onSearchTextChange(searchText: string): void {
    this.searchText.set(searchText);
  }

  protected async onCreateParameterFromSearch(): Promise<void> {
    const searchTerm = this.searchText().trim();

    if (searchTerm && searchTerm.length >= 2) {
      this.isAddingParameter.set(true);
      const parameterData = { name: searchTerm };
      this.configApiHelperService.createParameter(parameterData)
        .subscribe({
          next: async (res) => {
            const newParameter = res.data;
            await this.parameterService.addParameter(newParameter)
            await this.loadParametersMasterList();
            this.riskForm.patchValue({ parameterId: newParameter.id });
            this.searchText.set('');
            this.isAddingParameter.set(false);
          },
          error: (e: Error) => {
            console.error(e.message);
            this.newParameterControl.setValue(searchTerm);
            this.showAddParameterForm.set(true);
            this.searchText.set('');
            this.isAddingParameter.set(false);
          },
        });
    }
  }

  protected displayParameterFn = (parameterId: string): string => {
    if (!parameterId) return '';

    if (parameterId === '__CREATE_NEW__') return '';

    const params = this.parameters();
    if (!Array.isArray(params)) return '';

    const parameter = params.find(p => p && p.id === parameterId);
    return parameter && parameter.name ? parameter.name : '';
  }

  protected onParameterSelected(): void {
    this.searchText.set('');
  }

  private createRiskFromForm(): Risk {
    const formValue = this.riskForm.value;

    return {
      id: Date.now().toString(),
      parameter: formValue.parameterId,
      category: formValue.category as RiskCategory,
      description: formValue.description,
      likelihood: formValue.likelihood as LikelihoodLevel,
      impact: formValue.impact as ImpactLevel,
      riskLevel: this.calculateRiskLevel(formValue.likelihood as LikelihoodLevel, formValue.impact as ImpactLevel),
      createdAt: new Date()
    };
  }

  private handleSubmissionError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save risk. Please try again.';
    this.hasFormErrors.set(true);
    this.formErrorMessage.set(errorMessage);
    this.snackbarService.openSnack(errorMessage, 'OK', 4000);
  }



  protected readonly calculatedRiskLevel = computed(() => {
    const formValue = this.formValues();
    const likelihood = formValue?.likelihood;
    const impact = formValue?.impact;

    if (likelihood && impact) {
      return this.calculateRiskLevel(likelihood, impact);
    }
    return null;
  });

  protected readonly riskScoreCalculation = computed(() => {
    const formValue = this.formValues();
    const likelihood = formValue?.likelihood;
    const impact = formValue?.impact;

    if (likelihood && impact) {
      const likelihoodScore = this.getLikelihoodScore(likelihood);
      const impactScore = this.getImpactScore(impact);
      const riskScore = likelihoodScore * impactScore;

      return {
        likelihoodScore,
        impactScore,
        riskScore,
        likelihoodLabel: this.getLikelihoodLabel(likelihood),
        impactLabel: this.getImpactLabel(impact)
      };
    }
    return null;
  });

  protected readonly canSubmit = computed(() => {
    const formValid = this.formValidationSignal();
    const notSubmitting = !this.isSubmitting();

    return formValid && notSubmitting;
  });

  protected readonly submissionState = computed(() => ({
    isSubmitting: this.isSubmitting(),
    hasErrors: this.hasFormErrors(),
    errorMessage: this.formErrorMessage()
  }));

  protected readonly isParameterInputDisabled = computed(() =>
    this.isLoadingParameters() || this.isAddingParameter()
  );

  protected readonly isNewParameterInputDisabled = computed(() =>
    this.isAddingParameter()
  );

  protected readonly newParameterValue = signal<string>('');

  protected readonly isAddParameterButtonDisabled = computed(() =>
    this.isAddingParameter() || (this.newParameterValue().trim().length || 0) < 2
  );

  protected getRiskLevelTextClass(riskLevel: RiskLevel): string {
    const textClasses: Record<string, string> = {
      'HIGH': 'text-red-600 font-semibold',
      'MEDIUM': 'text-amber-500 font-semibold',
      'LOW': 'text-green-600 font-semibold'
    };

    return textClasses[riskLevel] || textClasses['LOW'];
  }
}

