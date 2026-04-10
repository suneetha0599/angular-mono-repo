import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatInput, MatLabel, } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect, MatSelectChange } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { BpaCategory, PdElementMapping } from '@admin-core/models/data-inventory/BPA';
import { NgClass } from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import { BPA_TYPE, BpaRecepient, RECEPIENT_LIST } from '../constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from "@valura-lib/service/snackbar/snackbar.service";
import { ApiHelperService as DataInventoryApiHelperService } from "@admin-core/services/network/data-inventory/api-helper.service";
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';

export interface RecipientEntry {
  type: any;
  recipient: any;
  purpose: any;
  numberOfPersonHavingAccess: number;
  pdElementMappingList: any;
}


interface SelectedSourceData {
  recipient: BpaRecepient;
  type: string;
  purpose: string;
  selected: boolean;
  numberOfPersonHavingAccess: number;
  pdElements: PdElementMapping[];
  totalSelectedCount: number;
}

@Component({
  selector: 'bpa-drawer-recipients',
  imports: [
    LoadingButtonComponent,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatIcon,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    NgClass,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef,
    MatIconButton,
  ],
  templateUrl: './bpa-drawer-recipients.component.html',
  styleUrl: './bpa-drawer-recipients.component.scss'
})
export class BpaDrawerRecipientsComponent {
  @Input() createBpaForm!: FormGroup;
  @Input() departments!: any[];
  @Input() isPdElementsEditMode!: boolean;
  @Input() selectedRecipients!: any;
  @Input() pdElementsMappingList: PdElementMapping[] = [];
  @Output() onCloseDrawer = new EventEmitter<any>();
  @Output() onApplyChanges = new EventEmitter<any>();

  protected readonly bpaType = BPA_TYPE;
  filteredDepartments: any[] = [];
  departmentSearch = '';
  vendorSearch = '';
  thirdSearch = '';
  selectedDepartment: any;
  filteredVendors: any[] = [];
  filteredThirdParties: any[] = [];
  purpose: any;
  numberOfPersonHavingAccess: number | null = null;
  selectedVendor: any;
  selectedThirdParty: any;
  showAddPdElementInput: boolean = false;
  showTable = false;
  recipientsList = RECEPIENT_LIST
  BpaRecepient = BpaRecepient
  displayRecipients: FormGroup[] = [];
  displayedColumns: string[] = [];
  pdElementForm!: FormGroup;
  protected isSubmitPdElementLoading = false;
  originalPdElements: PdElementMapping[] = [];

  private bpaService = inject(BpaService);
  private apiHelperService = inject(ApiHelperService)
  private snackbarService = inject(SnackbarService);
  cdr = inject(ChangeDetectorRef);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);

  constructor(private fb: FormBuilder) {
    this.pdElementForm = this.fb.group({
      pdElementName: ['', Validators.required],
      pdElementCategory: [null, Validators.required],
      dataSubject: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.resetRecipientSelection();
    this.loadPdCategories();
    this.displayedColumns = ['select', 'name', 'dataSubject', 'category']

  }
  ngOnChanges(changes: SimpleChanges) {

    if (changes['isPdElementsEditMode']) {
      if (changes['isPdElementsEditMode'].currentValue === true) {
        this.setupPdElementsEditMode();
      } else if (changes['isPdElementsEditMode'].currentValue === false) {
        this.isPdElementsEditMode = false;
        this.originalPdElements = [];
      }
    }
  }

  setupPdElementsEditMode() {
    this.isPdElementsEditMode = true;

    if (!this.selectedRecipients || this.selectedRecipients.length === 0) return;

    const mapping = this.selectedRecipients[0];
    const recipient = mapping.recipient;

    const pdElementMappingList = this.createEditablePdElements(mapping.pdElementMappingList || []);

    const recipientData: SelectedSourceData = {
      recipient: recipient,
      type: mapping.type || '',
      purpose: mapping.purpose || '',
      selected: true,
      numberOfPersonHavingAccess: mapping.numberOfPersonHavingAccess || '',
      pdElements: pdElementMappingList,
      totalSelectedCount: pdElementMappingList.filter(e => e.selected).length
    };


    (recipientData as any).pdElementMappingList = pdElementMappingList;

    this.selectedRecipients = [recipientData];
    this.originalPdElements = JSON.parse(JSON.stringify(pdElementMappingList));
  }


  private createEditablePdElements(selectedPdElements: PdElementMapping[], newPdElements: PdElementMapping[] = []): PdElementMapping[] {
    const existingElements = this.pdElementsMappingList || [];


    const allElements = [...existingElements, ...newPdElements];

    if (!allElements || allElements.length === 0) {
      return [];
    }

    return allElements.map(element => {

      const wasSelected = selectedPdElements.find(selected =>
        selected.pdElement?.id === element.pdElement?.id &&
        selected.dataSubject?.id === element.dataSubject?.id
      );

      return {
        ...element,
        selected: !!wasSelected,
        dataSubject: element.dataSubject
      };
    });
  }

  onPdElementSelectionChange(pdElement: PdElementMapping, checked: boolean) {
    if (this.isPdElementsEditMode) {
      pdElement.selected = checked;

      if (this.selectedRecipients.length > 0) {
        const recipientData = this.selectedRecipients[0];
        recipientData.totalSelectedCount = recipientData.pdElements.filter((element: { selected: any; }) => element.selected).length;
      }
    }
  }

  cancelAddNewPdElement() {
    this.showAddPdElementInput = false;
    this.pdElementForm.reset();
    this.cdr.detectChanges();
  }

  showAddNewPdElement() {
    this.showAddPdElementInput = true;
    this.cdr.markForCheck();
  }

  async savePdElement() {
    if (this.pdElementForm.invalid) {
      this.snackbarService.openSnack(`Please fill the required details!`);
      return;
    }

    const dataSubject = this.pdElementForm.get('dataSubject')?.value;
    const body = {
      name: this.pdElementForm.get('pdElementName')?.value ?? '',
      categoryId: this.pdElementForm.get('pdElementCategory')?.value ?? 0,
    };

    this.isSubmitPdElementLoading = true;

    try {
      const newElement = await this.dataInventoryApiHelperService.addNewPdElements(body).toPromise();


      if (this.displayRecipients?.length > 0) {
        const recipientGroup = this.displayRecipients[0]
        const pdArray = recipientGroup.get('pdElementMappingList') as FormArray;

        pdArray.push(
          this.fb.group({
            selected: [true],
            pdElement: [newElement],
            dataSubject: dataSubject,
            purpose: ['']
          })
        );
      }


      if (this.isPdElementsEditMode && this.selectedRecipients?.length > 0) {
        this.selectedRecipients[0].pdElementMappingList.push({
          selected: true,
          pdElement: newElement,
          dataSubject: dataSubject,
          purpose: ''
        });
      }

      this.onSavePdElements();
      this.isSubmitPdElementLoading = false;
      this.cancelAddNewPdElement();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to add PD element:', error);
      this.isSubmitPdElementLoading = false;
    }
  }



  close() {
    this.resetRecipientSelection();
    this.cancelAddNewPdElement();
    this.onCloseDrawer.emit(true);
  }


  onRecipientsChange(event: MatSelectChange) {
    if (event.value.key === BpaRecepient.DEPARTMENT) this.filterDepartments();
    if (event.value.key === BpaRecepient.VENDOR) this.filterVendors();
    if (event.value.key === BpaRecepient.THIRD_PARTY) this.filterThirdParties();
  }

  onRecipientSelected() {
    let recipientObj = null;
    let recipientType = '';

    if (this.selectedRecipients?.key === BpaRecepient.DEPARTMENT && this.selectedDepartment) {
      recipientObj = this.selectedDepartment;
      recipientType = BpaRecepient.DEPARTMENT;
    } else if (this.selectedRecipients?.key === BpaRecepient.VENDOR && this.selectedVendor) {
      recipientObj = this.selectedVendor;
      recipientType = BpaRecepient.VENDOR;
    } else if (this.selectedRecipients?.key === BpaRecepient.THIRD_PARTY && this.selectedThirdParty) {
      recipientObj = this.selectedThirdParty;
      recipientType = BpaRecepient.THIRD_PARTY;
    }

    if (recipientObj) {
      this.addRecipient([{ pdElement: null, selected: false, purpose: '', dataSubject: null }], recipientType, recipientObj);
      this.selectedRecipients = null;
      this.selectedDepartment = null;
      this.selectedVendor = null;
      this.selectedThirdParty = null;
      this.vendorSearch = ''
      this.thirdSearch = ''
      this.departmentSearch = ''
      this.showTable = true;
      this.cdr.detectChanges();
    }
  }


  addRecipient(pdElementMappings: any[] = [], type?: string, recipient?: any) {
    if (!recipient || !recipient.name || !type) return;

    const group = this.fb.group({
      selected: [false],
      type: [type || ''],
      recipient: [recipient],
      purpose: [''],
      numberOfPersonHavingAccess: [this.numberOfPersonHavingAccess ?? ''],
      pdElementMappingList: this.fb.array(
        pdElementMappings.map(pd =>
          this.fb.group({
            selected: [false],
            pdElement: [pd.pdElement],
            dataSubject: [pd.dataSubject],
            purpose: [pd.purpose ?? '']
          })
        )
      )
    });

    this.displayRecipients = [...this.displayRecipients, group];

    this.showTable = true;
  }


  clearForm() {
    this.selectedRecipients = null;
    this.selectedDepartment = null;
    this.selectedVendor = null;
    this.selectedThirdParty = null;
    this.departmentSearch = '';
    this.vendorSearch = '';
    this.thirdSearch = '';
    this.filteredDepartments = [];
    this.filteredVendors = [];
    this.filteredThirdParties = [];
    this.purpose = '';
    this.numberOfPersonHavingAccess = null;
    this.displayRecipients = []
  }

  onDepartmentSelected(dept: any) {
    this.selectedDepartment = dept;
    this.onRecipientSelected();
  }

  onVendorSelected(vendor: any) {
    this.selectedVendor = vendor;
    this.onRecipientSelected();
  }

  onThirdPartySelected(tp: any) {
    this.selectedThirdParty = tp;
    this.onRecipientSelected();
  }



  resetRecipientSelection() {
    this.clearRecipientsArray();
    this.clearForm();
    this.showTable = false;
  }


  clearRecipientsArray() {
    this.displayRecipients = [];
  }

  filterDepartments() {
    const search = (this.departmentSearch).toString().toLowerCase();
    this.filteredDepartments = (this.departments || []).filter(d => d.name.toLowerCase().includes(search));
  }

  filterVendors() {
    const search = (this.vendorSearch).toString().toLowerCase();
    this.filteredVendors = (this.vendorList || []).filter((v: { name: string; }) => v.name.toLowerCase().includes(search));
  }

  filterThirdParties() {
    const search = (this.thirdSearch).toString().toLowerCase();
    this.filteredThirdParties = (this.thirdPartyList || []).filter((tp: { name: string; }) => tp.name.toLowerCase().includes(search));
  }

  async addNewThirdParty(name: string) {
    if (!name?.trim()) return;

    try {
      const payload = { name: name.trim(), description: '', type: "CUSTOMER" };
      const newTp = await this.apiHelperService.addThirdParty(payload);

      this.thirdPartyList.push(newTp);
      this.thirdSearch = newTp;
      this.filterThirdParties();

      return newTp;
    } catch (err) {
      console.error('Failed to add third party:', err);
      return null;
    }
  }
  async addNewVendor(name: string) {
    if (!name?.trim()) return;

    try {
      const payload = { name: name.trim(), description: '' };
      const newVendor = await this.apiHelperService.addVendor(payload);

      this.vendorList.push(newVendor.vendorDetail);
      this.vendorSearch = newVendor.name;
      this.filterVendors();

      return newVendor.vendorDetail;
    } catch (err) {
      console.error('Failed to add vendor:', err);
      return null;
    }
  }
  async addNewDepartment(name: string) {
    if (!name?.trim()) return;

    try {
      const payload = { name: name.trim(), description: '' };
      const newDept = await this.apiHelperService.addDepartment(payload);

      this.departments.push(newDept);
      this.departmentSearch = newDept.name;
      this.filterDepartments();

      return newDept;
    } catch (err) {
      console.error('Failed to add department:', err);
      return null;
    }
  }




  onApplyClick(): void {
    const validRecipients = this.displayRecipients.filter(group => group.get('selected')?.value);

    if (validRecipients.length === 0) {
      this.snackbarService.openSnack('Please select at least one recipient.');
      return;
    }
    const recipientsToApply = validRecipients.map(group => {
      const pdElements = group.get('pdElementMappingList')?.value || [];

      return {
        type: group.get('type')?.value,
        recipient: group.get('recipient')?.value,
        purpose: group.get('purpose')?.value || '',
        numberOfPersonHavingAccess: group.get('numberOfPersonHavingAccess')?.value || '',
        pdElementMappingList: pdElements.filter((pd: any) => pd.selected)
      };
    });

    this.onApplyChanges.emit({ recipientMapping: recipientsToApply });
    this.resetRecipientSelection();
  }



  get allPdElementMappings() {
    const dataSubjects = this.createBpaForm.get('dataElements')?.get('dataSubjectPdElementMapping')?.value || [];
    return dataSubjects.flatMap((ds: any) => ds.pdElementMappingList || []);
  }

  isAllSelected(): boolean {
    if (!this.displayRecipients || this.displayRecipients.length === 0) return false;
    return this.displayRecipients.every(row => row.get('selected')?.value);
  }

  isSomeSelected(): boolean {
    if (!this.displayRecipients || this.displayRecipients.length === 0) return false;
    const selectedCount = this.displayRecipients.filter(row => row.get('selected')?.value).length;
    return selectedCount > 0 && selectedCount < this.displayRecipients.length;
  }

  toggleAllRows(checked: boolean) {
    this.displayRecipients.forEach(row => row.get('selected')?.setValue(checked));
  }


  getSensitivityClass(sensitivity: string) {
    if (sensitivity.toLowerCase() === 'low') {
      return 'bg-green-100 text-green-800';
    }
    if (sensitivity.toLowerCase() === 'high') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  }


  getSelectedCount(recipient: any): number {
    const list = recipient.pdElementMappingList || recipient.pdElements || [];
    return list.filter((pd: { selected: any }) => pd.selected).length;
  }

  @Output() onPdElementsSaved = new EventEmitter<any>();
  @Input() thirdPartyList!: any;
  @Input() vendorList!: any;
  bpaCategoriesList: BpaCategory[] = [];
  @Input() dataSubjectUserTypesList!: any[];



  onSavePdElements(): void {
    if (!this.isPdElementsEditMode || this.selectedRecipients.length === 0) {
      return;
    }

    const recipientData = this.selectedRecipients[0];
    const selectedPdElements = recipientData.pdElementMappingList.filter((element: any) => element.selected);


    const updatedMapping: any = {
      recipient: recipientData.recipient,
      type: recipientData.type,
      pdElementMappingList: selectedPdElements.filter((element: any) => !element.newAdded),
      purpose: recipientData.purpose,
      numberOfPersonHavingAccess: recipientData.numberOfPersonHavingAccess ?? '',
      recipientNewPdElementMasterList: selectedPdElements.filter((element: any) => element.newAdded),
      dataSubject: selectedPdElements.map((p: any) => p.dataSubject)
        .filter(Boolean)
        .reduce((acc: any[], ds: any) => {
          if (!acc.find(a => a.id === ds.id)) acc.push(ds);
          return acc;
        }, [])
    };

    this.onPdElementsSaved.emit({
      recipientMapping: updatedMapping,
      selectedCount: selectedPdElements.length,
      newPdElements: updatedMapping.recipientNewPdElementMasterList || []
    });

    this.close();
  }



  async loadPdCategories() {
    try {
      const data = await this.configApiHelperService.getPdCategories();
      this.bpaCategoriesList = data?.pdCategories ? data.pdCategories : [];
    } catch (error) {
      this.bpaCategoriesList = [];
    }
  }
  async onAddVendorOptionSelected(event: any, name: string) {
    if (!event.isUserInput) return;
    const trimmedName = name?.trim();
    if (!trimmedName) return;
    try {
      const newVendor = await this.addNewVendor(trimmedName);
      if (newVendor) {
        this.selectedVendor = newVendor;
        this.selectedRecipients = { name: 'External Vendor', key: BpaRecepient.VENDOR };
        this.onRecipientSelected();
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Failed to add vendor:', error);
    }
  }


  async onAddDepartmentOptionSelected(event: any, name: string) {
    if (event.isUserInput) {
      const trimmedName = name?.trim();
      if (!trimmedName) return;
      try {
        const newDept = await this.addNewDepartment(trimmedName);
        if (newDept) {
          this.selectedDepartment = newDept;
          this.selectedRecipients = { name: 'Internal', key: BpaRecepient.DEPARTMENT };
          this.onRecipientSelected();
        }
      }
      catch (error) {
        console.error('Failed to add department:', error);
      }
    }
  }


  async onAddThirdPartyOptionSelected(event: any, name: string) {
    if (event.isUserInput) {
      const trimmedName = name?.trim();
      if (!trimmedName) return;
      try {
        const newTp = await this.addNewThirdParty(trimmedName);
        if (newTp) {
          this.selectedThirdParty = newTp;
          this.selectedRecipients = { name: 'External Third Parties', key: BpaRecepient.THIRD_PARTY };
          this.onRecipientSelected();
        }
      } catch (error) {
        console.error('Failed to add third party:', error);
      }

    }
  }

  isAllSelectedPdElement(recipient: any): boolean {
    if (!recipient?.pdElementMappingList || recipient.pdElementMappingList.length === 0) {
      return false;
    }
    return recipient.pdElementMappingList.every((pd: any) => pd.selected);
  }

  toggleSelectAll(recipient: any, checked: boolean): void {
    if (!recipient?.pdElementMappingList) return;

    recipient.pdElementMappingList.forEach((pd: any) => {
      pd.selected = checked;
    });
  }

  isVendorExist(name: string): boolean {
    return this.vendorList.some((v: any) => v.name.toLowerCase() === name.toLowerCase());
  }

  isThirdPartyExist(name: string): boolean {
    return this.thirdPartyList.some((tp: any) => tp.name.toLowerCase() === name.toLowerCase());
  }

  isDepartmentExist(name: string): boolean {
    return this.departments.some((d: any) => d.name.toLowerCase() === name.toLowerCase());
  }

  get isEditMode() {
    return this.bpaService.isEditMode
  }


  get recipientData() {
    return this.createBpaForm?.get('recipient')?.value;
  }

  get dataSubjectList() {

    const overviewForm = this.createBpaForm?.get('overview')?.value;
    const dataSubjects = overviewForm?.dataSubjectList;

    if (dataSubjects && dataSubjects.length > 0) {
      return dataSubjects;
    }


    return this.recipientData?.dataSubjectList ?? [];
  }
}

