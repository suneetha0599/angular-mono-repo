import { FormBuilder, FormGroup, Validators } from "@angular/forms"

export const buildFormConfigurationForm = (fb: FormBuilder) => {

    let form: FormGroup = fb.group({
        displayForm: fb.group({
            formLogoUrl: [null],
            copyright: ['', Validators.required],
            formTitle: ['Welcome to Valura', Validators.required],
            subTitle: [''],
            primaryColor: ['#1e3a8a', Validators.required],
            secondaryColor: ['#d9f99d', Validators.required]
        })
    })
    return form;
}