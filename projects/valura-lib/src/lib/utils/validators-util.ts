import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms"

export function objectControlValidation(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

        if (control?.value?.id) {
            return null
        }
        return { objectControlMandatory: true }

    }
}