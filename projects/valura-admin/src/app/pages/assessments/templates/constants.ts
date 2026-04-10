export const ALL = 'ALL';
export const DRAFTS = 'DRAFTS';

export const FIRST_PAGE = 1;
export const PAGE_SIZE = 10;

export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_STATUS = 'HEADER_STATUS';
export const HEADER_DATE = 'HEADER_DATE';
export const HEADER_ACTION = 'HEADER_ACTION';
export const HEADER_DESCRIPTION = 'HEADER_DESCRIPTION';
export const HEADER_LINKED_ASSESSMENTS = 'HEADER_LINKED_ASSESSMENTS';
export const HEADER_CLONE_STATUS = 'cloneStatus';
export const CLONE = 'CLONE';
export const HEADER_CREATED_BY = 'HEADER_CREATED_BY';

export enum TEMPLATE_MODE {
  EDIT = 'EDIT',
  VIEW = 'VIEW',
  CREATE = 'CREATE'
}

export const TAB_HEADER_DETAILS = [
  { name: 'Published', count: 0, key: ALL },
  { name: 'Unpublished', count: 0, key: DRAFTS },
];

//Template status
export enum TemplateStatus {
  OPEN = "OPEN",
}

export const TEMPLAE_HEADERS = [
  {
    columnDef: 'templateId',
    headerName: 'Template ID',
    key: 'TEMPLATE_ID',
    sortable: true,
    width: '100px'
  },
  {
    columnDef: 'name',
    headerName: 'Template Name',
    key: HEADER_NAME,
    sortable: true,
    width: '300px',
    maxWidth: '150px'
  },
  {
    columnDef: 'type',
    headerName: 'Type',
    key: 'HEADER_TYPE',
    sortable: true,
    width: '160px'
  },
  {
    columnDef: 'status',
    headerName: 'Status',
    key: HEADER_STATUS,
    sortable: true,
    width: '160px'
  },
  {
    columnDef: 'createdByUserName',
    headerName: 'Created By',
    key: HEADER_CREATED_BY,
    sortable: true,
    width: '160px',
    maxWidth: '160px'
  },
  {
    columnDef: 'createdOn',
    headerName: 'Created On',
    key: HEADER_DATE,
    sortable: true,
    width: '160px'
  },
  {
    columnDef: 'actions',
    headerName: 'Actions',
    key: HEADER_ACTION,
    sortable: false,
    width: '50px'
  },
];



export const TEMPLAE_DRAFT_HEADERS = [
  {
    columnDef: 'name',
    headerName: 'Template Name',
    key: HEADER_NAME,
    sortable: true,
    width: '300px',
    maxWidth: '150px'
  },
  {
    columnDef: 'type',
    key: 'HEADER_TYPE',
    headerName: 'Type',
    sortable: true,
    width: '160px'
  },
  {
    columnDef: 'createdByUserName',
    headerName: 'Created By',
    key: HEADER_CREATED_BY,
    sortable: true,
    width: '160px',
    maxWidth: '160px'
  },
  {
    columnDef: 'createdOn',
    headerName: 'Created On',
    key: HEADER_DATE,
    sortable: true,
    width: '160px'
  },
  // {
  //   columnDef: 'status',
  //   headerName: 'Status',
  //   key: HEADER_STATUS,
  //   sortable: true,
  // },
  {
    columnDef: 'actions',
    headerName: 'Actions',
    key: HEADER_ACTION,
    sortable: false,
    width: '50px'
  },
];

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = "IN_ACTIVE",
}

export const StatusList = [
  { value: Status.ACTIVE, label: 'Active' },
  { value: Status.INACTIVE, label: 'Inactive' }
];