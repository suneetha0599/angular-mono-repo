import { Component, OnInit, inject, Input } from '@angular/core';
import { FeatureService } from '../@admin-coreservices/feature.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatListItem, MatNavList } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';
import { Feature } from '../@admin-coremodels/Feature';
import { FooterComponenetComponent } from "../../footer-component/footer-componenet.component";
import { FormConfigurationService } from '@admin-core/services/form-configuration.service';
import { ASSESSMENTS, ASSET, BPA, COLLECTION_POINT, FORM_CONFIGURATION_ROUTE_CODE, REQUEST_MANAGEMENT, TASK_MANAGEMENT, TEMPLATES, VENDORS } from '@admin-core/constants/constants';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { TaskManagementService } from '@admin-core/services/task-management/task-management.service';
import { AssetService } from '@admin-core/services/asset/asset.service';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { CollectionPointService } from '@admin-core/services/collection-point/collection-point.service';
import { VendorService } from '@admin-core/services/vendor/vendor.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { TemplateService } from '@admin-core/services/template/template.service';
import { TemplatePreviewStateService } from @admin - page / assessments / templates / template - preview - state.service';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    RouterOutlet, MatSidenavContainer, MatSidenav, MatSidenavContent, MatNavList, MatListItem, RouterLink, NgClass, MatIcon, MatTooltip,
    ProgressBarComponent, FooterComponenetComponent, MatTooltipModule,
  ],
  standalone: true
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  hoveredFeature: any | null = null;
  showSubMenuCard = false;
  isHoveringMain = false;
  isHoveringCard = false;
  submenuPosition = {
    top: '0px',
    left: '0px'
  };
  closeTimeout: any = null;

  // convenience getter
  get linkText() {
    return !this.collapsed;
  }

  private featureService = inject(FeatureService);
  private formConfigurationService = inject(FormConfigurationService);
  private requestManagementService = inject(RequestManagementService);
  private taskManagementService = inject(TaskManagementService);
  private assetService = inject(AssetService);
  private bpaService = inject(BpaService);
  private collectionPointService = inject(CollectionPointService);
  private vendorService = inject(VendorService);
  private assessmentService = inject(AssessmentService);
  private templateService = inject(TemplateService);
  private templatePreviewStateService = inject(TemplatePreviewStateService);



  featureList: any[] = [];
  private clearActions: Record<string, () => void> = {
    // [REQUEST_MANAGEMENT]: () => this.requestManagementService.clearRequestListingFilters(),
    // [TASK_MANAGEMENT]: () => this.taskManagementService.clearTaskFilters(),
    // [ASSET]: () => this.assetService.clearAssetListingFilters(),
    // [BPA]: () => this.bpaService.clearBpaListingFilters(),
    // [COLLECTION_POINT]: () => this.collectionPointService.clearCollectionPointFilter(),
    // [VENDORS]: () => this.vendorService.clearVendorFilters(),
    // [ASSESSMENTS]: () => this.assessmentService.clearRequestListingFilters(),
    [TEMPLATES]: () => {
      // this.templatePreviewStateService.updateFormState(false);
      // this.templateService.clearTemplateFilters(),
    },
    [FORM_CONFIGURATION_ROUTE_CODE]: () => {
      this.formConfigurationService.removeFormConfiguration();
      this.formConfigurationService.updateFormState(false);
    }
  };

  constructor(private router: Router) { }

  ngOnInit() {
    this.setFeatureList();
  }


  async setFeatureList() {
    this.featureList = await this.featureService.getFeatureList();
  }




  isActiveMainMenu(feature: any): boolean {
    if (this.router.url.startsWith(feature.featureRoute)) { return true; }
    return feature.subFeatureList?.some((subFeature: Feature) => this.router.url.startsWith(subFeature.featureRoute))
  }



  clearData(feature: Feature) {
    const action = this.clearActions[feature.featureCode];
    action?.();
  }



  onMainMenuClick(mainFeature: Feature, event?: MouseEvent): void {
    if (this.collapsed && mainFeature.subFeatureList?.length) {
      event?.stopPropagation();
      this.openSubMenu(mainFeature);
      return;
    }

    if (mainFeature.subFeatureList?.length) {
      this.featureList.forEach(f => {
        if (f !== mainFeature) f.isOpen = false;
      });
      mainFeature.isOpen = !mainFeature.isOpen;
    } else if (mainFeature.featureRoute) {
      this.router.navigate([mainFeature.featureRoute]);
    }
  }

  onHoverMainFeature(mainFeature: any) {
    if (this.collapsed && mainFeature.subFeatureList?.length) {
      this.hoveredFeature = mainFeature;
      this.showSubMenuCard = true;
    }
  }

  onLeaveMainFeature() {
    if (this.collapsed) {
      this.showSubMenuCard = false;
      this.hoveredFeature = null;
    }
  }

  onClickSubMenu(feature: Feature) {
    this.showSubMenuCard = false;
    this.hoveredFeature = null;
    this.clearData(feature);
  }


  tryCloseSubMenu() {
    if (!this.isHoveringMain && !this.isHoveringCard) {
      this.hoveredFeature = null;
    }
  }


  openSubMenu(feature: any, event?: MouseEvent) {
    if (!this.collapsed || !feature?.subFeatureList?.length) return;

    clearTimeout(this.closeTimeout);

    const target = event?.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      this.submenuPosition = {
        top: `${rect.top}px`,
        left: `${rect.right + 8}px`
      };
    }

    this.hoveredFeature = feature;
  }

  scheduleClose() {
    this.closeTimeout = setTimeout(() => {
      if (!this.isHoveringMain && !this.isHoveringCard) {
        this.hoveredFeature = null;
      }
    }, 150);
  }

  onSubFeatureClick(event: MouseEvent, sub: Feature) {
    event.preventDefault();
    event.stopPropagation();

    this.hoveredFeature = null;
    this.isHoveringCard = false;
    this.isHoveringMain = false;

    this.clearData(sub);
    this.router.navigate([sub.featureRoute]);
  }


}
