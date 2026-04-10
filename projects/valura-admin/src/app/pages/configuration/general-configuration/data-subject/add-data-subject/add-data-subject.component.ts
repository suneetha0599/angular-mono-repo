import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatButtonModule } from '@angular/material/button';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormElementsConfig } from '@admin-page/configuration/configuration/constants';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { FormControl } from '@angular/forms';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

interface DialogData {
  dataSubject?: number;
  editMode?: boolean;
  viewMode?: boolean
  viewType?: string
  dataSubjectData?: any
  existingList?: any;
}

@Component({
  selector: 'app-add-data-subject',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LoadingButtonComponent,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-data-subject.component.html',
  styleUrls: ['./add-data-subject.component.scss'],
})
export class AddDataSubjectComponent {
  form: FormGroup;
  isEditMode = false;
  isViewMode = false;
  viewType: string | null = null;
  dataSubjectId: number | null | undefined = null;
  submitLoading = false;
  existingList: any = [];

  private dataSubjectService = inject(DataSubjectService)


  get nameControl(): FormControl {
    return this.form.get('name') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.form.get('description') as FormControl;
  }

  get simplyiedLegalGroundControl(): FormControl {
    return this.form.get('simplifiedDescription') as FormControl;
  }
  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private configApiHelperService: ConfigApiHelperService,
    private dialogRef: MatDialogRef<AddDataSubjectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData | null
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    const id = this.data?.dataSubject;
    this.viewType = this.data?.viewType || null;
    if (this.data?.editMode) {
      this.isEditMode = true;
      this.dataSubjectId = id;
      this.existingList = this.data?.existingList;
    }
    if (this.data?.viewMode) {
      this.isViewMode = true;
      this.dataSubjectId = id;
      this.form.disable();
      this.existingList = this.data?.existingList;
    }
    if (this.viewType) {
      this.onViewTypeInit()
      return
    }
    if (id) {
      this.loadDataSubject(id);
    }
  }

  onViewTypeInit() {
    if (this.viewType == FormElementsConfig.DATA_SUBJECT_ROLE) {
      const response = this.data?.dataSubjectData ?? null;
      if (response) {
        this.patchDataSubjectDetails(response);
      }
    }
  }

  patchDataSubjectDetails(response: any) {
    if (response) {
      this.form.patchValue({
        name: response.name || '',
        description: response.description || ''
      });
    }
  }

  async loadDataSubject(id: number) {
    try {
      const response = await this.dataSubjectService.getDataSubjectById(id);
      this.patchDataSubjectDetails(response)
    } catch (e) {
      console.log(e)
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.isViewMode = false;
    this.isEditMode = true;
    this.form.enable();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack('All fields are required');
      return;
    }
    this.submitLoading = true;
    const payload = this.form.value;
    if (this.viewType) {  // from form configuration
      this.onUpdateDatasubjectInFormConfiguration(payload)
      return
    }
    try {

      let response;

      if (this.isEditMode && this.dataSubjectId) {
        response = await this.configApiHelperService.updateDataSubject(
          this.dataSubjectId,
          payload
        );
        if (response) {
          this.dataSubjectService.updateDatasubjectToDb(this.dataSubjectId, response)
        }
      } else {
        response = await this.configApiHelperService.createGeneralDataSubject(payload);
        if (response) {
          this.dataSubjectService.createAndNewDataSubject(response)
        }
      }

      this.dialogRef.close(true);
    } catch (error) {
    } finally {
      this.submitLoading = false;
    }
  }

  onUpdateDatasubjectInFormConfiguration(formValue: any) {
    if (this.viewType === FormElementsConfig.DATA_SUBJECT_ROLE) {
      const existingList = this.data?.existingList || [];

      const isAlreadyPresent = existingList.some(
        (item: { name?: string }) =>
          item.name?.trim().toLowerCase() ===
          formValue.name?.trim().toLowerCase()
      );

      if (isAlreadyPresent) {
        this.snackbarService.openSnack(
          `Data Subject  '${formValue.name}' already exists in the table`
        );
        this.submitLoading = false;
        return;
      }

      this.dialogRef.close({
        success: true,
        data: { ...formValue },
      });
    }
    this.submitLoading = false;
  }
}
