import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConsentTemplateDialogComponent } from '../consent-management-dialog/consent-template-dialog/consent-template-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS, PUBLISH_CONFIRMATION, TERMS_AND_CONDITIONS } from '@admin-core/constants/constants';
import { routes as routeConstants } from '@admin-core/constants/routes';

@Component({
  selector: 'app-consent-management-preview',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    RouterModule,
    LoadingButtonComponent

  ],
  templateUrl: './consent-management-preview.component.html',
  styleUrl: './consent-management-preview.component.scss'
})
export class ConsentManagementPreviewComponent {
  hovering: boolean = false;
  selectedOption: 'enabled' | 'disabled' = 'enabled';
  purposeForm: FormGroup;
  inputTypes = ['Check box (Opt in/ Opt out)', 'Toggle', 'Radio button', 'Email verification', 'OTP verification'];
  tabOptions = ['Add content', 'Add document', 'Add links'];
  selectedTab = 'Add content';
  termForm: FormGroup | undefined;
  currentPath: string = '';

  @ViewChild('termsDialog') termsDialogTemplate!: TemplateRef<any>;
  dialogRef: MatDialogRef<any> | null = null;

  constructor(private fb: FormBuilder, private router: Router, public dialog: MatDialog) {
    this.purposeForm = this.fb.group({
      title: [''],
      description: [''],
      expiry: [''],
      inputType: [],
      mandatory: [true],
      applyPolicy: [true],
      termContent: ['']
    });

    this.termForm = this.fb.group({
      termDescription: ['']
    });
  }

  ngOnInit(): void {
    this.onInitPage()
  }

  ngOnDestroy(): void { }

  onSubmit() {
    console.log(this.purposeForm.value);
  }

  selectInputType(type: string) {
    this.purposeForm.patchValue({ inputType: type });
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  goBack() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CONSENT_MANAGEMENT_CREATE}`]);
  }

  publish() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CONSENT_MANAGEMENT_DETAILS}`]);
  }

  openConfirmDialog() {
    this.dialog.open(ConsentTemplateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',

      data: { dialogType: PUBLISH_CONFIRMATION }
    });


  }

  openTermsDialog() {
    this.dialog.open(ConsentTemplateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',

      data: { dialogType: TERMS_AND_CONDITIONS }
    });
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }
}

