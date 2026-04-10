import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatInput, MatInputModule, MatLabel, MatPrefix, MatSuffix } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from "@angular/material/dialog";
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { BpaDataSubject, BpaDepartment, Country, Purpose } from '@admin-core/models/data-inventory/BPA';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { ScrollDispatcher, ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgClass } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { v1 as uuidv1 } from 'uuid';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ADMIN_USER, INTERNAL_USER } from '@admin-core/constants/constants';
import { USER_PURPOSE } from '@admin-core/constants/api-constants';
import { firstValueFrom } from 'rxjs';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { UserService } from '@admin-core/services/user/user.service';
import { CustomMatErrorComponent } from "@valura-lib/components//custom-mat-error/custom-mat-error.component";
import { User } from '@admin-core/models/user.model';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
import { AddCategoryDialogComponent } from '@admin-page/data-discovery/data-discovery-dialog/add-category-dialog/add-category-dialog.component';
@Component({
  selector: 'app-overview-tab',
  imports: [ReactiveFormsModule, CustomMatTextareaComponent, FormsModule, CommonModule, MatFormFieldModule, MatLabel, MatInputModule, MatButtonModule, MatSelect, MatOptionModule, MatIconModule, MatChipsModule, MatAutocompleteTrigger, MatAutocomplete, MatButtonModule, MatIconModule, NgClass, MatDivider, MatSliderModule, CustomMatErrorComponent, MatCheckboxModule],

  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss',
})
export class OverviewTabComponent {

  @Input() formGroup!: FormGroup;
  @Input() departments!: any[];
  @Input() countryMasterList!: any[];
  @Input() purposeList!: any;
  @Input() regulations: any[] = [];
  @Input() editMode!: boolean;
  @Input() dataSubjectUserTypesList!: any[];
  @Input() actsWithLegalBasis: any[] = [];
  @Input() dataUpdated!: string;
  @Input() viewMode!: boolean;
  @Output() goToDataElements = new EventEmitter<void>();
  @Output() onDataSubjectChange = new EventEmitter<any>();
  @Output() onRemovePurpose = new EventEmitter<any>();

  newAssociatedDepartment: any[] = [];
  newPurposeList: any[] = [];

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return `${value}`;
  }

  get nameControl(): FormControl {
    return this.formGroup.get('name') as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.formGroup.get('description') as FormControl;
  }

  get ownerControl(): FormControl {
    return this.formGroup.get('owner') as FormControl;
  }
  formatPowerLabel = (index: number): string => {
    const value = this.getPowerValue(index);
    if (value === 0) return '0';
    if (value >= 1_000_000_000) return (value / 1_000_000_000) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000) + 'M';
    if (value >= 1_000) return (value / 1_000) + 'K';
    return value.toString();
  };
  onMinSliderChange(index: number): void {
    this.formGroup.get('minValue')?.setValue(this.getPowerValue(index));
  }

  onMaxSliderChange(index: number): void {
    this.formGroup.get('maxValue')?.setValue(this.getPowerValue(index));
  }
  getIndexFromValue(value: number): number {
    if (value === 0) return 0;
    const logValue = Math.log10(value);
    const closestIndex = Math.round(logValue);
    return Math.max(0, Math.min(10, closestIndex));
  }


  getPowerLabel(index: number): string {
    return this.formatPowerLabel(index);
  }

  getPowerValue(index: number): number {
    if (index === 0) return 0;
    return Math.pow(10, index);
  }

  roles: string[] = ['Manager', 'Analyst', 'Developer', 'Auditor'];
  respondentEmails: string[] = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
  tooltip = "Data Usage\n This data is collected solely for identification purpose";
  frequencies: string[] = ['One Time', 'Monthly', 'Yearly', 'Continuous'];
  volumeOfData = ['<1000', '1000-10000', '10000-100000', '>100000'];
  formControls: { [regId: number]: FormControl } = {};
  filteredPurposeList: any[] = []
  searchTerm = '';
  showAddIcon = false;
  departmentSearchTerm = ''
  legalBasisList: any[] = [];
  filteredDepartmentList: any[] = []
  legalBasesMap: { [regId: number]: any[] } = {};
  selectedRegulations: { reg: any; base: any }[] = [];
  selectedRegulationsLabel = '';
  currentRegId: number | null = null;
  currentLegalBases: any[] = [];
  selectedMap: { [regId: number]: Set<number> } = {};
  regulationList: any[] = [];
  activeSection = 'basicDetails';
  filteredOwnerList: any[] = [];
  owners: any[] = [];
  selectedOwner: any = null;

  private isScrollingProgrammatically = false;

  readonly addOnBlur = true;
  private apiHelperService = inject(ApiHelperService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private bpaService = inject(BpaService);
  private createBpaService = inject(CreateBpaService);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService)

  constructor(public dialog: MatDialog, private cdr: ChangeDetectorRef, private scroll: ScrollDispatcher) { }

  @ViewChild(MatAutocompleteTrigger) trigger!: MatAutocompleteTrigger;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['departments']) {
      this.newAssociatedDepartment = this.createBpaService.newAssociatedDepartment;
      this.filteredDepartmentList = [...this.departments, ...this.newAssociatedDepartment]
    }
    if (changes['purposeList']) {
      this.newPurposeList = this.createBpaService.newPurposesList;
      this.filteredPurposeList = [...this.purposeList, ...this.newPurposeList]
    }
    if (changes['countryMasterList'] && this.countryMasterList) {
      this.filteredCountryList = [...this.countryMasterList];
    }
    if (changes['formGroup']) {
      if (this.formGroup.get('regulations')?.value) {
        const reg = this.formGroup.get('regulations')?.value;
        const legal = this.formGroup.get('legalBasis')?.value;
        if (this.legalBasisList?.length) {
          this.onRegulationChange(reg);
          this.selectedBases = legal;
        } else {
          this.getLegalBasisList();
        }
      }
    }
  }
  async getLegalBasisList() {
    const res = await this.bpaService.getLegalBasisList();
    if (res) {
      this.legalBasisList = res || [];
    }

    return;
  }

  async ngAfterViewInit() {

    await this.getOwnerList()
    await this.getLegalBasisList();
    const reg = this.formGroup.get('regulations')?.value;
    const legal = this.formGroup.get('legalBasis')?.value;
    if (reg) this.onRegulationChange(reg);
    if (legal) this.onLegalBasesChange(legal);
    const container = this.scrollContainer.nativeElement;
    container.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }


  scrollToSection(sectionId: string) {
    this.activeSection = sectionId;
    const container = this.scrollContainer.nativeElement;
    const target = container.querySelector('#' + sectionId) as HTMLElement;
    if (!target) return;

    const containerTop = container.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top - 8;
    const currentScroll = container.scrollTop;
    const offset = currentScroll + (targetTop - containerTop);

    this.isScrollingProgrammatically = true;

    container.scrollTo({
      top: offset,
      behavior: 'smooth',
    });

    setTimeout(() => {
      this.isScrollingProgrammatically = false;
    }, 500);
  }

  onScroll() {
    if (this.isScrollingProgrammatically) return;

    const container = this.scrollContainer.nativeElement as HTMLElement;
    const scrollPosition = container.scrollTop;

    const sections = container.querySelectorAll('.scroll-section') as NodeListOf<HTMLElement>;

    for (const sec of sections) {
      const sectionTop = sec.offsetTop;
      const sectionHeight = sec.offsetHeight;

      if (scrollPosition >= sectionTop - 100 && scrollPosition < sectionTop + sectionHeight - 100) {
        this.activeSection = sec.id;
        break;
      }
    }
  }


  onSelectionChange(select: MatSelect) {
    select.close();
  }

  loadFromForm() {
    const saved = this.formGroup.get('regulations')?.value || [];
    this.selectedRegulations = saved.map((r: any) => {
      const reg = this.regulationList.find((x: { id: any; }) => x.id === r.regId || r.id);
      const base = (this.legalBasesMap[r.regId] || []).find(b => b.id === r.baseId || r.id);
      return { reg, base };
    });

    this.selectedMap = {};
    for (const sel of this.selectedRegulations) {
      if (!this.selectedMap[sel?.reg?.id]) {
        this.selectedMap[sel?.reg?.id] = new Set<number>();
      }
      this.selectedMap[sel?.reg?.id].add(sel?.base?.id);
    }

    this.updateSelectedRegulationsLabel();
  }

  onCancel() {

  }

  onSave() {
    this.goToDataElements.emit();
  }

  async onSearchPurpose(query: any) {
    let raw = '';
    if (typeof query === 'string') raw = query;
    else if (query && typeof query === 'object') {
      raw = (query.purposeName ?? query.name ?? '').toString();
    } else raw = '';

    const q = raw.trim().toLowerCase();
    if (!Array.isArray(this.purposeList)) {
      this.filteredPurposeList = [];
      this.showAddIcon = q.length > 0;
      return;
    }

    this.filteredPurposeList = this.purposeList.filter((p: any) =>
      (p.purposeName ?? '').toLowerCase().includes(q)
    );

    this.showAddIcon = q.length > 0 && this.filteredPurposeList.length === 0;
  }

  selectPurpose(purposeOrName: any) {
    let purposeObj: any = typeof purposeOrName === 'string'
      ? this.purposeList.find((p: any) => p.purposeName === purposeOrName)
      : purposeOrName;

    if (!purposeObj) return;

    const control = this.formGroup.get('purposePurpose');
    const current = control?.value || [];
    if (!current.some((p: any) => p.id === purposeObj.id)) {
      control?.setValue([...current, purposeObj]);
    }

    this.searchTerm = purposeObj.purposeName || '';
    this.filteredPurposeList = [...this.purposeList];
    this.showAddIcon = false;
    if (typeof purposeObj.id === 'string') {
      this.createBpaService.onCreateOrUpdatePurpose(purposeObj);
    }
  }


  removePurpose(purpose: any) {
    this.onRemovePurpose.emit({ purpose: purpose })
  }

  onAddNewRegion() {
    const tempDataSubjectRegion = this.tempDataSubjectRegion?.value as Country;
    let newDataSubjectRegionList: Country[] = this.dataSubjectRegion.value?.length ? this.dataSubjectRegion.value : [];
    let find = newDataSubjectRegionList?.find((newCountry: Country) => newCountry.id == tempDataSubjectRegion.id);
    if (!find) {
      newDataSubjectRegionList.push(tempDataSubjectRegion)
    }
    this.dataSubjectRegion.setValue(newDataSubjectRegionList);
    this.tempDataSubjectRegion.setValue('')
  }

  // Inside OverviewTabComponent class
  filteredCountryList: any[] = [];

  onCountrySearch(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredCountryList = [...this.countryMasterList];
      return;
    }
    this.filteredCountryList = this.countryMasterList.filter(c =>
      c.name.toLowerCase().includes(q)
    );
  }

  removeCountry(country: any) {
    const control = this.dataSubjectRegion;
    const updated = (control.value || []).filter(
      (c: any) => c.id !== country.id
    );

    control.setValue(updated);
    control.markAsDirty();

    // this.createBpaService.onDeleteRegion(country);
  }


  isCountrySelected(country: any): boolean {
    const selected = this.dataSubjectRegion.value || [];
    return selected.some((c: any) => c.id === country.id);
  }

  isDataSubjectSelected(dsType: any): boolean {
    const selected = this.dataSubjectList.value || [];
    return selected.some((s: any) => s.id === dsType.id);
  }

  onDataSubjectChangeWrapper() {
    this.onDataSubjectChange.emit({ type: 'add' });
  }

  onCountryOpened(opened: boolean, input: HTMLInputElement) {
    if (opened) {
      input.value = '';
      this.filteredCountryList = [...this.countryMasterList];
    }
  }

  toggleCountry(country: any, event: MouseEvent) {
    event.stopPropagation();

    const control = this.dataSubjectRegion;
    const current = control.value || [];

    const exists = current.some((c: any) => c.id === country.id);

    const updated = exists
      ? current.filter((c: any) => c.id !== country.id)
      : [...current, country];

    control.setValue(updated);
    control.markAsDirty();
  }

  removeType(dataSubjectType: any) {
    const control = this.dataSubjectList;
    const updated = (control.value || []).filter((c: any) => c.id !== dataSubjectType.id);
    control.setValue(updated);
    control.markAsDirty();
    this.onDataSubjectChange.emit({ type: 'delete', dataSubjectType: dataSubjectType });
  }


  async addNewPurpose(name: string) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) return;

    const newPurpose = await this.apiHelperService.addPurpose({ purposeName: trimmed });
    this.purposeList = this.purposeList || [];
    this.purposeList.push(newPurpose);
    this.filteredPurposeList = [...this.purposeList];
    const control = this.formGroup.get('purposePurpose');
    const current = control?.value || [];
    control?.setValue([...current, newPurpose]);
    this.searchTerm = '';
    this.showAddIcon = false;
  }

  removeRegulation(sel: { reg: any; base: any }) {
    this.selectedRegulations = this.selectedRegulations.filter(
      r => !(r?.reg?.id === sel?.reg?.id && r?.base?.id === sel?.base?.id)
    );
    this.selectedRegulationsLabel = this.selectedRegulationsLabel.replace(`${sel?.reg?.name} - ${sel?.base?.name}`, '').replace(/,\s*,/g, ',').replace(/^,\s*|\s*,\s*$/g, '');
    if (this.selectedMap[sel?.reg?.id]) {
      this.selectedMap[sel?.reg?.id].delete(sel?.base?.id);
      if (this.selectedMap[sel?.reg?.id].size === 0) {
        delete this.selectedMap[sel?.reg?.id];
      }
    }
    this.updateSelectedRegulationsLabel();
    this.formGroup.get('overview.regulations')?.setValue(this.selectedRegulations);
    this.formGroup.get('overview.regulations')?.markAsDirty();
  }


  clearSelectedPurpose() {
    this.searchTerm = ''
    this.filteredPurposeList = this.purposeList
    this.showAddIcon = false;
  }


  openLegalBases(reg: { id: number; name: string }) {
    this.currentRegId = reg.id;
    this.currentLegalBases = this.legalBasesMap[reg.id] ?? [];
  }

  isSelected(regId: number | null, baseId: number) {
    return (regId != null && this.selectedMap[regId] && this.selectedMap[regId].has(baseId));
  }

  selectedCountForReg(regId: number) {
    return this.selectedMap[regId] ? this.selectedMap[regId].size : 0;
  }

  getBaseById(regId: number, baseId: number) {
    return (this.legalBasesMap[regId] || []).find(b => b.id === baseId);
  }


  toggleLegalBase(regId: number | null, base: any) {
    if (regId == null) return;
    if (!this.selectedMap[regId]) {
      this.selectedMap[regId] = new Set<number>();
    }
    const set = this.selectedMap[regId];

    if (set.has(base.id)) {
      set.delete(base.id);
      this.selectedRegulations = this.selectedRegulations.filter(
        r => !(r.reg.id === regId && r.base.id === base.id)
      );
    } else {
      set.add(base.id);
      const reg = this.regulationList.find((r: { id: number }) => r.id === regId);
      this.selectedRegulations.push({ reg, base });
    }

    this.updateSelectedRegulationsLabel();

    this.formGroup.get('regulations')?.setValue(
      this.selectedRegulations.map(r => ({
        regId: r?.reg?.id,
        baseId: r?.base?.id
      }))
    );

  }


  updateSelectedRegulationsLabel() {
    const labels: string[] = [];
    if (Array.isArray(this.regulationList)) {
      for (const reg of this.regulationList) {
        const selected = this.selectedMap[reg.id];
        if (selected && selected.size > 0) {
          for (const baseId of selected) {
            const base = this.getBaseById(reg.id, baseId);
            if (base) labels.push(`${reg.name} - ${base.name}`);
          }
        }
      }
    }
    this.selectedRegulationsLabel = labels.join(', ');
  }

  msCompareFn(objOne: BpaDataSubject, objTwo: BpaDataSubject) {
    return objOne.id === objTwo.id;
  }

  compareDataSubjectRegion(o1: any, o2: any) {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  compareLegalBasis(o1: any, o2: any) {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  compareRegulations(o1: any, o2: any) {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  isPurposeExist(name: string): boolean {
    return this.purposeList?.some((p: any) => (p.purposeName ?? '').toLowerCase() === name.toLowerCase());
  }


  compareDept = (o1: BpaDepartment, o2: BpaDepartment) =>
    o1 && o2 ? o1.id === o2.id : o1 === o2;


  onSearchDepartment(term: string) {
    this.departmentSearchTerm = term;
    const allDepartments = [...this.departments, ...this.newAssociatedDepartment];

    this.filteredDepartmentList = allDepartments.filter(d =>
      d.name.toLowerCase().includes(term.toLowerCase())
    );
  }


  selectDepartment(department: any) {
    if (!department) return;
    this.formGroup.get('departmentId')?.setValue(department);
    this.departmentSearchTerm = department.name;
    this.filteredDepartmentList = [
      ...this.departments,
      ...this.newAssociatedDepartment
    ];
  }


  async onAddDepartment(event: any, name: string) {
    if (!event.isUserInput) return;
    const newDep = await this.apiHelperService.addDepartment({ name, description: '' });
    if (newDep) {
      this.departments.push(newDep);
      this.formGroup.get('departmentId')?.setValue(newDep);
      this.departmentSearchTerm = newDep.name;
      this.filteredDepartmentList = [...this.departments];
    }
  }


  get departmentControl(): FormControl {
    return this.formGroup.get('departmentId') as FormControl;
  }

  displayDepartmentName(department: any): string {
    return department?.name || '';
  }

  async onDeleteDepartment(department: any) {
    const res = await this.dataInventoryApiHelperService.deleteDepartment(department.id);
    if (res) {
      this.cdr.detectChanges()
      this.departments = this.departments.filter((d: { id: any; }) => d.id !== department.id);
      this.filteredDepartmentList = [...this.departments];
    }
  }

  isExistingDepartment(name: string): boolean {
    return this.departments?.some((dep: any) => dep.name.toString().toLowerCase() === name.toString().toLowerCase()) || false;
  }

  get peopleInvolvedControls() {
    return (this.formGroup.get('peopleInvolved') as FormArray).controls;
  }

  getArray(controlName: string): FormArray {
    return this.formGroup.get(controlName) as FormArray;
  }

  // addRole(type: string, value: string) {
  //   if (!value || !value.trim()) return;
  //   this.getArray(type).push(new FormControl(value.trim()));
  //   this.updateControllerMappings();
  // }

  updateControllerMappings(type: string, name: string, action: 'add' | 'edit' | 'delete', oldName?: string) {
    const control = this.formGroup.get('controllerMappings');
    if (!control) return;

    const mappings = control.value || [];

    if (action === 'add') {
      mappings.push({
        type,
        name,
        isDeleted: false,
        isUpdated: false
      });
    }

    if (action === 'edit') {
      const mapping = mappings.find((m: any) => m.name === oldName && m.type === type);
      if (mapping) {
        mapping.name = name;
        mapping.isUpdated = true;
      }
    }

    if (action === 'delete') {
      const mapping = mappings.find((m: any) => m.name === name && m.type === type);
      if (mapping) {
        mapping.isDeleted = true;
      } else {
        mappings.push({ type, name, isDeleted: true, isUpdated: false });
      }
    }

    control.setValue(mappings);
  }


  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly announcer = inject(LiveAnnouncer);

  addRoleFromChipInput(type: string, event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) return;

    const formArray = this.getArray(type);
    if (formArray.value.includes(value)) return;

    formArray.push(new FormControl(value));

    if (this.editMode) this.updateControllerMappings(type, value, 'add');
    this.announcer.announce(`Added ${type} ${value}`);
    event.chipInput?.clear();
  }

  removeRole(type: string, index: number): void {
    const formArray = this.getArray(type);
    const removed = formArray.at(index)?.value;
    formArray.removeAt(index);

    if (this.editMode) this.updateControllerMappings(type, removed, 'delete');
    this.announcer.announce(`Removed ${type} ${removed}`);
  }

  editRole(type: string, index: number, event: MatChipEditedEvent): void {
    const value = event.value.trim();
    const formArray = this.getArray(type);
    const oldValue = formArray.at(index).value;

    if (!value) {
      this.removeRole(type, index);
      return;
    }

    formArray.at(index).setValue(value);

    if (this.editMode) this.updateControllerMappings(type, value, 'edit', oldValue);
    this.announcer.announce(`Edited ${type} ${value}`);
  }



  selectedRegId!: number | null;
  selectedBases: number[] = [];



  onRegulationChange(selectedRegId: any, isValueChanged: boolean = false): void {
    this.selectedRegId = selectedRegId.id;
    if (isValueChanged) {
      this.formGroup.get('legalBasis')?.setValue('');
    }
    this.currentLegalBases = this.legalBasisList.filter(
      (b) => b.actId === this.selectedRegId
    );
    this.selectedBases = [];
  }

  onLegalBasesChange(selected: any): void {
    this.selectedBases = selected.id;
  }

  openAddDialog(type: 'purpose' | 'department', initialName: string): void {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      width: '400px',
      panelClass: 'dialog-wrapper',

      data: { type }
    });

    dialogRef.componentInstance.form.patchValue({ name: initialName });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        this.departmentSearchTerm = '';
        this.filteredDepartmentList = [...this.departments, this.createBpaService.newAssociatedDepartment];
        return;
      }

      if (type === 'purpose') {
        this.newPurposeList = this.createBpaService.newPurposesList;

        this.filteredPurposeList = [
          ...this.purposeList,
          ...this.newPurposeList
        ];
        const control = this.formGroup.get('purposePurpose');
        const current = control?.value || [];
        control?.setValue([...current, result]);

        this.searchTerm = '';
      }
      else if (type === 'department') {
        this.newAssociatedDepartment = this.createBpaService.newAssociatedDepartment || [];

        this.filteredDepartmentList = [
          ...this.departments,
          ...this.newAssociatedDepartment
        ];
        this.formGroup.get('departmentId')?.setValue(result);
        this.departmentSearchTerm = result.name;
      }
    });
  }

  onAddNewDataSubject() {
    const tempDataSubject = this.tempDataSubject?.value as BpaDataSubject;
    let newDataSubjectList: BpaDataSubject[] = this.dataSubjectList.value?.length ? this.dataSubjectList.value : [];
    let find = newDataSubjectList?.find((newDs: BpaDataSubject) => newDs.id == tempDataSubject.id);
    if (!find) {
      newDataSubjectList.push(tempDataSubject)
    }
    this.dataSubjectList.setValue(newDataSubjectList);
    this.tempDataSubject.setValue('')
    this.onDataSubjectChange.emit({ type: 'add' })
  }

  get dataSubjectRegionText() {
    const list = this.formGroup.get('dataSubjectRegion')?.value || [];
    return list.length ? list.map((x: any) => x.name).join(', ') : '—';
  }

  get dataSubjectTypeText() {
    const list = this.formGroup.get('dataSubjectList')?.value || [];
    return list.length ? list.map((x: any) => x.name).join(', ') : '—';
  }

  get dataSubjectList() {
    return this.formGroup.get('dataSubjectList') as FormControl
  }

  get tempDataSubject() {
    return this.formGroup.get('tempDataSubject') as FormControl
  }

  get dataSubjectRegion() {
    return this.formGroup.get('dataSubjectRegion') as FormControl
  }

  get tempDataSubjectRegion() {
    return this.formGroup.get('tempDataSubjectRegion') as FormControl
  }

  addTypedPurpose(event: MatChipInputEvent) {
    const input = event.input;
    const value = (event.value || '').trim();

    if (!value) return;

    const exists = this.purposeList.some((p: any) =>
      p.purposeName.toLowerCase() === value.toLowerCase()
    ) || this.newPurposeList.some((p: any) =>
      p.purposeName.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      const newObj: any = {
        id: uuidv1(),
        purposeName: value,
      };


      this.createBpaService.onCreateOrUpdatePurpose(newObj);
      this.newPurposeList = this.createBpaService.newPurposesList;

      this.filteredPurposeList = [
        ...this.purposeList,
        ...this.newPurposeList
      ];
      const control = this.formGroup.get('purposePurpose');
      const current = control?.value || [];
      control?.setValue([...current, newObj]);
    }

    if (input) input.value = '';
    this.searchTerm = '';
  }


  filterOwners(value: string) {
    if (!value || typeof value !== 'string') {
      value = '';
    }

    const filterValue = value.toLowerCase();

    this.filteredOwnerList = this.owners.filter(o =>
      (o.displayName || '').toLowerCase().includes(filterValue) ||
      (o.email || '').toLowerCase().includes(filterValue)
    );
  }

  displayOwner(owner: any): string {
    return owner?.displayName || owner?.email || '';
  }

  isOwnerExist(value: string) {
    return this.owners.some(o => o.email?.toLowerCase() === value.toLowerCase());
  }


  onOwnerInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterOwners(value);
  }

  isApproverExist(value: string) {
    return this.owners.includes(value);
  }

  async getOwnerList() {
    try {
      const data = await this.userService.getAllUserMasterList(false, [ADMIN_USER, INTERNAL_USER]);

      this.owners = data;
      this.filteredOwnerList = [...this.owners];
    }
    catch (e) {
      console.error('Error loading owners', e);
    }
  }

  onOwnerSelected(event: MatAutocompleteSelectedEvent) {
    const user = event.option.value;

    const selectedUser = {
      userId: user.applicationUserId,
      displayName: user.displayName || user.email,
      userType: user.userType
    };

    this.selectedOwner = selectedUser;

    this.formGroup.patchValue({
      owner: selectedUser
    });

    this.selectedOwner = selectedUser;
  }



  async addNewUser(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      this.snackbarService.openSnack("Please enter a valid email");
      return;
    }

    try {
      const res = await firstValueFrom(this.apiHelperService.getOrCreateInternalUser({ email, purpose: USER_PURPOSE.BPA_PROCESS_OWNER }));

      if (res?.success) {
        const newUser = {
          userId: res.data.applicationUserId,
          displayName: res.data.displayName || email.split('@')[0],
          email: email,
          userType: 'INTERNAL_USER'
        };
        const user = this.userService.createNewUserObj(newUser.userId, email, newUser.displayName, newUser.userType)
        this.userService.addInternalUser(user)
        this.owners.push(newUser);
        this.filteredOwnerList = [...this.owners];
        this.formGroup.patchValue({ owner: newUser });


        this.snackbarService.openSnack("User added successfully");
      }

    } catch (err) {
      this.snackbarService.openSnack("User creation failed");
    }
  }

  getOwnerName(owner: any): string {
    return owner?.displayName || owner?.email || '';
  }

  getDisplayName(user: User) {
    return user.displayName ? user.displayName : (user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : (user.email ?? ''));
  }

}


