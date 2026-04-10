import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { WidgetType } from '@admin-core/constants/widget-types';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { RouterModule } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { buildConsentForm } from '../../consent-utils';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

@Component({
  selector: 'create-consent-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, RouterModule,
    MatButtonModule, MatCheckboxModule, CustomMatTextareaComponent, TextFieldModule, LoadingButtonComponent, MatButtonToggleModule, DragDropModule],
  templateUrl: './create-consent-form.component.html',
  styleUrl: './create-consent-form.component.scss'
})
export class CreateConsentFormComponent {

  @Input() propertyForm!: FormGroup;
  @Input() propertyValueList: any = [];
  @Input() routerLinks: string = '';
  @Input() isLast: boolean = false;
  @Output() onAddDynamicForm = new EventEmitter<any>();
  @Output() onButtonClick = new EventEmitter<any>();

  CHECK_BOX = WidgetType.CHECK_BOX
  DROP_DOWN = WidgetType.DROP_DOWN
  TEXT_ALPHA_NUMERIC = WidgetType.TEXT_ALPHA_NUMERIC
  TEXT_NUMERIC = WidgetType.TEXT_NUMERIC
  TEXT_AREA = WidgetType.TEXT_AREA
  TEXT_BUTTON = WidgetType.TEXT_BUTTON
  BUTTON = WidgetType.BUTTON
  MULTI_BUTTON_TOGGLE = WidgetType.MULTI_BUTTON_TOGGLE
  DYNAMIC_FORM = WidgetType.DYNAMIC_FORM

  ngOnInit(): void {
  }

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder,) { }

  get value(): FormControl {
    return this.propertyForm.get('value') as FormControl;
  }

  get value2(): FormControl {
    return this.propertyForm.get('value2') as FormControl;
  }

  get valueArray() {
    return this.propertyForm.get('value') as FormArray;
  }

  get valueRid(): FormControl {
    return this.propertyForm.get('valueRid') as FormControl;
  }

  get label(): FormControl {
    return this.propertyForm.get('componentLabel') as FormControl;
  }

  get propertyName(): string {
    return this.propertyForm.get('propertyName')?.value ?? '';
  }

  get componentTypeRid(): number {
    return this.propertyForm.get('componentTypeRid')?.value ?? 0;
  }

  get propValueList(): FormArray {
    return this.propertyForm.get('propertyValueList') as FormArray;
  }

  onCheckBoxChange(event: MatCheckboxChange) {

  }

  preview() {

  }

  addDynamicForm() {
    const event = { property: this.propertyForm.value }
    this.onAddDynamicForm.emit(event)
  }

  addPropertyValues() {
    const newForm = buildConsentForm(this.fb, this.propertyForm.value, 1, routeConstants.CONSENT_MANAGEMENT_FORMS)
    this.propValueList.push(newForm)
  }

  get propValueListControls(): any {
    return this.propValueList?.controls ?? []
  }

  onBtnClick() {
    const data = { property: this.propertyForm.value }
    this.onButtonClick.emit(data)
  }
}
