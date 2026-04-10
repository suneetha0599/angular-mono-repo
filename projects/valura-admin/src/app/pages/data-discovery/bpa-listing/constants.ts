export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_DATE = 'CREATED_AT';
export const HEADER_ACTION = 'ACTION';

export const HEADER_ID = 'HEADER_ID';
export const THIRD_PARTY = 'THIRD_PARTY';
export const HEADER_TRIGGER = 'HEADER_TRIGGER'

export const HEADER_ASSETS = 'HEADER_ASSETS'
export const HEADER_VENDOR_STATUS = 'HEADER_VENDOR_STATUS';

export const DRAWER_SUMMARY = "summary"

export const PAGE_SIZE = 10;
export const FIRST_PAGE = 1;

export const ALL = "ALL"
export const PRIORITY = "PRIORITY"
export const OPEN = "OPEN"
export const DRAFTS = "DRAFTS"

//BPA status
export enum Status {
  OPEN = "OPEN",
}

export const FORM_ERROR_LABELS: Record<string, string> = {
  'recipients.recipientsPdElementsMapping.*.purpose': 'Reason for Access',
  'dataElements.dataSubjectPdElementMapping.*.pdElementMappingList.*.purpose': 'Purpose'

};

export const BPA_LISTING_HEADER = [
  { key: '', headerName: 'Process ID', sortable: true, filter: true, columnDef: 'bpaId' },
  { key: HEADER_NAME, headerName: 'Process Name', sortable: true, filter: true, columnDef: 'name' },
  // { key: '', headerName: 'Volume of Data subject', sortable: false, filter: false, columnDef: 'riskLevel' },
  { key: '', headerName: 'Process Owner', sortable: true, filter: true, columnDef: 'owner' },
  { key: '', headerName: 'Department', sortable: false, filter: false, columnDef: 'associatedDepartment' },
  { key: '', headerName: 'Volume of Data Subjects', sortable: true, filter: true, columnDef: 'dsInvolved' },
  { key: '', headerName: 'Linked Assets', sortable: false, filter: false, columnDef: 'assetLinked' },
  { key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: true, columnDef: 'createdAt' },
  // { key: '', headerName: 'Role', sortable: false, filter: false, columnDef: 'role' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: true, columnDef: 'status' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export const BPA_LISTING_DRAFT_HEADER = [
  // { key: '', headerName: 'BPA ID', sortable: false, filter: false, columnDef: 'bpaId' },
  { key: HEADER_NAME, headerName: 'Name', sortable: true, filter: true, columnDef: 'name' },
  // { key: '', headerName: 'Risk', sortable: false, filter: false, columnDef: 'risk' },
  { key: '', headerName: 'Process Owner', sortable: true, filter: true, columnDef: 'owner' },
  { key: '', headerName: 'Department', sortable: false, filter: false, columnDef: 'department' },
  { key: '', headerName: 'Assets', sortable: false, filter: false, columnDef: 'asset' },
  { key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: true, columnDef: 'createdAt' },
  // { key: '', headerName: 'Data Subject involved range', sortable: false, filter: false, columnDef: 'dsInvolved' },
  // { key: '', headerName: 'Role', sortable: false, filter: false, columnDef: 'role' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: true, columnDef: 'status' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];


export const ASSESSMENT_HEADER_BPA = [
  { key: '', headerName: 'Assessment ID', sortable: false, filter: false, columnDef: 'id' },
  { key: HEADER_NAME, headerName: 'Assessment Name', sortable: true, filter: false, columnDef: 'name' },
  { key: '', headerName: 'Linked BPA', sortable: true, filter: false, columnDef: 'bpaName' },
  { key: '', headerName: 'Author', sortable: false, filter: false, columnDef: 'owner' },
  { key: HEADER_DATE, headerName: 'Created On', sortable: true, filter: false, columnDef: 'createdOn' },
  { key: HEADER_DATE, headerName: 'Due Date', sortable: true, filter: false, columnDef: 'dueDate' },
  { key: HEADER_STATUS, headerName: 'Status', sortable: true, filter: false, columnDef: 'status' },
  // { key: HEADER_TRIGGER, headerName: 'Trigger', sortable: false, filter: false, columnDef: 'trigger' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export enum CreateBpaTabKey {
  OVERVIEW = 'OVERVIEW',
  DATA_ELEMENTS = 'DATA_ELEMENTS',
  SOURCES = 'SOURCES',
  ASSETS = 'ASSETS',
  RECIPIENTS = 'RECIPIENTS',
  DATA_FLOW = 'DATA_FLOW',
  SECURITY_CONTROLS = 'SECURITY_CONTROLS',
  RISK_SUMMARY = 'RISK_SUMMARY'
}

export const CREATE_BPA_STAGES = [
  { position: 0, name: "Overview", key: CreateBpaTabKey.OVERVIEW },
  { position: 1, name: "Personal Data Elements", key: CreateBpaTabKey.DATA_ELEMENTS },
  { position: 2, name: "Sources", key: CreateBpaTabKey.SOURCES },
  { position: 3, name: "Assets", key: CreateBpaTabKey.ASSETS },
  { position: 4, name: "Recipients", key: CreateBpaTabKey.RECIPIENTS },
  { position: 5, name: "Data Flow", key: CreateBpaTabKey.DATA_FLOW },
  { position: 6, name: "Security Controls", key: CreateBpaTabKey.SECURITY_CONTROLS },
  { position: 7, name: "Risk Summary", key: CreateBpaTabKey.RISK_SUMMARY }
];

export enum CreateRegulationKey {
  DSSR = 'DSSR',
  BPA = 'BPA',
  ASSESSMENT = 'ASSESSMENT'
}

export const REGULATION_STAGES = [
  { name: "DSRR Management", key: CreateRegulationKey.DSSR },
  { name: "Data Discovery", key: CreateRegulationKey.BPA },
  { name: "Assessment", key: CreateRegulationKey.ASSESSMENT }
];

export enum RegulationDSSR {
  RIGHTS = 'Rights',
  VALIDATION_QUESTION = 'Validation Question',
  DECLARATION = 'Declaration',
  // SLA = 'SLA'
}

export const REGULATION_DSSR_STAGES = [
  { name: "Rights", key: RegulationDSSR.RIGHTS, buttonName: "Add Right" },
  { name: "Validation Question", key: RegulationDSSR.VALIDATION_QUESTION, buttonName: "Add Question" },
  { name: "Declarations", key: RegulationDSSR.DECLARATION, buttonName: 'Add Declaration' },
  // { name: "SLA", key: RegulationDSSR.SLA }
];

export enum RegulationBPA {
  LEGAL_GROUND = 'Legal Ground'
}

export const REGULATION_BPA_STAGES = [
  { name: "Legal Ground", key: RegulationBPA.LEGAL_GROUND, buttonName: "Add Legal Ground" }
];

export enum Sensitivity {
  LOW = 'LOW',
  MEDIUM = "MEDIUM",
  HIGH = 'HIGH'
}

export enum BpaDrawerViewType {
  ADD = 'ADD',
  EDIT = 'EDIT'
}

export const BPA_TYPE = [
  { label: 'Internal', key: 'internal' },
  { label: 'External', key: 'external', }
];

export const FREQUENCIES = [
  { id: 1, name: 'One Time', label: 'One Time' },
  { id: 3, name: 'Monthly', label: 'Monthly' },
  { id: 5, name: 'Yearly', label: 'Yearly' },
  { id: 4, name: 'Continuous', label: 'Continuous' },
];

export const STATUS = [
  { label: 'Active', key: 'ACTIVE' },
  { label: 'Inactive', key: 'IN_ACTIVE' }
];

export const SENSITIVITY_LIST = [
  { label: 'Low', key: Sensitivity.LOW },
  { label: 'Medium', key: Sensitivity.MEDIUM, },
  { label: 'High', key: Sensitivity.HIGH, }

];

export enum BpaRecepient {
  DEPARTMENT = 'DEPARTMENT',
  VENDOR = "VENDOR",
  THIRD_PARTY = 'THIRD_PARTY'
}

export enum Recipient {
  DEPARTMENT = 'DEPARTMENT',
  INTERNAL = 'INTERNAL',
  VENDOR = "VENDOR",
  THIRD_PARTY = 'THIRD_PARTY'
}

export const RECEPIENT_LIST = [
  { key: Recipient.INTERNAL, name: 'Internal' },
  { key: Recipient.VENDOR, name: 'External Vendor' },
  { key: Recipient.THIRD_PARTY, name: 'External Third Parties' }
];

export const RECEPIENT_NAME_LIST = [
  ...RECEPIENT_LIST,
  { key: Recipient.DEPARTMENT, name: 'Department' },
];

export enum DataElementHeaderKey {
  SELECT = 'select',
  PERSONAL_DATA_ELEMENT = 'personalDataElement',
  DATA_CATEGORY = 'dataCategory',
  CLASSIFICATION = 'classification',
  PURPOSE = 'purpose',
  ACTIONS = 'actions',
}

export enum BpaAssetHeaderKey {
  SELECT = 'select',
  PERSONAL_DATA_ELEMENT = 'personalDataElement',
  CATEGORY = 'category',
  ACTIONS = 'actions',
  ASSET_NAME = 'assetName',
  TYPE = 'type',
  HOSTING_LOCATION = 'hostingLocation',
  LINKED_SOURCES = 'linkedSources',
  DATA_SUBJECT = 'dataSubject'
}

export enum BpaSourceHeaderKey {
  SELECT = 'select',
  PERSONAL_DATA_ELEMENT = 'personalDataElement',
  sourceType = 'sourceType',
  ACTIONS = 'actions',
  SOURCE_NAME = 'name',
  TYPE = 'type',
  HOSTING_LOCATION = 'hostingLocation',
  DATA_SUBJECT = 'dataSubject'
}

export enum DrawerMode {
  MAPPING = 'MAPPING',
  PD_MAPPING = 'PD_MAPPING',
}

export enum DATA_MANAGMENT_TABS {
  DATA_ELEMENTS = 'DATA_ELEMENTS',
  SOURCES = 'SOURCES',
  ASSETS = 'ASSETS',
  RECIPIENTS = 'RECIPIENTS'
}

export const DATA_ELEMENT_HEADERS = [
  { id: 1, key: DataElementHeaderKey.SELECT, headerName: '', sortable: false },
  { id: 2, key: DataElementHeaderKey.PERSONAL_DATA_ELEMENT, headerName: 'Personal Data Element', sortable: true },
  { id: 5, key: DataElementHeaderKey.PURPOSE, headerName: 'Purpose', sortable: true },
  { id: 3, key: DataElementHeaderKey.DATA_CATEGORY, headerName: 'Data category', sortable: true },
  { id: 4, key: DataElementHeaderKey.CLASSIFICATION, headerName: 'Classification', sortable: true },
  { id: 6, key: DataElementHeaderKey.ACTIONS, headerName: 'Actions', sortable: false }
];


export const DATA_ELEMENT_DRAWER_HEADERS: any = [
  { id: 1, key: DataElementHeaderKey.SELECT, headerName: '', sortable: false },
  { id: 2, key: DataElementHeaderKey.PERSONAL_DATA_ELEMENT, headerName: 'Personal Data Element', sortable: true },
  { id: 3, key: DataElementHeaderKey.DATA_CATEGORY, headerName: 'Data category', sortable: true },
  { id: 4, key: DataElementHeaderKey.CLASSIFICATION, headerName: 'Classification', sortable: true },
  { id: 5, key: DataElementHeaderKey.ACTIONS, headerName: 'Actions', sortable: true },

];

export const BPA_ASEET_HEADERS = [
  { id: 1, key: BpaAssetHeaderKey.ASSET_NAME, headerName: 'Asset name', sortable: true },
  { id: 2, key: BpaAssetHeaderKey.TYPE, headerName: 'Type', sortable: true },
  { id: 3, key: BpaAssetHeaderKey.CATEGORY, headerName: 'Category', sortable: true },
  // { id: 4, key: BpaAssetHeaderKey.HOSTING_LOCATION, headerName: 'Hosting location', sortable: true },
  // { id: 5, key: BpaAssetHeaderKey.LINKED_SOURCES, headerName: 'Linked Sources', sortable: true },
  // { id: 6, key: BpaAssetHeaderKey.DATA_SUBJECT, headerName: 'Data subject', sortable: true },
  { id: 7, key: BpaAssetHeaderKey.PERSONAL_DATA_ELEMENT, headerName: 'Pd elements', sortable: true },
  { id: 8, key: BpaAssetHeaderKey.ACTIONS, headerName: 'Action', sortable: false }
];

export const BPA_ASEET_DRAWER_HEADERS = [
  { id: 1, key: BpaAssetHeaderKey.SELECT, headerName: '', sortable: false, },
  { id: 2, key: BpaAssetHeaderKey.ASSET_NAME, headerName: 'Asset name', sortable: true },
  { id: 3, key: BpaAssetHeaderKey.CATEGORY, headerName: 'Category', sortable: true },
  { id: 4, key: BpaAssetHeaderKey.TYPE, headerName: 'Type', sortable: true },
];

export const BPA_ASEET_DATA_ELEMENT_DRAWER_HEADERS: any = DATA_ELEMENT_DRAWER_HEADERS.concat([
  { id: 5, key: BpaAssetHeaderKey.DATA_SUBJECT, headerName: 'Data subject', sortable: true }
]);

export const BPA_SOURCE_DRAWER_HEADERS = [
  { id: 1, key: BpaSourceHeaderKey.SELECT, headerName: '', sortable: false, },
  { id: 2, key: BpaSourceHeaderKey.SOURCE_NAME, headerName: 'Name', sortable: true },
  { id: 3, key: BpaSourceHeaderKey.TYPE, headerName: 'Type', sortable: true },
  { id: 4, key: BpaSourceHeaderKey.sourceType, headerName: 'Category', sortable: true },
];

export enum SOURCE_TYPE_ENUM {
  DIRECT = "DIRECT",
  INDIRECT = "INDIRECT"
}
export const SOURCE_TYPE = [
  { key: SOURCE_TYPE_ENUM.DIRECT, label: "Direct" },
  { key: SOURCE_TYPE_ENUM.INDIRECT, label: "Indirect" }
]

export enum ASSET_TYPE_ENUM {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL"
}

export const ASSET_TYPE = [
  { key: ASSET_TYPE_ENUM.INTERNAL, label: "Internal" },
  { key: ASSET_TYPE_ENUM.EXTERNAL, label: "External" }
]

export const COLLECTION_POINT_TYPE = [
  ...SOURCE_TYPE
]


//external window
export enum BPA_EXTERNAL_WINDOW {
  DATA_ELEMENT_PD = 'DATA_ELEMENT_PD',
  PD_CATEGORY = 'PD_CATEGORY',
  SOURCE_ELEMENT_PD = 'SOURCE_ELEMENT_PD',
  ASSET_ELEMENT_PD = 'ASSET_ELEMENT_PD',
}


export enum BPA_MODE {
  EDIT = 'EDIT',
  VIEW = 'VIEW'
}

//dialog types
export enum DialogTypes {
  BPA_SAVE = "BPA_SAVE"
}
export const HEADER_EXPAND = 'expand';


export const RISK_LISTING_HEADER = [
  { key: HEADER_EXPAND, headerName: '', sortable: false, filter: false, columnDef: 'expand' },
  { key: '', headerName: 'Risk ID', sortable: false, filter: false, columnDef: 'id' },
  { key: HEADER_NAME, headerName: 'Parameter', sortable: false, filter: false, columnDef: 'parameterName' },
  { key: HEADER_ASSETS, headerName: 'Risk description', sortable: false, filter: false, columnDef: 'description' },
  { key: '', headerName: 'Likelihood', sortable: false, filter: false, columnDef: 'likelihood' },
  { key: '', headerName: 'Impact', sortable: false, filter: false, columnDef: 'impact' },
  { key: HEADER_VENDOR_STATUS, headerName: 'Category Type', sortable: false, filter: false, columnDef: 'categoryType' },
  //  { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'approvalStatus' },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];


export const RISK_LISTING_FOR_APPROVER = [
  { key: HEADER_EXPAND, headerName: '', sortable: false, filter: false, columnDef: 'expand' },
  { key: '', headerName: 'Risk ID', sortable: false, filter: false, columnDef: 'riskId' },
  { key: HEADER_NAME, headerName: 'Parameter', sortable: false, filter: false, columnDef: 'parameterName' },
  { key: HEADER_ASSETS, headerName: 'Description', sortable: false, filter: false, columnDef: 'riskDescription' },
  { key: '', headerName: 'Likelihood', sortable: false, filter: false, columnDef: 'likelihood' },
  { key: '', headerName: 'Impact', sortable: false, filter: false, columnDef: 'impact' },
];


export const RISK_OPTIONS = [
  { key: 'AVOID', label: 'Avoid' },
  { key: 'ACCEPT', label: 'Accept' },
  { key: 'MITIGATE', label: 'Mitigate' },
  { key: 'TRANSFER', label: 'Transfer' }
];

export const MEASURE_HEADER = [
  { key: HEADER_NAME, headerName: 'Measure', columnDef: 'name', sortable: false },
  { key: HEADER_ACTION, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions', stickyEnd: true },
];

export interface RISK {
  id: number;
  parameter: string;
  description: string;
  likelihood: string;
  impact: string;
  categoryType: string;
  measures?: any[];
  measureIds?: any[];
}

export enum CreatItemType {
  DATA_ELEMENTS = "DATA_ELEMENTS",
  SOURCE = "SOURCE",
  ASSET = "ASSET",
  RECEPIENT = "RECEPIENT"
}

export enum SOURCE_CATEGORY {
  ASSET = "ASSET",
  COLLECTION_POINT = "COLLECTION_POINT",
}
