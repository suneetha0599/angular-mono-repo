
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'HEADER_DATE';
export const HEADER_ACTION = 'HEADER_ACTION';
export const HEADER_ID = 'HEADER_ID';
export const HEADER_LEGAL = 'HEADER_LEGAL';
export const HEADER_COLLECTION_SOURCE = 'COLLECTION_SOURCE';
export const HEADER_STORAGE = 'STORAGE';

export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;

export const DS_DATA_ELEMENT_HEADER = [
    { id: 1, key: HEADER_ID, headerName: 'ID', sortable: true, filter: false, columnDef: 'purposeId' },
    { id: 2, key: HEADER_NAME, headerName: 'Purposes', sortable: true, filter: false, columnDef: 'name' },
    { id: 3, key: HEADER_LEGAL, headerName: 'Simplified Legal Ground', sortable: true, filter: false, columnDef: 'legalBases' },
    { id: 4, key: HEADER_COLLECTION_SOURCE, headerName: 'Collection Source', sortable: true, filter: false, columnDef: 'sourceOfCollection' },
    { id: 5, key: HEADER_STORAGE, headerName: 'Storage Location', sortable: true, filter: false, columnDef: 'internalStorage' },
    { id: 6, key: '', headerName: 'Internal Owner', sortable: true, filter: false, columnDef: 'internalOwner' },
    { id: 7, key: '', headerName: 'Third Party', sortable: true, filter: false, columnDef: 'thirdParty' },
    { id: 8, key: '', headerName: 'Third Party Purpose', sortable: true, filter: false, columnDef: 'thirdPartyPurpose' },
    { id: 9, key: '', headerName: 'Retention Period', sortable: true, filter: false, columnDef: 'retentionPeriod' },
    { id: 10, key: '', headerName: 'Origin', sortable: true, filter: false, columnDef: 'origin' },
    { id: 11, key: '', headerName: 'Linked BPA', sortable: true, filter: false, columnDef: 'bpaName' },
];



export enum DataInventoryButtonKey {
    ALL = "ALL",
    THIRD_PARTY = "THIRD_PARTY"
}

export enum DataInventoryDrawer {
    DATA_ELEMENT = "DATA_ELEMENT",
}

export enum DataDiscoveryModule {
    BPA = "BPA",
    DATA_INVENTORY = "DATA_INVENTORY"
}

export const DataInventoryButtonTabs = [
    { id: 1, key: DataInventoryButtonKey.ALL, label: "All" },
    { id: 2, key: DataInventoryButtonKey.THIRD_PARTY, label: "Third party" },
]

export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "IN_ACTIVE",
}

export const STATUS = [
    { label: 'Active', key: Status.ACTIVE },
    { label: 'Inactive', key: Status.INACTIVE }
];

