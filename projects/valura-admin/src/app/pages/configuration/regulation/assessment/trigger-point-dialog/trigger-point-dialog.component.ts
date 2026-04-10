import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

@Component({
  selector: 'app-trigger-point-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatDialogModule,
    MatDialogContent,
    CustomMatTextareaComponent
  ],
  templateUrl: './trigger-point-dialog.component.html',
  styleUrl: './trigger-point-dialog.component.scss'
})
export class TriggerPointDialogComponent {
  form!: FormGroup;
  actionName: string = 'Add';

  constructor(private fb: FormBuilder, private dialog: MatDialogRef<TriggerPointDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      provision: ['', [Validators.required]],
      label: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });

    if (this.data && this.data.actionName === "Edit") {
      this.actionName = this.data.actionName;
      this.form.patchValue({
        id: this.data.elementData.id,
        provision: this.data.elementData.source,
        label: this.data.elementData.triggerLabel,
        description: this.data.elementData.name
      });
    }
    if (this.data && this.data.actionName === "View") {
      this.actionName = this.data.actionName;
      this.form.patchValue({
        id: this.data.elementData.id,
        provision: this.data.elementData.source,
        label: this.data.elementData.triggerLabel,
        description: this.data.elementData.name
      });
      this.form.disable();
    }
  }

  onEdit() {
    this.actionName = "Edit";
    this.form.enable();
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }

    const formData = this.form.value;
    const result = {
      id: formData.id,
      source: formData.provision,
      triggerLabel: formData.label,
      name: formData.description
    };

    this.dialog.close(result);
  }

  onCancel(): void {
    this.dialog.close();
    this.form.reset();
  }

  get provision(): FormControl {
    return this.form.get('provision') as FormControl;
  }

  get label(): FormControl {
    return this.form.get('label') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }
}
