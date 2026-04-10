import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomMatErrorComponent } from '@valura-lib/components/custom-mat-error/custom-mat-error.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { patchTriggers } from '../assessment-utils';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { TriggerService } from '@admin-core/services/trigger/trigger.service';
import { MatChipsModule } from '@angular/material/chips';
import { AssessmentBpaDetails } from '@admin-core/models/assessment/assessment';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { AddTriggerDrawerComponent } from '../add-trigger-drawer/add-trigger-drawer.component';
import { ASSESSMENT_MODE } from '../constants';

@Component({
  selector: 'app-triggers-dpia',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatIconModule,
    CustomMatErrorComponent,
    MatChipsModule,
    MatDrawerContainer,
    MatDrawer,
    AddTriggerDrawerComponent
  ],
  templateUrl: './triggers-dpia.component.html',
  styleUrl: './triggers-dpia.component.scss'
})
export class TriggersDpiaComponent implements OnChanges {

  @Input() triggerForm!: FormGroup
  @Input() bpaDetails!: AssessmentBpaDetails;
  @Input() dataUpdated!: string;
  @Input() mode!: string;
  @ViewChild('addTriggerDrawer') addTriggerDrawer!: MatDrawer;

  regulations: any[] = [];
  triggerLists: any[] = [];
  editingReasonIndex: { [key: number]: boolean } = {};
  selectedRegulations: any[] = [];
  filteredRegulations: any[] = [];
  private regulationsLoaded = false;
  private pendingDataUpdate = false;

  private regulationsService = inject(RegulationsService);
  private triggerService = inject(TriggerService);

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.getRegulationList().then(() => {
      this.regulationsLoaded = true;
      this.syncChips();
      this.regulation.valueChanges.subscribe(() => {
        this.syncChips();
      });
      if (this.pendingDataUpdate || this.regulation.value) {
        this.pendingDataUpdate = false;
        this.onChangeRegulation();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataUpdated']) {
      if (this.dataUpdated) {
        if (this.regulationsLoaded) {
          this.onChangeRegulation();
        } else {
          this.pendingDataUpdate = true;
        }
      }
    }
    if (changes['bpaDetails']) {
      if (this.bpaDetails) {
        this.patchBpaDetails();
      }
    }
    if (changes['triggerForm']) {
      if (this.triggerForm && this.regulationsLoaded) {
        this.onChangeRegulation();
      }
    }
  }

  syncChips() {
    if (this.regulation && this.regulation.value) {
      const selectedIds = Array.isArray(this.regulation.value) ? this.regulation.value : [this.regulation.value];

      this.selectedRegulations = this.regulations.filter(reg =>
        selectedIds.includes(reg.id)
      );

      this.selectedRegulations = [...this.selectedRegulations];
    }
  }

  patchBpaDetails() {
    this.clearRegulation();
    const regulation = this.bpaDetails?.regulation
    if (regulation) {
      const regulationId = regulation.id;
      if (!this.selectedRegulations.find(r => r.id === regulation.id)) {
        this.selectedRegulations.push(regulation);

        const ids = this.selectedRegulations.map(r => r.id);
        this.regulation.patchValue(ids);
      }
      this.getTriggersList(regulationId);
    }
  }

  removeRegulation(regId: any) {
    this.selectedRegulations = this.selectedRegulations.filter(r => r.id !== regId);

    const triggerListArray = this.triggerListArray;
    for (let i = triggerListArray.length - 1; i >= 0; i--) {
      if (triggerListArray.at(i).get('regulationId')?.value === regId) {
        triggerListArray.removeAt(i);
      }
    }

    this.onSelectedRegulationsChange(this.selectedRegulations);
  }

  onTriggerCancel() {
    this.triggerReset();
  }

  triggerReset() {
    this.triggerForm.reset({
      regulation: '',
      triggerList: []
    });
  }

  async getRegulationList() {
    const res = await this.regulationsService.getRegulationMasterList();
    if (res) {
      this.regulations = (res.acts ?? []);
      this.filteredRegulations = [...this.regulations];
    }
  }

  async getTriggersList(actId: any) {
    const res = await this.triggerService.getActsTriggerList(actId);
    if (res) {
      const newTriggers = (res || []).map((t: any) => ({
        ...t,
        regulationId: actId
      }));

      const tempTriggerList = this.triggerForm.value.tenpTriggerList ?? [];
      const existingTriggers = this.triggerListArray.value ?? [];
      const updatedTriggers = newTriggers.map(trigger => {
        const match = tempTriggerList.find((x: any) => x.triggerId === trigger.id);
        const existingMatch = existingTriggers.find((x: any) => x.id === trigger.id && x.regulationId === actId);

        if (this.mode === ASSESSMENT_MODE.EDIT) {
          return {
            ...trigger,
            selected: !!match,
            reason: match?.selectionReason ?? '',
            assessmentTriggerMappingId: match?.assessmentTriggerMappingId ?? 0
          };
        } else {
          return {
            ...trigger,
            selected: match?.selected ?? existingMatch?.selected ?? false,
            reason: match?.reason ?? '',
            assessmentTriggerMappingId: match?.assessmentTriggerMappingId ?? 0
          };
        }
      });

      const triggerListArray = this.triggerForm.get('triggerList') as FormArray;
      patchTriggers(this.fb, triggerListArray, updatedTriggers);
    }
  }

  markReasonReadonly(index: number, event: any) {
    event.preventDefault();

    const group = this.triggerListArray.at(index);
    const reasonControl = group.get('reason') as FormControl;
    const readonlyControl = group.get('readonly') as FormControl;

    if (reasonControl && readonlyControl && reasonControl.value?.trim()) {
      readonlyControl.setValue(true);
    }
  }

  get regulation() {
    return this.triggerForm.get('regulation') as FormControl;
  }

  get triggerListArray(): FormArray {
    return this.triggerForm.get('triggerList') as FormArray;
  }

  get reason() {
    return this.triggerForm.get('reason') as FormControl;
  }


  getReasonControl(index: number): FormControl {
    return this.triggerListArray.at(index).get('reason') as FormControl;
  }

  enableReasonEdit(index: number) {
    this.editingReasonIndex[index] = true;
  }

  disableReasonEdit(index: number) {
    this.editingReasonIndex[index] = false;
  }

  // onChangeRegulation() {
  //   this.getTriggersList(10);
  //   const value = this.regulation.value;
  //   if (!value) return;
  //   const selectedIds: number[] = Array.isArray(value) ? value : [value];
  //   this.selectedRegulations = this.selectedRegulations.filter(reg =>
  //     selectedIds.includes(reg.id)
  //   );
  //   selectedIds.forEach(id => {
  //     const regObj = this.regulations.find(r => r.id === id);
  //     if (regObj && !this.selectedRegulations.some(r => r.id === id)) {
  //       this.selectedRegulations.push(regObj);
  //       this.getTriggersList(10);
  //     }
  //   });
  //   // this.regulation.setValue(null, { emitEvent: false });
  // }

  async onChangeRegulation() {
    const value = this.regulation.value;

    if (!value) return;
    const selectedIds: number[] = Array.isArray(value) ? value : [value];

    this.selectedRegulations = this.selectedRegulations.filter(reg =>
      selectedIds.includes(reg.id)
    );

    const missingRegs = this.regulations.filter(
      r => selectedIds.includes(r.id) &&
        !this.selectedRegulations.some(sr => sr.id === r.id)
    );

    this.selectedRegulations.push(...missingRegs);
    await Promise.all(this.selectedRegulations.map(r => this.getTriggersList(r.id)));

    // this.regulation.setValue(null, { emitEvent: false });
  }

  clearRegulation() {
    this.selectedRegulations = []
    const triggerListArray = this.triggerListArray;
    for (let i = triggerListArray.length - 1; i >= 0; i--) {
      triggerListArray.removeAt(i);
    }
  }

  openAddTriggerDrawer() {
    this.addTriggerDrawer.open();
  }

  closeAddTriggersDrawer() {
    this.addTriggerDrawer.close();
  }

  onSelectedRegulationsChange(updated: any) {
    this.selectedRegulations = updated;
    const ids = updated.map((r: any) => r.id);
    this.triggerForm.get('regulation')?.setValue(ids);
  }

  onRegulationSearch(query: string) {
    if (!query) {
      this.filteredRegulations = this.regulations;
      return;
    }
    const filterValue = query.toLowerCase();
    this.filteredRegulations = this.regulations.filter(r =>
      r.name.toLowerCase().includes(filterValue)
    );
  }

  onRegulationOpened(opened: boolean, searchInput: HTMLInputElement) {
    if (opened) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      this.onRegulationSearch('');
    }
  }
}
