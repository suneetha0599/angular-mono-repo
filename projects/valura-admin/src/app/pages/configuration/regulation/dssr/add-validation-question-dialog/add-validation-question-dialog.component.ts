import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { TYPES } from '@admin-core/constants/constants';
import { DbService } from '@admin-core/services/db/db.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatDialogModule } from '@angular/material/dialog';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { CustomMatTextareaComponent } from '@valura-lib/components/custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-add-validation-question-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatRadioModule,
    MatChipsModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatDialogModule,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-validation-question-dialog.component.html',
  styleUrl: './add-validation-question-dialog.component.scss'
})
export class AddValidationQuestionDialogComponent {
  form!: FormGroup;
  buttonName: string = 'Add';
  fieldTypes: any[] = [];
  rights: any[] = [];
  SINGLE_SELECT = 'SINGLE_SELECT';
  CHECK_BOX = 'CHECK_BOX';
  RADIO = 'RADIO';
  GENERAL = 'REGULATION';
  RIGHT_SPECIFIC = 'RIGHT';
  optionsList: string[] = [];
  optionInput = '';
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  isEdit: boolean = false;
  isView: boolean = false;
  showOptions: boolean = false;
  isSubmitloading: boolean = false;

  types: any[] = [
    { id: 1, name: 'General', key: 'REGULATION', type: 'REGULATION_SPECIFIC' },
    { id: 2, name: 'Right Specific', key: 'RIGHT', type: 'RIGHT_SPECIFIC' }
  ];

  private dbService = inject(DbService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private regulationService = inject(RegulationsService)
  constructor(private dialog: MatDialogRef<AddValidationQuestionDialogComponent>,
    private fb: FormBuilder, private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.isEdit = !!data?.editMode;
    this.isView = !!data?.viewMode;
    this.buttonName = this.isEdit ? 'Update' : 'Save';
  }

  async ngOnInit() {
    this.fieldTypes = TYPES;
    const initialType = this.data?.elementData?.entityType || this.data?.selectedEntityType || this.types[0].key;

    this.form = this.fb.group({
      right: [''],
      type: [initialType, Validators.required],
      question: ['', Validators.required],
      helper: [''],
      fieldType: ['', Validators.required],
      provision: ['', Validators.required],
      options: [[]]
    });

    if (this.isView) {
      this.form.disable({ emitEvent: false });
    }

    if (this.data?.regulationId) {
      await this.getRights();
    }

    this.form.get('type')?.valueChanges.subscribe(value => this.onTypeChange(value));
    this.onTypeChange(initialType);

    if (this.data?.elementData) {
      this.patchFormValues();
    }

    this.form.get('options')?.valueChanges.subscribe(value => {
      if (!Array.isArray(value)) {
        this.form.get('options')?.setValue([], { emitEvent: false });
      }
    });
  }

  patchFormValues() {
    if (!this.data?.elementData) return;

    const matchedFieldType = this.fieldTypes.find(
      t => t.label === this.data.elementData.questionType
    );
    this.form.patchValue({
      right: this.data.elementData.entityId ?? '',
      type: this.data.elementData.entityType || '',
      question: this.data.elementData.question || '',
      helper: this.data.elementData.helper || '',
      fieldType: matchedFieldType?.value || '',
      provision: this.data.elementData.provision || '',
      options: this.data.elementData.optionName || []
    }, { emitEvent: false });

    this.optionsList = this.data.elementData.optionName
      ? [...this.data.elementData.optionName]
      : [];

    this.showOptions = this.optionsList.length > 0;

    if (this.data.elementData.entityType === this.RIGHT_SPECIFIC) {
      const rightCtrl = this.form.get('right');
      rightCtrl?.setValidators(Validators.required);
      rightCtrl?.updateValueAndValidity();
    }
  }

  onTypeChange(type: string): void {
    const rightCtrl = this.form.get('right');

    if (type === this.RIGHT_SPECIFIC) {
      rightCtrl?.setValue(null);
      rightCtrl?.setValidators(Validators.required);
    } else {
      rightCtrl?.setValue('');
      rightCtrl?.clearValidators();
    }
    rightCtrl?.updateValueAndValidity();
  }



  switchToEdit() {
    this.isEdit = true;
    this.form.enable();
    this.isView = false;
  }

  async onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const formValue = this.form.value;

    const selectedType = this.types.find(
      t => t.key === formValue.type || t.name === formValue.type
    );
    const selectedFieldType = this.fieldTypes.find(
      t => t.value === formValue.fieldType
    );

    this.isSubmitloading = true;
    const entityId = formValue.right || this.data?.regulationId
    const payload = {
      id: this.data?.elementData?.id || 0,
      question: formValue?.question || '',
      optionName: ((selectedFieldType.value === "SINGLE_SELECT" || selectedFieldType.value === "CHECK_BOX" ||
        selectedFieldType.value === "RADIO") ? this.optionsList : []),
      questionType: selectedFieldType?.label || '',
      typeOfOptions: ((selectedFieldType.value === "SINGLE_SELECT" || selectedFieldType.value === "CHECK_BOX" ||
        selectedFieldType.value === "RADIO") ? this.optionsList : []),
      shouldDisplayChildQuestion: false,
      provision: formValue.provision || '',
      section: this.data?.elementData?.section || {
        rule: '',
        clause: '',
        article: '',
        sub_rule: '',
        sub_clause: ''
      },
      type: selectedType?.type || '',
      entityType: selectedType?.key || '',
      entityId: entityId,
      helper: formValue.helper || '',
      actId: this.data?.regulationId
    };
    try {
      if (this.isEdit) {
        const res = await this.configApiHelperService.updateQuestion((this.data?.elementData?.id ?? 0), payload);
        if (res.success) {
          await this.dbService.updateValidationQuestionById({ ...res.data.generalValidationQuestion, actId: this.data?.regulationId });
          this.isSubmitloading = false;

          this.dialog.close(res);
        }
      }
      else {
        const res = await this.configApiHelperService.addQuestion(payload);
        if (res.success) {

          this.dbService.addValidationQuestion({ ...res.data.generalValidationQuestion, actId: this.data?.regulationId, })
          this.isSubmitloading = false;
          this.optionsList = [];
          this.dialog.close(res);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      this.isSubmitloading = false;
    } finally {
      this.optionsList = [];
    }
  }

  onFieldTypeChange(fieldType: string) {
    const optionTypes = [this.SINGLE_SELECT, this.CHECK_BOX, this.RADIO];

    if (!optionTypes.includes(fieldType)) {
      this.optionsList = [];
      this.form.get('options')?.setValue([]);
      this.showOptions = false;
    } else {
      this.showOptions = true;
      this.form.get('options')?.setValue([...this.optionsList]);
    }
  }

  onCancel() {
    this.dialog.close();
    this.form.reset();
  }

  addOptionFromInput(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && !this.optionsList.includes(value)) {
      this.optionsList = [...this.optionsList, value];
      this.form.get('options')?.setValue([...this.optionsList]);
    }

    event.chipInput?.clear();
  }

  removeOption(option: string): void {
    this.optionsList = this.optionsList.filter(o => o !== option);
    this.form.get('options')?.setValue([...this.optionsList]);
  }

  getTypeName() {
    if (this.type.value === this.GENERAL) {
      return 'General';
    } else if (this.type.value === this.RIGHT_SPECIFIC) {
      return 'Right specific';
    }

    return '---';
  }

  getFieldTypeName() {
    return this.fieldTypes.find(ft => ft.value === this.fieldType.value)?.label || '---';
  }

  getRightName() {
    return this.rights.find(r => r.id === this.right.value)?.rightTitleSimplified || '---';
  }

  async getRights() {
    // const res = await this.configApiHelperService.getRightsMasterList(this.data?.regulationId);
    const res = await this.regulationService.getRightsMasterList(this.data?.regulationId);
    this.rights = res || [];
  }

  get right(): FormControl {
    return this.form.get('right') as FormControl;
  }

  get type(): FormControl {
    return this.form.get('type') as FormControl;
  }

  get question(): FormControl {
    return this.form.get('question') as FormControl;
  }

  get helper(): FormControl {
    return this.form.get('helper') as FormControl;
  }

  get fieldType(): FormControl {
    return this.form.get('fieldType') as FormControl;
  }

  get provision(): FormControl {
    return this.form.get('provision') as FormControl;
  }

  get options(): FormControl {
    return this.form.get('options') as FormControl;
  }
}
