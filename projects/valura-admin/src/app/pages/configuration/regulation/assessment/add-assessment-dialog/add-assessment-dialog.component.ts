import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { HttpService } from '@valura-lib/service/network/http.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';

@Component({
  selector: 'app-add-assessment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CustomMatErrorComponent,
    LoadingButtonComponent,
    MatDialogModule
  ],
  templateUrl: './add-assessment-dialog.component.html',
  styleUrls: ['./add-assessment-dialog.component.scss']
})
export class AddAssessmentDialogComponent {
  form!: FormGroup;
  isSaving = false;
  private configApiHelperService = inject(ConfigApiHelperService);

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialogRef<AddAssessmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: HttpService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]]
    });

    if (this.data?.mode === 'edit') {
      this.form.patchValue({
        name: this.data.assessment.name
      });
    }
  }

  get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  async onSave() {
    if (this.form.invalid) return;

    this.isSaving = true;

    try {
      if (this.data?.mode === 'edit') {
        const updatedAssessment = {
          ...this.data.assessment,
          name: this.name.value
        };

        await this.configApiHelperService.editAssessment(
          this.data.assessment.id,
          updatedAssessment
        );

        this.snackbarService.openSnack('Assessment updated successfully');

        this.dialog.close({ success: true, data: updatedAssessment });

      } else {
        const res = await this.configApiHelperService.onAddAssessmentType(this.name.value);
        this.dialog.close(res);
      }
    } catch (error) {
      this.snackbarService.openSnack('Failed to save assessment');
    } finally {
      this.isSaving = false;
    }
  }

  onCancel() {
    this.dialog.close();
    this.form.reset();
  }
}
