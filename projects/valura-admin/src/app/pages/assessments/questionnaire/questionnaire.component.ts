import { CommonModule } from '@angular/common';
import { Component, inject, Input, ViewChildren, ViewChild, QueryList, ElementRef, AfterViewInit, Output, EventEmitter, SimpleChanges, HostListener } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { v1 as uuidv1 } from 'uuid';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { MatTableModule } from '@angular/material/table';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { buildTemplateForm, prepareQuestionPayload, stripHtml } from '../templates/template-utils';
import { TYPES } from '@admin-core/constants/constants';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { firstValueFrom } from 'rxjs';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
import { buildAssessmentForm, patchQuestionnaire } from '../assessments/assessment-utils';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CustomMatErrorComponent } from "@valura-lib/components//custom-mat-error/custom-mat-error.component";
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { SectionDetailsDrawerComponent } from '../templates/section-details-drawer/section-details-drawer.component';
import { CustomEditorComponent } from '@valura-lib/components//custom-editor/custom-editor.component';
import { TriggerDrawerComponent } from "../templates/trigger-drawer/trigger-drawer.component";
import { QUESTIONNAIRE_ATTACHMENT } from '@admin-core/constants/constants';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { MatBadgeModule } from '@angular/material/badge';
import { TemplatePreviewStateService } from '../templates/template-preview-state.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { AssessemntSource } from '../assessments/constants';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

@Component({
  selector: 'app-questionnaire',
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
        animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ height: '0px', opacity: 0 }))
      ])
    ])
  ],
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatMenuModule,
    DragDropModule,
    MatTableModule,
    MatTooltipModule,
    CustomMatErrorComponent,
    SectionDetailsDrawerComponent,
    CustomEditorComponent,
    MatDrawerContainer,
    MatDrawer,
    TriggerDrawerComponent,
    SafeHtmlPipe,
    MatBadgeModule,
    EllipsisTooltipDirective
  ],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent {
  @Input() templateId!: number;
  @Input() assessmentsFormArray!: FormArray;
  @Input() isEditMode: boolean = true;
  @Input() isViewMode: boolean = false;
  @Input() mode: string = 'CREATE';
  @Input() assessmentSource: string = AssessemntSource.GENERAL

  @Output() questionsChanged = new EventEmitter<boolean>();
  @ViewChildren('questionCard') questionCards!: QueryList<ElementRef>;
  @ViewChild('questionsContainer') questionsContainer!: ElementRef;
  @ViewChild('rightDrawer') rightDrawer!: MatDrawer;
  @ViewChild('templateTriggerDrawer') templateTriggerDrawer!: MatDrawer;

  CREATE: string = 'CREATE';
  EDIT: string = 'EDIT';
  TEXT: string = 'TEXT';
  TEXTAREA: string = 'TEXTAREA';
  SINGLE_SELECT: string = 'SINGLE_SELECT';
  MULTI_SELECT: string = 'MULTI_SELECT';
  CHECK_BOX: string = 'CHECK_BOX';
  RADIO: string = 'RADIO';
  FILE_UPLOAD: string = 'FILE_UPLOAD';
  YES_NO: string = 'YES_NO';

  tabHeaderDetails: any[] = [
    { id: 1, name: 'Overview' },
    { id: 2, name: 'Questionnaire' },
    { id: 3, name: 'Risk and mitigation' },
  ];

  questions: any[] = [];
  form!: FormGroup;
  types: any[] = [];
  isLoading: boolean = false;
  selectedIndex: number = 0;
  isAddSection: boolean = false;
  addNewQuestion: boolean = false;
  editingQuestionIndex: number | null = null;
  newSectionControl = new FormControl('', [Validators.required]);
  newSectionDescriptionControl = new FormControl('', [Validators.required]);
  newSectionTitleControl = new FormControl('', [Validators.required]);
  currentQuestionForm!: FormGroup;
  newQuestionForm!: FormGroup;
  originalQuestionValue: any = null;
  isSaveLoading: boolean = false;
  selectedEditPayload: any

  private apiHelperService = inject(ApiHelperService);
  private assessmentService = inject(AssessmentService);
  private templatePreviewStateService = inject(TemplatePreviewStateService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  public dialog = inject(MatDialog);

  createBpaForm!: FormGroup;
  securityControlList: any[] = [];

  editingSectionIndex: number | null = null;
  sectionDetailsData: any = null;
  pendingImages: { file: File; fileName: string }[] = [];
  isUploadingImages: boolean = false;

  constructor(
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private httpService: HttpService
  ) {
  }

  ngOnInit() {
    this.types = TYPES;
    if (this.assessmentsFormArray.length > 0) {
      this.selectedIndex = 0;
      this.selectSection(0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (this.templateId) {
    //   this.getQuestionnaireDetails();
    // }
  }

  onImagesSelected(images: { file: File; tempId: string }[]): void {
    images.forEach(img => {
      const exists = this.pendingImages.some(p => p.fileName === img.file.name);
      if (!exists) {
        this.pendingImages.push({ file: img.file, fileName: img.file.name });
      }
    });
    // console.log('Pending images:', this.pendingImages);
  }



  async uploadAllPendingImages(): Promise<void> {
    // console.log('=== uploadAllPendingImages called ===');
    // console.log('pendingImages array:', this.pendingImages);

    if (this.pendingImages.length === 0) {
      // console.log('No pending images to upload');
      return;
    }

    for (let sectionIndex = 0; sectionIndex < this.assessmentsFormArray.length; sectionIndex++) {
      const sectionForm = this.assessmentsFormArray.at(sectionIndex) as FormGroup;
      const questionsArray = sectionForm.get('questions') as FormArray;

      for (let qIndex = 0; qIndex < questionsArray.length; qIndex++) {
        const questionForm = questionsArray.at(qIndex) as FormGroup;
        let helperContent = questionForm.get('helper')?.value;

        // Process ALL images, not just unsaved ones
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = helperContent;

        // Upload ALL pending images
        for (const { file, fileName } of this.pendingImages) {
          try {
            // console.log(`Uploading: ${fileName}`);

            const params = {
              fileName: file.name,
              contentType: file.type,
              purpose: QUESTIONNAIRE_ATTACHMENT,
            };

            const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);

            if (!imageInfo) {
              console.error('Failed to get presigned URL for', fileName);
              continue;
            }

            const { presignedUrl, fileKey } = imageInfo;

            await this.apiHelperService.getImageEtag(presignedUrl, file);
            // console.log(`Uploaded successfully, fileKey: ${fileKey}`);

            // Update ALL matching links, regardless of href value
            const links = tempDiv.querySelectorAll('a.image-link');

            links.forEach((link) => {
              const linkText = link.textContent?.trim();
              if (linkText === fileName) {
                link.removeAttribute('data-temp-id');
                link.setAttribute('href', `filekey://${fileKey}`);
                link.setAttribute('data-filename', fileName);
                link.classList.add('filekey-link');
                // console.log(`Replaced ${fileName} with fileKey`);
              }
            });

          } catch (error) {
            console.error(`Error uploading ${fileName}:`, error);
          }
        }

        // Update the form with all replacements
        helperContent = tempDiv.innerHTML;
        questionForm.patchValue({ helper: helperContent }, { emitEvent: false });
      }
    }

    this.pendingImages = [];
    // console.log('All images uploaded and cleared');
  }

  selectSection(index: number) {
    if (!this.canLeaveEditingQuestion()) {
      return;
    }

    this.editingQuestionIndex = null;

    // this.sectionControl.valueChanges.subscribe(() => { //commented  to avoid unsaved changes popup
    //   this.questionsChanged.emit(true);
    // });

    // this.discriptionControl.valueChanges.subscribe(() => {//commented  to avoid unsaved changes popup
    //   this.questionsChanged.emit(true);
    // });

    this.selectedIndex = index;
  }

  // addSection() {
  //   this.isAddSection = true;
  //   this.questionsChanged.emit(true);
  // }

  createSection(section: any = {}): FormGroup {
    const sectionIndex = (this.assessmentsFormArray.length);
    this.questionsChanged.emit(true);
    return this.fb.group({
      order: [section.order ?? 0],
      id: [section.id || uuidv1()],
      section: [section.section || '', Validators.required],
      totalQuestion: [section.totalQuestion || 0],
      description: [section.description || ''],
      questions: this.fb.array(
        (section.questions ?? []).map((q: any) => this.createQuestion(sectionIndex, q))
      ),
    });

  }

  get sectionDisplayName(): string {
    const sec = this.selectedSection?.get('section')?.value || '';
    const desc = this.selectedSection?.get('description')?.value || '';
    return desc ? `${sec} - ${desc}` : sec;
  }

  updateSectionFromInput(event: any) {
    this.questionsChanged.emit(true);
    const value = event.target.value;
    const parts = value.split('-');
    const section = parts[0]?.trim() || '';
    const description = parts.slice(1).join('-').trim();
    if (this.selectedSection) {
      this.selectedSection?.get('section')?.setValue(section);
      this.selectedSection?.get('description')?.setValue(description);
    }
  }

  removeSection() {
    this.assessmentsFormArray.removeAt(this.selectedIndex);
    this.newSectionControl.reset();
    this.isAddSection = false;
    this.questionsChanged.emit(true);
  }

  saveSection(section: any = null) {
    // const newSectionTitle = this.newSectionControl.value?.trim();
    // const newSectionDescription = this.newSectionDescriptionControl.value?.trim();
    const newSectionTitle = section?.title || '';
    const newSectionDescription = section?.description || '';

    // if (!newSectionTitle) {
    //   this.snackbarService.openSnack('Section title is required');
    //   return;
    // }

    const newSection = {
      order: this.assessmentsFormArray.length + 1,
      id: 0,
      section: newSectionTitle,
      description: newSectionDescription || '',
      totalQuestion: 0,
      questions: [],
    };

    this.assessmentsFormArray.push(this.createSection(newSection));
    this.questionsChanged.emit(true);
    this.newSectionControl.reset();
    this.newSectionDescriptionControl.reset();
    this.isAddSection = false;
  }

  saveEditSection(data: any) {
    if (this.editingSectionIndex === null) return;

    const sectionForm = this.assessmentsFormArray.at(this.editingSectionIndex) as FormGroup;
    if (!sectionForm) return;

    sectionForm.patchValue({
      section: data.title?.trim() || '',
      description: data.description || ''
    });

    this.questionsChanged.emit(true);
    this.editingSectionIndex = null;
  }

  addEditSection(data: any) {
    if (data.isEdit) {
      this.saveEditSection(data);
    } else {
      this.saveSection(data);
    }
    this.templatePreviewStateService.updateFormState(true)
  }

  get sectionControl(): FormControl {
    return this.selectedSection.get('section') as FormControl;
  }

  get discriptionControl(): FormControl {
    return this.selectedSection.get('description') as FormControl;
  }

  createQuestion(sectionIndex: number, questionData: any = null,): FormGroup {
    const rawOptions = Array.isArray(questionData?.options) ? questionData.options : [];

    const options = this.fb.array(
      rawOptions.map((opt: any) =>
        this.fb.group({
          value: opt.option ?? opt.value ?? '',
          saved: true,
        })
      )
    );
    this.questionsChanged.emit(true);
    const questionsArray = this.questionsForm;
    const questionIndex = questionsArray.length;

    const group = this.fb.group({
      id: [questionData?.id || uuidv1()],
      text: [questionData?.text || '', Validators.required],
      type: [questionData?.type || '', Validators.required],
      helper: [questionData?.helper || ''],
      required: [questionData?.required || false],
      numeric: [questionData?.numeric || false],
      comment: [questionData?.comment || false],
      file: [questionData?.file || false],
      rules: [questionData?.rules || questionData?.rule || null],
      options: options,
      displayOrder: [questionIndex + 1],
      displaySectionOrder: [sectionIndex + 1],
    });

    group.get('type')?.valueChanges.subscribe(type => {
      this.handleTypeChange(group, type);
    });

    group.valueChanges.subscribe(() => {
      if (this.editingQuestionIndex !== null) {
        this.questionsChanged.emit(true);
      }
    });

    return group;
  }

  addQuestion() {
    const questionsArray = this.questionsForm;
    for (let i = 0; i < questionsArray.length; i++) {
      const question = questionsArray.at(i) as FormGroup;
      const text = stripHtml(question.get('text')?.value);
      if (!text || question.invalid) {
        this.snackbarService.openSnack('Please complete the existing question before adding a new one.');
        question.markAllAsTouched();
        this.editingQuestionIndex = i;
        this.currentQuestionForm = question;
        this.addNewQuestion = false;
        setTimeout(() => {
          const cards = this.questionCards?.toArray();
          const target = cards?.[i];
          target?.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
        return;
      }
    }
    const sectionIndex = (this.assessmentsFormArray.length - 1);

    const newQuestion = this.createQuestion(sectionIndex);
    questionsArray.push(newQuestion);

    this.selectedSection.patchValue({
      totalQuestion: questionsArray.length
    });

    this.addNewQuestion = false;
    this.editingQuestionIndex = questionsArray.length - 1;
    this.currentQuestionForm = newQuestion;

    this.questionsChanged.emit(true);

    // setTimeout(() => {
    //   this.scrollToBottom();
    // }, 100);
  }
  cancelQuestion() {
    this.addNewQuestion = false;
    this.newQuestionForm.reset();
  }

  saveQuestion() {
    if (!this.newQuestionForm) return;

    const text = this.newQuestionForm.get('text')?.value?.trim();
    const type = this.newQuestionForm.get('type')?.value;

    if (!text || !type) {
      this.snackbarService.openSnack('Please fill all required fields');
      return;
    }

    const options = this.newQuestionForm.get('options') as FormArray;
    const optionsToSave = options.controls.map((ctrl) => ({
      option: ctrl.get('value')?.value,
    }));
    const sectionIndex = (this.assessmentsFormArray.length - 1);

    const questionToAdd = this.createQuestion(sectionIndex, {
      text: text,
      type: type,
      helper: this.newQuestionForm.get('helper')?.value,
      required: this.newQuestionForm.get('required')?.value,
      numeric: this.newQuestionForm.get('numeric')?.value,
      comment: this.newQuestionForm.get('comment')?.value,
      file: this.newQuestionForm.get('file')?.value,
      options: optionsToSave,
    });

    this.questionsFormArray(this.selectedIndex).push(questionToAdd);
    this.questionsChanged.emit(true);
    this.newQuestionForm.reset();
    this.addNewQuestion = false;

    // setTimeout(() => {
    //   this.scrollToNewQuestion();
    // }, 100);
  }

  // private scrollToBottom() {
  //   if (!this.questionsContainer) return;
  //   const container = this.questionsContainer.nativeElement;
  //   container.scrollTo({
  //     top: container.scrollHeight,
  //     behavior: 'smooth'
  //   });
  // }

  // private scrollToNewQuestion() {
  //   const questionCardsArray = this.questionCards.toArray();
  //   if (questionCardsArray.length === 0 || !this.questionsContainer) return;
  //   const lastQuestionCard = questionCardsArray[questionCardsArray.length - 1];
  //   const container = this.questionsContainer.nativeElement;
  //   const questionElement = lastQuestionCard.nativeElement;
  //   const containerRect = container.getBoundingClientRect();
  //   const questionRect = questionElement.getBoundingClientRect();
  //   const scrollTop = container.scrollTop;
  //   const offset = questionRect.top - containerRect.top - (containerRect.height / 2) + (questionRect.height / 2);
  //   container.scrollTo({
  //     top: scrollTop + offset,
  //     behavior: 'smooth'
  //   });
  // }

  // saveEdit(index: number) {
  //   if (this.editingQuestionIndex == null) return;
  //   const text = this.currentQuestionForm.get('text')?.value?.trim();
  //   const type = this.currentQuestionForm.get('type')?.value;
  //   if (!text || !type) {
  //     this.snackbarService.openSnack('Please fill all required fields');
  //     return;
  //   }
  //   const questionForm = this.questionsForm.at(index) as FormGroup;
  //   if (!questionForm) return;
  //   const options = (this.options.controls || []).map((ctrl, i) => ({
  //     value: ctrl.get('value')?.value,
  //     saved: ctrl.get('saved')?.value,
  //   }));
  //   questionForm.patchValue({
  //     ...questionForm.value,
  //     options,
  //   });
  //   this.questionsChanged.emit(true);
  //   this.editingQuestionIndex = null;
  // }

  // cancelEdit() {
  //   if (this.editingQuestionIndex !== null && this.originalQuestionValue) {
  //     const control = this.questionsForm.at(
  //       this.editingQuestionIndex
  //     ) as FormGroup;
  //     control.reset(this.originalQuestionValue);
  //     this.originalQuestionValue = null;
  //   }
  //   this.editingQuestionIndex = null;
  // }

  editQuestion(index: number) {
    if (this.editingQuestionIndex != index && !this.canLeaveEditingQuestion()) {
      return;
    }

    if (this.editingQuestionIndex === index) return;
    if (this.addNewQuestion) {
      this.saveQuestion();
    }
    const question = this.questionsForm.at(index) as FormGroup;
    if (!question) {
      return;
    }

    this.addNewQuestion = false;
    this.editingQuestionIndex = index;
    this.currentQuestionForm = this.questionsForm.at(index) as FormGroup;
    this.originalQuestionValue = JSON.parse(
      JSON.stringify(this.currentQuestionForm.value)
    );
    this.questionsChanged.emit(true);
  }

  deleteQuestion(index: number, selectedSection: FormGroup) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this template?',
        confirmationDetail: this.helperTextValue(this.questionsForm.at(index)?.get('text')?.value),
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });
    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      const questionsFormGroup = this.questionsForm.at(index) as FormGroup;
      const sectionId = (selectedSection?.value?.id ?? 0);

      const questions = this.questionsForm;
      if (!questions || questions.length === 0) return;

      questions.removeAt(index);
      this.selectedSection.patchValue({
        totalQuestion: questions.length,
      });

      if (this.editingQuestionIndex === index) {
        this.editingQuestionIndex = null;
        this.currentQuestionForm = null!;
        this.originalQuestionValue = null;
      }

      this.onDeleteQuestions(questionsFormGroup, selectedSection)
      this.questionsChanged.emit(true);
      this.addNewQuestion = false;
    }
    )
  }

  createOption(optionData: any = null): FormGroup {
    this.questionsChanged.emit(true);
    return this.fb.group({
      option: [optionData?.option || '', Validators.required],
    });
  }

  addOption(event?: Event, form?: FormGroup) {
    this.questionsChanged.emit(true);
    event?.stopPropagation();

    const targetOptions = form ? this.getOptionsFormArray(form) : this.options;
    const regularCount = targetOptions.controls.filter(
      c => c.get('value')?.value !== 'Other'
    ).length;
    const otherIndex = targetOptions.controls.findIndex(
      c => c.get('value')?.value === 'Other'
    );
    const newOption = this.fb.group({
      value: [`Option ${regularCount + 1}`, Validators.required],
      saved: [true],
    });

    if (otherIndex !== -1) {
      targetOptions.insert(otherIndex, newOption);
    } else {
      targetOptions.push(newOption);
    }
  }

  addOtherOption(event?: Event, form?: FormGroup) {
    event?.stopPropagation();
    const targetOptions = form ? this.getOptionsFormArray(form) : this.options;
    const alreadyHasOther = targetOptions.controls.some(
      c => c.get('value')?.value === 'Other'
    );
    if (alreadyHasOther) return;

    targetOptions.push(this.fb.group({
      value: ['Other', Validators.required],
      saved: [true],
    }));
    this.questionsChanged.emit(true);
  }

  get hasOtherOption(): boolean {
    return this.options.controls.some(c => c.get('value')?.value === 'Other');
  }

  hasOtherOptionInForm(form: FormGroup): boolean {
    return this.getOptionsFormArray(form).controls.some(
      c => c.get('value')?.value === 'Other'
    );
  }

  canDeleteOption(options: FormArray, index: number): boolean {
    const ctrl = options.at(index);
    if (ctrl.get('value')?.value === 'Other') return true;
    const regularCount = options.controls.filter(
      c => c.get('value')?.value !== 'Other'
    ).length;
    return regularCount > 1;
  }


  onOptionBlur(index: number, form?: FormGroup) {
    const targetOptions = form ? this.getOptionsFormArray(form) : this.options;
    const ctrl = targetOptions.at(index);
    const val = ctrl.get('value')?.value?.trim();
    if (!val) {
      const regularIndex = targetOptions.controls
        .slice(0, index + 1)
        .filter(c => c.get('value')?.value !== 'Other').length;
      ctrl.get('value')?.setValue(`Option ${regularIndex}`);
    }
    this.questionsChanged.emit(true);
  }

  onOptionEnter(event: Event, index: number, form?: FormGroup) {
    event.preventDefault();
    const targetOptions = form ? this.getOptionsFormArray(form) : this.options;
    const isOther = targetOptions.at(index).get('value')?.value === 'Other';
    if (isOther) return;

    this.addOption(undefined, form);


    setTimeout(() => {
      const currentInput = event.target as HTMLElement;
      const optionRow = currentInput.closest('.options-list');
      if (!optionRow) return;
      const allInputs = optionRow.querySelectorAll<HTMLInputElement>('input.gf-input');
      const newInput = allInputs[index + 1];
      if (newInput) {
        newInput.focus();
        newInput.select();
      }
    }, 0);
  }

  saveOption(index: number, event: any) {
    const option = this.options.at(index);
    const value = option.get('value')?.value?.trim();

    if (!value) {
      event.preventDefault();
      this.snackbarService.openSnack('Option cannot be empty');
      return;
    }

    option.get('saved')?.setValue(true);
    this.questionsChanged.emit(true);
  }

  removeOption(event: Event, index: number, form?: FormGroup) {
    event.stopPropagation();
    const targetOptions = form ? this.getOptionsFormArray(form) : this.options;
    targetOptions.removeAt(index);
    this.questionsChanged.emit(true);
  }

  drop(event: CdkDragDrop<any[]>) {
    const questionsArray = this.questionsFormArray(this.selectedIndex);
    if (!questionsArray || questionsArray.length === 0) return;

    const conflicts = this.findReorderTriggerConflicts(questionsArray, event.previousIndex, event.currentIndex);

    if (conflicts.length > 0) {
      const message = `Reordering this question will affect existing trigger rules:<br><br>${conflicts.join('<br>')}<br><br>Please review and update the affected rules after reordering.`;
      this.confirmationDialogService
        .showDialog('Trigger Rule Impact', message, 'Proceed', 'Cancel')
        .subscribe((confirmed) => {
          if (confirmed) {
            this.applyQuestionReorder(questionsArray, event.previousIndex, event.currentIndex);
          }
        });
    } else {
      this.applyQuestionReorder(questionsArray, event.previousIndex, event.currentIndex);
    }
  }

  private applyQuestionReorder(questionsArray: FormArray, previousIndex: number, currentIndex: number) {
    moveItemInArray(questionsArray.controls, previousIndex, currentIndex);
    questionsArray.controls.forEach((ctrl, index) => {
      ctrl.get('order')?.setValue(index + 1);
    });
    this.cleanupInvalidQuestionTargets(questionsArray);
    questionsArray.updateValueAndValidity();
    this.questionsChanged.emit(true);
  }

  private findReorderTriggerConflicts(questionsArray: FormArray, fromIndex: number, toIndex: number): string[] {
    const conflicts: string[] = [];
    const controls = [...questionsArray.controls];
    const reordered = [...controls];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const newIndexById = new Map<string, number>();
    reordered.forEach((ctrl, idx) => {
      newIndexById.set(ctrl.get('id')?.value, idx);
    });
    controls.forEach((ctrl) => {
      const rules = ctrl.get('rules')?.value;
      if (!rules) return;

      const rulesArray = Array.isArray(rules) ? rules : [rules];
      const questionId = ctrl.get('id')?.value;
      const questionText = stripHtml(ctrl.get('text')?.value || '');
      const sourceNewIndex = newIndexById.get(questionId) ?? -1;

      rulesArray.forEach((r: any) => {
        const rule = r?.rule ?? r;
        const uiEffects = rule?.uiEffects;
        if (!uiEffects?.action) return;

        const targets = uiEffects.targets || {};
        const targetQuestionIds: string[] = targets.questionIds || targets.questions || [];

        targetQuestionIds.forEach((targetId: string) => {
          const targetNewIndex = newIndexById.get(targetId) ?? -1;
          if (targetNewIndex >= 0 && targetNewIndex <= sourceNewIndex) {
            const targetCtrl = controls.find(c => c.get('id')?.value === targetId);
            const targetText = stripHtml(targetCtrl?.get('text')?.value || 'Unknown');
            const label = questionText ? `"${questionText.substring(0, 40)}"` : `Question`;
            conflicts.push(`• ${label} has a display rule targeting "${targetText.substring(0, 40)}" which will no longer be below it.`);
          }
        });
      });
    });

    return conflicts;
  }

  logFullForm() {
    // console.log('Full reactive form data: ', this.assessmentsFormArray.value);
  }

  questionsFormArray(sectionIndex: number): FormArray {
    return this.assessmentsFormArray.at(sectionIndex).get('questions') as FormArray;
  }

  getOptionsFormArray(form: FormGroup): FormArray {
    return form.get('options') as FormArray;
  }

  get questionsForm(): FormArray {
    if (!this.assessmentsFormArray?.length || this.selectedIndex == null) {
      return this.fb.array([]);
    }
    return this.assessmentsFormArray
      .at(this.selectedIndex)
      .get('questions') as FormArray;
  }

  get selectedSection(): FormGroup {
    return this.assessmentsFormArray.at(this.selectedIndex) as FormGroup;
  }

  get options(): FormArray {
    if (this.editingQuestionIndex != null) {
      const questionForm = this.questionsForm.at(
        this.editingQuestionIndex
      ) as FormGroup;
      return questionForm.get('options') as FormArray;
    } else if (this.newQuestionForm) {
      return this.newQuestionForm.get('options') as FormArray;
    } else {
      return this.fb.array([]);
    }
  }

  get isType(): string {
    return this.currentQuestionForm?.get('type')?.value;
  }

  get isNewType(): string {
    return this.newQuestionForm?.get('type')?.value;
  }

  get securityControlForm(): FormGroup {
    return this.createBpaForm.get('securityControls') as FormGroup;
  }

  dropSection(event: CdkDragDrop<any[]>) {
    const conflicts = this.findSectionReorderTriggerConflicts(event.previousIndex, event.currentIndex);

    if (conflicts.length > 0) {
      const message = `Reordering this section will affect existing trigger rules:<br><br>${conflicts.join('<br>')}<br><br>Please review and update the affected rules after reordering.`;
      this.confirmationDialogService
        .showDialog('Trigger Rule Impact', message, 'Proceed', 'Cancel')
        .subscribe((confirmed) => {
          if (confirmed) {
            this.applySectionReorder(event.previousIndex, event.currentIndex);
          }
        });
    } else {
      this.applySectionReorder(event.previousIndex, event.currentIndex);
    }
  }

  private applySectionReorder(previousIndex: number, currentIndex: number) {
    moveItemInArray(this.assessmentsFormArray.controls, previousIndex, currentIndex);
    this.assessmentsFormArray.controls.forEach((ctrl, index) => {
      ctrl.get('order')?.setValue(index + 1);
    });
    this.cleanupInvalidSectionTargets();
    this.questionsChanged.emit(true);
    this.assessmentsFormArray.updateValueAndValidity();
  }

  private findSectionReorderTriggerConflicts(fromIndex: number, toIndex: number): string[] {
    const conflicts: string[] = [];
    const sections = [...this.assessmentsFormArray.controls];
    const reordered = [...sections];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const newSectionIndexById = new Map<string, number>();
    reordered.forEach((ctrl, idx) => {
      newSectionIndexById.set(ctrl.get('id')?.value, idx);
    });
    const questionToNewSectionIndex = new Map<string, number>();
    reordered.forEach((sectionCtrl, sIdx) => {
      const questions = (sectionCtrl.get('questions') as FormArray)?.controls || [];
      questions.forEach((q) => {
        questionToNewSectionIndex.set(q.get('id')?.value, sIdx);
      });
    });

    sections.forEach((sectionCtrl) => {
      const sectionId = sectionCtrl.get('id')?.value;
      const sectionName = sectionCtrl.get('section')?.value || 'Section';
      const newSectionIdx = newSectionIndexById.get(sectionId) ?? -1;
      const questions = (sectionCtrl.get('questions') as FormArray)?.controls || [];

      questions.forEach((qCtrl, qIdx) => {
        const rules = qCtrl.get('rules')?.value;
        if (!rules) return;

        const rulesArray = Array.isArray(rules) ? rules : [rules];
        rulesArray.forEach((r: any) => {
          const rule = r?.rule ?? r;
          const uiEffects = rule?.uiEffects;
          if (!uiEffects?.action) return;

          const targets = uiEffects.targets || {};
          const targetSectionIds: string[] = targets.sectionIds || targets.sections || [];
          const targetQuestionIds: string[] = targets.questionIds || targets.questions || [];

          targetSectionIds.forEach((targetSecId: string) => {
            const targetNewIdx = newSectionIndexById.get(targetSecId) ?? -1;
            if (targetNewIdx >= 0 && targetNewIdx <= newSectionIdx) {
              conflicts.push(`• "${sectionName}" has a display rule targeting a section that will no longer be below it.`);
            }
          });

          targetQuestionIds.forEach((targetQId: string) => {
            const targetSecIdx = questionToNewSectionIndex.get(targetQId) ?? -1;
            if (targetSecIdx >= 0 && targetSecIdx < newSectionIdx) {
              conflicts.push(`• "${sectionName}" Q${qIdx + 1} has a display rule targeting a question that will be in a section above it.`);
            }
          });
        });
      });
    });

    return conflicts;
  }

  private cleanupInvalidQuestionTargets(questionsArray: FormArray) {
    const indexById = new Map<string, number>();
    questionsArray.controls.forEach((ctrl, idx) => {
      indexById.set(ctrl.get('id')?.value, idx);
    });

    questionsArray.controls.forEach((ctrl, sourceIdx) => {
      const rulesCtrl = ctrl.get('rules');
      let rules = rulesCtrl?.value;
      if (!rules) return;

      const rulesArray = Array.isArray(rules) ? rules : [rules];
      let modified = false;

      rulesArray.forEach((r: any) => {
        const rule = r?.rule ?? r;
        const targets = rule?.uiEffects?.targets;
        if (!targets) return;

        const questionIds: string[] = targets.questionIds || targets.questions || [];
        const filtered = questionIds.filter((targetId: string) => {
          const targetIdx = indexById.get(targetId) ?? -1;
          return targetIdx > sourceIdx;
        });

        if (filtered.length !== questionIds.length) {
          modified = true;
          if (targets.questionIds) targets.questionIds = filtered;
          if (targets.questions) targets.questions = filtered;
        }
      });

      if (modified) {
        rulesCtrl?.setValue(rules);
      }
    });
  }

  private cleanupInvalidSectionTargets() {
    const sectionIndexById = new Map<string, number>();
    this.assessmentsFormArray.controls.forEach((ctrl, idx) => {
      sectionIndexById.set(ctrl.get('id')?.value, idx);
    });

    const questionToSectionIndex = new Map<string, number>();
    const questionIndexInSection = new Map<string, number>();
    this.assessmentsFormArray.controls.forEach((sectionCtrl, sIdx) => {
      const questions = (sectionCtrl.get('questions') as FormArray)?.controls || [];
      questions.forEach((q, qIdx) => {
        questionToSectionIndex.set(q.get('id')?.value, sIdx);
        questionIndexInSection.set(q.get('id')?.value, qIdx);
      });
    });

    this.assessmentsFormArray.controls.forEach((sectionCtrl) => {
      const sectionId = sectionCtrl.get('id')?.value;
      const sourceSectionIdx = sectionIndexById.get(sectionId) ?? -1;
      const questions = (sectionCtrl.get('questions') as FormArray)?.controls || [];

      questions.forEach((qCtrl, qIdx) => {
        const rulesCtrl = qCtrl.get('rules');
        let rules = rulesCtrl?.value;
        if (!rules) return;

        const rulesArray = Array.isArray(rules) ? rules : [rules];
        let modified = false;

        rulesArray.forEach((r: any) => {
          const rule = r?.rule ?? r;
          const targets = rule?.uiEffects?.targets;
          if (!targets) return;

          const sectionIds: string[] = targets.sectionIds || targets.sections || [];
          const filteredSections = sectionIds.filter((targetSecId: string) => {
            const targetIdx = sectionIndexById.get(targetSecId) ?? -1;
            return targetIdx > sourceSectionIdx;
          });
          if (filteredSections.length !== sectionIds.length) {
            modified = true;
            if (targets.sectionIds) targets.sectionIds = filteredSections;
            if (targets.sections) targets.sections = filteredSections;
          }

          const questionIds: string[] = targets.questionIds || targets.questions || [];
          const filteredQuestions = questionIds.filter((targetQId: string) => {
            const targetSecIdx = questionToSectionIndex.get(targetQId) ?? -1;
            const targetQIdx = questionIndexInSection.get(targetQId) ?? -1;
            if (targetSecIdx > sourceSectionIdx) return true;
            if (targetSecIdx === sourceSectionIdx && targetQIdx > qIdx) return true;
            return false;
          });
          if (filteredQuestions.length !== questionIds.length) {
            modified = true;
            if (targets.questionIds) targets.questionIds = filteredQuestions;
            if (targets.questions) targets.questions = filteredQuestions;
          }
        });

        if (modified) {
          rulesCtrl?.setValue(rules);
        }
      });
    });
  }

  async getQuestionnaireDetails() {
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    return await firstValueFrom(
      this.httpService.httpGet(`${_url}/${this.templateId}`)
    ).then(res => {
      if (res && res?.data?.sections) {
        patchQuestionnaire(this.fb, this.form, res.data);
        const formAssessments = this.form.get('assessments') as FormArray;

        if (this.assessmentsFormArray) {
          this.assessmentsFormArray.clear();
          formAssessments.controls.forEach(c => this.assessmentsFormArray.push(c));
        }

        if (this.assessmentsFormArray.length > 0) {
          this.selectedIndex = 0;
          this.selectSection(0);
        }
      }
    })
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  onDeleteSections(section: any) {
    if (section?.id) {
      this.assessmentService.deletedSectionsList.push({ ...section, isDeleted: true });
    }
    this.questionsChanged.emit(true);
  }

  deleteSection(index: number) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete the question?',
        confirmationDetail: this.assessmentsFormArray.at(index)?.get('section')?.value,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      const sectionForm = this.assessmentsFormArray.at(index) as FormGroup;
      if (!sectionForm) return;

      const sectionValue = sectionForm.value;
      const sectionId = sectionValue?.id ?? 0;
      if (sectionId) {
        this.assessmentService.deletedSectionsList.push({
          ...sectionValue,
          sectionId,
          isDeleted: true
        });
      }
      const questionsArray = sectionForm.get('questions') as FormArray;
      questionsArray.controls.forEach(qCtrl => {
        const qValue = qCtrl.value;
        if (qValue?.id) {
          this.assessmentService.deletedQuestionsList.push({
            ...qValue,
            sectionId,
            isDeleted: true
          });
        }
      });
      this.assessmentsFormArray.removeAt(index);
      this.questionsChanged.emit(true);

      if (this.selectedIndex === index) this.selectedIndex = -1;
      else if (this.selectedIndex > index) this.selectedIndex--;
    }
    )
  }

  onDeleteQuestions(question: FormGroup, section: FormGroup) {
    const _question = question?.value;
    const sectionId = (section?.value?.id ?? 0);

    if (_question?.id) {
      prepareQuestionPayload({ ..._question, sectionId: sectionId, isDeleted: true }).then(questionPayload => {
        this.assessmentService.deletedQuestionsList.push(questionPayload);
      });
    }
    this.questionsChanged.emit(true);
  }

  openSectionDetailsDrawer(index?: number) {
    if (!this.canLeaveEditingQuestion()) {
      return;
    }

    this.editingQuestionIndex = null;

    if (index !== undefined) {
      this.editingSectionIndex = index;

      const section = this.assessmentsFormArray.at(index).value;

      this.sectionDetailsData = {
        section: section.section,
        description: section.description
      };
    }
    else {
      this.editingSectionIndex = null;
      this.sectionDetailsData = null;
    }

    this.rightDrawer.open();
  }

  closeSectionDetailsDrawer() {
    this.sectionDetailsData = null;
    this.rightDrawer.close();
  }

  get questionCount(): number {
    return (this.selectedSection?.get('questions') as FormArray)?.length || 0;
  }

  get hasQuestions(): boolean {
    if (!this.assessmentsFormArray?.length) return false;

    return this.assessmentsFormArray.controls.some(section =>
      (section.get('questions') as FormArray)?.length > 0
    );
  }

  onNewQuestionMouseLeaveCard(event: MouseEvent) {
    if (!this.addNewQuestion) return;

    const toElement = event.relatedTarget as HTMLElement;

    if (toElement && event.currentTarget instanceof HTMLElement) {
      if (event.currentTarget.contains(toElement)) return;
    }

    if (toElement?.closest('.cdk-overlay-container')) return;

    this.autoSaveOrCancelNewQuestion();
  }

  autoSaveOrCancelNewQuestion() {
    if (this.newQuestionForm.invalid) {
      this.cancelQuestion();
    } else if (this.newQuestionForm.dirty) {
      this.saveQuestion();
    }
  }

  onEditCardLeave(event: MouseEvent, index: number) {
    if (this.editingQuestionIndex !== index) return;

    const toElement = event.relatedTarget as HTMLElement | null;
    const card = event.currentTarget as HTMLElement;

    if (toElement && card.contains(toElement)) return;
    if (toElement?.closest('.cdk-overlay-container')) return;
    if ((event as any).buttons === 1) return;

    this.autoSaveEdit(index);
  }

  openTemplateTriggerDrawer(questionIndex: number) {
    const sectionForm = this.assessmentsFormArray.at(this.selectedIndex) as FormGroup;
    const questionForm = this.questionsForm.at(questionIndex) as FormGroup;

    this.selectedEditPayload = {
      currentQuestionId: questionForm?.get('id')?.value ?? 0,
      currentSectionId: sectionForm?.get('id')?.value ?? 0,
      sections: this.assessmentsFormArray.value,
    };
    this.templateTriggerDrawer.open();
  }


  autoSaveEdit(index: number) {
    const sectionArray = this.questionsFormArray(this.selectedIndex);
    const questionForm = sectionArray.at(index);

    if (!questionForm) return;

    const text = stripHtml(questionForm.get('text')?.value);
    if (!text || questionForm.invalid) {
      return;
    }

    if (!questionForm.dirty) {
      this.editingQuestionIndex = null;
      return;
    }

    if (questionForm.invalid) {
      this.editingQuestionIndex = null;
      return;
    }

    questionForm.markAsPristine();
    this.editingQuestionIndex = null;
  }

  handleTypeChange(form: FormGroup, type: string) {
    const optionsArray = form.get('options') as FormArray;
    while (optionsArray.length) { optionsArray.removeAt(0); }

    if (type === this.YES_NO) {
      optionsArray.push(this.fb.group({ value: ['Yes', Validators.required], saved: [true] }));
      optionsArray.push(this.fb.group({ value: ['No', Validators.required], saved: [true] }));
      return;
    }

    const optionTypes = [this.SINGLE_SELECT, this.MULTI_SELECT, this.RADIO, this.CHECK_BOX];
    if (!optionTypes.includes(type)) return;

    optionsArray.push(this.fb.group({
      value: ['Option 1', Validators.required],
      saved: [true],
    }));
  }

  dropOption(event: CdkDragDrop<any[]>) {
    const optionsArray = this.options;

    moveItemInArray(optionsArray.controls, event.previousIndex, event.currentIndex);
    optionsArray.updateValueAndValidity();

    this.currentQuestionForm.markAsDirty();
    this.questionsChanged.emit(true);
  }

  dropNewOption(event: CdkDragDrop<any[]>) {
    const optionsArray = this.getOptionsFormArray(this.newQuestionForm);

    moveItemInArray(optionsArray.controls, event.previousIndex, event.currentIndex);
    optionsArray.updateValueAndValidity();

    this.newQuestionForm.markAsDirty();
    this.questionsChanged.emit(true);
  }

  onQuestionTextChange(data: { content: string, edited: boolean }) {
    if (this.currentQuestionForm) {
      this.currentQuestionForm.patchValue({ text: data.content }, { emitEvent: false });
      if (data.edited) {
        this.templatePreviewStateService.updateFormState(true)
      }
    }
  }

  async onQuestionHelperChange(data: { content: string, edited: boolean }): Promise<void> {
    if (this.currentQuestionForm) {
      this.currentQuestionForm.patchValue({ helper: data.content }, { emitEvent: false });
      if (data.edited) {
        this.templatePreviewStateService.updateFormState(true)
      }
    }
  }



  onNewQuestionTextChange(data: { content: string, edited: boolean }) {
    if (this.newQuestionForm) {
      this.newQuestionForm.patchValue({ text: data.content }, { emitEvent: false });
      if (data.edited) {
        this.templatePreviewStateService.updateFormState(true)
      }
    }
  }

  async onNewQuestionHelperChange(data: { content: string, edited: boolean }): Promise<void> {
    if (this.newQuestionForm) {
      this.newQuestionForm.patchValue({ helper: data.content }, { emitEvent: false });
      if (data.edited) {
        this.templatePreviewStateService.updateFormState(true)
      }
    }
  }


  extractFontStyles(htmlString: string): { fontFamily?: string; fontSize?: string } {
    if (!htmlString) return {};

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;


    const styledElement = tempDiv.querySelector('[style*="font"]');

    if (styledElement) {
      const style = (styledElement as HTMLElement).style;
      return {
        fontFamily: style.fontFamily || undefined,
        fontSize: style.fontSize || undefined
      };
    }

    return {};
  }


  getQuestionTextStyle(questionText: string): string {
    const styles = this.extractFontStyles(questionText);
    const styleArray: string[] = [];

    if (styles.fontFamily) {
      styleArray.push(`font-family: ${styles.fontFamily}`);
    }
    if (styles.fontSize) {
      styleArray.push(`font-size: ${styles.fontSize}`);
    }

    return styleArray.join('; ');
  }

  onHelperContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement;

    if (!link) return;

    const href = link.getAttribute('href');

    // Handle filekey:// links
    if (href && href.startsWith('filekey://')) {
      event.preventDefault();
      event.stopPropagation();

      const fileKey = href.replace('filekey://', '');
      const fileName = link.getAttribute('data-filename') ||
        link.textContent?.trim() ||
        'image';

      this.viewImageFromFileKey(fileKey, fileName);
      return;
    }

    // Handle regular links
    if (href && href !== '#' && !href.startsWith('javascript:')) {
      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (href === '#' || href === '') {
      event.preventDefault();
    }
  }

  async viewImageFromFileKey(fileKey: string, fileName: string): Promise<void> {
    try {
      const params = { fileKey: fileKey };
      const imageInfo = await this.apiHelperService.getPresignedUrl(params);

      if (imageInfo?.presignedUrl) {

        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: fileName || 'image',
            isTaskView: true,
          },
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          maxWidth: '100vh',
          disableClose: false,
          panelClass: 'dialog-wrapper',
          autoFocus: false,
        });
      } else {
        console.error('Failed to get presigned URL for image');
        this.snackbarService.openSnack('Failed to load image');
      }
    } catch (error) {
      console.error('Error viewing image:', error);
      this.snackbarService.openSnack('Error loading image');
    }
  }

  helperTextValue(htmlString: string): string {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
  }

  onTriggerSave(event: any) {
    const section = this.assessmentsFormArray.controls.find(
      (s: any) => s.get('id')?.value === event.sectionId
    ) as FormGroup;

    if (!section) return;

    const questions = section.get('questions') as FormArray;

    const question = questions.controls.find(
      (q: any) => q.get('id')?.value === event.questionId
    ) as FormGroup;

    if (!question) return;

    question.patchValue({
      rules: event.rule
    });

    question.markAsDirty();
    this.questionsChanged.emit(true);
  }


  hasRule(questionIndex: any) {
    const questionForm = this.questionsForm.at(questionIndex) as FormGroup;
    const rule = questionForm?.get('rules')?.value
    return rule?.length ?? false
  }

  validateAllQuestions(): boolean {
    if (!this.assessmentsFormArray || this.assessmentsFormArray.length === 0) {
      this.snackbarService.openSnack('Please add at least one section.');
      return false;
    }
    for (let sIndex = 0; sIndex < this.assessmentsFormArray.length; sIndex++) {
      const section = this.assessmentsFormArray.at(sIndex) as FormGroup;
      const questions = section.get('questions') as FormArray;

      // if (!questions || questions.length === 0) {
      //   this.snackbarService.openSnack(
      //     `Section "${section.get('section')?.value}" must contain at least one question.`
      //   );
      //   this.selectedIndex = sIndex;
      //   return false;
      // }

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions.at(qIndex) as FormGroup;
        const value = question.value;
        const cleanText = stripHtml(value.text);
        const cleanHelper = stripHtml(value.helper);
        if (!cleanText) {
          this.handleInvalidQuestion(sIndex, qIndex, question, 'Question text cannot be empty.');
          return false;
        }

        if (!value.type || !value.type.trim()) {
          this.handleInvalidQuestion(sIndex, qIndex, question, 'Question type is required.');
          return false;
        }
        if (
          value.type === 'SINGLE_SELECT' ||
          value.type === 'MULTI_SELECT' ||
          value.type === 'RADIO'
        ) {
          if (!value.options || value.options.length === 0) {
            this.handleInvalidQuestion(
              sIndex,
              qIndex,
              question,
              'Please add at least one option.'
            );
            return false;
          }

          const hasEmptyOption = value.options.some(
            (opt: any) => !opt.value || !opt.value.trim()
          );

          if (hasEmptyOption) {
            this.handleInvalidQuestion(
              sIndex,
              qIndex,
              question,
              'Option values cannot be empty.'
            );
            return false;
          }
        }
      }
    }

    return true;
  }

  handleInvalidQuestion(sectionIndex: number, questionIndex: number, question: FormGroup, message: string) {

    this.snackbarService.openSnack(message);
    question.markAllAsTouched();
    this.selectedIndex = sectionIndex;
    this.editingQuestionIndex = questionIndex;
    this.currentQuestionForm = question;
    setTimeout(() => {
      const cards = this.questionCards?.toArray();
      const target = cards?.[questionIndex];
      target?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);
  }

  hasDescription(value: string) {
    return value?.replace(/<[^>]*>/g, '').trim();
  }

  canLeaveEditingQuestion(): boolean {
    if (this.editingQuestionIndex === null) return true;

    const questionForm = this.questionsForm.at(this.editingQuestionIndex) as FormGroup;
    if (!questionForm) return true;

    const text = stripHtml(questionForm.get('text')?.value);

    if (!text || questionForm.invalid) {
      if (!text) {
        this.snackbarService.openSnack('Question is mandatory.');
      } else if (questionForm.invalid) {
        this.snackbarService.openSnack('Question Type is mandatory.');
      }
      questionForm.markAllAsTouched();
      return false;
    }

    return true;
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (this.editingQuestionIndex === null) return;

    const target = event.target as HTMLElement;
    if (target.closest('.cdk-overlay-container')) return;

    const cards = this.questionCards?.toArray();
    const editingCard = cards?.[this.editingQuestionIndex];
    if (!editingCard) return;
    if (editingCard.nativeElement.contains(target)) return;

    if (!this.isQuestionValid()) {
      this.canLeaveEditingQuestion();
      return;
    }

    this.autoSaveEdit(this.editingQuestionIndex);
  }

  isQuestionValid(): boolean {
    if (this.editingQuestionIndex === null) return true;
    const questionForm = this.questionsForm.at(this.editingQuestionIndex) as FormGroup;
    if (!questionForm) return true;
    const text = stripHtml(questionForm.get('text')?.value);

    return !!text && questionForm.valid;
  }

  isTargetQuestion(questionIndex: number): boolean {
    const questionId = this.questionsForm.at(questionIndex)?.get('id')?.value;
    if (!questionId) return false;

    for (let sIdx = 0; sIdx < this.assessmentsFormArray.length; sIdx++) {
      const questions = (this.assessmentsFormArray.at(sIdx).get('questions') as FormArray)?.controls || [];
      for (const qCtrl of questions) {
        const rules = qCtrl.get('rules')?.value;
        if (!rules) continue;
        const rulesArray = Array.isArray(rules) ? rules : [rules];
        for (const r of rulesArray) {
          const rule = r?.rule ?? r;
          const targets = rule?.uiEffects?.targets || {};
          const targetQuestionIds: string[] = targets.questionIds || targets.questions || [];
          if (targetQuestionIds.includes(questionId)) return true;
        }
      }
    }
    return false;
  }


  getParentQuestionInfo(questionIndex: number): string {
    const questionId = this.questionsForm.at(questionIndex)?.get('id')?.value;
    if (!questionId) return '';

    for (let sIdx = 0; sIdx < this.assessmentsFormArray.length; sIdx++) {
      const section = this.assessmentsFormArray.at(sIdx);
      const sectionName = section.get('section')?.value || `Section ${sIdx + 1}`;
      const sectionOrder = section.get('order')?.value || sIdx + 1;
      const questions = (section.get('questions') as FormArray)?.controls || [];
      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const qCtrl = questions[qIdx];
        const rules = qCtrl.get('rules')?.value;
        if (!rules) continue;
        const rulesArray = Array.isArray(rules) ? rules : [rules];
        for (const r of rulesArray) {
          const rule = r?.rule ?? r;
          const targets = rule?.uiEffects?.targets || {};
          const targetQuestionIds: string[] = targets.questionIds || targets.questions || [];
          if (targetQuestionIds.includes(questionId)) {
            return `Sub-question of: ${sectionName} → Q${sectionOrder}.${qIdx + 1}`;
          }
        }
      }
    }
    return '';
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

}
