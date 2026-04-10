import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { OverviewDpiaComponent } from '../overview-dpia/overview-dpia.component';
import { TriggersDpiaComponent } from '../triggers-dpia/triggers-dpia.component';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { FormArray, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { buildAssessmentForm, buildAssessmentPayloadForDraft, buildAssessmentPayloadForEdit, buildAssessmentsPayload, buildEditAssessmentsPayload, patchAssessmentForm, patchAssessmentFormForEdit } from '../assessment-utils';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSESSMENT_MANUAL_DRAFT_KEY, GLOBAL_DIALOG_DEFAULTS, MANUAL_VENDOR_ASSESSMENT_REQUEST } from '@admin-core/constants/constants';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { AssessemntSource, ASSESSMENT_MODE, OVERVIEW, RISK, ROLE } from '../constants';
import { v1 as uuidv1 } from 'uuid';
import { AuthService } from '@admin-core/services/auth.service';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { AssessmentWarningDialogComponent } from '../assessment-warning-dialog/assessment-warning-dialog.component';
import { AssessmentBpaDetails } from '@admin-core/models/assessment/assessment';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { PreviewTemplateComponent } from '../../templates/preview-template/preview-template.component';

const { USER, DATA_DISCOVERY, BPA, BPA_CREATE, ASSESSMENT_QUESTIONS_LIST, CREATE_ASSETS, CONSENT_ASSETS, VENDORS, VENDOR, ASSESSMENT, CREATE_VENDOR_RECORD } = routeConstants

@Component({
  selector: 'app-create-dpia-assessment',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatExpansionModule,
    OverviewDpiaComponent,
    TriggersDpiaComponent,
    LoadingButtonComponent,
    PreviewTemplateComponent
  ],
  templateUrl: './create-dpia-assessment.component.html',
  styleUrl: './create-dpia-assessment.component.scss',
  providers: [AssessmentService]
})
export class CreateDpiaAssessmentComponent {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild('panel1') panel1!: MatExpansionPanel;
  @ViewChild('panel2') panel2!: MatExpansionPanel;
  @ViewChild('panel4') panel4!: MatExpansionPanel;

  isSubmitLoading: boolean = false;
  isDraftLoading: boolean = false;
  templateIdFromOverview: any;
  dataUpdated = ''
  assessmentId: number = 0;
  manualDraftAssessmentId: string = ''
  tabHeaderDetails: any[] = [
    { id: 1, name: 'Overview' },
    { id: 2, name: 'Triggers' },
    { id: 3, name: 'Questionnaire' },
    // { id: 4, name: 'Rules' }
  ];
  createAssessmentForm!: FormGroup;
  assessmentDetails: any;
  AssessemntSource = AssessemntSource
  assessmentSource: string = AssessemntSource.GENERAL
  assessmentRouteSource: string = ''
  bpaId: number = 0;
  formUpdated: string = '';
  formIsUpdated: boolean = false;
  bpaDetails!: AssessmentBpaDetails;
  mode: string = ASSESSMENT_MODE.VIEW;
  private initialFormValue: any;
  private createAssessmentFormSubscription!: Subscription;
  private location = inject(Location);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private authService = inject(AuthService);
  private assessmentService = inject(AssessmentService);
  questionsUpdated = false;

  panelState = {
    panel1: false,
    panel2: false,
    panel3: false,
    panel4: false
  };

  selected: 'basic' | 'questions' = 'basic';
  OVERVIEW = OVERVIEW;
  RISK = RISK;
  ROLE = ROLE;
  currentPath: string = '';
  isFinalSaved: boolean = false;

  constructor(private fb: FormBuilder, private httpService: HttpService, private router: Router, private snackbarService: SnackbarService, private dialog: MatDialog, private route: ActivatedRoute,) { }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.formIsUpdated && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): boolean {
    if (this.formIsUpdated) {
      return false;
    }
    return true;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const assessmentId = params['assessmentId'];
      const source = params['source'];
      const bpaId = params['bpaId'];
      const mode = params['mode'];
      this.mode = mode;

      const manualDraftAssessmentId = params['manualDraftAssessmentId'];
      this.assessmentId = +(assessmentId || 0);
      this.manualDraftAssessmentId = manualDraftAssessmentId;
      this.bpaId = +(bpaId || 0);
      this.assessmentRouteSource = source;

      if (this.router.url.includes(routeConstants.VENDORS)) {
        this.assessmentSource = AssessemntSource.VENDOR;
      }
    });
    this.onInitPage();
  }

  ngOnDestroy() {
    this.createAssessmentFormSubscription?.unsubscribe();
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.assessmentService.clearAssessmentCreationData();
    this.createAssessmentForm = buildAssessmentForm(this.fb);
    this.removeTriggerRelatedValidations();
    if (this.mode === ASSESSMENT_MODE.EDIT && this.assessmentId) {
      this.getAssessmentDetails();
      return;
    }
    if (this.manualDraftAssessmentId) {
      this.getManualDraftRequestDetails()
      return
    }
    if (this.assessmentId) {
      this.getAssessmentDetails();
      return
    }
    this.initFormSubscription();
    this.setBPARouteDetails()
    this.setBpaDetails();
    this.formUpdated = uuidv1()
  }

  initFormSubscription() {
    this.createAssessmentFormSubscription = this.createAssessmentForm.valueChanges.subscribe(val => {
      if (val && this.createAssessmentForm.dirty && !this.formIsUpdated) {
        this.formIsUpdated = true;
      }
    });
  }

  resetFormState() {
    this.initialFormValue = this.createAssessmentForm.getRawValue();
    this.formIsUpdated = false;
  }

  onQuestionsUpdated() {
    this.questionsUpdated = true;
  }


  async getManualDraftRequestDetails() {
    if (!this.manualDraftAssessmentId) {
      return
    }
    const data = await this.assessmentApiHelperService.getManualDraftDetails(this.manualDraftAssessmentId);
    if (data) {
      this.assessmentDetails = data.formData;
      // this.patchDraftRequestForm();
      patchAssessmentForm(this.fb, this.createAssessmentForm, this.assessmentDetails);
      this.dataUpdated = uuidv1();
      this.onPostPatchForm();
    }
  }

  async getAssessmentDetails() {
    if (!this.assessmentId) {
      return
    }

    const data = await this.assessmentApiHelperService.getAssessmentDetail(this.assessmentId);
    if (data) {
      this.assessmentDetails = data;
      if (this.mode == ASSESSMENT_MODE.EDIT) {
        const assessmentData = await this.assessmentService.prepareAssessmentDetail(this.assessmentDetails);
        patchAssessmentFormForEdit(this.fb, this.createAssessmentForm, assessmentData);
        this.dataUpdated = uuidv1();
        this.onPostPatchForm();
        return
      }
      patchAssessmentForm(this.fb, this.createAssessmentForm, this.assessmentDetails);
      this.onPostPatchForm();
    }
  }

  onPostPatchForm() {
    this.initFormSubscription();
  }
  // async patchDraftRequestForm() {
  //   this.createAssessmentForm.patchValue(this.assessmentDetails);
  // }

  // async patchRequestForm() {
  //   this.overviewForm.patchValue(this.assessmentDetails?.assessment);
  //   this.triggerForm.patchValue(this.assessmentDetails?.trigger)
  //   this.createAssessmentForm.patchValue(this.assessmentDetails?.templateDetails?.sections);
  // }

  initialSections: any[] = [];

  async getTemplateIdFromOverview(templateId: any) {
    this.templateIdFromOverview = templateId;
    if (templateId) {
      // const templateDetails = await this.assessmentApiHelperService.getTemplateDetails(templateId);

      // if (templateDetails) {
      //   this.initialSections = JSON.parse(JSON.stringify(templateDetails.sections)); // deep clone
      //   patchAssessmentForm(this.fb, this.createAssessmentForm, { assessments: templateDetails.sections });
      // }
    }
  }

  onCancel() {
    this.resetFormState();
    this.goBack();
  }

  hasNewSectionsOrQuestions(): boolean {
    const formSections = this.createAssessmentForm.get('assessments')?.value || [];
    const originalSections = this.initialSections;

    if (formSections.length > originalSections.length) return true;

    for (let i = 0; i < formSections.length; i++) {
      const formQuestions = formSections[i]?.questions || [];
      const originalQuestions = originalSections[i]?.questions || [];

      if (formQuestions.length > originalQuestions.length) {
        return true;
      }
    }
    return false;
  }

  async onSave(): Promise<void> {
    if (this.createAssessmentForm.invalid) {
      this.createAssessmentForm.markAllAsTouched();
      if (this.overviewForm.invalid) {
        if (this.overviewForm.get('type')?.invalid || this.overviewForm.get('title')?.invalid || this.overviewForm.get('template')?.invalid) {
          this.panel1?.open();
        }
        if (this.overviewForm.get('respondent')?.invalid || this.overviewForm.get('author')?.invalid || this.overviewForm.get('approver1')?.invalid) {
          this.panel4?.open();
        }
      }

      if (this.triggerForm.invalid) {
        this.panel2?.open();
      }

      this.snackbarService.openSnack('Please fill the required details!');
      return;
    }

    // const selectedTriggerList = this.triggerList?.filter((t: { selected: any; }) => t.selected) ?? [];
    // if (selectedTriggerList.length === 0) {
    //   this.panel2.open();
    //   this.snackbarService.openSnack('At least one trigger is required!');
    //   return;
    // }

    const user = this.authService.getUserInfo();
    const currentUser = { userId: user?.applicationUserId ?? 0, userType: user?.userType ?? '' };
    const isVendor = this.assessmentSource === AssessemntSource.VENDOR;

    let payload: any = this.mode === ASSESSMENT_MODE.EDIT
      ? buildEditAssessmentsPayload(this.assessmentDetails, this.createAssessmentForm.getRawValue(), currentUser, this.assessmentId, this.assessmentService, isVendor)
      : buildAssessmentsPayload(this.createAssessmentForm.getRawValue(), currentUser, this.assessmentId, isVendor);

    if (payload.commands.length === 0) {
      this.snackbarService.openSnack('No changes to update');
      return;
    }

    this.isSubmitLoading = true;

    try {
      if (this.mode === ASSESSMENT_MODE.EDIT) {
        const res = isVendor
          ? await this.assessmentApiHelperService.updateVendorAssessmentDetails(this.assessmentId, payload)
          : await this.assessmentApiHelperService.updateAssessmentDetails(this.assessmentId, payload);
        if (res) {
          await this.deleteManualDraftRequests();
          this.resetFormState();
          this.goBack();
          this.isFinalSaved = true;

        }

        return;

      } else {
        let result: any = false;

        if (this.questionsUpdated) {
          this.isSubmitLoading = false;
          const dialogRef = this.dialog.open(AssessmentWarningDialogComponent, {
            ...GLOBAL_DIALOG_DEFAULTS,
            disableClose: true,
            panelClass: 'dialog-wrapper',
            width: '26%',
            maxHeight: '70vh',
            autoFocus: false,
            data: {
              payload,
              currentUser,
              mode: this.mode,
              assessmentId: this.assessmentId,
              isVendorContext: this.isVendorContext
            }
          });

          result = await firstValueFrom(dialogRef.afterClosed());

        } else {
          const response = isVendor
            ? await this.assessmentApiHelperService.createVendorAssessment(payload)
            : await this.assessmentApiHelperService.createAssessment(payload);
          result = !!response;
        }

        if (result === true) {
          await this.deleteManualDraftRequests();
          this.resetFormState();
          this.isFinalSaved = true;
          this.goBack();
        }
      }

    } catch (err) {
      this.isFinalSaved = false;
      console.error(err);
      // this.snackbarService.openSnack('Something went wrong!');

    } finally {
      this.isSubmitLoading = false;
    }
  }



  onSaveAsDraft(): void {

    if (!this.assessmentDetails?.createdBy && this.assessmentDetails) {
      const userData = this.authService.getUserInfo();
      if (!this.assessmentDetails) {
        this.assessmentDetails = {} as any;
      }
      this.assessmentDetails.createdBy = userData?.applicationUserId ?? 0;
    }
    const formData = buildAssessmentPayloadForDraft(this.createAssessmentForm.getRawValue(), this.assessmentDetails);
    const draftKey = this.isVendorContext ? MANUAL_VENDOR_ASSESSMENT_REQUEST : ASSESSMENT_MANUAL_DRAFT_KEY;
    const body = this.manualDraftAssessmentId ?
      { "formData": formData } :
      { "key": draftKey, "formData": formData }

    this.isDraftLoading = true;
    this.assessmentApiHelperService.saveManualDraft(body, (this.manualDraftAssessmentId ?? ''))
      .subscribe({
        next: async () => {
          this.resetFormState();
          this.goBack();
          this.isDraftLoading = false;
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isDraftLoading = false;
        },
      });
  }

  goBack(): void {
    this.formIsUpdated = false;
    this.router.navigate([`${this.currentPath}/${ASSESSMENT_QUESTIONS_LIST}`]);
  }

  get overviewForm() {
    return this.createAssessmentForm?.get('overview') as FormGroup
  }

  get bpa() {
    return this.overviewForm?.get('bpa') as FormGroup
  }

  get template() {
    return this.overviewForm?.get('template') as FormGroup
  }

  get triggerForm() {
    return this.createAssessmentForm?.get('trigger') as FormGroup
  }

  get triggerListFormArray() {
    return this.triggerForm?.get('triggerList') as FormArray
  }

  get triggerList() {
    return (this.triggerListFormArray?.value ?? []);
  }

  get questionsForm() {
    return this.createAssessmentForm?.get('assessments') as FormArray
  }

  async deleteManualDraftRequests() {
    if (this.manualDraftAssessmentId) {
      await this.deleteManualDraftRequest();
      return
    }
  }

  async deleteManualDraftRequest() {
    try {
      const response = await this.assessmentApiHelperService.deleteManualDraftRequest(this.manualDraftAssessmentId);
    } catch (error) {
      console.error('Error:', error);
    }
  }



  onCreateBpa(event: any) {
    this.assessmentService.setRouteDetails(true);
    if (event) {
      this.formIsUpdated = false;
      this.router.navigate([`${USER}/${DATA_DISCOVERY}/${BPA}/${BPA_CREATE}`]);
    }
  }


  onCreateVendor(event: any) {
    this.assessmentService.setRouteDetails(true);
    if (event) {
      this.formIsUpdated = false
      this.router.navigate([`${USER}/${VENDORS}/${VENDOR}/${CREATE_VENDOR_RECORD}`], { queryParams: { mode: 'add' } })
    }
  }

  onCreateAsset(event: any) {
    this.assessmentService.setRouteDetails(true);
    if (event) {
      this.formIsUpdated = false;
      this.router.navigate([`${USER}/${DATA_DISCOVERY}/${CONSENT_ASSETS}/${CREATE_ASSETS}`]);
    }
  }

  setBPARouteDetails() {
    this.assessmentService.clearRouteDetails();
    const bpaDetails = this.assessmentService.getBPADetails();
    this.assessmentService.clearBPADetails()
    this.patchBpaDetails(bpaDetails)
  }

  async setBpaDetails() {
    if (!this.bpaId) {
      return
    }
    this.assessmentService.clearRouteDetails();
    const res = await this.getBpaDetails(this.bpaId, true);
    this.patchBpaDetails(this.bpaDetails)
  }

  patchBpaDetails(bpaDetails: any) {
    if (bpaDetails) {
      this.bpaDetails = { ...bpaDetails };
      const bpa = (bpaDetails?.bpa ?? bpaDetails?.vendor ?? bpaDetails?.asset ?? '');
      this.bpa.patchValue(bpa);
      if (this.bpaDetails?.disabled) {
        this.bpa.disable();
      }
    }
  }

  async onChangeBpa(event: any) {
    const bpaId = event?.bpaId ?? 0;
    this.getBpaDetails(bpaId);
  }

  async getBpaDetails(bpaId: number, disabled: boolean = false) {
    if (bpaId) {
      const data = await this.assessmentApiHelperService.getAssessmentBpaDetails(bpaId);
      if (data) {
        const detail = await this.assessmentService.prepareAssessmentBpaDetails(data)
        this.bpaDetails = { ...detail, disabled: disabled };
      }
    }
  }

  get isEditMode() {
    return this.mode === 'EDIT'
  }

  clearDataUpdated(event: any) {
    if (event) {
      const type = event.type;
      setTimeout(() => {
        if (type == 1) {
          this.formUpdated = ''
        }
        else {
          this.dataUpdated = '';
        }
      });
    }
  }

  removeTriggerRelatedValidations() {
    if (this.assessmentSource == AssessemntSource.VENDOR) {
      const reasonControl = this.triggerForm?.get('reason');
      if (reasonControl) {
        reasonControl.setValidators(null);
        reasonControl.clearValidators();
        reasonControl.updateValueAndValidity();
      }
    }
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

}
