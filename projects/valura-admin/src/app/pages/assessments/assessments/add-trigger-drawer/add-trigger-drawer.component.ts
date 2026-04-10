import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';

@Component({
  selector: 'app-add-trigger-drawer',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoadingButtonComponent
  ],
  templateUrl: './add-trigger-drawer.component.html',
  styleUrl: './add-trigger-drawer.component.scss'
})
export class AddTriggerDrawerComponent {
  @Output() onCloseDrawer = new EventEmitter<any>();
  @Input() selectedRegulations: any[] = [];
  @Input() triggerForm!: FormGroup;
  @Output() selectedRegulationsChange = new EventEmitter<any>();
  regulations: any[] = [];
  localTriggers: any[] = [];
  tempSelection: Record<string, boolean> = {};

  ngOnInit() {
    this.regulations = [...(this.selectedRegulations || [])];
    this.localTriggers = [...(this.triggerListArray.value || [])];
    this.initializeTempSelection();
  }

  ngOnChanges() {
    this.regulations = [...(this.selectedRegulations || [])];
    this.localTriggers = [...(this.triggerListArray.value || [])];
  }

  initializeTempSelection() {
    this.localTriggers.forEach(trigger => {
      this.tempSelection[trigger.id] = trigger.selected || false;
    });
  }

  onCheckboxChange(id: string, checked: boolean) {
    this.tempSelection[id] = checked;
  }

  removeRegulation(regId: any) {
    this.regulations = this.regulations.filter(r => r.id !== regId);
    this.localTriggers = this.localTriggers.filter(
      t => t.regulationId !== regId
    );
  }

  closeDrawer() {
    this.onCloseDrawer.emit(true);
  }

  onSave() {
    const triggerArray = this.triggerListArray;

    triggerArray.controls.forEach(control => {
      const id = control.get('id')?.value;

      if (this.tempSelection.hasOwnProperty(id)) {
        control.get('selected')?.setValue(this.tempSelection[id]);
      }
    });

    for (let i = triggerArray.length - 1; i >= 0; i--) {
      const formTriggerId = triggerArray.at(i).get('id')?.value;

      const existsInLocal = this.localTriggers.some(
        t => t.id === formTriggerId
      );

      if (!existsInLocal) {
        triggerArray.removeAt(i);
      }
    }

    this.selectedRegulationsChange.emit(this.regulations);
    this.closeDrawer();
  }

  get triggerListArray(): FormArray {
    return this.triggerForm.get('triggerList') as FormArray;
  }
}
