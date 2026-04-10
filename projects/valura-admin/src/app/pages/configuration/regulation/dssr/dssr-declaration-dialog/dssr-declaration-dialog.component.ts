import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { DeclarationService } from '@admin-core/services/declaration/declaration.service';
import { DbService } from '@admin-core/services/db/db.service';
import { AbstractControl } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-dssr-declaration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LoadingButtonComponent,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    CustomMatErrorComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './dssr-declaration-dialog.component.html',
  styleUrl: './dssr-declaration-dialog.component.scss'
})
export class DssrDeclarationDialogComponent implements OnInit {
  form!: FormGroup;
  rights: any[] = [];
  isEdit: boolean = false;
  viewMode: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  buttonText: string = 'Save';
  declarationId?: number;
  viewType: string | null = null;
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private declarationService = inject(DeclarationService);
  private dbService = inject(DbService);

  constructor(
    public dialogRef: MatDialogRef<DssrDeclarationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      declarationId?: number;
      regulationId: number;
      itemData?: any;
      editMode?: boolean;
      forceEditMode?: boolean;
      viewMode?: boolean
      selectedEntityType?: string
      viewType?: string
    },
    private fb: FormBuilder
  ) { }

  async ngOnInit(): Promise<void> {
    this.declarationId = this.data.declarationId;
    this.viewType = this.data?.viewType || null;

    if (this.data?.editMode) {
      this.isEdit = true;
    } else if (this.data?.viewMode) {
      this.isEdit = false;
    }

    this.initForm();

    if (this.data.regulationId) {
      await this.getRights();
    }

    if (this.data?.itemData) {
      this.populateFormFromItemData(this.data.itemData);
    } else if (this.declarationId) {
      await this.loadDeclarationDetails();
    }

    this.form.get('type')?.valueChanges.subscribe(value =>
      this.onTypeChange(value)
    );
  }

  get mode(): 'add' | 'edit' | 'view' {
    if (this.declarationId && this.isEdit) return 'edit';
    if (this.declarationId && !this.isEdit) return 'view';
    return 'add';
  }

  private populateFormFromItemData(item: any): void {
    const type =
      item.entityType === 'REGULATION'
        ? 'REGULATION_SPECIFIC'
        : 'RIGHT_SPECIFIC';

    this.form.patchValue({
      declaration: item.declaration || '',
      type: type,
      entityType: item.entityType,
      entityId:
        item.entityType === 'REGULATION'
          ? this.data.regulationId
          : item.entityId,
    });

    if (type === 'RIGHT_SPECIFIC') {
      const entityIdCtrl = this.form.get('entityId');
      entityIdCtrl?.setValidators(Validators.required);
      entityIdCtrl?.updateValueAndValidity();
    }
  }

  private async loadDeclarationDetails(): Promise<void> {
    this.isLoading = true;
    try {
      let decl = await this.declarationService.getDeclarationById(this.declarationId!);

      if (!decl) {
        const response = await this.apiHelperService.getDeclarationById(this.declarationId!);
        decl = response?.generalDeclaration || response?.data?.generalDeclaration || response;

        if (decl) {
          await this.declarationService.addDeclaration(decl);
        }
      }

      if (decl) {
        const type = decl.entityType === 'REGULATION' ? 'REGULATION_SPECIFIC' : 'RIGHT_SPECIFIC';

        this.form.patchValue({
          declaration: decl.declaration || '',
          type: type,
          entityType: decl.entityType,
          entityId: decl.entityId ?? this.data.regulationId
        });

        if (type === 'RIGHT_SPECIFIC') {
          const entityIdCtrl = this.form.get('entityId');
          entityIdCtrl?.setValidators(Validators.required);
          entityIdCtrl?.updateValueAndValidity();
        }
      }
    } catch (error) {
      console.error('Error loading declaration:', error);
      this.snackbarService.openSnack('Failed to load declaration details');
    } finally {
      this.isLoading = false;
    }
  }

  private async getRights(): Promise<void> {
    try {
      const rightsList = await this.dbService.getRightsByActId(this.data.regulationId);
      this.rights = rightsList || [];
    } catch (error) {
      this.rights = [];
    }
  }

  initForm(): void {
    const initialType = this.data?.selectedEntityType == 'RIGHT_SPECIFIC' ? 'RIGHT_SPECIFIC' : 'REGULATION_SPECIFIC'

    this.form = this.fb.group({
      declaration: ['', Validators.required],
      type: [initialType, Validators.required],
      entityType: ['REGULATION'],
      entityId: [this.data.regulationId]
    });
    this.onTypeChange(initialType)
  }

  onTypeChange(type: string): void {
    const entityTypeCtrl = this.form.get('entityType');
    const entityIdCtrl = this.form.get('entityId');

    if (type === 'REGULATION_SPECIFIC') {
      entityTypeCtrl?.setValue('REGULATION');
      entityIdCtrl?.setValue(this.data.regulationId);
      entityIdCtrl?.clearValidators();
    } else if (type === 'RIGHT_SPECIFIC') {
      entityTypeCtrl?.setValue('RIGHT');
      entityIdCtrl?.setValue(null); // Clear the value
      entityIdCtrl?.setValidators(Validators.required); // Add required validator
    }
    entityIdCtrl?.updateValueAndValidity();
  }

  get isRightSpecific(): boolean {
    return this.form.get('type')?.value === 'RIGHT_SPECIFIC';
  }

  startEditing(): void {
    this.isEdit = true;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const fv = this.form.value;
      const payload: any = {
        declaration: fv.declaration,
        entityType: fv.type === 'REGULATION_SPECIFIC' ? 'REGULATION' : 'RIGHT',
        entityId:
          fv.type === 'REGULATION_SPECIFIC'
            ? this.data.regulationId
            : fv.entityId,
        actId: this.data.regulationId,
      };

      if (this.viewType && fv.type === 'RIGHT_SPECIFIC') {
        const selectedRight = this.rights.find(
          r => r.id === fv.entityId
        );

        payload.rightTitle = selectedRight?.rightTitleSimplified ?? '';
      }

      if (this.viewType) {
        this.dialogRef.close({
          success: true,
          from: 'FORM_CONFIGURATION',
          data: {
            ...payload,
            id: this.declarationId,
            regulationId: this.data.regulationId,
          },
        });
        return;
      }

      if (this.declarationId) {
        payload.id = this.declarationId;
      }

      let res: any;
      if (this.declarationId) {
        res = await this.apiHelperService.updateDeclaration(
          this.declarationId,
          payload
        );
      } else {
        res = await this.apiHelperService.addDeclaration(payload);
      }

      if (res?.success) {
        const responseData: any = res?.data || res;
        const declaration = responseData?.generalDeclaration || payload;

        if (this.declarationId) {
          await this.declarationService.updateDeclarationToDb(
            this.declarationId,
            declaration
          );
        } else if (declaration.id) {
          await this.declarationService.createAndAddDeclaration(declaration);
        }

        this.dialogRef.close(res);
      } else {
        this.snackbarService.openSnack('Operation failed');
      }
    } catch (error) {
      console.error('Save declaration error:', error);
      this.snackbarService.openSnack('Failed to save declaration');
    } finally {
      this.isSaving = false;
    }
  }
  typeLabel(): string {
    return this.form.get('type')?.value === 'REGULATION_SPECIFIC' ? 'General' : 'Right Specific';
  }

  isRightSpecificView(): boolean {
    return this.form.get('type')?.value === 'RIGHT_SPECIFIC';
  }

  declaration(): string {
    return this.form.get('declaration')?.value || '';
  }

  rightDisplayName(): AbstractControl {
    const entityId = this.form.get('entityId')?.value;
    return this.rights.find(r => r.id === entityId)?.rightTitleSimplified || '-';
  }

  get typeControl(): AbstractControl {
    return this.form.get('type')!;
  }

  get entityIdControl(): FormControl {
    return this.form.get('entityId') as FormControl;
  }
  get declarationControl(): FormControl {
    return this.form.get('declaration') as FormControl;
  }
}
