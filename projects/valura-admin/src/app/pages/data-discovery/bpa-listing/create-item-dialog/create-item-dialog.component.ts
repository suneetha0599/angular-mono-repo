import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { BpaCategory } from '@admin-core/models/data-inventory/BPA';
import { SOURCE_TYPE, ASSET_TYPE, RECEPIENT_LIST, CreatItemType, SOURCE_CATEGORY } from '../constants';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { v1 as uuidv1 } from 'uuid';
import { CategoryService } from '@admin-core/services/category/category.service';
import { Classfication } from '@admin-core/models/configuration/regulation';
import { ClassificationService } from '@admin-core/services/classfication/classification.service';
import { ApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
export interface CreateItemDialogData {
  type: CreatItemType
  categories?: BpaCategory[];
  editData?: any;
  purposeList?: any[];
}
export interface TypeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-create-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    LoadingButtonComponent,
    TextFieldModule,
    FormsModule,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './create-item-dialog.component.html',
  styleUrls: ['./create-item-dialog.component.scss']
})
export class CreateItemDialogComponent implements OnInit {

  itemForm!: FormGroup;
  isLoading = false;
  bpaCategoriesList: BpaCategory[] = [];
  classificationMasterList: Classfication[] = []
  SOURCE_CATEGORY = SOURCE_CATEGORY;
  sourceCategoryOptions: TypeOption[] = [
    { value: SOURCE_CATEGORY.COLLECTION_POINT, label: 'Collection Point' },
    { value: SOURCE_CATEGORY.ASSET, label: 'Asset' }
  ];

  recipientCategoryOptions: TypeOption[] = RECEPIENT_LIST.map((item: any) => ({
    value: item.key,
    label: item.name
  }));

  assetTypeOptions: TypeOption[] = ASSET_TYPE.map((item: any) => ({
    value: item.key,
    label: item.label
  }));

  recipientTypeOptions: TypeOption[] = RECEPIENT_LIST.map((item: any) => ({
    value: item.key,
    label: item.name
  }));

  collectionPointTypeOptions: TypeOption[] = SOURCE_TYPE.map((item: any) => ({
    value: item.key,
    label: item.label
  }));

  assetSourceTypeOptions: TypeOption[] = ASSET_TYPE.map((item: any) => ({
    value: item.key,
    label: item.label
  }));

  get nameControl(): FormControl {
    return this.itemForm.get('name') as FormControl;
  }

  get categoryControl(): FormControl {
    return this.itemForm.get('category') as FormControl;
  }

  get purposeControl(): FormControl {
    return this.itemForm.get('purpose') as FormControl;
  }

  get classificationControl(): FormControl {
    return this.itemForm.get('classification') as FormControl;
  }

  get sourceTypeControl(): FormControl {
    return this.itemForm.get('sourceType') as FormControl;
  }

  get typeControl(): FormControl {
    return this.itemForm.get('type') as FormControl;
  }

  get countControl(): FormControl {
    return this.itemForm.get('count') as FormControl;
  }

  currentSourceTypeOptions: TypeOption[] = [];
  CreatItemType = CreatItemType;

  private createBpaService = inject(CreateBpaService);
  private categoryService = inject(CategoryService);
  private snackbarService = inject(SnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private classificationService = inject(ClassificationService);
  private pdElementService = inject(PdElementService);
  private dataInventoryApiHelperService = inject(ApiHelperService)

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateItemDialogData
  ) { }

  async ngOnInit() {
    this.initForm();
    if (this.data.type === CreatItemType.DATA_ELEMENTS) {
      if (!this.data.categories) {
        this.data.categories = undefined;
      }
      await this.loadCategories();
    }
    if (this.isEdit) {
      this.patchFormWithEditData();
    }
    this.setupFormListeners();
  }


  async initForm() {
    const setValidators = this.isEdit;

    switch (this.data.type) {
      case CreatItemType.DATA_ELEMENTS:
        this.itemForm = this.fb.group({
          name: [null, Validators.required],
          category: [''],
          classification: [''],
          purpose: ['', setValidators ? Validators.required : null],
          originalCategoryMappings: [[]],
          originalClassificationMappings: [[]]
        });
        this.classificationMasterList = await this.classificationService.getClassificationMasterList();
        break;
      case CreatItemType.SOURCE:
        this.itemForm = this.fb.group({
          name: [null, Validators.required],
          category: ['', Validators.required],
          sourceType: [''],
          type: [null, Validators.required]
        });
        break;
      case CreatItemType.ASSET:
        this.itemForm = this.fb.group({
          name: [null, Validators.required],
          type: ['', Validators.required],
          addedBySource: [false]
        });
        break;
      case CreatItemType.RECEPIENT:
        this.itemForm = this.fb.group({
          name: [null, Validators.required],
          category: ['', Validators.required],
          purpose: [''],
          count: ['',]
        });
        break;
    }
  }

  patchFormWithEditData() {
    if (!this.isEdit) return;

    setTimeout(() => {
      this.itemForm.patchValue({
        name: this.data.editData.name || ''
      });

      if (this.data.type === CreatItemType.DATA_ELEMENTS) {
        const selectedCategories = this.data.categories?.filter(cat => this.data.editData.categoryId?.includes(cat.id)) ?? [];
        const selectedClassification = this.classificationMasterList?.filter(c => this.data.editData.classificationId?.includes(c.id)) ?? []
        this.itemForm.patchValue({
          id: this.data.editData?.id ?? 0,
          name: this.data.editData.name,
          category: selectedCategories,
          classification: selectedClassification,
          purpose: this.data.editData.purpose || [],
          originalCategoryMappings: this.data.editData.originalCategoryMappings,
          originalClassificationMappings: this.data.editData.originalClassificationMappings
        });
      }

      if (this.data.type === CreatItemType.ASSET) {
        this.itemForm.patchValue({
          id: this.data.editData?.id ?? 0,
          type: this.data.editData.type,
          addedBySource: this.data.editData?.addedBySource ?? false,
        });
      }

      if (this.data.type === CreatItemType.SOURCE) {
        this.itemForm.patchValue({
          id: this.data.editData?.id ?? 0,
          category: this.data.editData.category,
          type: this.data.editData.type,
          sourceType: this.data.editData.sourceType,
          addedBySource: this.data.editData?.addedBySource ?? false,
        });
      }

      if (this.data.type === CreatItemType.RECEPIENT) {
        const patchData: any = {
          category: this.data.editData.category,
          name: this.data.editData.name || this.data.editData.recipient?.name || ''
        };
        if (this.data.editData) {
          patchData.purpose = this.data.editData.purpose;
          patchData.count = this.data.editData.count || this.data.editData.numberOfPersonHavingAccess;
        }
        this.itemForm.patchValue(patchData);
      }
      this.cdr.detectChanges();

    }, 0);
  }

  setupFormListeners() {
    if (this.data.type === CreatItemType.SOURCE) {
      this.itemForm.get('category')?.valueChanges.subscribe(category => {
        if (this.data.editData) {
          this.currentSourceTypeOptions = this.collectionPointTypeOptions;
        } else {
          this.updateSourceTypeOptions(category);
        }
      });

      if (this.data.editData) {
        this.currentSourceTypeOptions = this.collectionPointTypeOptions;
      }
    }
  }

  updateSourceTypeOptions(category: string) {
    if (category === SOURCE_CATEGORY.ASSET) {
      this.currentSourceTypeOptions = this.collectionPointTypeOptions;
    } else if (category === SOURCE_CATEGORY.COLLECTION_POINT) {
      this.currentSourceTypeOptions = this.collectionPointTypeOptions;
    } else {
      this.currentSourceTypeOptions = [];
    }
    this.itemForm.get('type')?.setValue(null);
  }

  async loadCategories() {
    try {
      this.data.categories = undefined;
      this.cdr.detectChanges();
      this.bpaCategoriesList = await this.categoryService.getPdCategoryMasterList();
      this.data.categories = this.bpaCategoriesList;

    } catch (error) {
      console.error('Error loading categories:', error);
      this.snackbarService.openSnack('Failed to load categories');
      this.data.categories = [];
      this.cdr.detectChanges();
    }
  }

  getTitle(): string {
    const titles: { [key: string]: string } = {
      [CreatItemType.DATA_ELEMENTS]: this.isEdit ? 'Data Element' : ' Data Element',
      [CreatItemType.SOURCE]: this.isEdit ? 'Source' : 'Source',
      [CreatItemType.ASSET]: this.isEdit ? 'Asset' : 'Asset',
      [CreatItemType.RECEPIENT]: this.isEdit ? 'Recipient' : 'Recipient'
    };
    return titles[this.data.type] || (this.isEdit ? 'Edit Item' : 'Create Item');
  }

  getButtonText(): string {
    if (this.isEdit) {
      return 'Update';
    } else {
      const createButtonTexts: { [key: string]: string } = {
        [CreatItemType.DATA_ELEMENTS]: 'Create Data Element',
        [CreatItemType.SOURCE]: 'Create Source',
        [CreatItemType.ASSET]: 'Create Asset',
        [CreatItemType.RECEPIENT]: 'Create Recipient'
      };
      return createButtonTexts[this.data.type] || 'Create';
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  async onCreate() {
    if (this.itemForm.invalid) {
      this.snackbarService.openSnack('Please fill all required fields');
      return;
    }

    const { name } = this.itemForm.value;
    const originalName = this.data.editData?.name;
    const nameChanged = name.trim().toLowerCase() !== originalName?.trim().toLowerCase();

    if (!this.isEdit || nameChanged) {
      if (await this.isDuplicateName(name, this.data.type)) {
        this.snackbarService.openSnack(`${this.getTitle()} with this name already exists`);
        return;
      }
    }
    this.isLoading = true;

    try {
      let result: any;
      const formValue = this.itemForm.value;

      switch (this.data.type) {
        case CreatItemType.DATA_ELEMENTS:
          result = await this.createDataElement(formValue);
          this.createBpaService.onCreateOrUpdatePdElement({ ...result });
          break;
        case CreatItemType.SOURCE:
          result = await this.createSource(formValue);
          if (result?.category === SOURCE_CATEGORY.ASSET) {
            //  && !this.data.editData?.id
            const _asset = { ...formValue, type: formValue?.sourceType }
            const assetResult = await this.createAsset(_asset);
            this.createBpaService.onCreateOrUpdateAsset({ ...assetResult, addedBySource: true });
            result.assetId = assetResult.id;
          }
          // const _source = { ...result, type: formValue?.category === SOURCE_CATEGORY.ASSET ? formValue?.sourceType : formValue?.type };
          this.createBpaService.onCreateOrUpdateSource({ ...result });
          break;
        case CreatItemType.ASSET:
          result = await this.createAsset(formValue);
          this.createBpaService.onCreateOrUpdateAsset({ ...result });
          break;
        case CreatItemType.RECEPIENT:
          result = await this.createRecipient(formValue);
          this.createBpaService.onCreateOrUpdateRecepient({ ...result });
          break;
      }

      if (result) {
        const action = this.isEdit ? 'updated' : 'created';
        this.snackbarService.openSnack(`${this.getTitle()} ${action} successfully`);
        this.dialogRef.close({ item: result });
      }
    } catch (error) {
      console.error('Error creating item:', error);
      const action = this.isEdit ? 'update' : 'create';
      this.snackbarService.openSnack(`Failed to ${action} item. Please try again.`);
    } finally {
      this.isLoading = false;
    }
  }
  async createDataElement(formValue: any): Promise<any> {

    const categories = Array.isArray(formValue.category) ? formValue.category : [];
    const classifications = Array.isArray(formValue.classification) ? formValue.classification : [];

    const purposeMappingData = new Map((this.data?.editData?.purpose ?? []).map((p: any) => [p.id, p]));
    const purposes = Array.isArray(formValue.purpose) ? formValue.purpose.map((_purpose: any) => {
      const findPurpose: any = purposeMappingData.get(_purpose.id);
      const { bpaPurposeMappingId, ...rest } = _purpose;
      return {
        ...rest,
        pdBpaPurposeMappingId: findPurpose?.pdBpaPurposeMappingId
      };
    }) : [];

    return {
      id: this.data.editData?.id ?? uuidv1(),
      name: formValue.name,
      purpose: purposes,
      categoryId: categories.map((c: { id: any; }) => c.id),
      categoryName: categories.map((c: { name: any; }) => c.name),
      categoryNames: categories.map((c: { name: any; }) => c.name),
      categoryIds: categories.map((c: { id: any; }) => c.id),
      classificationIds: classifications.map((c: { id: any; }) => c.id),
      classification: classifications.map((c: { name: any; }) => c.name),
      classificationId: classifications.map((c: { id: any; }) => c.id),
      classificationName: classifications.map((c: { name: any; }) => c.name),
      originalCategoryMappings: formValue.originalCategoryMappings || [],
      originalClassificationMappings: formValue.originalClassificationMappings || []
    };
  }



  msComparePurpose(objOne: any, objTwo: any) {
    return objOne && objTwo ? objOne.id === objTwo.id : objOne === objTwo;
  }

  msCompareClassification(objOne: any, objTwo: any) {
    return objOne && objTwo ? objOne.id === objTwo.id : objOne === objTwo;
  }

  async createSource(formValue: any): Promise<any> {
    const sourceData = {
      ...formValue,
      sourceType: formValue.sourceType,
      type: formValue.type,
      id: this.data.editData?.id ? this.data.editData.id : uuidv1(),
    };
    return sourceData
  }

  async createAsset(formValue: any): Promise<any> {
    const assetData = {
      ...formValue,
      category: formValue?.type || '',
      hostingSite: this.data.editData?.hostingSite || [],
      id: this.data.editData?.id ? this.data.editData.id : uuidv1(),
    };
    return assetData
  }

  async createRecipient(formValue: any): Promise<any> {
    const categoryOption = this.recipientCategoryOptions.find(opt => opt.value === formValue.category);
    const recepientData = {
      ...formValue,
      categoryName: categoryOption?.label || '',
      id: this.data.editData?.id ? this.data.editData.id : uuidv1(),
    };
    return recepientData
  }

  msCompareCategory(objOne: BpaCategory, objTwo: BpaCategory) {
    return objOne.id === objTwo.id;
  }

  get isEdit(): boolean {
    return !!(this.data.editData)
  }

  get showAssetType() {
    return !this.isEdit && this.itemForm?.get('category')?.value == SOURCE_CATEGORY.ASSET
  }
  async isDuplicateName(name: string, type: CreatItemType): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const params: any = { page: 1, size: 100, searchQuery: name.trim() };
    let items: any[] = [];
    const selectedCategory = this.itemForm?.get('category')?.value;
    try {
      switch (type) {
        case CreatItemType.SOURCE:
          params.type = (selectedCategory === SOURCE_CATEGORY.ASSET) ? 'ASSET' : 'COLLECTION_POINT';
          const sRes = await this.dataInventoryApiHelperService.getSourceMasterList(params);
          items = sRes?.sourceMasters || [];
          break;

        case CreatItemType.ASSET:
          params.type = 'ASSET';
          const aRes = await this.dataInventoryApiHelperService.getSourceMasterList(params);
          items = aRes?.sourceMasters || [];
          break;

        case CreatItemType.RECEPIENT:
          const rRes = await this.dataInventoryApiHelperService.getRecipientMasterList(params);
          items = rRes?.recipientMasters || [];
          break;

        case CreatItemType.DATA_ELEMENTS:
          const dRes = await this.pdElementService.getPdElementMasterList();
          items = dRes || [];
          break;
      }
      return items.some(i => {
        const isSameName = i.name?.trim().toLowerCase() === normalized;
        if (this.isEdit) {
          const currentEditId = this.data.editData?.id;
          return isSameName && (i.id !== currentEditId);
        }

        return isSameName;
      });
    } catch (error) {
      return false;
    }
  }


}