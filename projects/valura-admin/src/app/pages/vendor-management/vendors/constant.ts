export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'CREATED_AT';
export const HEADER_ACTION = 'ACTION';
export const HEADER_ID = 'HEADER_ID';
export const HEADER_ASSETS = 'HEADER_ASSETS'
export const HEADER_BPA = 'HEADER_BPA'
export const HEADER_VENDOR_STATUS = 'HEADER_VENDOR_STATUS';
export const POINT_OF_CONTACT = 'POINT_OF_CONTACT';
export const VENDOR_ID = 'VENDOR_ID';
export const HEADER_CREATED_ON = 'HEADER_CREATED_ON';

export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "IN_ACTIVE",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export const VENDOR_LISTING_HEADER = [
    { key: VENDOR_ID, headerName: 'Vendor ID', sortable: true, filter: false, columnDef: 'id', maxWidth: '80px' },
    { key: HEADER_NAME, headerName: 'Name', sortable: true, filter: false, columnDef: 'name', maxWidth: '160px', minWidth: '160px' },
    { key: POINT_OF_CONTACT, headerName: 'Third Party Type', sortable: true, filter: false, columnDef: 'thirdPartyType', maxWidth: '160px', minWidth: '160px' },
    { key: HEADER_ASSETS, headerName: 'Asset Linked', sortable: true, filter: false, columnDef: 'assetsLinked' },
    { key: HEADER_BPA, headerName: 'BPA Linked', sortable: true, filter: false, columnDef: 'bpaLinked' },
    { key: HEADER_VENDOR_STATUS, headerName: 'Status', sortable: true, filter: false, columnDef: 'status' },
    { key: HEADER_CREATED_ON, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn' },
    { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export const VENDOR_LISTING_HEADER_DRAFT = [
    { key: HEADER_NAME, headerName: 'Name', sortable: true, filter: false, columnDef: 'name', maxWidth: '160px', minWidth: '160px' },
    { key: POINT_OF_CONTACT, headerName: 'Third Party Type', sortable: true, filter: false, columnDef: 'thirdPartyType', maxWidth: '160px', minWidth: '160px' },
    { key: HEADER_ASSETS, headerName: 'Assets Linked', sortable: true, filter: false, columnDef: 'assetsLinked' },
    { key: HEADER_BPA, headerName: 'BPA Linked', sortable: true, filter: false, columnDef: 'bpaLinked' },
    { key: HEADER_CREATED_ON, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn' },
    { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export const STATUS = [
    { label: 'Active', key: 'ACTIVE' },
    { label: 'Inactive', key: 'IN_ACTIVE' }
];

export enum VendorDetailsKey {
    DETAILS = "DETAILS",
    DOCUMENTS = "DOCUMENTS",
    RELATED_COMPONENTS = "RELATED_COMPONENTS"
}


export const TAB_HEADER_DETAILS = [
    { key: VendorDetailsKey.DETAILS, name: 'Details' },
    { key: VendorDetailsKey.DOCUMENTS, name: 'Documents' },
    { key: VendorDetailsKey.RELATED_COMPONENTS, name: 'Related Components' },

]

export enum VendorDocumentKey {
    DOCUMENT_NAME = 'documentName',
    DOCUMENT_TYPE = 'documentType',
    DESCRIPTION = 'description',
    EFFECTIVE_DATE = 'effectiveDate',
    EXPIRY_DATE = 'expiryDate',
    ACTION = 'action'
}
export const VENDOR_DOCUMENT_HEADERS = [
    { key: VendorDocumentKey.DOCUMENT_NAME, columnDef: 'documentName', header: 'Document Name', width: '15%' },
    { key: VendorDocumentKey.DOCUMENT_TYPE, columnDef: 'documentType', header: 'File Type', width: '15%' },
    { key: VendorDocumentKey.DESCRIPTION, columnDef: 'description', header: 'Description', width: '40%' },
    { key: VendorDocumentKey.EFFECTIVE_DATE, columnDef: 'effectiveDate', header: 'Effective Date', width: '12%' },
    { key: VendorDocumentKey.EXPIRY_DATE, columnDef: 'expiryDate', header: 'Expiry Date', width: '10%' },
    { key: VendorDocumentKey.ACTION, columnDef: 'action', header: 'Action', width: '8%', textEnd: true }
];

export enum createVendorCommandType {
    UpdateStatus = 'updateStatus',
}
