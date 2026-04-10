import { CommonModule } from '@angular/common';
import { Component, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { AddValidationQuestionDialogComponent } from '../add-validation-question-dialog/add-validation-question-dialog.component';
import { DbService } from '@admin-core/services/db/db.service';
import { firstValueFrom } from 'rxjs';
import { EDIT_DELETE_VALIDATION_QUESTION } from '@admin-core/constants/api-constants';
import { HttpService } from '@valura-lib/service/network/http.service';
import { ActivatedRoute } from '@angular/router';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ConfigurationService } from '@admin-core/services/configuration.service';
import { signal, computed } from '@angular/core';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
@Component({
  selector: 'app-dssr-validation-question',
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    ItemNotFoundComponent,
    MatSortModule, MatTooltipModule,
    EllipsisTooltipDirective
  ],
  templateUrl: './dssr-validation-question.component.html',
  styleUrl: './dssr-validation-question.component.scss'
})
export class DssrValidationQuestionComponent {
  @Input() searchText!: string;
  @Input() refreshValidationQuestion!: boolean;

  @ViewChild(MatSort) sort!: MatSort;

  questions: any[] = [];
  GENERAL: string = "REGULATION";
  RIGHT_SPECIFIC: string = "RIGHT";
  selectedSection: any;
  mainDispayedColumns: string[] = ['provision', 'question', 'helper', 'rightTitle', 'type', 'action'];
  displayedColumns: string[] = [];
  initialListIsEmpty: boolean = false;

  shimmerDataSource: any[] = Array.from({ length: 7 }, (_, i) => ({
    shimmerIndex: i,
    provision: '',
    question: '',
    helper: '',
    rightTitle: '',
    type: '',
    action: ''
  }));

  dataSource = new MatTableDataSource<any>();
  regulationId: any;
  originalElements: any[] = [];

  private dbService = inject(DbService);
  private configurationService = inject(ConfigurationService);
  constructor(private snackbarService: SnackbarService, private dialog: MatDialog, private httpService: HttpService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.regulationId = Number(this.route.snapshot.paramMap.get('id'));
    this.onGeneral();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.applyFilter();
    }
    if (changes['refreshValidationQuestion'] && !changes['refreshValidationQuestion'].firstChange) {
      this.loadData();
    }
  }

  applyFilter() {
    if (!this.dataSource) return;

    const filterValue = (this.searchText || '').trim().toLowerCase();

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return (
        data.question?.toLowerCase().includes(filter) ||
        data.helper?.toLowerCase().includes(filter) ||
        data.questionType?.toLowerCase().includes(filter)
      );
    };

    this.dataSource.filter = filterValue;
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  validationQuestions = signal<any[]>([]);

  protected readonly hasValidations = computed(
    () => this.validationQuestions().length > 0
  );


  async loadData() {
    const allData = await this.dbService.getValidationQuestionByRegulationId(
      this.regulationId
    );

    this.originalElements = allData || [];
    if (this.originalElements.length === 0) {
      this.initialListIsEmpty = true;
    }
    this.validationQuestions.set(allData || []);
    const entityType =
      this.selectedSection === this.GENERAL
        ? this.GENERAL
        : this.RIGHT_SPECIFIC;

    const filteredData = (allData || []).filter(q =>
      q.entityType === entityType
    );

    this.displayedColumns =
      this.selectedSection === this.RIGHT_SPECIFIC
        ? this.mainDispayedColumns
        : this.mainDispayedColumns.filter(c => c !== 'rightTitle');
    this.dataSource.data = filteredData;
  }

  get errorTitle() {
    return (this.searchText
      ? `No validation questions match your search criteria`
      : `No validation questions have been configured for this regulation`)
  }

  onSectionChange(event: any) {
    const value = event.value
    if (value === this.GENERAL) {
      this.onGeneral();
    } else if (value === this.RIGHT_SPECIFIC) {
      this.onRightSpecific();
    }
    this.configurationService.onEntityTypeChange$.next(this.selectedSection)
  }
  onGeneral() {
    this.selectedSection = this.GENERAL;
    this.loadData();
  }

  onRightSpecific() {
    this.selectedSection = this.RIGHT_SPECIFIC;
    this.loadData();
  }

  async onEditClick(element: any) {
    const dialog = this.dialog.open(AddValidationQuestionDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        elementData: element,
        regulationId: this.regulationId,
        editMode: true
      }
    });


    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        // const res = await this.updateValidationQuestion(element, result);
        if (result.success) {
          // await this.dbService.updateValidationQuestionById(result);
          await this.loadData();
          // this.snackbarService.openSnack(res.message);
        }
      }
    });
  }

  async onViewClick(element: any) {
    const dialog = this.dialog.open(AddValidationQuestionDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        elementData: element,
        regulationId: this.regulationId,
        viewMode: true
      }
    });

    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result.success) {
          // await this.dbService.updateValidationQuestionById(result);
          await this.loadData();
          // this.snackbarService.openSnack(r.message);
        }
      }
    });
  }

  onDeleteClick(row: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this validation question?',
        confirmationDetail: row.question,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });


    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      try {
        const res = await firstValueFrom(
          this.httpService.httpDelete(EDIT_DELETE_VALIDATION_QUESTION(row.id))
        );

        if (res?.success) {
          this.dbService.deleteValidationQuestion(row.id)
          this.dataSource.data = this.dataSource.data.filter(item => item.id !== row.id);

          await this.loadData();
          this.snackbarService.openSnack(res.message);
        }
      } catch (error) {
        this.snackbarService.openSnack('Failed to delete. Try again.');
      }
    });
  }

  get rightSpecificTab() {
    return this.selectedSection === 'RIGHT_SPECIFIC'
  }
}
