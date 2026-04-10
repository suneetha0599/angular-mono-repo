import { Location, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { FormConfigurationService } from '@admin-core/services/form-configuration.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { RequestFormViewType } from '@admin-page/request-management/constant';
import { DsrFormComponent } from '@admin-page/request-management/dsr-form/dsr-form.component';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { Subscription } from 'rxjs';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { FORM_CONFIGURATION_DRAFT_KEY } from '@admin-core/constants/constants';
import { ConfigService } from '@admin-core/services/config.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dsr-form-preview',
  imports: [DsrFormComponent, MatIconModule, MatDivider, LoadingButtonComponent, MatButtonModule, NgTemplateOutlet],
  templateUrl: './dsr-form-preview.component.html',
  styleUrl: './dsr-form-preview.component.scss'
})
export class DsrFormPreviewComponent {

  formConfiguration: FormConfigurationData = new FormConfigurationData();
  pageTitle: string = 'Form Configuration';
  RequestFormViewType = RequestFormViewType;
  formIsPublished: boolean = false;
  formIsUpdated: boolean = false;
  private formPublishedSubscription!: Subscription;
  private formUpdatedSubscription!: Subscription;
  dsrFormLink: string = environment.dsrFormDomainUrl;
  isLoading: boolean = false;
  draftLoading = false
  actionLoading: boolean = true;
  isDraftDetails: boolean = false;
  isFinalSaved: boolean = false;

  private formConfigurationService = inject(FormConfigurationService);
  private location = inject(Location);
  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private configService = inject(ConfigService);

  constructor(private router: Router) {
    this.formPublishedSubscription = this.formConfigurationService.formIsPublished$.subscribe(value => {
      this.formIsPublished = value ? true : false;
    });
    this.formUpdatedSubscription = this.formConfigurationService.formIsUpdated$.subscribe(value => {
      this.formIsUpdated = value ? true : false;
    });
  }

  ngOnInit(): void {
    this.onInitPage();
  }

  ngOnDestroy(): void {
    this.formPublishedSubscription?.unsubscribe();
    this.formUpdatedSubscription?.unsubscribe();
  }

  async onInitPage() {
    const formConfiguration: any = await this.formConfigurationService.prepareFormPreviewConfigurationData();
    this.formConfiguration = new FormConfigurationData(formConfiguration);
    this.isDraftDetails = this.formConfiguration.isDraft
    this.setFormIsPublished()
  }

  goBack() {
    this.location.back();
  }

  get title() {
    return this.formConfiguration.displaySettings.formInformation.title
  }

  get subTitle() {
    return this.formConfiguration.displaySettings.formInformation.subTitle
  }

  onPublishForm() {
    this.isLoading = true;
    const body = this.formConfigurationService.preparePublishForm();

    this.configApiHelperService.publishChanges(body)
      .subscribe({
        next: async (res) => {
          await this.formConfigurationService.clearConfigurationData();
          this.formConfigurationService.formIsPublished();
          if (this.isDraftDetails) {
            await this.dataInventoryApiHelperService.deleteDraftRequest(FORM_CONFIGURATION_DRAFT_KEY);
            this.isDraftDetails = false;
            this.formConfigurationService.clearDraftDetails();
          }
          this.clearFormState();
          this.isLoading = false;
          this.isFinalSaved = true;
        },
        error: (e: Error) => {
          this.isLoading = false;
        },
      });
  }

  onDraft() {
    this.draftLoading = true;

    const body = {
      key: FORM_CONFIGURATION_DRAFT_KEY,
      formData: this.formConfigurationService.preparePublishForm(true)
    };

    this.dataInventoryApiHelperService.saveBpaDrafts(body)
      .subscribe({
        next: (res) => {
          this.goBack();
          this.formConfigurationService.removeFormConfiguration()
          this.clearFormState();
          this.draftLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.draftLoading = false;
        }
      });
  }


  onCopy() {
    navigator.clipboard.writeText(this.dsrFormLink).then(() => {
      this.snackbarService.openSnack("Link copied");
    }).catch(err => {
      console.error('Link copy failed:', err);
    });
  }

  clearFormState() {
    this.formConfigurationService.updateFormState(false);
  }

  async setFormIsPublished() {
    const configurationData = await this.configService.getDsrConfiguration();
    this.formIsPublished = configurationData.displaySettings.isPublished;
    this.actionLoading = false
  }

  get showPublishSection() {
    return this.formIsPublished && ((!this.formIsUpdated) && (!this.isDraftDetails))
  }

  get publishBtnLabel() {
    return this.formIsPublished ? `Update changes` : `Publish form`;
  }
}
