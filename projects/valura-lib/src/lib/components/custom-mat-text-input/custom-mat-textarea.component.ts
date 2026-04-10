import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomMatErrorComponent } from '../custom-mat-error/custom-mat-error.component';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-custom-mat-textarea',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    CustomMatErrorComponent,
    TextFieldModule
  ],
  templateUrl: './custom-mat-textarea.component.html',
  styleUrls: ['./custom-mat-textarea.component.scss']
})
export class CustomMatTextareaComponent {

  @Input() control: FormControl = new FormControl('');
  @Input() label = '';
  @Input() placeholder = '';
  @Input() appearance: 'outline' | 'fill' = 'outline';
   @Input() readonly = false;
  @Input() disabled = false;

  @Input() minRows = 1;
  @Input() maxRows = 5;
  @Input() maxLength?: number;

  @Input() showCounter = false;

  @Output() valueChange = new EventEmitter<string>();

  get length(): number {
    return this.control?.value?.length || 0;
  }

  onInput() {
    this.control.markAsDirty();
    this.valueChange.emit(this.control.value);
  }
}
