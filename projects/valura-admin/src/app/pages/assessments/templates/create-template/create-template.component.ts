import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ChangeDetectorRef, Component, inject, Input, SimpleChanges, } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { AssessmentType } from '@admin-core/models/assessment/assessment';
import { ApiHelperService as ConfigurationApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AssessmentTypeService } from '@admin-core/services/assessment-type/assessment-type.service';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { objectControlValidation } from '@admin-core/utils/validators-util';
import { TemplatePreviewStateService } from '../template-preview-state.service';
import { Status } from '../constants';

@Component({
  selector: 'app-create-template',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    DragDropModule,
    CustomMatErrorComponent,
    MatSlideToggleModule,
    MatAutocompleteModule,
    CustomEditorComponent
  ],
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss'],
})
export class CreateTemplateComponent {
  @Input() templateForm!: FormGroup
  @Input() isEditMode!: boolean;
  @Input() dataUpdated: string = '';

  assessmentTypes: AssessmentType[] = [];
  filteredAssessmentTypes: AssessmentType[] = [];
  submitLoading = false;

  private assessmentTypeService = inject(AssessmentTypeService);
  private configurationApiHelperService = inject(ConfigurationApiHelperService);
  private cdr = inject(ChangeDetectorRef);
  private templatePreviewStateService = inject(TemplatePreviewStateService);
  constructor() { }

  ngOnInit() {
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['templateForm']) {
      this.onChangeForm()
    }
    if (changes['dataUpdated']) {
      this.onChangeForm()
    }
  }

  async onChangeForm() {
    await this.getAssessmentTypeList();
    this.patchTemplateType();
  }

  onCancel() {
    // this.templateForm.reset();
  }

  onStatusToggle(isChecked: boolean) {
    this.templateForm.patchValue({
      status: isChecked ? Status.ACTIVE : Status.INACTIVE
    });
  }

  get templateName() {
    return this.templateForm.get('templateName') as FormControl;
  }

  get description() {
    return this.templateForm.get('description') as FormControl;
  }

  get templateType() {
    return this.templateForm.get('templateType') as FormControl;
  }

  get templateStatus() {
    return this.templateForm.get('status') as FormControl;
  }

  get activeTemplate() {
    return this.templateStatus?.value === Status.ACTIVE
  }

  get selectedTemplateLabel(): string {
    const value = this.templateForm?.get('templateType')?.value;

    if (!value) return 'None';
    if (typeof value === 'object') return value.label || value.key || 'None';

    return value;
  }

  async getAssessmentTypeList() {
    if (this.assessmentTypes?.length) {
      return
    }
    const res = await this.assessmentTypeService.getAssessmentTypeMasterList();
    this.assessmentTypes = res ?? [];
    this.filteredAssessmentTypes = [...this.assessmentTypes];
  }

  addNewAssessmentTypes(assessmentName: string) {
    const body = {
      name: assessmentName
    }
    this.configurationApiHelperService.addNewAssessmentType(body)
      .subscribe({
        next: async (res) => {
          const assessmentType = res?.assessmentType;
          if (assessmentType) {
            this.assessmentTypes.push(assessmentType);
            this.filteredAssessmentTypes = [...this.assessmentTypes];
            this.templateForm.get('templateType')?.setValue(assessmentType);
            await this.assessmentTypeService.createAndNewAssessmentType(assessmentType)
          }
        },
        error: (e: Error) => {
          console.error(e.message);
        },
      });
  }

  filterAssessmentTypes(value: string) {
    if (typeof value !== "string") {
      return
    }
    const filterValue = value.toLowerCase();
    this.filteredAssessmentTypes = this.assessmentTypes.filter(type =>
      type.name.toLowerCase().includes(filterValue)
    );
  }

  onAssessmentSelected(event: any) {
    this.templateType.patchValue(event.option.value);
  }

  get filteredAssesmentTypeIsEmpty() {
    return !this.filteredAssessmentTypes?.length
  }

  assessmentDisplayName(assessmentType: AssessmentType) {
    return assessmentType ? assessmentType.name : ""
  }

  patchTemplateType() {
    const assessmentId = this.templateType.value?.id ?? 0;
    const assessment = this.assessmentTypes.find(type => type.id == assessmentId);
    if (assessment)
      this.templateType.patchValue(assessment)
    this.templateType.setValidators(objectControlValidation());
    this.templateType.updateValueAndValidity();
  }

  onDescriptionChange(data: { content: string, edited: boolean }) {
    this.templateForm.patchValue({ description: data.content }, { emitEvent: false });
    if (data.edited) {
      this.templatePreviewStateService.updateFormState(true)
    }
  }
}
