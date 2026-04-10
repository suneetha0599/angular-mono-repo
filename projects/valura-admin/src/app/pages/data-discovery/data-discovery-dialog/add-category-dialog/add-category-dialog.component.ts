import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { v1 as uuidv1 } from 'uuid';
import { CreateAssetService } from '@admin-core/services/asset/create-asset.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

export enum ItemType {
  Category = 'category',
  Department = 'department',
  Purpose = 'purpose',
  DataSubject = 'dataSubject',
  Reason = 'reason',
  Vendor = 'vendor',
  AssetDepartment = 'assetDepartment',
  SecurityControl = 'securityControl',
  BpaSecurityControl = 'bpaSecurityControl',
  UserDepartment = 'userDepartment',
}
export interface AddCategoryDialogData {
  type: string
}

@Component({
  selector: 'app-add-category-dialog',
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatDialogTitle,
    MatDialogActions,
    CustomMatTextareaComponent,
    MatLabel, MatIcon, LoadingButtonComponent,
    MatIconButton
  ],
  templateUrl: './add-category-dialog.component.html',
  styleUrl: './add-category-dialog.component.scss'
})
export class AddCategoryDialogComponent {
  form: FormGroup;
  title: string;
  ItemType = ItemType

  private createBpaService = inject(CreateBpaService);
  private createAssetService = inject(CreateAssetService)
  private departmentService = inject(DepartmentService)

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCategoryDialogData
  ) {
    this.title = data.type === ItemType.Category
      ? 'Add Category'
      : data.type === ItemType.Department || data.type === ItemType.AssetDepartment || data.type === ItemType.UserDepartment
        ? 'Add Department'
        : data.type === ItemType.Purpose
          ? 'Add Purpose'
          : data.type === ItemType.Vendor
            ? 'Add Vendor'
            : data.type === ItemType.SecurityControl || data.type === ItemType.BpaSecurityControl
              ? 'Add Security Control'
              : data.type === ItemType.Reason
                ? 'Reason'
                : 'Add Item';

    this.form = this.fb.group({
      name: [
        '',
        data.type !== ItemType.Reason ? Validators.required : []
      ],
      description: [
        '',
        data.type === ItemType.Reason ? Validators.required : []
      ]
    });
  }

  save() {
    if (this.form.invalid) return;

    let result;
    if (this.data.type === ItemType.Reason) {
      result = { reason: this.form.get('description')?.value };
    }
    else if (this.data.type === ItemType.Purpose) {
      result = { purposeName: this.form.get('name')?.value, id: uuidv1() };
      this.createBpaService.onCreateOrUpdatePurpose(result);
    }
    else if (this.data.type === ItemType.DataSubject) {
      result = { name: this.form.get('name')?.value };
    }
    else if (this.data.type === ItemType.Department) {
      result = { ...this.form.value, id: uuidv1() };
      this.createBpaService.onCreateOrUpdateDepartment(result);
    }
    else if (this.data.type === ItemType.AssetDepartment) {
      result = { ...this.form.value, id: uuidv1() };
      this.createAssetService.onCreateOrUpdateDepartment(result);
    }
    else if (this.data.type === ItemType.Vendor) {
      result = { ...this.form.value, vendorId: uuidv1() };
      this.createAssetService.onCreateOrUpdateVendor(result);
    }
    else if (this.data.type === ItemType.SecurityControl) {
      result = { ...this.form.value, id: uuidv1() };
      this.createAssetService.onCreateOrUpdateSecurityControl(result);
    }
    else if (this.data.type === ItemType.BpaSecurityControl) {
      result = { ...this.form.value, id: uuidv1() };
      this.createBpaService.onCreateOrUpdateSecurityControl(result);
    }
    else if (this.data.type === ItemType.UserDepartment) {
      result = { ...this.form.value, id: uuidv1() };
      this.departmentService.onCreateOrUpdateDepartment(result);
    }
    else {
      result = this.form.value;
    }

    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }
}


