export class DIDataSubject {
    id: number;
    name: string;
    categoryList: DICategory[];

    constructor({
        id = 0,
        name = '',
        categoryList = []
    }) {
        this.id = id
        this.name = name
        this.categoryList = categoryList

    }
}

export class DICategory {
    id: number;
    name: string;
    sensitivity: string
    pdElementList: PdElement[]

    constructor({
        id = 0,
        name = '',
        sensitivity = '',
        pdElementList = []
    }) {
        this.id = id
        this.name = name
        this.sensitivity = sensitivity
        this.pdElementList = pdElementList
    }
}

export class PdElement {
    id: number;
    name: string;
    classificationId: number
    classification: string
    purposes: Purpose[];
    dataSource: any
    tableHeaders: any
    displayedHeaders: any
    expanded: boolean
    purposeCount: number;
    purposesLoaded: boolean

    constructor({
        id = 0,
        name = '',
        classificationId = 0,
        classification = '',
        purposes = [],
        dataSource = null,
        tableHeaders = null,
        displayedHeaders = null,
        expanded = false,
        purposesLoaded = false,
    }) {
        this.id = id
        this.name = name
        this.classificationId = classificationId
        this.classification = classification
        this.purposes = purposes
        this.dataSource = dataSource
        this.tableHeaders = tableHeaders
        this.displayedHeaders = displayedHeaders
        this.expanded = expanded
        this.purposeCount = purposes.length;
        this.purposesLoaded = purposesLoaded
    }
}

export class PdElementMapping {
    purpose: string;
    legalGround: string;
    collectionSource: string;
    storage: string;
    owner: string;
    thirdParty: string;

    constructor({
        purpose = '',
        legalGround = '',
        collectionSource = '',
        storage = '',
        owner = '',
        thirdParty = ''
    }) {
        this.purpose = purpose
        this.legalGround = legalGround
        this.collectionSource = collectionSource
        this.storage = storage
        this.owner = owner
        this.thirdParty = thirdParty
    }
}
export interface PdInventory {
    dsId: number,
    pdId: number,
    purposes: []
}

export interface Category {
    items: CategoryItem[];
}

export interface CategoryItem {
    id: number;
    name: string;
    sensitivity: string
    pds: PdElement[];
}

export interface Purpose {
    purposeId: number;
    name: string;
    origin: string;
    bpaName: string;
    legalBases: LegalBase[];
    externalStorage: StorageItem[];
    internalStorage: StorageItem[];
    retentionPeriod: string;
    vendorRecipients: Recipient[];
    internalRecipients: InternalRecipient[];
    sourceOfCollection: SourceOfCollection[];
    thirdPartyRecipients: Recipient[];
}

export interface LegalBase {
    name: string | null;
    id: number | null;
}

export interface StorageItem {
    name: string;
}

export interface Recipient {
    // Extend later if needed
}

export interface InternalRecipient {
    purpose: string;
    entityId: number;
    entityType: string;
}

export interface SourceOfCollection {
    type: string;
    assetId: number;
    sourceType: string;
    collectionPoint: string;
}
