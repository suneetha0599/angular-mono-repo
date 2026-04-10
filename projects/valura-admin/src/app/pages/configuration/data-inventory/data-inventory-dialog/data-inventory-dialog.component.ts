import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { CategoryService } from '@admin-core/services/category/category.service';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { Classfication } from '@admin-core/models/configuration/regulation';
import { ClassificationService } from '@admin-core/services/classfication/classification.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
interface DialogData {
  dialogType: 'dataSubject' | 'category' | 'pdElement';
  categoryId?: number;
  editMode?: boolean;
  itemData?: any;
}

@Component({
  selector: 'app-data-inventory-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    LoadingButtonComponent,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    CustomMatTextareaComponent
  ],
  templateUrl: './data-inventory-dialog.component.html',
  styleUrl: './data-inventory-dialog.component.scss'
})
export class DataInventoryDialogComponent implements OnInit {
  dialogTitle: string = '';
  dialogType: 'dataSubject' | 'category' | 'pdElement';
  form!: FormGroup;
  submitLoading: boolean = false;
  categoryId?: number;
  editMode: boolean = false;
  itemData: any = null;
  initialFormValue: any;
  hasFormChanged: boolean = false
  classificationMasterList: Classfication[] = []

  private classificationService = inject(ClassificationService);
  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private datasubjectService = inject(DataSubjectService);
  private pdCategoryService = inject(CategoryService);
  private pdElementService = inject(PdElementService);

  constructor(
    public dialogRef: MatDialogRef<DataInventoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder
  ) {
    this.dialogType = data.dialogType;
    this.categoryId = data.categoryId;
    this.editMode = data.editMode || false;
    this.itemData = data.itemData || null;

    if (this.dialogType === 'dataSubject') {
      this.dialogTitle = this.editMode ? 'Edit Data Subject' : 'Add Data Subject';
    } else if (this.dialogType === 'category') {
      this.dialogTitle = this.editMode ? 'Update Category' : 'Add Category';
    } else {
      this.dialogTitle = this.editMode ? 'Update PD Element' : 'Add PD Element';
    }


  }

  ngOnInit(): void {
    this.initForm();

  }

  async initForm() {
    if (this.dialogType === 'dataSubject') {
      this.form = this.fb.group({
        name: [this.itemData?.name || '', Validators.required],
        description: [this.itemData?.description || '', Validators.required]
      });
    } else if (this.dialogType === 'category') {
      this.form = this.fb.group({
        name: [this.itemData?.name || '', Validators.required],

      });
    } else if (this.dialogType === 'pdElement') {
      this.classificationMasterList = await this.classificationService.getClassificationMasterList();
      this.form = this.fb.group({
        name: [this.itemData?.name || '', Validators.required],
        categoryId: [this.itemData?.categoryId || this.categoryId, Validators.required],
        // sensitivity: [this.itemData?.sensitivity || '', Validators.required]
      });
    }
    // Store initial form value for comparison
    this.initialFormValue = this.form?.value;

    // Subscribe to form changes to detect modifications
    this.form.valueChanges.subscribe(value => {
      this.hasFormChanged = JSON.stringify(value) !== JSON.stringify(this.initialFormValue);
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.openSnack('Please fill all required fields!');
      return;
    }

    // In edit mode, check if form has changed
    if (this.editMode && !this.hasFormChanged) {
      this.snackbarService.openSnack('No changes detected!');
      return;
    }

    this.submitLoading = true;

    try {
      if (this.dialogType === 'dataSubject') {
        let res;
        if (this.editMode) {
          res = await this.configApiHelperService.updateDataSubject(this.itemData.id, this.form.value)
          await this.datasubjectService.updateDatasubjectToDb(this.itemData.id, res)
        } else {
          res = await firstValueFrom(this.configApiHelperService.createDataSubject(this.form.value))
          await this.datasubjectService.createAndNewDataSubject(res)
        }
        this.dialogRef.close({ success: true, data: res });
      } else if (this.dialogType === 'category') {
        let res;
        if (this.editMode) {
          res = await this.configApiHelperService.updatePDCategory(this.itemData.id, this.form.value)
          await this.pdCategoryService.updatePdCategoryToDb(this.itemData.id, res.pdCategory)
        } else {
          res = await firstValueFrom(this.configApiHelperService.createPdCategory(this.form.value));
          await this.pdCategoryService.createAndNewPdCategory(res.pdCategory)
        }
        this.dialogRef.close({ success: true, data: res });
      } else if (this.dialogType === 'pdElement') {
        let res;
        if (this.editMode) {
          res = await this.configApiHelperService.updatePDElement(this.itemData.id, this.form.value)
          await this.pdElementService.updatePdElementToDb(this.itemData.id, { ...res.pdElement, categoryId: this.categoryId })
        } else {
          res = await firstValueFrom(this.configApiHelperService.createPDElement(this.form.value));
          await this.pdElementService.createAndNewpdElement({ ...res, categoryId: this.categoryId })
        }
        this.dialogRef.close({ success: true, data: res });
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      this.submitLoading = false;
    }
  }

  get isDataSubject(): boolean {
    return this.dialogType === 'dataSubject';
  }

  get isCategory(): boolean {
    return this.dialogType === 'category';
  }

  get isPDElement(): boolean {
    return this.dialogType === 'pdElement';
  }

  get buttonText(): string {
    return this.editMode ? 'Update' : 'Save';
  }

  get isUpdateButtonDisabled(): boolean {
    return this.editMode && !this.hasFormChanged;
  }
}