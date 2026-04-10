export interface Regulation {
    id: number;
    name: string;
    jurisdiction: string;
    dataSubjectRegion: string;
    countries: any[];
    isEnabled: boolean;
    respondTime: string;
    extensionTime: string;
}

export interface RegulationRight {
    id: number;
    actId: number;
    displayName: string;
    metaJson: string;
    rightTitle: string;
    rightDescription: string;
    rightTitleSimplified: string;
    rightDescriptionSimplified: string;
    displayInForm: boolean;
    declarations: Declaration[];
    specificValidationsJson: string;
    rightsCategory: string;
    icon: string;
    iconName?: string;
    clientOverride: {
        rightDescriptionSimplified: string
        rightTitleSimplified: string
        icon: string
    }
}


export interface RegulationPayload {
    actName: string;
    jurisdiction: string;
    countryIds: number[];
    dataSubjectRegion: string,
    respondTime: number,
    extensionTime: number,
}

export interface LegalBasis {
    id: number;
    actId: number;
    name: string;
    provision?: string;
    description?: string;
}

export interface SecurityControl {
    id: number;
    name: string;
}

export interface PdElements {
    id: number;
    name: string;
    categoryName?: string;
    categoryId?: number
    classificationId?: number
    categoryIds?: any
    classificationIds?: any
    classification?: string
    pdBpaMappingId?: string;
    categoryMappings?: any[];
    classificationMappings?: any[];
}

export interface PdCategory {
    id: number;
    name: string;
}

export interface DataSubject {
    id: number;
    name: string;
    description: string;
}

export interface RegulationsTrigger {
    id: number;
    name: string;
    source: string;
    triggerLabel: string;
    createdAt: string;
    updatedAt: string;
    actId: number;
}

export interface ThirdPartyRole {
    id: number;
    name: string;
    description: string
}

export interface Platform {
    id: number;
    name: string;
}

export interface ValidationQuestion {
    id: number;
    question: string;
    optionName: string[];
    questionType: string;
    typeOfOptions: string[];
    shouldDisplayChildQuestion: boolean;
    section: any
    type: string;
    entityType: string;
    entityId: number;
    actId: number
    provision: string
}


export interface Declaration {
    id: number;
    declaration: string;
    type: string
    entityType: string;
    entityId: number;
    actId?: number;
    clientOverride: {
        overriddenDeclaration: string
    }
    displayInForm: boolean
}

export interface Country {
    id: number;
    name: string;
    countryPhoneCode: string;
    countryCode: string;
    dsrResolutionTime: number;
    dsrResolutionExtensionTime: number;
    phoneNumberLength: number;
    createdAt: string;
}

export interface Classfication {
    id: number;
    name: string;
    description: string
}
