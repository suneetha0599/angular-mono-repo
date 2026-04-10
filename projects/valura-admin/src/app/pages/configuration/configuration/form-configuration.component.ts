import { Component, ViewChild } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { ConfigKey, CONFIG_STAGES } from './constants';
import { DisplaySettingComponent } from './display-setting/display-setting.component';
import { DisplayTextComponent } from './display-text/display-text.component';
import { FormElementsComponent } from './form-elements/form-elements.component';
import { inject } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { FormConfiguration, FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { FormConfigurationService } from '@admin-core/services/form-configuration.service';
import { Router } from '@angular/router';
import { buildFormConfigurationForm } from './form-configuration-util';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { CanComponentDeactivate } from '@admin-core/guards/unsaved-change.guard';
import { v1 as uuidv1 } from 'uuid';
import { MatDialog } from '@angular/material/dialog';

import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { FormPreviewDialogComponent } from '@admin-page/request-management/request-management-dialog/form-preview-dialog/form-preview-dialog.component';

@Component({
  selector: 'app-form-configuration',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatMenuModule,
    DisplaySettingComponent,
    DisplayTextComponent,
    FormElementsComponent,
    LoadingButtonComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './form-configuration.component.html',
  styleUrl: './form-configuration.component.scss',
})
export class FormConfigurationComponent implements CanComponentDeactivate {
  pageTitle = 'Form Configuration';
  selectedTabIndex = 0;
  tabHeaderDetails = CONFIG_STAGES;
  ConfigTabKey = ConfigKey;
  mainConfiguration: FormConfiguration = new FormConfiguration();
  loading: boolean = false;
  formConfiguration: FormConfigurationData = new FormConfigurationData();
  thirdPartyRoles: any[] = [];
  requesterInfo: any[] = [];
  previewLoading: boolean = false;
  currentPath: string = '';
  configurationForm!: FormGroup;
  formPatched: boolean = false;
  skipUnsavedCheck = false;
  formUpdated: boolean = false;
  dataUpdated: string = ''
  private formUpdatedSubscription!: Subscription;
  private pendingTabIndex: number | null = null;


  @ViewChild(DisplayTextComponent) displayTextComponent!: DisplayTextComponent;
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  private formConfigurationService = inject(FormConfigurationService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  hasApiError: boolean = false;

  constructor(private router: Router, private fb: FormBuilder, private dialog: MatDialog) {
    this.formUpdatedSubscription = this.formConfigurationService.formIsUpdated$.subscribe(value => {
      if (value && !this.formUpdated) {
        this.formUpdated = true;
      }
    });
  }

  ViewStepperDialog() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        auditLogs: AUDIT_LOG_ENTITY_TYPE.FORM_CONFIGURATION,
        audit_log_module: AUDIT_LOG_MODULE.CONFIGURATION
      }
    })
  }

  ngOnInit(): void {
    this.onInitPage();
  }

  ngOnDestroy(): void {
    this.formUpdatedSubscription?.unsubscribe();
  }

  async onInitPage() {
    this.configurationForm = buildFormConfigurationForm(this.fb);
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    await this.getInitialConfiguration();
  }

  canDeactivate(): boolean {
    if (this.skipUnsavedCheck) {
      return true
    }
    if (this.formUpdated || this.configurationForm.dirty) {
      return false;
    }
    // Always check displayTextComponent for unsaved changes regardless of current tab
    if (this.displayTextComponent && !this.displayTextComponent.canDeactivate()) {
      return false;
    }
    return true
  }

  onFormUpdated(updated: boolean) {
    this.formUpdated = updated
  }

  get displayForm() {
    return this.configurationForm.get('displayForm') as FormGroup;
  }

  async getInitialConfiguration() {
    this.formConfigurationService.formIsLoading$.next(true);
    const formConfiguration = this.formConfigurationService.getFormConfigurationData();
    if (formConfiguration) {
      this.onPostInitConfiguration(formConfiguration);
      return
    }
    this.hasApiError = false;
    let res;
    try {
      res = await this.formConfigurationService.prepareInitialFormConfiguration();
      const { _mainConfiguration, _formConfiguration } = res
      if (!res) {
        this.hasApiError = true;
        return
      }
      this.mainConfiguration = _mainConfiguration;
      this.onPostInitConfiguration(_formConfiguration);
    }
    catch (error) {
      this.formConfigurationService.formIsLoading$.next(false);
      console.error('Failed to load configuration', error);
      this.hasApiError = true
    }
  }

  onPostInitConfiguration(formConfiguration: any) {
    this.formConfiguration = formConfiguration;
    this.loading = true;
    this.dataUpdated = uuidv1();
    this.formConfigurationService.formIsLoading$.next(false);
  }

  async onTabChange(index: number): Promise<void> {
    // Store the pending tab index for later use
    this.pendingTabIndex = index;

    // Check if we're leaving the Privacy Centre tab (tab 2) with unsaved changes
    const leavingPrivacyCentreWithChanges = this.selectedTabIndex === 2 &&
      index !== 2 &&
      this.displayTextComponent &&
      this.displayTextComponent.hasFormChanged;

    if (leavingPrivacyCentreWithChanges) {
      // Immediately reset the tab group to prevent the view from being destroyed
      if (this.tabGroup) {
        this.tabGroup.selectedIndex = this.selectedTabIndex;
      }

      try {
        const result = await firstValueFrom(
          this.confirmationDialogService.showDialog(
            'Alert',
            'You have unsaved changes that will be lost. Are you sure you want to leave this tab?',
            'Yes',
            'No',
            '420px',
          )
        );

        if (result) {
          // User confirmed - proceed with tab change
          this.displayTextComponent.hasFormChanged = false;
          this.selectedTabIndex = index;
          // Update the tab group to show the new tab
          if (this.tabGroup) {
            this.tabGroup.selectedIndex = index;
          }
          this.pendingTabIndex = null;
        } else {
          // User cancelled - stay on the current tab (already reset above)
          this.pendingTabIndex = null;
        }
      } catch (error) {
        console.error('Error showing confirmation dialog:', error);
        this.pendingTabIndex = null;
      }
    } else {
      // No unsaved changes, proceed with tab change
      this.selectedTabIndex = index;
      this.pendingTabIndex = null;
    }
  }

  async onRevert() {
    await this.getInitialConfiguration();
  }

  onPreview(): void {
    this.skipUnsavedCheck = true
    const _formConfiguration = this.formConfiguration;
    const _displaySetting = this.displayForm.value;

    if (this.formPatched) {
      _formConfiguration.displaySettings = {
        logoUrl: _displaySetting.formLogoUrl || '',
        copyright: _displaySetting.copyright || '',
        primaryColor: _displaySetting.primaryColor || '',
        secondaryColor: _displaySetting.secondaryColor || '',
        formInformation: {
          title: _displaySetting.formTitle || '',
          subTitle: _displaySetting.subTitle || ''
        },
        isPublished: (_displaySetting?.isPublished ?? false),
      };
    }
    this.previewLoading = true;
    this.formConfigurationService.updateFormState(this.formUpdated)
    this.formConfigurationService.onPreview(_formConfiguration, this.currentPath)
  }

  get showDisplaySettingTab(): boolean {
    return this.selectedTabIndex !== 2;
  }

  onPatchForm(updated: boolean = false) {
    if (updated) {
      this.formPatched = true
    }
  }

  clearDataUpdated(event: any) {
    if (event) {
      this.dataUpdated = '';
    }
  }

  onUndoDisplayText(): void {
    if (this.displayTextComponent) {
      this.displayTextComponent.undo();
    }
  }

  onPreviewDisplayText(): void {
    this.skipUnsavedCheck = true;
    this.dialog.open(FormPreviewDialogComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'dialog-wrapper',
      autoFocus: false,
    });
  }
}
