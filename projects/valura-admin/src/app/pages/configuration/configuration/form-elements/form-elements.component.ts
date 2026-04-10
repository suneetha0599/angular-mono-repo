import { Component, ElementRef, ViewChild, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '@admin-core/models/role-management/role.model';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { FormElementTableComponent } from '../form-element-table/form-element-table.component';
import { Sort } from '@angular/material/sort';
import { DssrDeclarationDialogComponent } from '../../regulation/dssr/dssr-declaration-dialog/dssr-declaration-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { GLOBAL_DIALOG_DEFAULTS, Channel } from '@admin-core/constants/constants';
import { AddDataSubjectComponent } from '../../general-configuration/data-subject/add-data-subject/add-data-subject.component';
import { AddThirdPartyComponent } from '../add-third-party/add-third-party.component';
import { AddRequesterInfoComponent } from '../add-requester-info/add-requester-info.component';
import { RegulationCreateComponent } from '../../regulation/regulation-create/regulation-create.component';
import { DataSubjectDeclaration, DataSubjectRegulation, FormConfigurationData } from '@admin-core/models/configuration/FormConfiguration';
import { RightsExerciseDialogComponent } from '../rights-exercise-dialog/rights-exercise-dialog.component';
import { v1 as uuidv1 } from 'uuid';
import { DeclarationInfoTableHeaders, GeneralDeclarationInfoTableHeaders, EntityType, FormElementsConfig, RegulationTableHeaders, RequesterInfoTableColumn, RightsTableHeaders, RoleDisplayedColumns, ThirdPartyRoleTableColumn, ChannelTableColumn, EntityTypeSpecific } from '../constants';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ChannelAddEditComponent } from '../channel-add-edit/channel-add-edit.component';
import { FormConfigurationService } from '@admin-core/services/form-configuration.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
@Component({
  selector: 'app-form-elements',
  imports: [
    FormElementTableComponent,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    NgClass,
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    FormsModule, LoadingButtonComponent
  ],
  templateUrl: './form-elements.component.html',
  styleUrl: './form-elements.component.scss',
})
export class FormElementsComponent {

  @Input() formConfiguration: FormConfigurationData = new FormConfigurationData();
  @Output() formUpdated = new EventEmitter<boolean>();

  activeSection = 'requesterInfo';
  isRoleLoading: boolean = true;
  private isScrollingProgrammatically = false;
  private rolePermissionService = inject(RolePermissionService);
  roles: Role[] = [];
  regulationList: any[] = [];
  requestLoading: boolean = true;
  regulationId: number = 0;
  regulationIdInDeclartion: number = 0;
  isLoading: boolean = true;
  FormElementsConfig = FormElementsConfig;
  tableHeaders: any = [];
  displayedHeaders = [];
  shimmerDataSource = Array(4).fill({});
  shimmerRoleDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    roleName: '',
    description: '',
  }));
  requesterInfoDataSource = new MatTableDataSource<any>([]);
  channelInfoDataSource = new MatTableDataSource<any>([]);
  thirdPartyRoleDataSource = new MatTableDataSource<any>([]);
  regulationDataSource = new MatTableDataSource<any>([]);
  rightsDataSource = new MatTableDataSource<any>([]);
  roleDataSource = new MatTableDataSource<any>([]);
  declarationDataSource = new MatTableDataSource<any>([]);

  RequesterInfoTableColumn = RequesterInfoTableColumn;
  ThirdPartyRoleTableColumn = ThirdPartyRoleTableColumn;
  ChannelTableColumn = ChannelTableColumn;
  RegulationTableHeaders = RegulationTableHeaders;
  RightsTableHeaders = RightsTableHeaders;
  RoleDisplayedColumns = RoleDisplayedColumns;
  DeclarationInfoTableHeaders = DeclarationInfoTableHeaders;
  GeneralDeclarationInfoTableHeaders = GeneralDeclarationInfoTableHeaders;
  selectedEntity!: DataSubjectDeclaration;
  EntityType = EntityType;
  selectedRegulation!: DataSubjectRegulation;
  dataUpdated: string = '';
  declarationType: string = 'General';
  private formLoadedubscription!: Subscription;
  iconsMap: Map<string, string> = new Map();
  formElementFullAcess: boolean = false;
  private formConfigurationService = inject(FormConfigurationService);
  private apiHelperService = inject(ApiHelperService);

  constructor(private dialog: MatDialog) {
    this.formLoadedubscription = this.formConfigurationService.formIsLoading$.subscribe(value => {
      this.isLoading = value ? true : false;
    });
  }

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;


  ngOnInit() {
    this.onInitPage()
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.formElementFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  ngOnDestroy(): void {
    this.formLoadedubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formConfiguration']) {
      this.prepareDataSource();
      if (this.iconsMap.size > 0) {
        this.populateIconNames();
      }
    }
  }

  prepareDataSource() {
    //  REQUESTER_INFO
    this.requesterInfoDataSource = new MatTableDataSource(this.formConfiguration.requesterInfo);

    // THIRD_PARTY_ROLE
    this.thirdPartyRoleDataSource = new MatTableDataSource(this.formConfiguration.thirdPartyRoles);

    // REGULATIONS
    this.regulationDataSource = new MatTableDataSource(this.formConfiguration.dataSubjectRegulationMasterList);

    this.channelInfoDataSource = new MatTableDataSource(
      this.formConfiguration.channels ?? []
    );

    //  RIGHTS:
    this.onRightRegulationTabChange(0)

    // DATA_SUBJECT_ROLE:
    this.roleDataSource = new MatTableDataSource(this.formConfiguration.dataSubjectUserTypesList);

    //  DECLARATION:
    this.onDeclarationRegulationTabChange(0);
  }

  async onInitPage() {
    await this.loadIcons();
  }

  async loadIcons(): Promise<void> {
    try {
      const response = await this.apiHelperService.getIcons();
      if (response?.icons) {
        this.iconsMap.clear();
        response.icons.forEach((icon: any) => {
          this.iconsMap.set(icon.icon, icon.name);
        });
        this.populateIconNames();
      }
    } catch (error) {
      console.error('Error loading icons:', error);
    }
  }

  populateIconNames(): void {
    this.formConfiguration.dataSubjectRegulationMasterList.forEach(regulation => {
      regulation.rightsMasterList?.forEach(right => {
        if (right.icon && !right.iconName) {
          right.iconName = this.iconsMap.get(right.icon) || right.icon;
        }
      });
    });
    if (this.selectedRegulation?.rightsMasterList) {
      this.rightsDataSource.data = this.rightsDataSource.data.map(right => ({
        ...right,
        iconName: right.iconName || this.iconsMap.get(right.icon) || right.icon
      }));
    }
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

    const sections = container.querySelectorAll(
      '.scroll-section'
    ) as NodeListOf<HTMLElement>;

    for (const sec of sections) {
      const sectionTop = sec.offsetTop;
      const sectionHeight = sec.offsetHeight;

      if (
        scrollPosition >= sectionTop - 100 &&
        scrollPosition < sectionTop + sectionHeight - 100
      ) {
        this.activeSection = sec.id;
        break;
      }
    }
  }

  async loadRegulationData(searchText: string = '', sortBy: string = '', sortDirection: string = '') {

  }

  async loadRegulationRights(search: string = '', sortBy: string = '', sortDirection: string = '') {

  }

  async loadRoles(searchText: string = '', sortBy: string = '', sortDirection: string = '') {

  }

  async loadDeclarations(search: string = '', sortBy: string = '', sortDirection: string = '') {

  }

  onRightRegulationTabChange(index: number) {
    const regulation = this.formConfiguration.dataSubjectRegulationMasterList[index];
    this.selectedRegulation = regulation;
    const rightsWithIconNames = (regulation?.rightsMasterList ?? []).map(right => ({
      ...right,
      iconName: right.iconName || this.iconsMap.get(right.icon) || right.icon
    }));
    this.rightsDataSource = new MatTableDataSource(rightsWithIconNames);
  }

  onDeclarationRegulationTabChange(index: number) {
    const regulation = this.formConfiguration.dataSubjectRegulationMasterList[index];
    this.regulationId = regulation?.id ?? 0;
    this.selectedRegulation = regulation
    this.declarationType = 'General';
    this.onChangeRegulationInDelaration(regulation)
  }

  onChangeRegulationInDelaration(regulation: DataSubjectRegulation) {
    const declaration = regulation?.declarationMasterList[0];
    this.selectedEntity = declaration;
    this.declarationDataSource = new MatTableDataSource(declaration?.list ?? []);
  }

  onSectionChange(event: MatButtonToggleChange) {
    const declaration = event.value;
    this.declarationType = declaration.label;
    this.declarationDataSource = new MatTableDataSource(declaration.list);
  }

  onAddClick(key: string) {
    switch (key) {
      case FormElementsConfig.THIRD_PARTY_ROLE:
        this.addThirdPartyRole();
        break;
      case FormElementsConfig.CHANNEL:
        this.addChannel();
        break;
      case FormElementsConfig.DATA_SUBJECT_ROLE:
        this.addDataSubject();
        break;
      case FormElementsConfig.DECLARATION:
        this.onAddDeclarationClick();
        break;
      default:
        console.warn('Unknown add key:', key);
    }
  }

  onAddDeclarationClick() {
    const dialogRef = this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: true,
        regulationId: this.regulationId,
        viewType: FormElementsConfig.DECLARATION,
        existingList: this.declarationDataSource.data,
        selectedEntityType: this.selectedEntity.type == EntityType.RIGHT ? EntityTypeSpecific.RIGHT_SPECIFIC : EntityTypeSpecific.REGULATION_SPECIFIC
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success && result.data) {
        const newDeclaration = {
          ...result.data,
          id: result.data.id || uuidv1(),
          displayInForm: true,
          isEdited: true,
        };

        const entityType = newDeclaration.entityType || result.data.entityType;

        const targetEntity = this.selectedRegulation.declarationMasterList.find(
          d => d.type === entityType
        );

        if (targetEntity) {
          targetEntity.list = [...(targetEntity.list ?? []), newDeclaration];

          if (this.selectedEntity === targetEntity) {
            this.declarationDataSource.data = [...targetEntity.list];
            this.declarationDataSource = new MatTableDataSource([...this.declarationDataSource.data]);
          }
        }

        this.dataUpdated = uuidv1();
        setTimeout(() => this.dataUpdated = '', 10);
        this.formUpdated.emit(true);
      }
    });
  }

  async addChannel() {
    const dialogRef = this.dialog.open(ChannelAddEditComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: false,
        viewMode: false,
        existingList: this.formConfiguration.channels,
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result?.success) return;

    const newChannel: Channel = {
      id: uuidv1(),
      label: result.data.label,
      description: result.data.description ?? '',
      displayInForm: true,
      isEdited: true,
    };

    this.formConfiguration.channels.push(newChannel);

    this.channelInfoDataSource.data = [...this.formConfiguration.channels];

    this.formUpdated.emit(true);
  }

  addDataSubject() {
    const dialogRef = this.dialog.open(AddDataSubjectComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        viewType: FormElementsConfig.DATA_SUBJECT_ROLE,
        existingList: this.roleDataSource.data
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        const res = { ...result.data, id: uuidv1(), displayInForm: true, isEdited: true };
        this.roleDataSource.data = [...this.roleDataSource.data, res];
        this.formConfiguration.dataSubjectUserTypesList.push(res);
        this.formUpdated.emit(true);
      }
    });
  }

  addThirdPartyRole() {
    const dialogRef = this.dialog.open(AddThirdPartyComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        editMode: false,
        existingList: this.thirdPartyRoleDataSource.data
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.addNewThirdPartyRow(result.data);
        this.formUpdated.emit(true);
      }
    });
  }

  addNewThirdPartyRow(newRow: any) {
    const data = { ...newRow, id: uuidv1(), displayInForm: true, isEdited: true };
    this.thirdPartyRoleDataSource.data = [...this.thirdPartyRoleDataSource.data, data];
    if (data) {
      this.formConfiguration.thirdPartyRoles.push(data);
    }
  }

  handleSort(event: Sort, key: string) {
    const sortBy = event.active;
    const sortDirection = event.direction;

    switch (key) {
      case FormElementsConfig.REQUESTER_INFO:
        this.requesterInfoDataSource.data = this.sortLocal(
          this.formConfiguration.requesterInfo,
          sortBy,
          sortDirection
        );
        break;

      case FormElementsConfig.THIRD_PARTY_ROLE:
        this.thirdPartyRoleDataSource.data = this.sortLocal(
          this.formConfiguration.thirdPartyRoles,
          sortBy,
          sortDirection
        );
        break;

      case FormElementsConfig.REGULATIONS:
        this.regulationDataSource.data = this.sortLocal(
          this.formConfiguration.dataSubjectRegulationMasterList,
          sortBy,
          sortDirection
        );
        break;

      case FormElementsConfig.RIGHTS:
        const sortedRights = this.sortLocal(
          this.selectedRegulation.rightsMasterList,
          sortBy,
          sortDirection
        );
        this.rightsDataSource = new MatTableDataSource(sortedRights);
        this.selectedRegulation.rightsMasterList = [...sortedRights];
        break;

      case FormElementsConfig.DATA_SUBJECT_ROLE:
        this.roleDataSource.data = this.sortLocal(
          this.formConfiguration.dataSubjectUserTypesList,
          sortBy,
          sortDirection
        );
        break;

      case FormElementsConfig.DECLARATION:
        const sortedDeclarations = this.sortLocal(
          this.selectedEntity.list,
          sortBy,
          sortDirection
        );
        this.declarationDataSource = new MatTableDataSource(sortedDeclarations);
        this.selectedEntity.list = [...sortedDeclarations];
        break;
    }
  }

  sortLocal(data: any[], field: string, direction: string) {
    if (!direction) return data;

    return [...data].sort((a, b) => {
      const valA = a[field]?.toString().toLowerCase();
      const valB = b[field]?.toString().toLowerCase();

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  handleEdit(event: { row: any; key: string }) {
    switch (event.key) {
      case FormElementsConfig.REQUESTER_INFO:
        this.editRequesterInfo(event.row, event.key);
        break;

      case FormElementsConfig.THIRD_PARTY_ROLE:
        this.editThirdPartyRole(event.row, event.key);
        break;

      case FormElementsConfig.REGULATIONS:
        this.openRegulationEdit(event.row, event.key);
        break;

      case FormElementsConfig.RIGHTS:
        this.openRightsExerciseEdit(event.row, event.key);
        break;

      case FormElementsConfig.DATA_SUBJECT_ROLE:
        this.openRoleEdit(event.row, event.key);
        break;

      case FormElementsConfig.DECLARATION:
        this.openDeclarationEdit(event.row, event.key);
        break;

      case FormElementsConfig.CHANNEL:
        this.openChannelEdit(event.row, event.key);
        break;
    }
  }

  onViewToggle(event: { row: any; key: string }) {
    switch (event.key) {
      case FormElementsConfig.REGULATIONS:
        this.regulationToggleView(event.row);
        break;

      case FormElementsConfig.RIGHTS:
        this.rightsToggleView(event.row);
        break;

      case FormElementsConfig.DATA_SUBJECT_ROLE:
        this.dataSubjectToggleView(event.row);
        break;

      case FormElementsConfig.DECLARATION:
        this.declarationToggleView(event.row);
        break;
    }
  }

  regulationToggleView(row: any) {
    const index = this.regulationDataSource.data.findIndex((x) => x.id === row.id);
    if (index !== -1) {
      this.regulationDataSource.data[index] = row;
      this.regulationDataSource.data = [...this.regulationDataSource.data];
    }
    let regulation = this.formConfiguration.dataSubjectRegulationMasterList.find(regulation => regulation.id == row.id);
    if (regulation) {
      regulation.displayInForm = row.displayInForm;
      regulation.isEdited = true;
      this.formUpdated.emit(true)
    }
  }


  rightsToggleView(row: any) {
    const index = this.rightsDataSource.data.findIndex((x) => x.id === row.id);
    if (index !== -1) {
      this.rightsDataSource.data[index] = row;
      this.rightsDataSource.data = [...this.rightsDataSource.data];
    }
    let right = this.selectedRegulation.rightsMasterList.find(right => right.id == row.id);
    if (right) {
      right.displayInForm = row.displayInForm;
      right.isEdited = true;
      this.formUpdated.emit(true)
    }
  }

  dataSubjectToggleView(row: any) {
    const index = this.roleDataSource.data.findIndex((x) => x.id === row.id);
    if (index !== -1) {
      this.roleDataSource.data[index] = row;
      this.roleDataSource.data = [...this.roleDataSource.data];
    }
    let ds = this.formConfiguration.dataSubjectUserTypesList.find(ds => ds.id == row.id);
    if (ds) {
      ds.displayInForm = row.displayInForm;
      ds.isEdited = true;
      this.formUpdated.emit(true)
    }
  }

  declarationToggleView(row: any) {
    const index = this.declarationDataSource.data.findIndex((x) => x.id === row.id);
    if (index !== -1) {
      this.declarationDataSource.data[index] = row;
      this.declarationDataSource.data = [...this.declarationDataSource.data];
    }
    let declaration = this.selectedEntity.list.find(declaration => declaration.id == row.id);
    if (declaration) {
      declaration.displayInForm = row.displayInForm
      declaration.isEdited = true;
      this.formUpdated.emit(true)
    }
  }

  openRoleEdit(row: any, key: any) {
    const dialogRef = this.dialog.open(AddDataSubjectComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        dataSubject: row.id,
        editMode: true,
        viewMode: false,
        viewType: key,
        dataSubjectData: row
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        const dataSubjectRole = { ...row, ...result.data, isEdited: true }
        this.updateRoleInfo(dataSubjectRole);
        this.formUpdated.emit(true);
      }
    });
  }

  openDeclarationEdit(row: any, key: any) {
    const dialogRef = this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        regulationId: this.regulationId,
        declarationId: row.id,
        editMode: true,
        itemData: row,
        viewType: key,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.success || !result.data) return;

      const payload = result.data.generalDeclaration ?? result.data;
      const updatedDeclaration = {
        ...row,
        ...payload,
        isEdited: true,
      };
      this.formUpdated.emit(true);
      this.updateDeclarationData(updatedDeclaration)
    });
  }

  openChannelEdit(row: Channel, key: string) {
    const dialogRef = this.dialog.open(ChannelAddEditComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        channel: {
          label: row.label,
          description: row.description,
        },
        editMode: true,
        viewType: key,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.success) return;

      const updatedChannel = {
        ...row,
        label: result.data.label,
        description: result.data.description,
        isEdited: true,
      };

      this.updateChannelData(updatedChannel);
      this.formUpdated.emit(true);
    });
  }

  updateChannelData(updatedRow: Channel) {
    const index = this.channelInfoDataSource.data.findIndex(c => c.id === updatedRow.id);
    if (index !== -1) {
      this.channelInfoDataSource.data[index] = updatedRow;
      this.channelInfoDataSource = new MatTableDataSource([
        ...this.channelInfoDataSource.data
      ]);
    }

    const channel = this.formConfiguration.channels.find(c => c.id === updatedRow.id);
    if (channel) {
      Object.assign(channel, updatedRow);
    }
  }

  updateDeclarationData(updatedRow: any) {
    const index = this.declarationDataSource.data.findIndex((x) => x.id === updatedRow.id);
    if (index !== -1) {
      this.declarationDataSource.data[index] = updatedRow;
      this.declarationDataSource = new MatTableDataSource(this.declarationDataSource.data);
    }
    let declaration = this.selectedEntity.list.find(declaration => declaration.id == updatedRow.id);
    if (declaration) {
      declaration = { ...declaration, ...updatedRow };
    }
  }

  updateRoleInfo(updatedRow: any) {
    const index = this.roleDataSource.data.findIndex((x) => x.id === updatedRow.id);
    if (index !== -1) {
      this.roleDataSource.data[index] = updatedRow;
      this.roleDataSource = new MatTableDataSource(this.roleDataSource.data);

    }
    let ds = this.formConfiguration.dataSubjectUserTypesList.find(ds => ds.id == updatedRow.id);
    if (ds) {
      ds = { ...ds, ...updatedRow };
    }
  }

  editThirdPartyRole(row: any, key: any) {
    if (!row.original_description) {
      row.original_description = row.description;
    }

    const dialogRef = this.dialog.open(AddThirdPartyComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        editMode: true,
        thirdParty: row,
        key: key,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {
        const thirdPartyData = { ...row, ...result.data, isEdited: true }
        this.updateThirdPartyData(thirdPartyData);
        this.formUpdated.emit(true);
      }
    });
  }

  updateThirdPartyData(updatedRow: any) {
    const index = this.thirdPartyRoleDataSource.data.findIndex((x) => x.id === updatedRow.id);
    if (index !== -1) {
      this.thirdPartyRoleDataSource.data[index] = updatedRow;
      this.thirdPartyRoleDataSource = new MatTableDataSource(this.thirdPartyRoleDataSource.data);

    }
    let thirdPartyRole = this.formConfiguration.thirdPartyRoles.find(role => role.id == updatedRow.id);
    if (thirdPartyRole) {
      thirdPartyRole = { ...thirdPartyRole, ...updatedRow };
    }
  }

  editRequesterInfo(row: any, key: string) {
    if (!row.original_description) {
      row.original_description = row.description;
    }
    const dialogRef = this.dialog.open(AddRequesterInfoComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: true,
        requesterInfo: row,
        key: key,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        const requesterInfo = { ...row, ...result.data, isEdited: true }
        this.updateRequesterInfo(requesterInfo)
        this.formUpdated.emit(true);
      }
    });
  }

  updateRequesterInfo(updatedRow: any) {
    const index = this.requesterInfoDataSource.data.findIndex((x) => x.type === updatedRow.type);
    if (index !== -1) {
      this.requesterInfoDataSource.data[index] = updatedRow;
      this.requesterInfoDataSource = new MatTableDataSource(this.requesterInfoDataSource.data);

    }
    let requesterInfo = this.formConfiguration.requesterInfo.find(info => info.type == updatedRow.type);
    if (requesterInfo) {
      requesterInfo.overridden = updatedRow.overridden;
    }
  }

  openRegulationEdit(row: any, key: any) {
    const dialogRef = this.dialog.open(RegulationCreateComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        regulation: row.id,
        viewType: key,
        regulationData: row
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {
        const _regulation = { ...row, ...result.data, isEdited: true }
        this.updateRegulationData(_regulation);
        this.formUpdated.emit(true);
      }
    });
  }

  updateRegulationData(updatedRow: any) {
    const index = this.regulationDataSource.data.findIndex((x) => x.id === updatedRow.id);
    if (index !== -1) {
      this.regulationDataSource.data[index] = updatedRow;
      this.regulationDataSource = new MatTableDataSource(this.regulationDataSource.data);
    }
    let regulation = this.formConfiguration.dataSubjectRegulationMasterList.find(regulation => regulation.id == updatedRow.id);
    if (regulation) {
      regulation = { ...regulation, ...updatedRow };
    }

  }

  openRightsExerciseEdit(row: any, key: any) {
    const dialogRef = this.dialog.open(RightsExerciseDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        elementData: row,
        editMode: true,
        viewMode: false,
        key: key,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {
        const _right = { ...row, ...result.data, isEdited: true }
        this.updateRightData(_right)
        this.formUpdated.emit(true);
      }
    });
  }



  updateRightData(updatedRow: any) {
    const index = this.rightsDataSource.data.findIndex(
      x => x.id === updatedRow.id
    );

    if (updatedRow.icon && !updatedRow.iconName) {
      updatedRow.iconName = this.iconsMap.get(updatedRow.icon) || updatedRow.icon;
    }

    if (index !== -1) {
      this.rightsDataSource.data[index] = {
        ...this.rightsDataSource.data[index],
        ...updatedRow
      };

      this.rightsDataSource = new MatTableDataSource([
        ...this.rightsDataSource.data
      ]);

      this.dataUpdated = uuidv1();
      this.formUpdated.emit(true);
    }

    const rightIndex =
      this.selectedRegulation.rightsMasterList.findIndex(
        r => r.id === updatedRow.id
      );

    if (rightIndex !== -1) {
      this.selectedRegulation.rightsMasterList[rightIndex] = {
        ...this.selectedRegulation.rightsMasterList[rightIndex],
        ...updatedRow,
        isEdited: true
      };
    }

    setTimeout(() => (this.dataUpdated = ''), 10);
  }

  get rightSpecific() {
    return this.selectedEntity?.type == EntityType.RIGHT;
  }

  handleDelete(event: { row: any; key: string }, regulation: any = null) {
    switch (event.key) {
      case FormElementsConfig.THIRD_PARTY_ROLE:
        this.deleteThirdParty(event.row, event.key);
        break;

      case FormElementsConfig.DATA_SUBJECT_ROLE:
        this.deleteDataSubject(event.row, event.key);
        break;

      case FormElementsConfig.DECLARATION:
        this.deleteDeclaration(event.row, event.key, regulation);
        break;

      case FormElementsConfig.CHANNEL:
        this.deleteChannel(event.row);
        break;
    }
    this.formUpdated.emit(true);
  }

  async deleteThirdParty(role: any, key: string): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Role Deletion',
        content: 'Are you sure you want to delete this third party role?',
        confirmationDetail: role.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.thirdPartyRoleDataSource.data = this.thirdPartyRoleDataSource.data.filter(r => r.id !== role.id);
      this.formConfiguration.thirdPartyRoles = this.formConfiguration.thirdPartyRoles.filter(r => r.id !== role.id);
      this.formConfigurationService.onDeleteThirdPartyRole(role)
    });
  }

  async deleteChannel(channel: Channel) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Channel Deletion',
        content: 'Are you sure you want to delete this channel?',
        confirmationDetail: channel.label,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600',
      } as PopupDialogData,
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.channelInfoDataSource.data =
      this.channelInfoDataSource.data.filter(c => c.id !== channel.id);
    this.formConfiguration.channels =
      this.formConfiguration.channels.filter(c => c.id !== channel.id);

    this.formConfigurationService.onDeleteChannel(channel);
    this.formUpdated.emit(true);
  }
  async deleteDataSubject(dataSubject: any, key: string): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Role Deletion',
        content: 'Are you sure you want to delete this data subject?',
        confirmationDetail: dataSubject.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.roleDataSource.data = this.roleDataSource.data.filter(r => r.id !== dataSubject.id);
      this.formConfiguration.dataSubjectUserTypesList = this.formConfiguration.dataSubjectUserTypesList.filter(r => r.id !== dataSubject.id);
      this.formConfigurationService.onDeleteDataSubject(dataSubject);
    });
  }

  async deleteDeclaration(declaration: any, key: string, regulation: any): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Declaration Deletion',
        content: 'Are you sure you want to delete this declaration?',
        confirmationDetail: declaration.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const entity = this.selectedRegulation.declarationMasterList.find(d => d.type === declaration.entityType);
      if (!entity) return;

      entity.list = (entity.list ?? []).filter(d => d.id !== declaration.id);
      if (this.selectedEntity === entity) {
        this.declarationDataSource.data = [...entity.list];
      }
      this.dataUpdated = uuidv1();
      setTimeout(() => this.dataUpdated = '', 10);
      this.formConfigurationService.onDeleteDeclaration(declaration, regulation);
    });
  }
}
