import { Asset } from "./Asset";
export class PdElement {
    id!: number;
    name!: string;

    categoryName?: string[];
    categoryId?: number[];
    categoryNames?: string[];
    categoryIds?: number[];
    classificationId?: number[];
    classification?: string[];
    classificationMapping?: any[];
    categoryMapping?: any[]

    pdBpaMappingId?: number;
    isUpdated!: boolean;
    sensitivity?: string;
    classificationName?: any
    originalPdBpaMapingId?: number
    constructor(init?: Partial<PdElement>) {
        Object.assign(this, init);
    }
}

export class DataSubjectPdElemementMapping {
    dataSubjectType: BpaDataSubject | null
    pdElementMappingList: PdElementMapping[]
    selected: boolean

    constructor({
        dataSubjectType = null,
        pdElementMappingList = [],
        selected = false,
    }) {
        this.dataSubjectType = dataSubjectType
        this.pdElementMappingList = pdElementMappingList
        this.selected = selected
    }
}

export class SourcetPdElementMapping {
    source: BpaSource | null
    type: string
    pdElementMappingList: PdElementMapping[]
    channel: string
    selected: boolean
    id: number
    constructor({
        source = null,
        type = '',
        pdElementMappingList = [],
        channel = '',
        selected = false,
        id = 0,
    }) {
        this.source = source
        this.type = type
        this.pdElementMappingList = pdElementMappingList
        this.channel = channel
        this.selected = selected
        this.id = id
    }
}

export class AssetPdElementMapping {
    asset: BpaAsset | null
    pdElementMappingList: PdElementMapping[]
    dataSubjectName: string[]
    selected: boolean
    id: number
    dataSubject: string
    constructor({
        asset = null,
        pdElementMappingList = [],
        dataSubjectName = [],
        selected = false,
        id = 0,
        dataSubject = ''
    }) {
        this.asset = asset
        this.pdElementMappingList = pdElementMappingList
        this.dataSubjectName = dataSubjectName
        this.selected = selected
        this.id = id
        this.dataSubject = dataSubject
    }
}

export class RecipientPdElementMapping {
    type: string;
    recipient: any;
    numberOfPersonHavingAccess: number;
    purpose: string;
    pdElementMappingList: PdElementMapping[];
    id: number
    constructor({
        type = '',
        recipient = null,
        numberOfPersonHavingAccess = 0,
        purpose = '',
        pdElementMappingList = [],
        id = 0,
    }) {
        this.type = type;
        this.recipient = recipient;
        this.numberOfPersonHavingAccess = numberOfPersonHavingAccess;
        this.purpose = purpose;
        this.pdElementMappingList = pdElementMappingList;
        this.id = id
    }
}


export class PdElementMapping {
    dataSubject: BpaDataSubject | null;
    pdElement: PdElement | null;
    purpose: Purpose[];
    selected: boolean;
    newAdded: boolean;
    id: number;
    newItemId: string;
    originalPurposeMappingList: Purpose[];

    constructor({
        dataSubject = null,
        pdElement = null,
        purpose = [],
        selected = false,
        newAdded = false,
        id = 0,
        newItemId = '',
        originalPurposeMappingList = [],
    }) {
        this.dataSubject = dataSubject
        this.pdElement = pdElement
        this.purpose = purpose
        this.selected = selected
        this.newAdded = newAdded
        this.id = id
        this.newItemId = newItemId
        this.originalPurposeMappingList = originalPurposeMappingList
    }
}

export interface Purpose {
    id: number;
    purposeName: string;
    bpaPurposeMappingId: number
    pdBpaPurposeMappingId: number
}
export class BpaDataSubject {
    id: number;
    name: string;
    dsBpaMappingId: number

    constructor({
        id = 0,
        name = '',
        dsBpaMappingId = 0,
    }) {
        this.id = id
        this.name = name
        this.dsBpaMappingId = dsBpaMappingId

    }
}

export interface BpaDepartment {
    id: number;
    name: string;
}
export interface BpaAssetSource {
    id: number;
    name: string;
    channel?: string;
    type?: string;
    description?: string;
    category?: string;
    location?: string;
}

export interface CollectionPoint {
    assetId: number;
    collectionPoint: string;
    id: number;
    sourceType: string;
    type: string;
}

export interface BpaSourceCollectionPoint extends Asset {
    assetId: number;
    collectionPoint: string;
    id: number;
    sourceType: string;
    type: string;
}
export interface BpaCategory {
    id: number;
    name: string;
    sensitivity?: string;
}
export class BpaAsset {
    id: number;
    name: string;
    type: string
    categoryName: string
    hostingSite: any[];
    assetBpaMappingId: number

    constructor({
        id = 0,
        name = '',
        type = '',
        categoryName = '',
        hostingSite = [],
        assetBpaMappingId = 0,
    }) {
        this.id = id
        this.name = name
        this.type = type
        this.categoryName = categoryName
        this.hostingSite = hostingSite
        this.assetBpaMappingId = assetBpaMappingId

    }
}

export class BpaSource {
    id: number;
    name: string;
    sourceType: string;
    type: string
    sourceBpaMappingId: number
    category: string
    tempSourceId: any

    constructor({
        id = 0,
        name = '',
        sourceType = '',
        type = '',
        sourceBpaMappingId = 0,
        category = '',
        tempSourceId = '',
    }) {
        this.id = id
        this.name = name
        this.sourceType = sourceType
        this.type = type
        this.sourceBpaMappingId = sourceBpaMappingId
        this.category = category
        this.tempSourceId = tempSourceId
    }
}

export interface PdElementMappingResponse {
    id: number;
    pdElementId: number;
    dataSubjectId: number;
}

export interface LegalBasis {
    id: number;
    actId: number;
    name: string;
    mappingId: number
}

export interface Country {
    id: number;
    name: string;
    countryPhoneCode: string;
    countryFlagUrl: string;
    dsRegionBpaMappingId: number
}

export class BpaClassification {
    id: number;
    name: string;
    description: string

    constructor({
        id = 0,
        name = '',
        description = ''
    }) {
        this.id = id
        this.name = name
        this.description = description
    }
}

export interface CollectionPointId {
    id: number;
}