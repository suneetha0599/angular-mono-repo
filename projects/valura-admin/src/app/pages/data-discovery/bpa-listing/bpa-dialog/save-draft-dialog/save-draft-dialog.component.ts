import { Component, Inject } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatInput, MatInputModule, MatLabel } from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  MatNativeDateModule
} from '@angular/material/core';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
}

@Component({
  selector: 'app-save-draft-dialog',
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  imports: [
    ReactiveFormsModule, MatIcon, MatCard, LoadingButtonComponent, MatDialogContent, MatRadioGroup, FormsModule, MatRadioButton, MatFormField, MatInput, MatSelect, MatOption, MatDatepickerInput, MatDatepickerToggle, MatDatepicker, MatDialogActions, MatLabel, MatIconButton, MatDatepickerModule, MatNativeDateModule,
    MatInputModule
  ],
  templateUrl: './save-draft-dialog.component.html',
  styleUrl: './save-draft-dialog.component.scss'
})
export class SaveDraftDialogComponent {
  dialogTitle = "BPA saved";
  selectedOption: 'continue' | 'assignTask' = 'continue';
  taskForm!: FormGroup;

  assignees = ['User A', 'User B'];
  isTaskStep = false;

  constructor(
    public dialogRef: MatDialogRef<SaveDraftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {

    this.taskForm = this.fb.group({
      taskName: [''],
      description: [''],
      type: [''],
      dueDate: [''],
      priority: [''],
      assigneeType: [''],
      assignee: ['']
    });
  }

  // onContinue() {
  //   if (this.selectedOption === 'assignTask') {
  //     if (!this.isTaskStep) {
  //       this.dialogTitle = 'Create Task';
  //       this.isTaskStep = true;
  //       return;
  //     }
  //     if (this.taskForm.valid) {
  //       console.log('Task Data:', this.taskForm.value);
  //       this.dialogRef.close('createTask');
  //     } else {
  //       this.taskForm.markAllAsTouched();
  //     }
  //   } else {
  //     this.dialogRef.close('continue');
  //   }
  // }

  onContinue() {
    this.dialogRef.close('continue');
  }


  onClose() {
    this.dialogRef.close('close');
  }

}
