import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ActivatedRoute } from '@angular/router';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
@Component({
  selector: 'app-risk-mitigation-drawer',
  imports: [CustomMatTextareaComponent, CommonModule, MatInputModule, MatCardModule, MatTabsModule, MatIconModule, LoadingButtonComponent,
    MatTableModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatSelectModule, MatOptionModule, MatIcon, MatSelect, MatDialogModule],
  templateUrl: './risk-mitigation-drawer.component.html',
  styleUrl: './risk-mitigation-drawer.component.scss'
})
export class RiskMitigationDrawerComponent {
  @Input() formGroup!: FormGroup
  @Input() securityControlList!: any[];
  @Input() viewMode: 'ADD' | 'VIEW' | 'EDIT' = 'ADD';
  @Input() measure: any;
  @Input() approver: boolean = false
  @Input() risk: any;
  @Output() onApproveChange = new EventEmitter<void>();
  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyChanges = new EventEmitter<any>()
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  private apiHelperService = inject(ApiHelperService);
  private route = inject(ActivatedRoute);
  private configApiHelperService = inject(ConfigApiHelperService);
  private securityControlService = inject(SecurityControlService);
  saveLoading = false;
  approveLoading = false;
  rejectLoading = false;
  isLoading: boolean = false;
  searchTerm = '';
  filteredSecurityControlList: any[] = [];
  retentionPeriod: any = ['Monthly', 'Daily', 'Weekly'];
  riskOptions = [
    { key: 'AVOID', label: 'Avoid' },
    { key: 'ACCEPT', label: 'Accept' },
    { key: 'MITIGATE', label: 'Mitigate' },
    { key: 'TRANSFER', label: 'Transfer' }
  ];
  residualRisk = [
    { key: 'HIGH', label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' },
  ]
  riskEffects = [
    { key: 'REDUCED', label: 'Reduced' },
    { key: 'ELIMINATED', label: 'Eliminated' },
    { key: 'ACCEPTED', label: 'Accepted' },
  ]
  measureForm!: FormGroup;
  securityControlInput = new FormControl('');
  riskId!: number;
  isViewMode = true;
  submitLoading = false
  measureId: any;
  closeDrawer() {
    this.onCloseDrawer.emit(true);
    this.measureForm.reset()
  }
  constructor(private fb: FormBuilder) {
  }
  ngOnInit(): void {
    this.measureForm = this.fb.group({
      // measureType: [''],
      measureDescription: ['', Validators.required],
      standard: [''],
      controlCategory: [''],
      controlDescription: [''],
      riskEffect: [''],
      residualRisk: ['']
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    this.filteredSecurityControlList = [...this.securityControlList];
    if (changes['measure'] && this.measure && this.viewMode === 'EDIT') {
      this.edit();
    }
    if (changes['risk'] && this.risk) {
      this.riskId = this.risk.id;
      if (this.viewMode === 'VIEW') this.view();
    }
    this.route.queryParams.subscribe(params => {
      this.measureId = params['measureId'];
    });
  }
  async edit() {
    const measure = this.measure;
    if (!measure) return;
    const fullControls = (measure.securityControl || [])
      .map((id: number) => this.securityControlList.find(ctrl => ctrl.id === id))
      .filter(Boolean);
    this.measureForm.patchValue({
      measureDescription: this.measure.measureDescription || '',
      standard: this.measure.standard || '',
      controlCategory: this.measure.controlCategory || '',
      controlDescription: this.measure.controlDescription || '',
      riskEffect: this.measure.riskEffect || '',
      residualRisk: this.measure.residualRisk || ''
    });
    this.filteredSecurityControlList = [...this.securityControlList];
    this.isViewMode = false;
    this.measureId = measure.id;
  }
  async onSearchControl(query: string) {
    const q = query.toString().toLowerCase();
    this.filteredSecurityControlList = this.securityControlList.filter((p: any) =>
      (p.name).toLowerCase().includes(q)
    );
  }
  onAddOption(event: any, name: string) {
    if (event.isUserInput) {
      this.addNewSecurityControl(name)
    }
  }

  get measureDescriptionControl(): FormControl {
    return this.measureForm.get('measureDescription') as FormControl;
  }

  selectControl(securityControlName: any) {
    if (!securityControlName) return;
    const current = this.securityControl.value || [];
    if (!current.some((p: any) => p.id === securityControlName.id)) {
      this.securityControl?.setValue([...current, securityControlName]);
    }
    this.securityControlInput.setValue('');
    this.searchTerm = '';
    this.filteredSecurityControlList = [...this.securityControlList];
  }
  get securityControl(): FormControl {
    return this.measureForm.get('securityMeasures') as FormControl;
  }
  get measureType(): FormControl {
    return this.measureForm.get('measureType')?.value;
  }
  async addNewSecurityControl(name: string) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) return;
    try {
      const newControl = await this.configApiHelperService.addSecurityControls({ name: trimmed });
      if (newControl) {
        this.securityControlList = [...this.securityControlList, newControl];
        this.filteredSecurityControlList = [...this.securityControlList];
        await this.securityControlService.addSecurityControl(newControl)
        const control = this.securityControl;
        const current = control?.value || [];
        const SecurityControl = current.filter((p: any) => typeof p === 'object' && p?.id);
        control?.setValue([...SecurityControl, newControl]);
      }
      this.searchTerm = '';
    } catch (e) {
      console.error('Error while adding security control', e);
    }
  }
  removeControl(security: any) {
    const updated = (this.securityControl.value || []).filter((p: any) => p.id !== security.id);
    this.securityControl.setValue(updated);
  }
  isExistingControl(name: string): boolean {
    return this.securityControlList.some((p: any) => p.name === name);
  }
  displaySecurityName(security: any): string {
    return security?.name || '';
  }
  get selectedRisk() {
    return this.measureForm.get('measureType')?.value;
  }
  async save() {
    if (!this.measureForm?.valid) return;
    this.saveLoading = true
    const formValue = this.measureForm.value;
    const payload = {
      // measureType: formValue.measureType,
      measureDescription: formValue.measureDescription || '', // measureType: [''],
      standard: formValue.standard || '',
      controlCategory: formValue.controlCategory || '',
      controlDescription: formValue.controlDescription || '',
      riskEffect: formValue.riskEffect || '',
      residualRisk: formValue.residualRisk || '',
      // securityControls: (formValue.securityMeasures || []).map((ctrl: any) => ctrl.id)
    };
    const riskId = this.risk?.id;
    const measureId = this.measure?.id;
    try {
      let updatedMeasure;
      if (measureId) {
        updatedMeasure = await this.apiHelperService.updateRiskMeasure(payload, riskId, measureId);
      } else {
        updatedMeasure = await this.apiHelperService.addMeaures(payload, riskId);
      }
      this.onApplyChanges.emit(updatedMeasure);
      this.onApproveChange.emit();
      this.saveLoading = false
      setTimeout(() => {
        this.onCloseDrawer.emit(true);
      }, 500);
    } catch (error) {
      this.saveLoading = false
      console.error('Error saving measure:', error);
    }
  }
  async view() {
    const res = await this.apiHelperService.viewMeasure(this.riskId);// pass id
    if (res?.measures) {
      const measure = res?.measure;
      const fullControls = (measure.securityControl || []).map((id: number) =>
        this.securityControlList.find(ctrl => ctrl.id === id)
      ).filter(Boolean);
      this.measureForm.patchValue({
        measureType: measure.measureType,
        measureDescription: measure.measureDescription || '',
        securityMeasures: (measure.securityControl || [])
      });
    }
  }
  async onApproveMeasure(operation: 'APPROVED' | 'REJECTED', riskId: number, measureId: number) {
    if (operation === 'APPROVED') this.approveLoading = true;
    else this.rejectLoading = true;
    try {
      await this.apiHelperService.approveMeasure(operation, null, riskId, measureId);
      this.onApproveChange.emit();
      this.closeDrawer();
    } catch (error) {
      console.error('Error approving measure:', error);
    } finally {
      this.approveLoading = false;
      this.rejectLoading = false;
    }
  }
  get approvalStatus() {
    return this.measure?.status === "APPROVED" || this.measure?.status === 'REJECTED';
  }
}
