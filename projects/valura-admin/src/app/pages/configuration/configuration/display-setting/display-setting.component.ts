import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Input, EventEmitter, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxColorsModule } from 'ngx-colors';
import { SecureImgModule } from '@valura-lib/secure-img/secure-img.module';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { validateImageFile, IMAGE_FILE_UPLOAD_ACCEPT, IMAGE_FILE_UPLOAD_SUPPORTED_TEXT } from '@admin-core/constants/file-upload.constants';
import { FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { FileDropDirective } from '@valura-lib/directives/file-drop/file-drop.directive';
import { FormControl } from '@angular/forms';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-display-setting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NgxColorsModule,
    SecureImgModule,
    FileDropDirective,
    CustomMatErrorComponent,
    MatTooltipModule
  ],
  templateUrl: './display-setting.component.html',
  styleUrl: './display-setting.component.scss'
})
export class DisplaySettingComponent implements OnInit {
  @Input() formConfiguration?: FormConfigurationData;
  @Input() displayForm!: FormGroup;
  @Input() dataUpdated: string = ''

  @Output() onPatchForm = new EventEmitter<any>();
  @Output() clearDataUpdated = new EventEmitter<any>();
  @Output() formUpdated = new EventEmitter<boolean>();

  get copyrightControl(): FormControl {
    return this.displayForm.get('copyright') as FormControl;
  }

  get formTitleControl(): FormControl {
    return this.displayForm.get('formTitle') as FormControl;
  }

  get primaryColorControl(): FormControl {
    return this.displayForm.get('primaryColor') as FormControl;
  }

  get secondaryColorControl(): FormControl {
    return this.displayForm.get('secondaryColor') as FormControl;
  }

  isLoading = false;
  isDragging = false;
  configId!: number;
  fullConfig: any;
  selectedFileName: string | null = null;
  previewUrl: string | null = null;
  uploadedFileKey: any;
  readonly fileUploadAccept = IMAGE_FILE_UPLOAD_ACCEPT;
  readonly fileUploadSupportedText = IMAGE_FILE_UPLOAD_SUPPORTED_TEXT;
  private fb = inject(FormBuilder);
  private initialFormValue: any;
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  constructor() {
    this.initializeForm();
  }
  ngOnInit(): void {
    this.updateFormLogo()
    this.setupColorValidation();

    this.displayForm.valueChanges.subscribe(() => {
      const isChanged = !this.isFormSameAsInitial();

      if (isChanged) {
        this.formUpdated.emit(true);
      }

      if (!isChanged) {
        this.formUpdated.emit(false);
      }
    });
  }

  private isFormSameAsInitial(): boolean {
    if (!this.initialFormValue) {
      return true;
    }
    return JSON.stringify(this.initialFormValue) ===
      JSON.stringify(this.displayForm.getRawValue());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataUpdated']) {
      if (this.dataUpdated) {
        this.loadDisplaySettings();
      }
    }
  }

  private initializeForm(): void {
  }
  private setupColorValidation(): void {
    this.displayForm.get('primaryColor')?.valueChanges.subscribe(value => {
      if (value && /^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        this.displayForm.get('primaryColor')?.setValue(value, { emitEvent: false });
      }
    });
    this.displayForm.get('secondaryColor')?.valueChanges.subscribe(value => {
      if (value && /^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        this.displayForm.get('secondaryColor')?.setValue(value, { emitEvent: false });
      }
    });
  }
  updateFormLogo() {
    const logoKey = this.displayForm.value?.formLogoUrl;
    this.updateLogoUrl(logoKey);

  }
  async loadDisplaySettings(): Promise<void> {
    this.isLoading = true;

    try {
      if (this.formConfiguration?.displaySettings) {
        const displaySettings = this.formConfiguration.displaySettings;
        this.displayForm.patchValue({
          formLogoUrl: displaySettings.logoUrl || null,
          copyright: displaySettings.copyright || '',
          formTitle: displaySettings.formInformation?.title || 'Welcome to Valura',
          subTitle: displaySettings.formInformation?.subTitle || '',
          primaryColor: displaySettings.primaryColor || '#1e3a8a',
          secondaryColor: displaySettings.secondaryColor || '#d9f99d'
        });
        const logoKey = displaySettings.logoUrl;
        this.updateLogoUrl(logoKey);

      } else {
        const configs = await this.configApiHelperService.getConfigurations();
        if (!configs) return;
        const config = configs.find((c: any) => c.key === 'display_settings');
        if (!config) return;
        this.fullConfig = config;
        this.configId = config.id;
        this.displayForm.patchValue({
          formLogoUrl: config.value?.formLogoUrl || null,
          copyright: config.value?.copyright || '',
          formTitle: config.value?.formTitle || 'Welcome to Valura',
          subTitle: config.value?.subTitle || '',
          primaryColor: config.value?.primaryColor || '#1e3a8a',
          secondaryColor: config.value?.secondaryColor || '#d9f99d'
        });
        const logoKey = config.value?.formLogoUrl;
        this.updateLogoUrl(logoKey);
      }
      this.onPatchForm.emit({ updated: true })
      this.initialFormValue = JSON.parse(
        JSON.stringify(this.displayForm.getRawValue())
      );

      this.formUpdated.emit(false);

    } catch (error: any) {
      console.error('Error loading display settings:', error);
      this.snackbarService.openSnack('Failed to load display settings');
    } finally {
      this.isLoading = false;
    }
    this.clearDataUpdated.emit(true);
  }

  updateLogoUrl(logoKey: string) {
    if (logoKey) {
      this.previewUrl = logoKey;
      this.selectedFileName = this.getFileName(logoKey);
    }
  }

  onFileDropped(fileList: FileList) {
    if (fileList) {
      this.handleFileUpload(fileList[0]);
    }
  }
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.handleFileUpload(file);
    (event.target as HTMLInputElement).value = '';
  }
  onclick(event: any) {
    event.target.value = ''
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }
  private handleFileUpload(file: File): void {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      this.snackbarService.openSnack(validation.errorMessage || 'Invalid file');
      return;
    }
    this.selectedFileName = file.name;
    this.uploadLogo(file);
  }
  private async uploadLogo(file: File): Promise<void> {
    try {
      const params = {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        purpose: 'public-assets'
      };
      const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
      if (imageInfo?.presignedUrl) {
        const uploadResult = await this.apiHelperService.getImageEtag(
          imageInfo.presignedUrl,
          file
        );
        if (!uploadResult) {
          throw new Error('File upload to presigned URL failed');
        }
        this.uploadedFileKey = imageInfo.publicPath;
        this.displayForm.patchValue({ formLogoUrl: this.uploadedFileKey });
        this.previewUrl = this.uploadedFileKey;
        this.selectedFileName = file.name;
        this.displayForm.markAsDirty();
        this.onPatchForm.emit({ updated: true });
        if (this.configId && this.fullConfig) {
          await this.saveConfiguration();
        }
        this.snackbarService.openSnack('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.snackbarService.openSnack('Failed to upload logo');
    }
  }
  removeLogo(): void {
    this.previewUrl = null;
    this.selectedFileName = null;
    this.uploadedFileKey = null;
    this.displayForm.patchValue({ formLogoUrl: null });
  }
  getFileName(filePath: string): string {
    if (!filePath) return '';
    try {
      const url = new URL(filePath);
      return url.pathname.split('/').pop() || '';
    } catch {
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    }
  }
  openColorPicker(controlName: string): void {
    console.log(`Opening color picker for ${controlName}`);
  }
  resetColors(): void {
    this.displayForm.patchValue({
      primaryColor: '#1C2B70',
      secondaryColor: '#D7F049'
    });
    this.displayForm.markAsDirty();
    this.onPatchForm.emit({ updated: true });
    if (this.configId && this.fullConfig) {
      this.saveConfiguration();
    }
  }
  private async saveConfiguration(): Promise<void> {
    try {
      const payload = {
        ...this.fullConfig,
        value: this.displayForm.value
      };
      await new Promise<void>((resolve, reject) => {
        this.configApiHelperService.saveConfiguration(this.configId, payload).subscribe({
          next: (res) => {
            resolve();
          },
          error: (error: Error) => {
            console.error('Error auto-saving display settings:', error.message);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
  async onSave(): Promise<void> {
    if (this.displayForm.invalid) {
      this.snackbarService.openSnack('Please fill all required fields');
      return;
    }
    this.isLoading = true;
    const payload = {
      ...this.fullConfig,
      value: this.displayForm.value
    };
    this.configApiHelperService.saveConfiguration(this.configId, payload).subscribe({
      next: (res) => {
        this.snackbarService.openSnack('Display settings saved successfully');
      },
      error: (error: Error) => {
        console.error('Error saving display settings:', error.message);
        this.snackbarService.openSnack('Failed to save display settings');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  resetToDefault(): void {
    this.displayForm.reset({
      copyright: '',
      formTitle: 'Welcome to Valura',
      subTitle: '',
      primaryColor: '#1e3a8a',
      secondaryColor: '#d9f99d',
      formLogoUrl: null
    });
    this.removeLogo();
  }
}
