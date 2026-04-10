import { CommonModule } from '@angular/common';
import { Component, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TriggerPointDialogComponent } from '../trigger-point-dialog/trigger-point-dialog.component';
import { DbService } from '@admin-core/services/db/db.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ActivatedRoute } from '@angular/router';
import { HttpService } from '@valura-lib/service/network/http.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { TriggerService } from '@admin-core/services/trigger/trigger.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
@Component({
  selector: 'app-assessment-types',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    EllipsisTooltipDirective,
    MatTooltipModule,
    ItemNotFoundComponent
  ],
  templateUrl: './assessment-types.component.html',
  styleUrl: './assessment-types.component.scss'
})
export class AssessmentTypesComponent {
  @Input() tab: any;
  @Input() searchText: string = '';
  @ViewChild(MatSort) sort!: MatSort;

  initialListIsEmpty: boolean = false;

  dialogRef: MatDialogRef<any> | null = null;
  private dialog = inject(MatDialog);

  originalElements: any[] = [];

  get errorTitle() {
    return (this.searchText
      ? `No trigger points match your search criteria`
      : `No assessment trigger points have been configured yet`)
  }

  displayedColumns: string[] = ['provision', 'label', 'description', 'action'];
  dataSource = new MatTableDataSource<any>();
  selectedTab: any;
  regulationId!: number;

  allData: any[] = [];
  filteredData: any[] = [];

  private dbService = inject(DbService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private triggerService = inject(TriggerService)
  constructor(private snackbarService: SnackbarService, private route: ActivatedRoute, private httpService: HttpService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tab'] && changes['tab'].currentValue) {
      this.regulationId = Number(this.route.snapshot.paramMap.get('id'));
      this.selectedTab = this.tab.id;
      this.loadParametersMasterList();
    }

    if (changes['searchText'] && this.searchText !== undefined && this.dataSource) {
      this.applyFilter();
    }
  }

  ngAfterViewInit() {
  }

  private async loadParametersMasterList(): Promise<void> {
    try {
      let triggers = await this.dbService.getTriggerByActIdAndTypeId(this.regulationId, this.selectedTab);
      // const triggers = await this.configApiHelperService.getTriggerById({
      //   regulationId: this.regulationId,
      //   page: 0,
      //   size: 0,
      //   assessmentTypes: [this.selectedTab]
      // });

      this.originalElements = triggers;

      if (this.originalElements) {
        this.dataSource.data = triggers || [];
        this.dataSource.sort = this.sort;

        this.dataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'provision': return item.source;
            case 'label': return item.triggerLabel;
            case 'description': return item.name;
            default: return item[property];
          }
        };
      } else {
        this.initialListIsEmpty = true
      }
    } catch (error) {
      console.error('Error', error);
    }

    this.applyFilter();
  }

  async onDeleteClick(element: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this trigger?',
        confirmationDetail: element.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });


    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      try {
        const res = await this.configApiHelperService.onDeleteClick(element);
        if (res?.success) {
          await this.triggerService.deleteTrigger(element.id);
          this.dataSource.data = this.dataSource.data.filter(item => item !== element);
          await this.loadParametersMasterList();
          this.snackbarService.openSnack('Trigger deleted successful');
        }
      } catch (error) {
        console.error('Error deleting trigger:', error);
        this.snackbarService.openSnack('Failed to delete trigger');
      }
    });
  }

  async editTrigger(element: any) {
    const body = {
      name: element.name,
      source: element.source,
      triggerLabel: element.triggerLabel
    }

    const res = await this.configApiHelperService.editTrigger(element, body);
    if (res.success) {
      return res.data;
    }
  }

  async onEditClick(element: any) {
    const dialog = this.dialog.open(TriggerPointDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        actionName: 'Edit',
        elementData: element
      }
    });


    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        const res = await this.editTrigger(result);
        if (res) {
          const updatedTrigger = {
            ...element,
            ...result,
            updatedAt: new Date().toISOString().replace('Z', ''),
          };

          this.dataSource.data = this.dataSource.data.map((item: any) =>
            item.id === element.id ? { ...item, ...result } : item
          );

          await this.triggerService.updateTriggerToDb(updatedTrigger);
          await this.loadParametersMasterList();
          this.snackbarService.openSnack(res.message || 'Trigger updated successful');
        }
      }
    });
  }

  async onViewClick(element: any) {
    const dialog = this.dialog.open(TriggerPointDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        actionName: 'View',
        elementData: element
      }
    });

    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        const res = await this.editTrigger(result);
        if (res) {
          this.dataSource.data = this.dataSource.data.map((item: any) =>
            item.id === element.id ? { ...item, ...result } : item
          );

          // await this.dbService.updateTrigger(res);
          await this.loadParametersMasterList();
          this.snackbarService.openSnack(res.message || 'Trigger updated successful');
        }
      }
    });
  }

  async addTriggerPoint(data: any) {
    const res = await this.configApiHelperService.addTriggers(data, this.regulationId, this.selectedTab);

    if (res.success) {
      // console.log(res.success, res)
      await this.triggerService.addTrigger(res.data.model);
      this.dataSource.data = [
        ...this.dataSource.data,
        {
          id: 0,
          name: data.name,
          source: data.source,
          triggerLabel: data.triggerLabel,
          createdAt: new Date().toISOString().replace('Z', ''),
          updatedAt: new Date().toISOString().replace('Z', ''),
          actId: this.regulationId,
        }];


      await this.loadParametersMasterList();
      this.snackbarService.openSnack(res.message || 'Trigger added successful');
    }
  }

  applyFilter() {
    const filterValue = this.searchText.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return (
        data.source?.toLowerCase().includes(filter) ||
        data.triggerLabel?.toLowerCase().includes(filter) ||
        data.name?.toLowerCase().includes(filter)
      );
    };
    this.dataSource.filter = filterValue;
  }
}
