import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CategoryService } from '@admin-core/services/category/category.service';
import { ClassificationService } from '@admin-core/services/classfication/classification.service';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { PD_ELEMENTS_MENU } from '../constant';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-add-pd-elements-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-pd-elements-dialog.component.html',
  styleUrl: './add-pd-elements-dialog.component.scss'
})
export class AddPdElementsDialogComponent {
  form!: FormGroup;
  categories: any[] = [];
  classifications: any[] = [];
  filteredCategories: any[] = [];
  filteredClassifications: any[] = [];
  categorySearchControl = new FormControl('');
  classificationSearchControl = new FormControl('');
  header = 'Add Data Element';
  buttonName = 'Save';
  menu = PD_ELEMENTS_MENU;
  isDataElements = false;
  isCategory = false;
  isClassification = false;
  isViewMode = false;
  isSubmitLoading = false;

  private fb = inject(FormBuilder);
  private api = inject(ConfigApiHelperService);
  private categoryService = inject(CategoryService);
  private classificationService = inject(ClassificationService);
  private pdService = inject(PdElementService);
  private snackbarService = inject(SnackbarService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialogRef<AddPdElementsDialogComponent>) { }

  async ngOnInit() {
    this.initForms();

    if (this.isDataElements) {
      await Promise.all([
        this.getPdCategory(),
        this.getClassification()
      ]);

      // Setup search functionality
      this.setupCategorySearch();
      this.setupClassificationSearch();

      if (this.data?.elementData) {
        this.patchPdElementData();
      }
    } else if (this.isCategory || this.isClassification) {
      if (this.data?.elementData) {
        this.patchSimpleEntity();
      }
    }
  }

  private setupCategorySearch() {
    this.categorySearchControl.valueChanges.subscribe(searchTerm => {
      this.filterCategories(searchTerm || '');
    });
  }

  private setupClassificationSearch() {
    this.classificationSearchControl.valueChanges.subscribe(searchTerm => {
      this.filterClassifications(searchTerm || '');
    });
  }

  private filterCategories(searchTerm: string) {
    if (!searchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(cat =>
        cat.name?.toLowerCase().includes(search)
      );
    }
  }

  private filterClassifications(searchTerm: string) {
    if (!searchTerm) {
      this.filteredClassifications = [...this.classifications];
    } else {
      const search = searchTerm.toLowerCase();
      this.filteredClassifications = this.classifications.filter(cl =>
        cl.name?.toLowerCase().includes(search)
      );
    }
  }

  getCategoryDisplayText(): string {
    const selectedIds: number[] = this.category?.value ?? [];

    if (!selectedIds.length || !this.categories?.length) {
      return '';
    }

    const selectedCategories = this.categories.filter(
      c => selectedIds.includes(c.id)
    );

    if (!selectedCategories.length) {
      return '';
    }

    if (selectedCategories.length === 1) {
      return selectedCategories[0]?.name ?? '';
    }

    return `${selectedCategories[0]?.name ?? ''} +${selectedCategories.length - 1}`;
  }

  private initForms() {
    if (this.data?.menuName === this.menu[0].name || this.data?.menuName === '') {
      this.isDataElements = true;

      this.form = this.fb.group({
        elementName: ['', Validators.required],
        category: [[] as number[]],
        classification: [[] as number[]]
      });


      if (this.data?.editMode) {
        this.header = 'Edit Data Element';
        this.buttonName = 'Update';
      }

      if (this.data?.viewMode) {
        this.header = 'View Data Element';
        this.buttonName = 'Cancel';
        this.isViewMode = true;
      }
    }

    else if (this.data?.menuName === this.menu[1].name) {
      this.isCategory = true;

      this.form = this.fb.group({
        categoryName: ['', Validators.required],
        description: ['']
      });

      if (this.data?.editMode) {
        this.header = 'Edit Data Category';
        this.buttonName = 'Update';
      } else if (this.data?.viewMode) {
        this.header = 'View Data Category';
        this.buttonName = 'Cancel';
        this.isViewMode = true;
      } else {
        this.header = "Add Data Category";
        this.buttonName = 'Save';
      }
    }

    else if (this.data?.menuName === this.menu[2].name) {
      this.isClassification = true;

      this.form = this.fb.group({
        classificationName: ['', Validators.required],
        description: ['']
      });

      if (this.data?.editMode) {
        this.header = 'Edit Data Classification';
        this.buttonName = 'Update';
      } else if (this.data?.viewMode) {
        this.header = 'View Data Classification';
        this.buttonName = 'Cancel';
        this.isViewMode = true;
      } else {
        this.header = "Add Data Classification";
        this.buttonName = 'Save';
      }
    }
  }

  getClassificationDisplayText(): string {
    const selectedIds: number[] = this.classification?.value ?? [];

    if (!selectedIds.length || !this.classifications?.length) {
      return '';
    }

    const selectedClassifications = this.classifications.filter(
      cl => selectedIds.includes(cl.id)
    );

    if (!selectedClassifications.length) {
      return '';
    }

    if (selectedClassifications.length === 1) {
      return selectedClassifications[0]?.name ?? '';
    }

    return `${selectedClassifications[0]?.name ?? ''} +${selectedClassifications.length - 1}`;
  }



  private patchPdElementData() {
    const el = this.data.elementData;

    this.form.patchValue({
      elementName: el.name,

      category: (el.categoryMappings || [])
        .filter((m: any) => !m.isDeleted)
        .map((m: any) => Number(m.categoryId)),   // ✅ FIX

      classification: (el.classificationMappings || [])
        .filter((m: any) => !m.isDeleted)
        .map((m: any) => Number(m.classificationId))
    });
  }


  private patchSimpleEntity() {
    const el = this.data.elementData;

    this.form.patchValue({
      categoryName: el.name,
      classificationName: el.name,
      description: el.description
    });

    if (this.data?.viewMode) {
      this.isViewMode = true;
      this.form.disable();
      this.buttonName = 'Cancel';
    }
  }

  async getPdCategory() {
    // const res = await this.configApiHelperService.getAllPdCategory();
    const pdCategories = await this.categoryService.getPdCategoryMasterList()
    if (pdCategories && pdCategories.length) {
      this.categories = pdCategories.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      this.filteredCategories = [...this.categories];
    }
  }

  async getClassification() {
    // const res = await this.configApiHelperService.getAllClassification();
    const classification = await this.classificationService.getClassificationMasterList()
    if (classification && classification.length) {
      this.classifications = classification.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      this.filteredClassifications = [...this.classifications];
    }
  }

  async isDuplicatePdElement(name: string): Promise<boolean> {
    const existingList = await this.pdService.getPdElementMasterList();

    if (!existingList?.length) return false;

    const normalizedName = name.trim().toLowerCase();

    return existingList.some((item: any) => {
      if (this.data?.editMode && item.id === this.data.elementData?.id) {
        return false;
      }

      return item.name?.trim().toLowerCase() === normalizedName;
    });
  }


  async onSave() {
    if (this.form.invalid) return;
    this.isSubmitLoading = true;

    try {
      let res: any;

      if (this.data?.menuName === this.menu[0].name || this.data?.menuName === '') {
        const name = this.elementName?.value?.trim();
        if (!name) return;

        if (await this.isDuplicatePdElement(name)) {
          this.snackbarService.openSnack(
            'Data Element with this name already exists'
          );
          return;
        }
        if (this.data?.editMode) {
          res = await this.api.updatePdElements(
            this.data.elementData.id,
            this.buildEditPayload()
          );
          if (res?.success) {
            this.pdService.updatepdElementToDb(
              this.data.elementData.id, res.data.pdElement);
          }
        } else {
          const payloadData = {
            name: this.elementName.value,
            categoryIds: this.category.value || [],
            classificationIds: this.classification.value || []
          }

          res = await this.api.onAddPdElements(payloadData);
          if (res) {
            const localPdElement = this.buildAddPayload(res.data.id);
            this.pdService.addPdElement(localPdElement);
          }
        }
      } else if (this.data?.menuName === this.menu[1].name) {
        const params = {
          name: this.categoryName.value,
          description: this.description.value
        };
        if (this.data?.editMode) {
          res = await this.api.updatePdCategory(this.data?.elementData.id, params);
          if (res.success) {
            this.pdService.updatepdCategory(this.data?.elementData.id, res.data.pdCategory);
          }
        } else {
          res = await this.api.onAddCategory(params);
          if (res.success) {
            this.categoryService.addPdCategory(res.data.pdCategory)
          }
        }
      } else if (this.data?.menuName === this.menu[2].name) {

        const params = {
          name: this.classificationName.value,
          description: this.description.value
        };
        if (this.data?.editMode) {
          res = await this.api.updatePdClassification(this.data?.elementData.id, params);
          if (res.success) {
            this.pdService.updatepdClassfication(this.data?.elementData.id, res.data.classification);
          }
        } else {
          res = await this.api.onAddClassification(params);
          if (res.success) {
            this.classificationService.addClassfication(res.data.classification)
          }
        }
      }
      this.dialog.close(res);

    } catch (error: any) {
      console.error('Save error:', error);
    } finally {
      this.isSubmitLoading = false;
    }
  }

  private buildCategoryMappings(
    existingMappings: any[] = [],
    selectedCategoryIds: number[] = []
  ) {
    const mappings: any[] = [];
    for (const mapping of existingMappings) {
      if (selectedCategoryIds.includes(mapping.categoryId)) {
        mappings.push({
          mappingId: mapping.mappingId,
          categoryId: mapping.categoryId,
          categoryName: mapping.categoryName,
          isDeleted: false
        });
      } else {
        mappings.push({
          mappingId: mapping.mappingId,
          categoryId: mapping.categoryId,
          categoryName: mapping.categoryName,
          isDeleted: true
        });
      }
    }
    for (const categoryId of selectedCategoryIds) {
      const exists = existingMappings.some(m => m.categoryId === categoryId);

      if (!exists) {
        const category = this.categories.find(c => c.id === categoryId);

        mappings.push({
          mappingId: 0,
          categoryId,
          categoryName: category?.name || '',
          isDeleted: false
        });
      }
    }

    return mappings;
  }

  private buildCategoryMapping(
    existingMappings: any[] = [],
    selectedCategoryIds: number[] = []
  ) {
    const mappings: any[] = [];
    for (const mapping of existingMappings) {
      if (selectedCategoryIds.includes(mapping.categoryId)) {
        mappings.push({
          mappingId: mapping.mappingId,
          pdCategoryId: mapping.categoryId,
          categoryName: mapping.categoryName,
          isDeleted: false
        });
      } else {
        mappings.push({
          mappingId: mapping.mappingId,
          pdCategoryId: mapping.categoryId,
          categoryName: mapping.categoryName,
          isDeleted: true
        });
      }
    }
    for (const categoryId of selectedCategoryIds) {
      const exists = existingMappings.some(m => m.categoryId === categoryId);

      if (!exists) {
        const category = this.categories.find(c => c.id === categoryId);

        mappings.push({
          mappingId: 0,
          categoryId,
          categoryName: category?.name || '',
          isDeleted: false
        });
      }
    }

    return mappings;
  }

  private buildClassificationMappings(
    existingMappings: any[] = [],
    selectedClassificationIds: number[] = []
  ) {
    const mappings: any[] = [];

    for (const mapping of existingMappings) {
      if (selectedClassificationIds.includes(mapping.classificationId)) {
        mappings.push({
          mappingId: mapping.mappingId,
          classificationId: mapping.classificationId,
          classificationName: mapping.classificationName,
          isDeleted: false
        });
      } else {
        mappings.push({
          mappingId: mapping.mappingId,
          classificationId: mapping.classificationId,
          classificationName: mapping.classificationName,
          isDeleted: true
        });
      }
    }

    for (const classificationId of selectedClassificationIds) {
      const exists = existingMappings.some(
        m => m.classificationId === classificationId
      );

      if (!exists) {
        const classification = this.classifications.find(
          c => c.id === classificationId
        );

        mappings.push({
          mappingId: 0,
          classificationId,
          classificationName: classification?.name || '',
          isDeleted: false
        });
      }
    }

    return mappings;
  }


  private buildAddPayload(id: number) {
    return {
      id: id,
      name: this.elementName.value,

      categoryMappings: this.buildCategoryMappings(
        [],
        this.category.value || []
      ),

      classificationMappings: this.buildClassificationMappings(
        [],
        this.classification.value || []
      )
    };
  }



  private buildEditPayload() {
    const el = this.data.elementData;
    return {
      name: this.elementName.value,
      categoryMappings: this.buildCategoryEditMappings(
        el.categoryMappings || [],
        this.category.value || []
      ),
      classificationMappings: this.buildClassificationEditMappings(
        el.classificationMappings || [],
        this.classification.value || []
      )
    };
  }

  private buildDbEditPayload() {
    return {
      name: this.elementName.value,

      categoryMappings: this.buildCategoryMapping(
        [],
        this.category.value || []
      ),

      classificationMappings: this.buildClassificationMappings(
        [],
        this.classification.value || []
      )
    };
  }

  onEditMode() {
    this.isViewMode = false;
    this.data.editMode = true;
    this.header = 'Edit Data Element';
    this.buttonName = 'Update';
    this.form.enable();
  }

  onCancel() {
    this.dialog.close();
    this.form.reset();
  }

  get elementName(): FormControl {
    return this.form.get('elementName') as FormControl;
  }

  get category(): FormControl {
    return this.form.get('category') as FormControl;
  }

  get classification(): FormControl {
    return this.form.get('classification') as FormControl;
  }

  get categoryName(): FormControl {
    return this.form.get('categoryName') as FormControl;
  }

  get classificationName(): FormControl {
    return this.form.get('classificationName') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }

  onCategoryPanelClosed() {
    this.categorySearchControl.setValue('');
  }

  onClassificationPanelClosed() {
    this.classificationSearchControl.setValue('');
  }

  private buildCategoryEditMappings(
    existingMappings: any[] = [],
    selectedCategoryIds: number[] = []
  ) {
    const mappings: any[] = [];

    for (const mapping of existingMappings) {
      const pdCategoryId = mapping.pdCategoryId ?? mapping.categoryId;

      if (selectedCategoryIds.includes(pdCategoryId)) {
        mappings.push({
          mappingId: mapping.mappingId,
          pdCategoryId: pdCategoryId,
          isDeleted: false
        });
      } else {
        mappings.push({
          mappingId: mapping.mappingId,
          pdCategoryId: pdCategoryId,
          isDeleted: true
        });
      }
    }

    for (const categoryId of selectedCategoryIds) {
      const exists = existingMappings.some(
        m => (m.pdCategoryId ?? m.categoryId) === categoryId
      );

      if (!exists) {
        mappings.push({
          mappingId: 0,
          pdCategoryId: categoryId,
          isDeleted: false
        });
      }
    }

    return mappings;
  }

  private buildClassificationEditMappings(
    existingMappings: any[] = [],
    selectedClassificationIds: number[] = []
  ) {
    const mappings: any[] = [];

    for (const mapping of existingMappings) {
      const classificationId = mapping.classificationId;

      if (selectedClassificationIds.includes(classificationId)) {
        mappings.push({
          mappingId: mapping.mappingId,
          classificationId: classificationId,
          isDeleted: false
        });
      } else {
        mappings.push({
          mappingId: mapping.mappingId,
          classificationId: classificationId,
          isDeleted: true
        });
      }
    }

    for (const classificationId of selectedClassificationIds) {
      const exists = existingMappings.some(
        m => m.classificationId === classificationId
      );

      if (!exists) {
        mappings.push({
          mappingId: 0,
          classificationId,
          isDeleted: false
        });
      }
    }

    return mappings;
  }
}
