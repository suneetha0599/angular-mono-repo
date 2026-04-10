import { RegulationBpaComponent } from './../bpa/regulation-bpa/regulation-bpa.component';
import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { REGULATION_STAGES, CreateRegulationKey } from '@admin-page/data-discovery/bpa-listing/constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ConfigService } from '@admin-core/services/config.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { AssessmentConfigurationComponent } from '../assessment/assessment-configuration/assessment-configuration.component';
import { RegulationDssrComponent } from '../dssr/regulation-dssr/regulation-dssr.component';
import { LSK_REGULATION_LIST, LSK_REGULATON_NEXT_ID, LSK_REGULATION_PREV_ID } from '@admin-core/constants/local-storage-constants';
import { NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';

const LSK_REGULATION_DETAILS_PREFIX = "LSK_REGULATION_DETAILS_";

@Component({
  selector: 'app-regulation-details',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    RegulationDssrComponent,
    RegulationBpaComponent,
    AssessmentConfigurationComponent,
    LoadingButtonComponent,
    ErrorLoadingItemsComponent,
  ],
  templateUrl: './regulation-details.component.html',
  styleUrls: ['./regulation-details.component.scss']
})
export class RegulationDetailsComponent implements AfterViewInit {
  regulationId!: number;
  selectedTabIndex = 0;
  selectedTab: string = CreateRegulationKey.DSSR;
  CreateRegulationKey = CreateRegulationKey;

  tabHeaderDetails: Array<{ key: string; name: string; icon?: string }> = [];

  countriesList: Array<{ id: number; name: string }> = [];
  regulationDetails: any = null;

  regulationList: any[] = [];
  currentRegulationIndex: number = -1;

  prevRegulationId: number | null = null;
  nextRegulationId: number | null = null;

  showDssr = true;

  currentPath: string = '';

  private dialog = inject(MatDialog);
  private apiHelperService = inject(ApiHelperService);
  private configService = inject(ConfigService);
  private snackbarService = inject(SnackbarService);
  private regulationsService = inject(RegulationsService);
  private routerSubscription: any;

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        entityId: this.regulationId,
        audit_log_module: AUDIT_LOG_MODULE.CONFIGURATION,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.REGULATION
      }
    });
  }

  @ViewChild('bpaComponentRef') bpaComponentRef?: RegulationBpaComponent;
  hasApiError: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.regulationId = Number(this.route.snapshot.paramMap.get('id'));

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe((event: any) => {

        const nextUrl = event.url;

        if (!nextUrl.includes('/admin/configuration/regulation/details/')) {
          this.clearRegulationCache();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private clearRegulationCache() {
    localStorage.removeItem(LSK_REGULATION_LIST);
    localStorage.removeItem(LSK_REGULATION_PREV_ID);
    localStorage.removeItem(LSK_REGULATON_NEXT_ID);

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('LSK_REGULATION_DETAILS_')) {
        localStorage.removeItem(key);
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      this.regulationId = Number(params.get('id'));

      await this.getInitialConfiguration();
      await this.loadRegulationList();
      await this.loadRegulation(this.regulationId)
      this.setTabHeaders();
      this.handleQueryParams();
    });

    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  private handleQueryParams() {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'dssr') {
      this.selectedTabIndex = 0;
      this.selectedTab = CreateRegulationKey.DSSR;
    }
  }

  async loadRegulationList() {
    try {
      const cachedList = getItem(LSK_REGULATION_LIST);

      if (cachedList) {
        this.regulationList = cachedList;
      } else {
        const res = await this.regulationsService.getRegulationMasterList();

        if (res?.acts) {
          this.regulationList = res.acts.sort((a: any, b: any) => a.id - b.id);
          setItem(LSK_REGULATION_LIST, this.regulationList);
        }
      }

      this.currentRegulationIndex = this.regulationList.findIndex(
        (item: any) => item.id === this.regulationId
      );

      this.updatePrevNextIds();
    } catch (err) {
      console.error('Failed loading regulations list', err);
    }
  }

  ngAfterViewInit() {
  }

  async getInitialConfiguration() {
    try {
      // const res = await this.configService.getDsrConfiguration();
      // if (res?.countryList) {
      //   this.countriesList = res.countryList;
      // }
    } catch (err) {
      console.error('Error loading configuration', err);
      this.snackbarService.openSnack('Failed to load configuration');
    }
  }

  updatePrevNextIds() {
    this.prevRegulationId =
      this.currentRegulationIndex > 0
        ? this.regulationList[this.currentRegulationIndex - 1].id
        : null;

    this.nextRegulationId =
      this.currentRegulationIndex < this.regulationList.length - 1
        ? this.regulationList[this.currentRegulationIndex + 1].id
        : null;

    setItem(LSK_REGULATION_PREV_ID, this.prevRegulationId);
    setItem(LSK_REGULATON_NEXT_ID, this.nextRegulationId);
  }

  get disablePrevBtn(): boolean {
    return this.prevRegulationId === null;
  }

  get disableNextBtn(): boolean {
    return this.nextRegulationId === null;
  }

  async goToPrev() {
    if (!this.prevRegulationId) return;

    this.showDssr = false;

    this.router.navigate([`${this.currentPath}/${this.prevRegulationId}`]);

    this.regulationId = this.prevRegulationId;
    this.currentRegulationIndex--;

    await this.loadRegulation(this.regulationId)

    this.updatePrevNextIds();

    setTimeout(() => {
      this.showDssr = true;
    }, 0);
  }

  async goToNext() {
    if (!this.nextRegulationId) return;

    this.showDssr = false;

    this.router.navigate([`${this.currentPath}/${this.nextRegulationId}`]);
    this.regulationId = this.nextRegulationId;
    this.currentRegulationIndex++;

    await this.loadRegulation(this.regulationId)

    this.updatePrevNextIds();

    setTimeout(() => {
      this.showDssr = true;
    }, 0);
  }

  private mapCountryIdsToNames(regulation: any) {
    const mappedCountries = this.countriesList
      .filter(c => regulation.countryIds?.includes(c.id))
      .map(c => c.name);

    return {
      ...regulation,
      countries: mappedCountries
    };
  }

  private setTabHeaders() {
    this.tabHeaderDetails = REGULATION_STAGES;

  }

  goToNextTab() {
    const nextIndex = this.selectedTabIndex + 1;
    if (nextIndex < this.tabHeaderDetails.length) {
      this.selectedTabIndex = nextIndex;
      this.selectedTab = this.tabHeaderDetails[nextIndex].key;
    }
  }

  onTabChange(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
  }

  async loadRegulation(id: number) {
    this.hasApiError = false;
    try {
      const key = `${LSK_REGULATION_DETAILS_PREFIX}${id}`;
      let details: any = null;

      const cached = getItem(key);
      if (cached) {
        details = cached;
      }

      if (!details) {
        details = this.regulationList.find(r => r.id === id);
      }

      if (!details) {
        const apiRes = await this.regulationsService.getRegulationById(id);

        details = apiRes;
      }

      this.regulationDetails = this.mapCountryIdsToNames(details);

    } catch (err) {
      this.snackbarService.openSnack("Failed to load regulation details");
      this.hasApiError = true;
    }
  }

}
