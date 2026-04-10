import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';

@Component({
  selector: 'app-section-details-drawer',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    CustomEditorComponent
  ],
  templateUrl: './section-details-drawer.component.html',
  styleUrl: './section-details-drawer.component.scss'
})
export class SectionDetailsDrawerComponent {
  @Output() onCloseDrawer = new EventEmitter<any>();
  @Output() getSectionDetails = new EventEmitter<any>();
  @Input() sectionData: any;

  private cdr = inject(ChangeDetectorRef);
  private sbService = inject(SnackbarService);

  sectionForm!: FormGroup;
  prevId: number | null = null;
  nextId: number | null = null;
  selectedEmailElementList: any = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.sectionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      isEdit: false
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sectionData']) {
      if (this.sectionData) {
        this.sectionForm.patchValue({
          title: this.sectionData?.section,
          description: this.sectionData.description,
          isEdit: true
        });
      }
      else {
        if (this.sectionForm) {
          this.sectionForm.patchValue({
            title: '',
            description: '',
          });
        }
      }
    }
  }

  closeDrawer() {
    this.sectionForm.reset();
    this.onCloseDrawer.emit(true);
  }

  onDescriptionChange(data: { content: string, edited: boolean }) {
    this.sectionForm.patchValue({ description: data.content }, { emitEvent: false });
  }

  onSave() {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      this.sbService.openSnack('Please fill all required fields before submitting.');
      return;
    }

    // const descriptionHtml = this.sectionForm.get('description')?.value || '';
    // const tempDiv = document.createElement('div');
    // tempDiv.innerHTML = descriptionHtml;
    // const plainText = (tempDiv.textContent || tempDiv.innerText || '').trim();

    // if (!plainText) {
    //   this.sectionForm.get('description')?.setErrors({ required: true });
    //   this.sectionForm.get('description')?.markAsTouched();
    //   this.sbService.openSnack('Please fill all required fields before submitting.');
    //   return;
    // }

    this.getSectionDetails.emit(this.sectionForm.value);
    this.closeDrawer();
  }

  get title(): FormControl {
    return this.sectionForm.get('title') as FormControl;
  }

  get description(): FormControl {
    return this.sectionForm.get('description') as FormControl;
  }
}
