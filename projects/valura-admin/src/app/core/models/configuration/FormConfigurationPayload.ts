export class FormConfigurationPayload {
    requesterInfo: RequesterInfo;
    thirdPartyRoles: ThirdPartyRole[];
    regulations: Regulation[];
    dataSubjects: DataSubject[];
    displaySettings: DisplaySettings;
    channels: PayloadChannel[];
    constructor({
        requesterInfo = {} as RequesterInfo,
        thirdPartyRoles = [],
        channels = [],
        regulations = [],
        dataSubjects = [],
        displaySettings = {} as DisplaySettings
    }) {
        this.requesterInfo = requesterInfo;
        this.thirdPartyRoles = thirdPartyRoles;
        this.regulations = regulations;
        this.channels = channels;
        this.dataSubjects = dataSubjects;
        this.displaySettings = displaySettings;
    }
}

export interface RequesterInfo {
    myself: string;
    thirdParty: string;
}

export interface ThirdPartyRole {
    name: string;
    description: string;
}

export interface PayloadChannel{
    name: string;
}

export interface Regulation {
    actId: number;
    countryMappings: CountryMapping[];
    rightExercises: RightExercise[];
    declarations: Declaration[];
    displayInForm: boolean;
    isEditedInDraft: boolean
}

export interface CountryMapping {
    countryId: number;
    displayInForm: boolean;
}

export interface RightExercise {
    rightId: number;
    displayInForm: boolean;
    titleSimplified: string;
    descriptionSimplified: string;
    icon: string;
    declarations: Declaration[];
    isEditedInDraft: boolean
}

export interface Declaration {
    declarationId: number;
    displayInForm: boolean;
    overriddenDeclaration: string;
}

export interface DataSubject {
    dataSubjectId: number;
    displayInForm: boolean;
    description: string;
}

export interface DisplaySettings {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    copyright: string;
    formInformation: FormInformation;
}

export interface FormInformation {
    title: string;
    subTitle: string;
}
