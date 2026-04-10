import { CommonModule } from '@angular/common';
import { Component, ViewChild, } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule, } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ConsentTemplateDialogComponent } from '../consent-management-dialog/consent-template-dialog/consent-template-dialog.component';
import { CONSENT_PURPOSES, CONSENT_TEMPLATE, CONSENT_UPSTREAM, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { BTN_ADD_PURPOSE, BTN_CATEGORY, BTN_TERM, DRAWER_SELECTION, DRAWER_SUMMARY, isConsentForms, isConsentPurpose, isConsentRecords, isConsentTemplates } from '../constants';
import { buildConsentForm, buildConsentFormArray, formMasterList, purposeMasterList, recordsMasterList, templateMasterList } from '../consent-utils';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { WidgetType } from '@admin-core/constants/widget-types';
import { CreateConsentFormComponent } from './create-consent-form/create-consent-form.component';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ConsentDrawerContentComponent } from '../consent-management-dialog/consent-drawer-content/consent-drawer-content.component';

@Component({
  selector: 'app-create-purpose',
  templateUrl: './create-purpose.component.html',
  styleUrls: ['./create-purpose.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, RouterModule, MatButtonModule, MatCheckboxModule, TextFieldModule, MatTooltipModule,
    LoadingButtonComponent, CreateConsentFormComponent, DragDropModule, MatSidenavModule, ConsentDrawerContentComponent
  ],
  standalone: true
})
export class CreatePurposeComponent {
  consentForm!: FormGroup;
  expiryOptions = [{ valueRid: 1, value: '7 days' }, { valueRid: 2, value: '30 days' }, { valueRid: 3, value: '90 days' }];
  inputTypes = [{ valueRid: 1, value: 'Check box (Opt in/ Opt out)' }, { valueRid: 2, value: 'Toggle' }, { valueRid: 3, value: 'Radio button' }, { valueRid: 4, value: 'Email verification' }, { valueRid: 5, value: 'OTP verification' }];
  mv1 = [{ valueRid: 1, value: 'Make this purpose mandatory' }]
  mv2 = [{ valueRid: 1, value: 'Apply data policy or regulations' }]

  CHECK_BOX = WidgetType.CHECK_BOX
  DROP_DOWN = WidgetType.DROP_DOWN
  TEXT_ALPHA_NUMERIC = WidgetType.TEXT_ALPHA_NUMERIC
  TEXT_NUMERIC = WidgetType.TEXT_NUMERIC
  TEXT_AREA = WidgetType.TEXT_AREA
  TEXT_BUTTON = WidgetType.TEXT_BUTTON
  BUTTON = WidgetType.BUTTON
  MULTI_BUTTON_TOGGLE = WidgetType.MULTI_BUTTON_TOGGLE
  DYNAMIC_FORM = WidgetType.DYNAMIC_FORM
  FIRST_BTN = 1;
  SECOND_BTN = 2;
  THIRD_BTN = 3;
  pageTitle: string = '';
  currentPath: string = '';
  drawerType: string = DRAWER_SELECTION;

  @ViewChild('rightDrawer') rightDrawer!: MatSidenav;
  constructor(private fb: FormBuilder, private dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.onInitPage()
  }

  onSubmit() {
    console.log(this.consentForm.value);
  }

  openRightDrawer() {
    this.rightDrawer.open()
  }

  consentPurposeDialog() {
    this.dialog.open(ConsentTemplateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',

      data: { dialogType: CONSENT_PURPOSES }
    });

  }

  consentUpstreamDialog() {
    this.dialog.open(ConsentTemplateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',

      data: { dialogType: CONSENT_UPSTREAM }
    });

  }

  consentTemplateDialog() {
    this.dialog.open(ConsentTemplateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',

      data: { dialogType: CONSENT_TEMPLATE }
    });

  }

  preview() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CONSENT_MANAGEMENT_PREVIEW}`])
  }

  onSave() {
    console.log("saved", this.consentForm.value)
  }

  onInitPage() {
    this.pageTitle = `Create`
    if (isConsentPurpose(this.router.url)) {
      this.pageTitle = `${this.pageTitle} purpose`
      this.consentForm = this.fb.group({ propertyList: buildConsentFormArray(this.fb, purposeMasterList, 1, routeConstants.CONSENT_MANAGEMENT_PURPOSE) })
    }
    else if (isConsentTemplates(this.router.url)) {
      this.drawerType = DRAWER_SUMMARY
      this.pageTitle = `${this.pageTitle} templates`
      this.consentForm = this.fb.group({ propertyList: buildConsentFormArray(this.fb, templateMasterList, 1, routeConstants.CONSENT_MANAGEMENT_TEMPLATES) })
    }
    else if (isConsentForms(this.router.url)) {
      this.pageTitle = `${this.pageTitle} forms`
      this.consentForm = this.fb.group({ propertyList: buildConsentFormArray(this.fb, formMasterList, 1, routeConstants.CONSENT_MANAGEMENT_FORMS) })
    }
    else if (isConsentRecords(this.router.url)) {
      this.pageTitle = `${this.pageTitle} records`
      this.consentForm = this.fb.group({ propertyList: buildConsentFormArray(this.fb, recordsMasterList, 1, routeConstants.CONSENT_MANAGEMENT_RECORDS) })
    }

    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  get propertyList(): FormArray {
    return this.consentForm.get("propertyList") as FormArray
  }

  getSubPropertyList(property: FormGroup): FormArray {
    return property.get("subPropertyList") as FormArray
  }

  get displayPropertyList(): any {
    return this.propertyList?.value
  }

  getPropertyForm(index: number): FormGroup {
    return this.propertyList.at(index) as FormGroup;
  }


  getPropertyComponent(property: any) {
    return property.get('componentTypeRid')?.value ?? 0;
  }

  getPropertyName(property: any) {
    return property.get('propertyName')?.value ?? 0;
  }

  hidePropName(property: any): boolean {
    return property.get('hidePropName')?.value ?? false;
  }

  getComponentLabel(property: any): boolean {
    return property.get('componentLabel')?.value ?? '';
  }

  getConsentType(property: any): string {
    return property.get('consentType')?.value ?? '';
  }

  get propertyListControls(): any {
    return this.propertyList?.controls ?? []
  }

  get isConsentTemplates() {
    return isConsentTemplates(this.router.url)
  }

  getSubPropertyListControls(property: FormGroup): any {
    return this.getSubPropertyList(property)?.controls ?? []
  }

  getBtnLabel(level: number) {
    if (isConsentPurpose(this.router.url)) {
      if (level == this.FIRST_BTN)
        return `Preview`
      if (level == this.SECOND_BTN)
        return `Save Draft`
      if (level == this.THIRD_BTN)
        return `Cancel`
    }
    else if (isConsentTemplates(this.router.url)) {
      if (level == this.FIRST_BTN)
        return `Create template`
      if (level == this.SECOND_BTN)
        return `Save Draft`
      if (level == this.THIRD_BTN)
        return `Cancel`
    }
    else if (isConsentForms(this.router.url)) {
      if (level == this.FIRST_BTN)
        return `Preview`
      if (level == this.SECOND_BTN)
        return `Save Draft`
      if (level == this.THIRD_BTN)
        return `Cancel`
    }
    else if (isConsentRecords(this.router.url)) {
      if (level == this.FIRST_BTN)
        return `Find data subject`
    }
    return
  }

  onAddDynamicForm(property: any) {
    if (property) {
      const newForm = buildConsentForm(this.fb, property, 1, routeConstants.CONSENT_MANAGEMENT_FORMS)
      this.propertyList.push(newForm, { emitEvent: false })
    }
  }

  dropForm(event: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.propertyList.controls, event.previousIndex, event.currentIndex);
      moveItemInArray(this.propertyList.value, event.previousIndex, event.currentIndex);
    }
  }

  get isConsentRecords(): boolean {
    return isConsentRecords(this.router.url)
  }

  onButtonClick(property: any) {

    if (property.buttonType == BTN_TERM) {
      if (isConsentPurpose(this.router.url)) {
        this.router.navigate([`${this.currentPath}/${routeConstants.CONSENT_TERM_PAGE}`])
        return
      }
    }
    if (property.buttonType == BTN_CATEGORY) {
      if (isConsentPurpose(this.router.url)) {
        this.drawerType = DRAWER_SELECTION
        this.openRightDrawer()
        return
      }
    }
    if (property.buttonType == BTN_ADD_PURPOSE) {
      if (isConsentTemplates(this.router.url)) {
        this.drawerType = DRAWER_SUMMARY
        this.openRightDrawer()
        return
      }
    }
    return ''
  }

}


