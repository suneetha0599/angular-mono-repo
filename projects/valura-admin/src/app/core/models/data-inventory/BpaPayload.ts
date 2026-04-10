export interface BpaPayload {
    id: number;
    userId: number;
    name: string;
    description: string;
    owner: any;
    departmentId: number;
    legalBasis: number[];
    volumeOfPersonalData: string;
    frequencyOfProcessing: string;
    dataSubjectRegionIds: number[];
    dataSubjectIds: number[];
    purposes: number[];
    controllerMappings: ControllerMapping[];
    pdMappings: PdMapping[];
    bpaSources: BpaSourceMapping[];
    assetMappings: BpaAssetMapping[];
    recipientMappings: RecipientMapping[];
    retentionPeriod: string;
    securityMeasures: any;
}

export interface ControllerMapping {
    name: string;
    type: string;
}

export interface PdMapping {
    pdElementId: number;
    dsId: number;
    purposeId: number[];
}

export interface BpaSourceMapping {
    sourceId: number;
    pdMappings: PdElementRef[];
}

export interface PdElementRef {
    pdElementId: number;
    dsId: number;
}

export interface BpaAssetMapping {
    assetId: number;
    pdMappings: PdElementRef[];
}

export interface RecipientMapping {
    entityType: string;
    entityId: number;
    numberOfPersonHavingAccess: number;
    purpose: string;
    pdMappings: PdElementRef[];
}


//Update BPA payload
export interface BpaUpdatePayload {
    id: number;
    userId: number;
    name: string;
    description: string;
    owner: any;
    departmentId: number;
    legalBasis: LegalBasisMapping[];
    volumeOfPersonalData: string;
    frequencyOfProcessing: string;
    dataSubjectRegionIds: DsRegionMapping[];
    dataSubjectIds: any[];
    bpaPurposes: any[];
    controllerMappings: ControllerMapping[];
    pdMappings: PdMappingPayload[];
    sourcePdElementsMappings: SourceBpaMappingPayload[];
    assetPdElementsMappings: AssetBpaMappingPayload[];
    recipientPdElementsMappings: RecipientBpaMappingPayload[];
    retentionPeriod: string;
    securityMeasures: any;
}

export interface LegalBasisMapping {
    legalBasisId: number;
    legalBasisIdBpaMappingId: number;
    isDeleted: boolean;
}

export interface DsRegionMapping {
    dsRegionId: number;
    dsRegionBpaMappingId: number;
    isDeleted: boolean;
}

export interface PdMappingPayload {
    dsBpaMapping: {
        dsBpaMappingId: number;
        dsId: number;
        isDeleted: boolean;
        pdId: number;
    };
    pdBpaPurposeMappings: {
        isDeleted: boolean;
        pdBpaPurposeMappingId: number;
        purposeId: number;
    }[];
    pdElementBpaMapping: {
        isDeleted: boolean;
        pdElementBpaMappingId: number;
        pdElementId: number;
    };
}

export interface SourceBpaMappingPayload {
    sourceBpaMapping: {
        isDeleted: boolean;
        sourceBpaMappingId: number;
        sourceId: number;
    };
    pdElementMappings: SourcePdMappingPayload[]
}

export interface SourcePdMappingPayload {
    dsId: number;
    isDeleted: boolean;
    pdElementBpaMappingId: number;
    pdElementId: number;
    sourceBpaMappingId: number;
}
export interface AssetBpaMappingPayload {
    assetBpaMapping: {
        assetBpaMappingId: number;
        assetId: number;
        isDeleted: boolean;
    };
    pdElementMappings: AssetPdMappingPayload[]
}

export interface AssetPdMappingPayload {
    dsId: number;
    isDeleted: boolean;
    pdElementAssetMappingId: number;
    pdElementId: number;
    assetBpaMappingId: number;
}

export interface RecipientBpaMappingPayload {
    entityId: string;
    entityType: string;
    isDeleted: boolean;
    numberOfPersonHavingAccess: number;
    purpose: string;
    recipientBpaMappingId: number;
    pdElementMappings: RecipientPdMappingPayload[]
}

export interface RecipientPdMappingPayload {
    dsId: number;
    isDeleted: boolean;
    pdElementId: number;
    pdElementRecipientMappingId: number;
    recipientBpaMappingId: number;
}

export interface PurposeMappingPayload {
    purposeId: number;
    bpaPurposeId: number;
    isDeleted: boolean;
}

export interface RegionMappingPayload {
    dsRegionId: number;
    dsRegionBpaMappingId: number;
    isDeleted: boolean;
}

export interface DataSubjectTypeMappingPayload {
    dsId: number;
    dsBpaMappingId: number;
    isDeleted: boolean;
}
