import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from '@admin-core/constants/routes';
import { DataSubjectRegulation, FormConfiguration, FormConfigurationData, RequesterLabelInfo, DataSubjectCountry } from '@admin-core/models/configuration/FormConfiguration';
import { LSK_FORM_CONFIG_CHANGED, LSK_FORM_CONFIGURATION } from '@admin-core/constants/local-storage-constants';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';
import { ConfigService } from './config.service';
import { dsrRequestTypes, SELF, THIRD_PARTY } from '@admin-page/request-management/constant';
import { DataSubjectService } from './dataSubject/data-subject.service';
import { RegulationsService } from './regulations/regulations.service';
import { DeclarationService } from './declaration/declaration.service';
import { EntityType } from '@admin-page/configuration/configuration/constants';
import { CountryService } from './country/country.service';
import { BehaviorSubject } from 'rxjs';
import { FormConfigurationPayload, Regulation as FormConfigurationPayloadRegulation, RightExercise } from '@admin-core/models/configuration/FormConfigurationPayload';
import { DataSyncService } from './download/data-sync.service';
import { ApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { FORM_CONFIGURATION_DRAFT_KEY } from '@admin-core/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class FormConfigurationService {

  deletedThirdPartyRoleList: any = [];
  deletedDataSubjectList: any = [];
  deletedChannelList: any[] = [];


  private configService = inject(ConfigService);
  private dataSubjectService = inject(DataSubjectService);
  private regulationsService = inject(RegulationsService);
  private declarationService = inject(DeclarationService);
  private countryService = inject(CountryService);
  private dataSyncService = inject(DataSyncService);
  private apiHelperService = inject(ApiHelperService);

  public formIsPublished$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public formIsUpdated$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public formIsLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(private router: Router) {
    const formIsUpdated = this.getFormState();
    this.updateFormState(formIsUpdated)
  }

  setFormConfigurationData(res: FormConfigurationData) {
    setItem(LSK_FORM_CONFIGURATION, res);
  }

  removeFormConfiguration() {
    removeItem(LSK_FORM_CONFIGURATION);
  }

  getFormConfigurationData() {
    return getItem(LSK_FORM_CONFIGURATION)
  }

  setFormState(formState: boolean) {
    setItem(LSK_FORM_CONFIG_CHANGED, formState);
  }

  getFormState() {
    return !!getItem(LSK_FORM_CONFIG_CHANGED);
  }

  removeFormState() {
    removeItem(LSK_FORM_CONFIG_CHANGED);
  }

  updateFormState(formUpdated: boolean) {
    this.formIsUpdated$.next(formUpdated);
    if (formUpdated) {
      this.setFormState(formUpdated);
      return
    }
    this.removeFormState();
  }

  async prepareInitialFormConfiguration() {
    let draftDetails;
    const result = await this.apiHelperService.getDraftCount(FORM_CONFIGURATION_DRAFT_KEY);
    if (result?.count) {
      draftDetails = await this.apiHelperService.getBpaDraftDetails(FORM_CONFIGURATION_DRAFT_KEY);
    }

    let _mainConfiguration = new FormConfiguration();
    let _formConfiguration = new FormConfigurationData();

    const res = await this.configService.getDsrConfiguration();
    const data = await this.apiHelperService.getChannels();
    if (!res) {
      console.error('No configuration data received.');
      return { _mainConfiguration, _formConfiguration }
    }
    const configurationData = { ...res, channels: (data?.channels ?? []), isDraft: !!(draftDetails) };
    _mainConfiguration = new FormConfiguration(configurationData);
    const formConfiguration = new FormConfigurationData(configurationData);
    const _requesterInfo: RequesterLabelInfo[] = [];
    if (configurationData?.requesterInfo?.myself) {
      const selfOveridenDesc = draftDetails?.requesterInfo?.myself ? draftDetails.requesterInfo.myself : configurationData.requesterInfo.myself.overridden;
      _requesterInfo.push({ ...configurationData.requesterInfo.myself, overridden: selfOveridenDesc, type: SELF, label: dsrRequestTypes[0].name, icon: 'person_outlined' })
    }
    if (configurationData?.requesterInfo?.thirdParty) {
      const thirdPartyOveridenDesc = draftDetails?.requesterInfo?.thirdParty ? draftDetails.requesterInfo.thirdParty : configurationData.requesterInfo.thirdParty.overridden;
      _requesterInfo.push({ ...configurationData.requesterInfo.thirdParty, overridden: thirdPartyOveridenDesc, type: THIRD_PARTY, label: dsrRequestTypes[1].name, icon: 'groups' })
    }
    formConfiguration.requesterInfo = _requesterInfo;

    //Third party Role
    const thirdPartyRoles: any = configurationData.thirdPartyRoles ?? [];
    const draftThirdPartyRole = (draftDetails?.thirdPartyRoles ?? []).filter((role: any) => !role.isDeleted);
    const deletedThirdPartyRole = (draftDetails?.thirdPartyRoles ?? []).filter((role: any) => role.isDeleted);
    const newThirdPartyRole = draftThirdPartyRole.filter((role: any) => !role.id);


    for (const [index, thirdPartyRole] of thirdPartyRoles.entries()) {
      const findIndex = draftThirdPartyRole.findIndex((role: any) => (role.id == thirdPartyRole.id) && thirdPartyRole.id);
      const draftRole = draftThirdPartyRole[findIndex];
      if (draftRole) {
        thirdPartyRoles[index] = { ...thirdPartyRole, ...draftRole, isEdited: false };
      }
      if (findIndex > -1) {
        draftThirdPartyRole.splice(findIndex, 1);
      }
    }
    //Remove ids which are in deleted list
    for (const deletedRole of deletedThirdPartyRole) {
      const findIndex = thirdPartyRoles.findIndex((role: any) => (role.id == deletedRole.id) && role.id);
      if (findIndex > -1) {
        thirdPartyRoles.splice(findIndex, 1)
      }
    }
    formConfiguration.thirdPartyRoles = [...thirdPartyRoles, ...newThirdPartyRole];
    this.deletedThirdPartyRoleList = [...(deletedThirdPartyRole ?? [])];

    const channels: any[] = configurationData.channels ?? [];
    const draftChannels = (draftDetails?.channels ?? []).filter((ch: any) => !ch.isDeleted);
    const deletedChannels = (draftDetails?.channels ?? []).filter((ch: any) => ch.isDeleted);
    const newChannels = draftChannels.filter((ch: any) => !ch.id);

    for (const [index, channel] of channels.entries()) {
      channel.label = channel.name;
      const _channel = {
        id: channel.id,
        label: channel.name,
        displayInForm: true,
        isEdited: false,
      }
      channels[index] = { ..._channel };
      const findIndex = draftChannels.findIndex((d: any) => d.id === channel.id && channel.id);
      const draftChannel = draftChannels[findIndex];
      if (draftChannel) {
        channels[index] = {
          ...channel,
          ...draftChannel,
          isEdited: false
        };
      }

      if (findIndex > -1) {
        draftChannels.splice(findIndex, 1);
      }
    }

    for (const deletedChannel of deletedChannels) {
      const findIndex = channels.findIndex(
        ch => ch.id === deletedChannel.id && ch.id
      );
      if (findIndex > -1) {
        channels.splice(findIndex, 1);
      }
    }

    formConfiguration.channels = [...channels, ...newChannels];
    this.deletedChannelList = [...deletedChannels];

    //Data subject
    const dataSubjectMasterList: any = await this.dataSubjectService.getDatasubjectMasterList();
    const draftDataSubjectMasterList = draftDetails?.dataSubjects ?? [];
    const newDataSubjectMasterList = draftDataSubjectMasterList.filter((ds: any) => !ds.dataSubjectId);

    for (const [index, dataSubject] of dataSubjectMasterList.entries()) {
      const findIndex = draftDataSubjectMasterList.findIndex((ds: any) => (ds.dataSubjectId == dataSubject.id) && dataSubject.id);
      const _draftDataSubject = draftDataSubjectMasterList[findIndex];
      if (_draftDataSubject) {
        dataSubjectMasterList[index] = { ...dataSubject, ..._draftDataSubject };
      }
      if (findIndex > -1) {
        draftDataSubjectMasterList.splice(findIndex, 1);
      }
    }
    formConfiguration.dataSubjectUserTypesList = [...dataSubjectMasterList, ...newDataSubjectMasterList];

    // Regulation
    const regulationData: any = await this.regulationsService.getRegulationMasterList();
    const regulationMasterList: DataSubjectRegulation[] = regulationData.acts ?? []
    formConfiguration.dataSubjectRegulationMasterList = [...regulationMasterList];

    for (const regulation of formConfiguration.dataSubjectRegulationMasterList) {
      const draftRegulation = (draftDetails?.regulations ?? []).find((reg: any) => reg.actId == regulation.id)
      regulation.rightsMasterList = [];
      regulation.declarationMasterList = [];
      if (draftRegulation) {
        regulation.displayInForm = draftRegulation.displayInForm;
        regulation.isEditedInDraft = draftRegulation.isEditedInDraft;
      }
      // Countries
      if (draftRegulation?.countryMappings?.length) {
        regulation.countries.map(_country => {
          const findCountry = (draftRegulation?.countryMappings ?? []).find((dCountry: any) => (dCountry.countryId == _country.countryId));
          if (findCountry) {
            _country.displayInForm = findCountry.displayInForm;
          }
        });
      }
      const regulationMappingCountries = regulation.countries.filter((country: any) => country?.displayInForm);
      regulation.countries = [...regulationMappingCountries];
      regulation.originalCountryList = draftRegulation ? (draftRegulation?.countryMappings ?? []) : [...regulationMappingCountries];
      const _countryNames = regulationMappingCountries.map((country: any) => country.countryName).join(', ');
      regulation.countryNames = _countryNames;

      // Declaration
      let entityList: any = [{ label: 'General', type: EntityType.REGULATION, list: [] }, { label: 'Right specific', type: EntityType.RIGHT, list: [] }];

      const draftDeclarations = (draftRegulation?.declarations ?? []).filter((dDeclaration: any) => !dDeclaration.isDeleted);
      const deletedDeclarations = (draftRegulation?.declarations ?? []).filter((dDeclaration: any) => dDeclaration.isDeleted);
      const newGeneralDeclarations = draftDeclarations.filter((ds: any) => !ds.declarationId);

      // General Declaration
      const generalDeclaration = await this.declarationService.getDeclarationsByEntity(EntityType.REGULATION, regulation.id);
      const _generalDeclaration: any = generalDeclaration.map((declaration) => {
        const findDeclaration = (draftDeclarations ?? []).find((dDeclaration: any) => (dDeclaration.declarationId == declaration.id));
        const _declarationObj = {
          ...declaration,
          isEditedInDraft: findDeclaration ? findDeclaration.isEditedInDraft : false,
          displayInForm: findDeclaration ? findDeclaration.displayInForm : declaration.displayInForm,
          declaration: findDeclaration ? findDeclaration.overriddenDeclaration : declaration.clientOverride.overriddenDeclaration,
        }
        return _declarationObj
      });
      //Remove ids which are in deleted list
      const deletedGeneralDeclarations = (deletedDeclarations ?? []);
      for (const declaration of deletedGeneralDeclarations) {
        const findIndex = _generalDeclaration.findIndex((_declaration: any) => (_declaration.id == declaration.declarationId) && _declaration.id);
        if (findIndex > -1) {
          _generalDeclaration.splice(findIndex, 1)
        }
      }
      if (_generalDeclaration?.length) {
        entityList[0].list = [...entityList[0].list, ..._generalDeclaration, ...newGeneralDeclarations];
      }

      // Rights
      const rights = await this.regulationsService.getRightByActId(regulation.id);
      const _rights: any = [];
      let _rightSpecificDeclarationMasterList: any = [];
      for (const right of rights) {
        const draftRight = draftRegulation ? (draftRegulation?.rightExercises ?? []).find((dRight: any) => (dRight.rightId == right.id)) : null;
        const _rightObj: any = {
          ...right,
          displayInForm: draftRight ? draftRight.displayInForm : right.displayInForm,
          isEditedInDraft: draftRight ? draftRight.isEditedInDraft : false,
          icon: draftRight ? draftRight.icon : right.icon,
          rightTitleSimplified: draftRight ? draftRight.titleSimplified : right.clientOverride.rightTitleSimplified,
          rightDescriptionSimplified: draftRight ? draftRight.descriptionSimplified : right.clientOverride.rightDescriptionSimplified,
        }

        // Right specific Declaration
        const draftDeclarations = (draftRight?.declarations ?? []).filter((dDeclaration: any) => !dDeclaration.isDeleted);
        const deletedSpecificDeclarations = (draftRight?.declarations ?? []).filter((dDeclaration: any) => dDeclaration.isDeleted);
        const newSpecificDeclarations = (draftDeclarations ?? []).filter((ds: any) => !ds.declarationId);
        const rightSpecificDeclaration = await this.declarationService.getDeclarationsByEntityId(EntityType.RIGHT, right.id);

        const _rightSpecificDeclaration = rightSpecificDeclaration.map((declaration) => {
          const findDeclaration = (draftDeclarations ?? []).find((dDeclaration: any) => ((dDeclaration.declarationId == declaration.id) && dDeclaration.declarationId));
          const _declarationObj = {
            ...declaration,
            displayInForm: findDeclaration ? findDeclaration.displayInForm : declaration.displayInForm,
            isEditedInDraft: findDeclaration ? findDeclaration.isEditedInDraft : false,
            declaration: findDeclaration ? findDeclaration.overriddenDeclaration : declaration.clientOverride.overriddenDeclaration,
          }
          return _declarationObj
        });
        //Remove ids which are in deleted list
        const _deletedSpecificDeclarations = (deletedSpecificDeclarations ?? []);
        for (const declaration of _deletedSpecificDeclarations) {
          const findIndex = _rightSpecificDeclaration.findIndex((_declaration: any) => (_declaration.id == declaration.declarationId) && _declaration.id);
          if (findIndex > -1) {
            _rightSpecificDeclaration.splice(findIndex, 1)
          }
        }
        if (_rightSpecificDeclaration?.length) {
          _rightSpecificDeclarationMasterList = [..._rightSpecificDeclarationMasterList, ..._rightSpecificDeclaration, ...newSpecificDeclarations];
        }
        _rightObj.deletedDeclarationList = [...deletedSpecificDeclarations];
        _rights.push(_rightObj);

      }
      if (_rights?.length) {
        regulation.rightsMasterList = [...regulation.rightsMasterList, ..._rights]
      }

      if (_rightSpecificDeclarationMasterList?.length) {
        entityList[1].list = entityList[1].list.concat(_rightSpecificDeclarationMasterList)
      }
      regulation.declarationMasterList = [...entityList];
      // Set deleted declaration list
      regulation.deletedDeclarationList = [...deletedDeclarations];
    }
    // display settings
    if (draftDetails?.displaySettings) {
      formConfiguration.displaySettings = { ...configurationData.displaySettings, ...draftDetails.displaySettings }
    }
    _formConfiguration = formConfiguration;
    return { _mainConfiguration, _formConfiguration }
  }

  onPreview(formConfiguration: FormConfigurationData, currentPath: string) {
    const isPublished = formConfiguration.displaySettings.isPublished
    this.formIsPublished$.next(isPublished)
    // this.formIsUpdated$.next(true)
    this.setFormConfigurationData(formConfiguration);
    this.router.navigate([`${currentPath}/${routes.FORM_CONFIG_PREVIEW}`], {
      queryParams: {}
    });
  }

  async prepareFormPreviewConfigurationData() {
    const formConfiguration: FormConfigurationData = this.getFormConfigurationData();
    formConfiguration.requesterInfo = formConfiguration.requesterInfo.map((item: RequesterLabelInfo) => {
      return new RequesterLabelInfo({ ...item, description: item.overridden })
    })
    let countryMasterList: DataSubjectCountry[] = [];

    for (const regulation of formConfiguration.dataSubjectRegulationMasterList) {
      if (!regulation.displayInForm) {
        continue
      }
      const generalDeclaration = (regulation.declarationMasterList[0]?.list ?? []).filter(declaration => declaration.displayInForm);
      const specificDeclaration = (regulation.declarationMasterList[1]?.list ?? []).filter(declaration => declaration.displayInForm);
      const _rightsMasterList = regulation.rightsMasterList.filter(right => right.displayInForm).map(r => ({
        id: r.id,
        title: r.rightTitleSimplified,
        description: r.rightDescriptionSimplified,
        declarations: [],
        icon: r.icon
      }));
      for (const country of regulation.countries) {
        const countryFromDb = await this.countryService.getCountryById(country.countryId)
        let findCountry: any = countryMasterList.find(_country => _country.id == country.countryId);
        if (!findCountry) {
          const _country: any = {
            ...countryFromDb,
            rightsMasterList: _rightsMasterList, declarationMasterList: [...generalDeclaration, ...specificDeclaration]
          }
          const index = countryMasterList.findIndex(i => i.name > _country.name);
          if (index === -1) {
            countryMasterList.push(_country);
          } else {
            countryMasterList.splice(index, 0, _country);
          }
        }
        else {
          if (regulation?.rightsMasterList?.length) {
            findCountry.rightsMasterList = [...findCountry.rightsMasterList, ..._rightsMasterList]
          }
          if (regulation?.declarationMasterList?.length) {
            findCountry.declarationMasterList = [...findCountry.declarationMasterList, ...generalDeclaration, ...specificDeclaration
            ];
          }
        }
      }
    }
    formConfiguration.channelList = formConfiguration.channels.map(_channel => (_channel.label));
    formConfiguration.countryMasterList = [...countryMasterList];
    formConfiguration.filteredCountryList = [...countryMasterList];
    formConfiguration.filteredThirdPartyCountryList = [...countryMasterList];
    formConfiguration.filteredDataSubjectPhoneList = [...countryMasterList];
    const dataSubjectUserTypesList = formConfiguration.dataSubjectUserTypesList
    formConfiguration.dataSubjectUserTypesList = dataSubjectUserTypesList.filter(ds => ds.displayInForm)
    return formConfiguration
  }

  prepareCountryConfiguration(countryMasterList: DataSubjectCountry[], countryId: number) {
    const country = countryMasterList.find(_country => _country.id == countryId);
    const declarationList = country ? country.declarationMasterList.filter(_declaration => _declaration.entityType == EntityType.REGULATION).map(_dec => _dec.declaration) : [];
    return {
      rightsMasterList: country ? country.rightsMasterList : [],
      generalDeclarationList: declarationList
    }
  }

  prepareRightConfiguration(country: DataSubjectCountry, rightId: number) {
    const declarationList = country ? country.declarationMasterList.filter(_declaration => _declaration.entityType == EntityType.RIGHT && _declaration.entityId == rightId).map(_dec => _dec.declaration) : [];
    return {
      rightSpecificDeclarationList: declarationList
    }
  }

  preparePublishForm(isDraft: boolean = false) {

    const formConfiguration: FormConfigurationData = this.getFormConfigurationData();
    const normalizeId = (id: string | number) => (typeof id === 'string' ? 0 : id);

    let publishData = new FormConfigurationPayload({});

    publishData.requesterInfo = {
      myself: formConfiguration.requesterInfo[0].overridden ?? '',
      thirdParty: formConfiguration.requesterInfo[1].overridden ?? '',
    }

    publishData.thirdPartyRoles = formConfiguration.thirdPartyRoles.filter(_thirdPartyRole => _thirdPartyRole.isEdited || _thirdPartyRole.isEditedInDraft).map(_thirdPartyRole => {
      return this.prepareThirdPartyRoles(_thirdPartyRole, false, isDraft);
    });
    if (this.deletedThirdPartyRoleList?.length) {
      publishData.thirdPartyRoles = [...publishData.thirdPartyRoles, ...this.deletedThirdPartyRoleList];
    }

    publishData.channels = formConfiguration.channels.filter(_channel => _channel.isEdited || _channel.isEditedInDraft).map(_channel => {
      return this.prepareChannel(_channel, false, isDraft);
    });
    if (this.deletedChannelList?.length) {
      publishData.channels = [...publishData.channels, ...this.deletedChannelList];
    }

    publishData.dataSubjects = formConfiguration.dataSubjectUserTypesList
      .filter(ds => ds.isEdited || ds.isEditedInDraft)
      .map(ds => {
        return this.prepareDataSubjects(ds, false, isDraft);
      });
    if (this.deletedDataSubjectList?.length) {
      publishData.dataSubjects = [...publishData.dataSubjects, ...this.deletedDataSubjectList];
    }

    publishData.displaySettings = formConfiguration.displaySettings;
    const regulationData: FormConfigurationPayloadRegulation[] = [];
    for (const regulation of formConfiguration.dataSubjectRegulationMasterList) {
      const deletedDeclarationList = (regulation?.deletedDeclarationList ?? []);

      const _regulation: FormConfigurationPayloadRegulation = {
        actId: regulation.id,
        displayInForm: regulation.displayInForm,
        countryMappings: [],
        rightExercises: [],
        declarations: [],
        isEditedInDraft: isDraft
      };
      _regulation.countryMappings = regulation.countries.map(country => ({
        countryId: country.countryId,
        displayInForm: true,
      }));
      const selectedCountryIds = new Set(regulation.countries.map(c => c.countryId));

      const removedCountries = regulation.originalCountryList
        .filter(c => !selectedCountryIds.has(c.countryId))
        .map(c => ({ countryId: c.countryId, displayInForm: false }));

      if (removedCountries.length) {
        _regulation.countryMappings = [..._regulation.countryMappings, ...removedCountries];
      }

      const generalDeclarationMasterList = regulation.declarationMasterList?.[0]?.list ?? [];
      _regulation.declarations = generalDeclarationMasterList
        .filter(d => d.isEdited || d.isEditedInDraft)
        .map(d => {
          return this.prepareDeclaration(d, false, isDraft);
        });

      //Deleted list
      const generalDeclarationDeletedList = deletedDeclarationList.filter((d: any) => d.entityType === EntityType.REGULATION);

      if (generalDeclarationDeletedList?.length) {
        _regulation.declarations = [..._regulation.declarations, ...generalDeclarationDeletedList];
      }

      const specificDeclarationMasterList = regulation.declarationMasterList?.[1]?.list ?? [];
      for (const right of regulation.rightsMasterList) {
        const _right: RightExercise = {
          rightId: normalizeId(right.id),
          displayInForm: right.displayInForm,
          titleSimplified: right.rightTitleSimplified,
          descriptionSimplified: right.rightDescriptionSimplified,
          icon: right.icon,
          declarations: [],
          isEditedInDraft: isDraft
        };

        _right.declarations = specificDeclarationMasterList
          .filter(d => (d.isEdited || d.isEditedInDraft) && d.entityId === right.id)
          .map(d => {
            return this.prepareDeclaration(d, false, isDraft);
          });

        //Deleted list
        const newSpecificDeclarationDeletedList = (deletedDeclarationList ?? []).filter((d: any) => d.entityType === EntityType.RIGHT && d.entityId === right.id);
        const draftSpecificDeclarationDeletedList = right.deletedDeclarationList ?? [];
        const specificDeclarationDeletedList = [...newSpecificDeclarationDeletedList, ...draftSpecificDeclarationDeletedList]
        if (specificDeclarationDeletedList?.length) {
          _right.declarations = [..._right.declarations, ...specificDeclarationDeletedList];
        }

        if (_right.declarations.length > 0 || specificDeclarationDeletedList?.length > 0 || ((right.isEdited || right.isEditedInDraft) && _right.declarations.length === 0)) {
          _regulation.rightExercises.push(_right);
        }
      }

      if ((_regulation.declarations?.length > 0 || _regulation.rightExercises?.length > 0) || generalDeclarationDeletedList?.length > 0 || (regulation.isEdited || regulation.isEditedInDraft)) {
        regulationData.push(_regulation)
      }
    }
    publishData.regulations = regulationData;
    return publishData
  }

  formIsPublished() {
    this.formIsPublished$.next(true)
  }

  async clearConfigurationData() {
    this.startDbSync()
    await this.configService.getDsrConfiguration(true)
  }

  startDbSync() {
    this.dataSyncService.startSync(true)
  }

  prepareThirdPartyRoles(_thirdPartyRole: any, isDeleted: boolean = false, isDraft: boolean = false) {
    return {
      id: typeof _thirdPartyRole.id == "string" ? 0 : _thirdPartyRole.id,
      name: _thirdPartyRole.name,
      description: _thirdPartyRole.description,
      isDeleted: isDeleted,
      isEditedInDraft: isDraft
    }
  }

  prepareChannel(_channels: any, isDeleted: boolean = false, isDraft: boolean = false) {
    return {
      id: typeof _channels.id == "string" ? 0 : _channels.id,
      name: _channels.label,
      isDeleted: isDeleted,
      label: _channels.label,
      isEditedInDraft: isDraft
    }
  }

  prepareDataSubjects(ds: any, isDeleted: boolean = false, isDraft: boolean = false) {
    return {
      dataSubjectId: typeof ds.id == "string" ? 0 : ds.id,
      displayInForm: ds.displayInForm,
      name: ds.name,
      description: ds.description,
      isDeleted: isDeleted,
      isEditedInDraft: isDraft
    }
  }

  prepareDeclaration(declaration: any, isDeleted: boolean = false, isDraft: boolean = false) {
    return {
      declarationId: typeof declaration.id == "string" ? 0 : declaration.id,
      displayInForm: declaration.displayInForm,
      overriddenDeclaration: declaration.declaration,
      declaration: declaration.declaration,
      isDeleted: isDeleted,
      entityType: declaration.entityType,
      entityId: declaration.entityId,
      rightTitle: declaration.rightTitle,
      isEditedInDraft: isDraft
    }
  }

  onDeleteThirdPartyRole(_thirdPartyRole: any) {
    if (!_thirdPartyRole) {
      return
    }
    if (typeof _thirdPartyRole?.id === "string") {
      return
    }
    if (_thirdPartyRole?.id) {
      const find = this.deletedThirdPartyRoleList.find((thirdPartyRole: any) => thirdPartyRole.id == _thirdPartyRole.id);
      if (!find) {
        const deletedData = this.prepareThirdPartyRoles(_thirdPartyRole, true);
        this.deletedThirdPartyRoleList.push(deletedData)
      }
    }
  }

  onDeleteChannel(channel: any) {
    this.deletedChannelList.push({
      id: typeof channel.id === 'string' ? 0 : channel.id,
      isDeleted: true,
      isEditedInDraft: true
    });
  }


  onDeleteDataSubject(dataSubject: any) {
    if (!dataSubject) {
      return
    }
    if (typeof dataSubject?.id === "string") {
      return
    }
    if (dataSubject?.id) {
      const find = this.deletedDataSubjectList.find((ds: any) => ds.id == dataSubject.id);
      if (!find) {
        const deletedData = this.prepareDataSubjects(dataSubject, true);
        this.deletedDataSubjectList.push(deletedData)
      }
    }
  }

  onDeleteDeclaration(declaration: any, regulation: any) {
    if (!declaration) {
      return
    }
    if (typeof declaration?.id === "string") {
      return
    }
    if (!regulation.deletedDeclarationList) {
      regulation.deletedDeclarationList = [];
    }

    if (declaration?.id) {
      const find = regulation.deletedDeclarationList.find((_declaration: any) => _declaration.id == declaration.id);
      if (!find) {
        const deletedData = this.prepareDeclaration(declaration, true);
        regulation.deletedDeclarationList.push(deletedData)
      }
    }
  }

  clearDraftDetails() {
    const formConfiguration: FormConfigurationData = this.getFormConfigurationData();
    this.setFormConfigurationData({ ...formConfiguration, isDraft: false });
  }
}

