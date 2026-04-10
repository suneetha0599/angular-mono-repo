import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomMatErrorComponent } from '../custom-mat-error/custom-mat-error.component';
import { NgModelDebounceChangeDirective } from 'app/directives/ng-model-debounce/ng-model-debounce-change.directive';

@Component({
  selector: 'cutsom-mat-input',
  imports: [MatInputModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, CustomMatErrorComponent],
  templateUrl: './cutsom-mat-input.component.html',
  styleUrl: './cutsom-mat-input.component.scss'
})
export class CutsomMatInputComponent {

  @Input() formInputControl!: FormControl
  @Input() label: string = ''
  @Input() disabled: boolean = false
  @Input() placeholder: string = ''
  @Input() debounceTime = 1000
  @Input() appearance: any = 'outline';

  @Output() onChangeEvent = new EventEmitter<any>();

  ngOnInit() {
  }

  onChangeInput() {
    this.onChangeEvent.next(1)
  }
}
