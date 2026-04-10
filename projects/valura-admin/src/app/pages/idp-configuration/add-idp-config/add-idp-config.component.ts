import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-client-drawer',
  standalone: true,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    CustomMatTextareaComponent
  ],
  templateUrl: './add-idp-config.component.html',
  styleUrl: './add-idp-config.component.scss'
})
export class AddIdpComponent implements OnInit {

  clientForm!: FormGroup;

  clientIdData = '';
  redirectUri = '';
  redirectUriOidc = ''
  private samlClientIdTemplate = '';
  sampleRedirectUriOidc = ''
  private sampleRegistrationUri = ''
  isDetailsLoading = false;
  hideClientSecret = true;



  private apiHelperService = inject(ApiHelperService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddIdpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadRegistrationConfig();
    this.setupRegistrationIdGeneration();
    this.setupIdpTypeHandling();
    this.setupConfigModeHandling();
    this.clientForm.get('saml')?.disable();
    this.clientForm.get('samlLink')?.disable();

    if (this.data?.mode === 'edit' && this.data?.idpId) {
      this.loadIdpDetails(this.data.idpId);
    }
  }

  async loadIdpDetails(idpId: number): Promise<void> {
    this.isDetailsLoading = true;

    try {
      const res = await this.apiHelperService.getIdpDetails(idpId);
      if (!res) return;
      this.clientForm.patchValue({
        idpType: res.idpType,
        displayName: res.displayName,
        isActive: res.isActive,
        registrationId: res.idpData?.registrationId ?? ''
      });

      if (res.idpType === 'SAML' && res.idpData?.samlData) {
        this.clientForm.get('saml')?.patchValue({
          idpEntityId: res.idpData.samlData.idpEntityId,
          ssoServiceLocation: res.idpData.samlData.ssoServiceLocation,
          idpCertificate: res.idpData.samlData.idpCertificate
        });


        this.redirectUri = res.redirectUrl;
      }

      if (res.idpType === 'OIDC' && res.idpData?.oidcData) {
        this.clientForm.get('oidc')?.patchValue({
          authorizationUri: res.idpData.oidcData.authorizationUri,
          tokenUri: res.idpData.oidcData.tokenUri,
          clientId: res.idpData.oidcData.clientId,
          clientSecret: res.idpData.oidcData.clientSecret,
          issuerUri: res.idpData.oidcData.issuerUri,
          jwkSetUri: res.idpData.oidcData.jwkSetUri
        });


        this.redirectUriOidc = res.redirectUrl;
      }
      this.clientForm.get('idpType')?.disable();
      this.setupIdpTypeHandling();

    } catch (err) {
      console.error('Failed to load IDP details', err);
    }
    finally {
      this.isDetailsLoading = false;

    }
  }

  copied = false;
  copiedRedirectUri = false

  copyClientId(): void {
    if (!this.clientIdData) return;

    navigator.clipboard.writeText(this.clientIdData).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  copyRedirectUri(): void {
    if (!this.redirectUri) return;

    navigator.clipboard.writeText(this.redirectUri).then(() => {
      this.copiedRedirectUri = true;
      setTimeout(() => {
        this.copiedRedirectUri = false;
      }, 2000);
    });
  }
  copiedRedirectUriOidc = false

  copyRedirectUriOidc(): void {
    if (!this.redirectUriOidc) return;

    navigator.clipboard.writeText(this.redirectUriOidc).then(() => {
      this.copiedRedirectUriOidc = true;
      setTimeout(() => {
        this.copiedRedirectUriOidc = false;
      }, 2000);
    });
  }

  buildForm(): void {
    this.clientForm = this.fb.group({
      idpType: ['OIDC', Validators.required],
      configMode: ['manual', Validators.required],
      displayName: ['', Validators.required],
      registrationId: [{ value: '', disabled: true }],
      isActive: [true],

      oidcLink: [''],
      samlLink: [''],

      oidc: this.fb.group({
        authorizationUri: ['', Validators.required],
        tokenUri: ['', Validators.required],
        clientId: ['', Validators.required],
        clientSecret: ['', Validators.required],
        issuerUri: ['', Validators.required],
        jwkSetUri: ['', Validators.required]
      }),

      saml: this.fb.group({
        idpEntityId: ['', Validators.required],
        ssoServiceLocation: ['', Validators.required],
        idpCertificate: ['', Validators.required]
      })
    });
  }


  async loadRegistrationConfig(): Promise<void> {
    try {
      const res = await this.apiHelperService.registrationConfig();
      if (res?.saml?.clientId) {
        this.samlClientIdTemplate = res.saml.clientId;
        this.sampleRegistrationUri = res.saml.validRedirectUri
        this.sampleRedirectUriOidc = res.oidc.redirectUris

        this.updateClientId();
        this.updateRedirectUri()
        this.updateOidcRedirectUri()
      }
    } catch (err) {
      console.error('Failed to load registration config', err);
    }
  }

  setupRegistrationIdGeneration(): void {
    this.clientForm.valueChanges.subscribe(() => {
      const displayName = this.clientForm.get('displayName')?.value || '';
      const idpType = this.clientForm.get('idpType')?.value || '';

      const registrationId = `${displayName}-${idpType}`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      this.clientForm.get('registrationId')?.setValue(registrationId, {
        emitEvent: false
      });

      this.updateClientId();
      this.updateRedirectUri();
      this.updateOidcRedirectUri()
    });
  }

  updateClientId(): void {
    if (this.isSAML && this.samlClientIdTemplate) {
      const regId = this.clientForm.get('registrationId')?.value;
      this.clientIdData = this.samlClientIdTemplate.replace('{registrationId}', regId);

    } else {
      this.clientIdData = '';
    }
  }


  updateRedirectUri(): void {
    if (this.isSAML && this.sampleRegistrationUri) {
      const regId = this.clientForm.get('registrationId')?.value;
      this.redirectUri = this.sampleRegistrationUri.replace('{registrationId}', regId);

    } else {
      this.redirectUri = '';
    }
  }

  updateOidcRedirectUri(): void {
    if (this.isOIDC && this.sampleRedirectUriOidc) {
      const regId = this.clientForm.get('registrationId')?.value;
      this.redirectUriOidc = this.sampleRedirectUriOidc.replace('{registrationId}', regId);

    } else {
      this.redirectUriOidc = '';
    }
  }


  setupIdpTypeHandling(): void {
    this.clientForm.get('idpType')?.valueChanges.subscribe(type => {

      if (type === 'OIDC') {
        this.clientForm.get('oidc')?.enable();
        this.clientForm.get('saml')?.disable();
        this.clientForm.get('oidcLink')?.enable();
        this.clientForm.get('samlLink')?.disable();
        this.clientIdData = '';
      } else {
        this.clientForm.get('saml')?.enable();
        this.clientForm.get('oidc')?.disable();
        this.clientForm.get('samlLink')?.enable();
        this.clientForm.get('oidcLink')?.disable();
        this.updateClientId();
        this.updateRedirectUri();
      }
    });
  }


  setupConfigModeHandling(): void {
    this.clientForm.get('configMode')?.valueChanges.subscribe(mode => {
      if (mode === 'metadata') {
        this.clientForm.get('oidc')?.disable();
        this.clientForm.get('saml')?.disable();
      } else {
        if (this.isOIDC) {
          this.clientForm.get('oidc')?.enable();
        } else {
          this.clientForm.get('saml')?.enable();
        }
      }
    });
  }

  get isOIDC(): boolean {
    return this.clientForm.get('idpType')?.value === 'OIDC';
  }

  get isSAML(): boolean {
    return this.clientForm.get('idpType')?.value === 'SAML';
  }

  get isManual(): boolean {
    return this.clientForm.get('configMode')?.value === 'manual';
  }

  get isMetadata(): boolean {
    return this.clientForm.get('configMode')?.value === 'metadata';
  }

  onCancel() {
    this.dialogRef.close()
  }


  save(): void {
    if (this.data?.mode === 'edit') {
      this.updateClient();
    } else {
      this.addClient();
    }
  }


  async updateClient(): Promise<void> {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const raw = this.clientForm.getRawValue();

    const payload: any = {
      displayName: raw.displayName,
      registrationId: raw.registrationId,
      isActive: raw.isActive,
      idpType: raw.idpType
    };

    if (raw.idpType === 'OIDC') {
      if (raw.configMode === 'manual') {
        payload.oidc = {
          authorizationUri: raw.oidc.authorizationUri,
          tokenUri: raw.oidc.tokenUri,
          clientId: raw.oidc.clientId,
          clientSecret: raw.oidc.clientSecret,
          issuerUri: raw.oidc.issuerUri,
          jwkSetUri: raw.oidc.jwkSetUri,
          redirectUri: this.redirectUriOidc
        };
      } else {
        payload.oidcLink = raw.oidcLink;
      }
    }


    if (raw.idpType === 'SAML') {
      if (raw.configMode === 'manual') {
        payload.saml = {
          idpEntityId: raw.saml.idpEntityId,
          ssoServiceLocation: raw.saml.ssoServiceLocation,
          idpCertificate: raw.saml.idpCertificate
        };
      } else {
        payload.samlLink = raw.samlLink;
      }
    }

    try {
      await this.apiHelperService.updateIdp(this.data.idpId, payload);
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Update failed', err);
    }
  }

  addClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const payload: any = {
      ...this.clientForm.getRawValue(),
      idpType: this.clientForm.value.idpType
    };

    if (payload.idpType === 'OIDC') {
      delete payload.saml;
    } else {
      delete payload.oidc;
    }

    if (payload.configMode === 'manual') {
      delete payload.oidcLink;
      delete payload.samlLink;
    } else {
      delete payload.oidc;
      delete payload.saml;
    }

    this.apiHelperService.createClient(payload).subscribe({
      next: res => this.dialogRef.close(res),
      error: err => console.error(err)
    });
  }



}
