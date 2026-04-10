import { Channel } from "@admin-core/constants/constants";
import { Country, DataSubjectUserType, Organization } from "../DsrConfiguration";
import { Declaration, Regulation, RegulationRight } from "./regulation";

export class RequesterLabelInfo {
    label: string;
    originalLabel: string;
    overridden: string;
    type: string;
    description: string;
    icon: string;
    constructor({
        label = '',
        originalLabel = '',
        overridden = '',
        type = '',
        description = '',
        icon = ''
    } = {}) {
        this.label = label;
        this.originalLabel = originalLabel;
        this.overridden = overridden;
        this.type = type
        this.description = description
        this.icon = icon
    }
}

export class RequesterInfo {
    myself: RequesterLabelInfo;
    thirdParty: RequesterLabelInfo;

    constructor({
        myself = new RequesterLabelInfo({}),
        thirdParty = new RequesterLabelInfo({})
    } = {}) {
        this.myself = myself;
        this.thirdParty = thirdParty;
    }
}

export class ThirdPartyRole {
    id: number;
    name: string;
    description: string;
    isEdited: boolean
    isEditedInDraft: boolean
    constructor({
        id = 0,
        name = '',
        description = '',
        isEdited = false,
        isEditedInDraft = false,
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isEdited = isEdited
        this.isEditedInDraft = isEditedInDraft
    }
}

export class FormInformation {
    title: string;
    subTitle: string;

    constructor({
        title = '',
        subTitle = ''
    } = {}) {
        this.title = title;
        this.subTitle = subTitle;
    }
}

export class DisplaySettings {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    copyright: string;
    formInformation: FormInformation;
    isPublished: boolean;

    constructor({
        logoUrl = '',
        primaryColor = '',
        secondaryColor = '',
        copyright = '',
        isPublished = false,
        formInformation = new FormInformation({})
    } = {}) {
        this.logoUrl = logoUrl;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.copyright = copyright;
        this.isPublished = isPublished;
        this.formInformation = formInformation;
    }
}

export class FormConfiguration {
    requesterInfo: RequesterInfo;
    thirdPartyRoles: ThirdPartyRole[];
    displaySettings: DisplaySettings;

    constructor({
        requesterInfo = new RequesterInfo({}),
        thirdPartyRoles = [],
        displaySettings = new DisplaySettings({})
    } = {}) {
        this.requesterInfo = requesterInfo;
        this.thirdPartyRoles = thirdPartyRoles;
        this.displaySettings = displaySettings;
    }
}

export class FormConfigurationData {
    requesterInfo: RequesterLabelInfo[];
    thirdPartyRoles: ThirdPartyRole[];
    displaySettings: DisplaySettings;
    channelList: string[];
    statusList: string[];
    dataSubjectUserTypesList: FormDataSubjectUserType[];
    countryMasterList: DataSubjectCountry[];
    filteredCountryList: DataSubjectCountry[];
    filteredThirdPartyCountryList: DataSubjectCountry[];
    filteredDataSubjectPhoneList: DataSubjectCountry[];
    organizationList: Organization[];
    emailRegex: string;
    defaultCountry: number;
    channels: Channel[];
    dataSubjectRegulationMasterList: DataSubjectRegulation[]
    dataSubjectRightsMasterList: any[]
    isDraft: boolean

    constructor({
        requesterInfo = [],
        thirdPartyRoles = [],
        displaySettings = new DisplaySettings({}),
        channelList = [],
        statusList = [],
        dataSubjectUserTypesList = [],
        countryMasterList = [],
        filteredCountryList = [],
        filteredThirdPartyCountryList = [],
        channels = [],
        filteredDataSubjectPhoneList = [],
        organizationList = [],
        emailRegex = '',
        defaultCountry = 0,
        dataSubjectRegulationMasterList = [],
        dataSubjectRightsMasterList = [],
        isDraft = false,
    } = {}) {
        this.requesterInfo = requesterInfo;
        this.thirdPartyRoles = thirdPartyRoles;
        this.displaySettings = displaySettings;
        this.channelList = channelList;
        this.statusList = statusList;
        this.dataSubjectUserTypesList = dataSubjectUserTypesList
        this.countryMasterList = countryMasterList;
        this.filteredCountryList = filteredCountryList;
        this.filteredThirdPartyCountryList = filteredThirdPartyCountryList;
        this.filteredDataSubjectPhoneList = filteredDataSubjectPhoneList;
        this.organizationList = organizationList;
        this.channels = channels;
        this.emailRegex = emailRegex;
        this.defaultCountry = defaultCountry;
        this.dataSubjectRegulationMasterList = dataSubjectRegulationMasterList
        this.dataSubjectRightsMasterList = dataSubjectRightsMasterList
        this.isDraft = isDraft
    }
}

export interface DataSubjectRegulation extends Regulation {
    rightsMasterList: FormRight[]
    declarationMasterList: DataSubjectDeclaration[]
    originalCountryList: any[]
    countryNames: string
    displayInForm: boolean
    isEdited: boolean
    deletedDeclarationList: any
    isEditedInDraft: boolean
}


export interface DataSubjectDeclaration {
    label: string,
    type: string,
    list: FormDeclaration[]
    id?: number
}
export interface FormRight extends RegulationRight {
    displayInForm: boolean
    isEdited: boolean
    isEditedInDraft: boolean
    deletedDeclarationList: any[]
}
export interface FormDataSubjectUserType extends DataSubjectUserType {
    displayInForm: boolean
    isEdited: boolean
    isEditedInDraft: boolean
}

export interface FormDeclaration extends Declaration {
    displayInForm: boolean
    isEdited: boolean
    isEditedInDraft: boolean
}

export interface DataSubjectCountry extends Country {
    rightsMasterList: FormRight[]
    countryId: number
    declarationMasterList: FormDeclaration[]
}

export class channelList {
    id: number;
    name: string;
    description: string;
    isEdited: boolean
    isEditedInDraft: boolean
    constructor({
        id = 0,
        name = '',
        description = '',
        isEdited = false,
        isEditedInDraft = false,
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isEdited = isEdited
        this.isEditedInDraft = isEditedInDraft
    }
}


