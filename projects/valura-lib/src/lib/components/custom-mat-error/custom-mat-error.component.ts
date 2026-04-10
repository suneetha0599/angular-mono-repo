import { Component, Input, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatError } from '@angular/material/input';

@Component({
  selector: 'custom-mat-error',
  imports: [],
  templateUrl: './custom-mat-error.component.html',
  styleUrl: './custom-mat-error.component.scss'
})
export class CustomMatErrorComponent {

  @Input() errors: any = null
  @Input() control!: FormControl
  @Input() controlActualName: string = ""
  errorMessage: any = ""

  constructor(
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['errors']) {
      this.checkErrors()
    }
  }

  get showError() {
    return (this.control?.invalid
      &&
      (this.control?.dirty || this.control?.touched))
  }

  checkErrors() {
    if (!this.errors) {
      this.errorMessage = null
      return
    }

    if (this.errors.required) {
      // this.errorMessage = this.controlActualName ? `${this.controlActualName} cannot be blank` : 'This field is mandatory'
      this.errorMessage = 'This field is mandatory'
      return
    }

    if (this.errors?.objectControlMandatory) {
      this.errorMessage = 'This field is mandatory'
      return
    }

    if (this.errors.pattern) {
      this.errorMessage = 'Invalid Input'
      return
    }

  }

}


