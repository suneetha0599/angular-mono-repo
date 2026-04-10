import { Component, inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { RequestFormViewType } from '../constant';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DsrFormComponent } from "../dsr-form/dsr-form.component";
import { FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { CreateRequestService } from '@admin-core/services/create-request/create-request.service';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-create-request',
  templateUrl: './create-request.component.html',
  imports: [ReactiveFormsModule, MatTooltipModule, MatFormFieldModule,
    MatInputModule, FormsModule, MatTooltipModule, DsrFormComponent],
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent {

  pageTitle: string = 'Create Request'
  RequestFormViewType = RequestFormViewType;

  @Input() formConfiguration: FormConfigurationData = new FormConfigurationData();
  private createRequestService = inject(CreateRequestService)
  private logger = inject(NGXLogger)
  async ngOnInit() {
    this.logger.info("Create Request Component Initialzied")
    this.onInitPage()
  }

  async onInitPage() {
    try {
      const formConfiguration: any = await this.createRequestService.prepareInitialFormConfiguration();
      this.formConfiguration = new FormConfigurationData(formConfiguration);
      this.logger.info("Form Configuration Loaded Successfully", this.formConfiguration);
    } catch (error) {
      this.logger.error("Failed to load form configuration", error);
    }
  }


}
