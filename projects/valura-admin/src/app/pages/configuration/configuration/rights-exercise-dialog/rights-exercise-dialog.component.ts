import { Component, inject, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CustomMatErrorComponent } from '@valura-lib/components//custom-mat-error/custom-mat-error.component';
import { IconPickerMenuComponent, ICON_MAPPING } from '../icon-picker-menu/icon-picker-menu.component';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

export interface RightsExerciseDialogData {
  mode?: 'create' | 'edit' | 'view';
  provision?: string;
  rightTitleSimplified?: string;
  rightDescriptionSimplified?: string;
  showDescription?: boolean;
  icon?: string;
  elementData?: any;
  editMode?: boolean;
  viewMode?: boolean;
}

export interface RightsExerciseFormValue {
  provision: string;
  rightTitleSimplified: string;
  rightDescriptionSimplified: string;
  showDescription: boolean;
  icon?: string;
  icons?: string[];
}

@Component({
  selector: 'app-rights-exercise-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    LoadingButtonComponent,
    CustomMatErrorComponent,
    MatTooltipModule,
    CustomMatTextareaComponent
  ],
  templateUrl: './rights-exercise-dialog.component.html',
  styleUrl: './rights-exercise-dialog.component.scss'
})
export class RightsExerciseDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly dialogRef = inject(MatDialogRef<RightsExerciseDialogComponent>);
  private readonly data = inject<RightsExerciseDialogData>(MAT_DIALOG_DATA);
  original_description: string | null = null;
  original_label: string | null = null;
  description: string | null = null;
  label: string | null = null;
  private overlayRef: OverlayRef | null = null;
  readonly fontSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
  form!: FormGroup;
  isViewMode = false;
  isSubmitLoading = false;
  selectedIcon: string = '';
  selectedIconName: string = '';
  header = 'Add Rights';
  buttonName = 'Save';
  private regulationsService = inject(RegulationsService);
  private apiHelperService = inject(ApiHelperService);
  icons: any[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.handleDialogMode();
    this.loadDialogData();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      provision: ['', [Validators.required]],
      rightTitleSimplified: ['', [Validators.required, Validators.maxLength(200)]],
      rightDescriptionSimplified: ['', [Validators.maxLength(1000)]],
      showDescription: [false],
      icons: [[]],
      original_description: [''],
      original_label: [''],
      selected: [false],
    });
  }

  onDescriptionChange(): void {
    const selectedCtrl = this.form.get('selected');
    const descCtrl = this.form.get('rightDescriptionSimplified');
    if (!selectedCtrl || !descCtrl) return;
    const currentValue = descCtrl.value ?? '';
    const originalValue = this.original_description ?? '';
    const normalize = (v: string) => v.trim();
    if (normalize(currentValue) === normalize(originalValue)) {
      selectedCtrl.setValue(true, { emitEvent: false });
    } else {
      selectedCtrl.setValue(false, { emitEvent: false });
    }
  }

  get rightDescriptionSimplifiedControl(): FormControl {
    return this.form.get('rightDescriptionSimplified') as FormControl;
  }

  onLabelChange(): void {
    const selectedCtrl = this.form.get('selected');
    const labelCtrl = this.form.get('rightTitleSimplified');
    const descCtrl = this.form.get('rightDescriptionSimplified');
    if (!selectedCtrl || !labelCtrl || !descCtrl) return;
    const normalize = (v: string | null | undefined) => (v ?? '').trim();
    const isLabelSame =
      normalize(labelCtrl.value) === normalize(this.original_label);
    const isDescriptionSame =
      normalize(descCtrl.value) === normalize(this.original_description);
    selectedCtrl.setValue(isLabelSame && isDescriptionSame, {
      emitEvent: false
    });
  }

  onToggleDescription() {
    const checked = this.form.get('selected')?.value;
    const descCtrl = this.form.get('rightDescriptionSimplified');
    const labelCtrl = this.form.get('rightTitleSimplified');
    if (checked) {
      descCtrl?.setValue(this.original_description);
      labelCtrl?.setValue(this.original_label)
    } else {
      descCtrl?.setValue(this.description);
      labelCtrl?.setValue(this.label);
    }
  }

  private handleDialogMode(): void {
    if (this.data?.viewMode) {
      this.isViewMode = true;
      this.header = 'View Rights';
      this.buttonName = 'Cancel';
    } else if (this.data?.editMode) {
      this.isViewMode = false;
      this.header = 'Edit Rights';
      this.buttonName = 'Update';
    } else {
      this.isViewMode = false;
      this.header = 'Add Rights';
      this.buttonName = 'Save';
    }
  }

  private async loadDialogData(): Promise<void> {
    if (!this.data?.elementData) return;
    const item = this.data.elementData;
    this.form.patchValue({
      provision: item.provision || '',
      rightTitleSimplified: item.rightTitleSimplified || '',
      original_label: item.original_label,
      rightDescriptionSimplified: item.rightDescriptionSimplified || '',
      showDescription: item.showDescription || false,
      original_description: item.original_description || item.rightDescriptionSimplified,
      selected: item.selected ?? false
    });
    const _rightFromDb = item?.id ? await this.regulationsService.getRightById(item.id) : null;
    this.original_description = _rightFromDb?.rightDescriptionSimplified ? _rightFromDb?.rightDescriptionSimplified : item.original_description;
    this.original_label = _rightFromDb?.rightTitleSimplified ? _rightFromDb.rightTitleSimplified : item.original_label;
    this.description = item.rightDescriptionSimplified;
    this.label = item.rightTitleSimplified;
    if (this.original_description === this.description && this.original_label === this.label) {
      this.form.get('selected')?.setValue(true);
    }
    if (item.icons && Array.isArray(item.icons) && item.icons.length > 0) {
      this.selectedIcon = item.icons[0];
    } else if (item.icon) {
      this.selectedIcon = Array.isArray(item.icon) ? item.icon[0] : item.icon;
    } else {
      this.selectedIcon = '';
    }
    this.form.patchValue({ icons: this.selectedIcon ? [this.selectedIcon] : [] });

    if (item.iconName) {
      this.selectedIconName = item.iconName;
    } else if (this.selectedIcon) {
      await this.loadIconsAndSetName();
    }

    if (this.isViewMode) {
      this.form.disable();
    }
  }

  private async loadIconsAndSetName(): Promise<void> {
    try {
      const response = await this.apiHelperService.getIcons();
      if (response?.icons) {
        this.icons = response.icons;
        const matchingIcon = this.icons.find(icon => icon.icon === this.selectedIcon);
        if (matchingIcon) {
          this.selectedIconName = matchingIcon.name;
        }
      }
    } catch (error) {
      console.error('Error loading icons:', error);
    }
  }

  get provisionTypeControl(): FormControl {
    return this.form.get('provision') as FormControl;
  }

  get labelControl(): FormControl {
    return this.form.get('rightTitleSimplified') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.form.get('rightDescriptionSimplified') as FormControl;
  }

  get showDescriptionControl(): FormControl {
    return this.form.get('showDescription') as FormControl;
  }

  get iconControl(): FormControl {
    return this.form.get('icon') as FormControl;
  }

  get displayProvisionType(): string {
    return this.provisionTypeControl?.value || '-';
  }

  get displayLabel(): string {
    return this.labelControl?.value || '-';
  }

  get displayDescription(): string {
    return this.descriptionControl?.value || '-';
  }

  get shouldShowDescription(): boolean {
    return this.showDescriptionControl?.value === true;
  }

  onEditMode(): void {
    this.isViewMode = false;
    this.data.editMode = true;
    this.header = 'Edit Rights';
    this.buttonName = 'Update';
    this.form.enable();
  }

  onCancel(): void {
    this.dialogRef.close();
    this.form.reset();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }
    this.isSubmitLoading = true;
    try {
      const formValue: RightsExerciseFormValue = this.form.getRawValue();
      const rightData: any = {
        provision: formValue.provision,
        rightTitleSimplified: formValue.rightTitleSimplified,
        rightDescriptionSimplified: formValue.rightDescriptionSimplified,
        showDescription: formValue.showDescription,
        selected: this.form.get('selected')?.value ?? false,
        original_description: this.original_description,
        original_label: this.original_label,
        icon: this.selectedIcon,
        iconName: this.toTitleCase(this.selectedIconName)
      };
      const isEdit = this.data?.elementData?.id;
      if (isEdit) {
        await this.regulationsService.updateRight(this.data.elementData.id, rightData);
      } else {
        const newRightData = {
          ...rightData,
          actId: this.data?.elementData?.actId || 0,
          displayName: formValue.rightTitleSimplified,
          rightTitle: formValue.rightTitleSimplified,
          rightDescription: formValue.rightDescriptionSimplified,
          displayInForm: true,
          metaJson: '',
          declarations: [],
          specificValidationsJson: '',
          rightsCategory: ''
        };
        await this.regulationsService.addRightItem(newRightData);
      }
      const response = {
        success: true,
        data: {
          ...rightData,
          id: this.data?.elementData?.id
        }
      };
      this.dialogRef.close(response);
    } catch (error) {
      console.error('Failed to save Rights:', error);
    } finally {
      this.isSubmitLoading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onAddIcon(event: MouseEvent): void {
    const buttonElement = event.currentTarget as HTMLElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(buttonElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -8
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8
        }
      ]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
    const portal = new ComponentPortal(
      IconPickerMenuComponent,
      this.viewContainerRef
    );
    const componentRef = this.overlayRef.attach(portal);
    componentRef.instance.selectedIcons = this.selectedIcon ? [this.selectedIcon] : [];
    componentRef.instance.iconSelected.subscribe((icons: string[]) => {
      this.selectedIcon = icons[0] || '';
      this.form.patchValue({ icons: icons });
      this.closeIconPicker();
    });
    componentRef.instance.iconWithNameSelected.subscribe((data: { icon: string; name: string }) => {
      this.selectedIcon = data.icon;
      this.selectedIconName = data.name;
      this.form.patchValue({ icons: [data.icon] });
      this.closeIconPicker();
    });
    componentRef.instance.closeMenu.subscribe(() => {
      this.closeIconPicker();
    });
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeIconPicker();
    });
  }

  private closeIconPicker(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  onRemoveIcon(): void {
    this.selectedIcon = '';
    this.selectedIconName = '';
    this.form.patchValue({ icons: [] });
  }

  toTitleCase(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get hasIcons(): boolean {
    return !!this.selectedIcon;
  }

  getMaterialIcon(friendlyName: string): string {
    return ICON_MAPPING[friendlyName] || friendlyName;
  }

  ngOnDestroy(): void {
    this.closeIconPicker();
  }

  get descriptionlength() {
    return this.descriptionControl?.value?.length
  }
}
