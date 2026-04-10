import { routes as routeConstants } from '@admin-core/constants/routes';


export const HEADER_NAME = 'HEADER_NAME';
export const HEADER_STATUS = 'HEADER_STATUS'
export const HEADER_ACTIONS = 'HEADER_ACTIONS'

export const CONSENT_STATUS_INPROGRESS = 1
export const CONSENT_STATUS_UNVERIFIED = 2
export const CONSENT_STATUS_REJECTED = 3
export const CONSENT_STATUS_ESCALATED = 4
export const CONSENT_STATUS_COMPLETED = 5

// CONSENT PURPOSE 
export const PURPOSE = "PURPOSE"
export const PURPOSE_DRAFTS = "DRAFTS"
export const BTN_TERM = "TERM"
export const BTN_CATEGORY = "CATEGORY"
export const BTN_ADD_PURPOSE = "ADD_PURPOSE"

export const DRAWER_SELECTION = "selection"
export const DRAWER_SUMMARY = "summary"

// CONSENT TEMPLATES 
export const TEMPLATES = "TEMPLATES"
export const TEMPLATES_DRAFTS = "DRAFTS"

// CONSENT FORMS 
export const FORMS = "FORMS"
export const FORMS_DRAFTS = "DRAFTS"

// CONSENT RECORDS 
export const RECORDS = "RECORDS"
export const RECORDS_DRAFTS = "DRAFTS"

export const CONSENT_PURPOSE_CATEGORIES = [
    { label: "Purposes", key: PURPOSE },
    { label: "Drafts", key: PURPOSE_DRAFTS }
]

export const CONSENT_TEMPLATES_CATEGORIES = [
    { label: "Consent template", key: TEMPLATES },
    { label: "Drafts", key: TEMPLATES_DRAFTS }
]

export const CONSENT_FORMS_CATEGORIES = [
    { label: "Forms created", key: FORMS },
    { label: "Drafts", key: FORMS_DRAFTS }
]

export const CONSENT_RECORDS_CATEGORIES = [
    { label: "Withdrawal request", key: RECORDS },
    { label: "Consent records", key: RECORDS_DRAFTS }
]

export const CONSENT_PURPOSE_HEADER = [
    { key: '', headerName: 'Purpose ID', sortable: false, filter: false, columnDef: 'purposeRid' },
    { key: HEADER_NAME, headerName: 'Purpose Name', sortable: false, filter: false, columnDef: 'purposeName' },
    { headerName: 'PD Elements', sortable: false, filter: false, columnDef: 'pdElements' },
    { key: '', headerName: 'Assigned To', sortable: false, filter: false, columnDef: 'assignedTo' },
    { key: '', headerName: 'Expiring In', sortable: false, filter: false, columnDef: 'expiredIn' },
    { key: '', headerName: 'Last Updates', sortable: false, filter: false, columnDef: 'lastUpdate' },
    { key: HEADER_STATUS, headerName: 'Status', field: 'status', sortable: false, filter: false, columnDef: 'status', },
    { key: HEADER_ACTIONS, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions' }
]

export const CONSENT_TEMPLATES_HEADER = [
    { key: 'ID', headerName: 'ID', sortable: false, filter: false, columnDef: 'templateRid' },
    { key: HEADER_NAME, headerName: 'Template', sortable: false, filter: false, columnDef: 'templateName' },
    { key: '', headerName: 'Upstream Sources', sortable: false, filter: false, columnDef: 'upstreamSources' },
    { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
    { key: '', headerName: 'Purpose', sortable: false, filter: false, columnDef: 'purpose' },
    { key: '', headerName: 'Data Subject', sortable: false, filter: false, columnDef: 'dataSubject' },
    { key: '', headerName: 'Method', sortable: false, filter: false, columnDef: 'method' },
    { key: '', headerName: 'Requested On', sortable: false, filter: false, columnDef: 'requestedOn' },
    { key: '', headerName: 'Performed By', sortable: false, filter: false, columnDef: 'performedBy' },
]

export const CONSENT_FORMS_HEADER = [
    { key: 'ID', headerName: 'ID', sortable: false, filter: false, columnDef: 'formRid' },
    { key: HEADER_NAME, headerName: 'Form Name', sortable: false, filter: false, columnDef: 'formName' },
    { headerName: 'Description', sortable: false, filter: false, columnDef: 'description' },
    { headerName: 'Created date', sortable: false, filter: false, columnDef: 'createdDate' },
    { key: HEADER_ACTIONS, headerName: 'Actions', sortable: false, filter: false, columnDef: 'actions' },
]

export const CONSENT_RECORDS_HEADER = [
    { key: 'ID', headerName: 'ID', sortable: false, filter: false, columnDef: 'templateRid' },
    { key: HEADER_NAME, headerName: 'Template', sortable: false, filter: false, columnDef: 'templateName' },
    { key: '', headerName: 'Upstream Sources', sortable: false, filter: false, columnDef: 'upstreamSources' },
    { key: HEADER_STATUS, headerName: 'Status', sortable: false, filter: false, columnDef: 'status' },
    { key: '', headerName: 'Purpose', sortable: false, filter: false, columnDef: 'purpose' },
    { key: '', headerName: 'Data Subject', sortable: false, filter: false, columnDef: 'dataSubject' },
    { key: '', headerName: 'Method', sortable: false, filter: false, columnDef: 'method' },
    { key: '', headerName: 'Requested On', sortable: false, filter: false, columnDef: 'requestedOn' },
    { key: '', headerName: 'Performed By', sortable: false, filter: false, columnDef: 'performedBy' },
]

export const isConsentPurpose = (url: string): boolean => {
    return url.includes(routeConstants.CONSENT_MANAGEMENT_PURPOSE)
}

export const isConsentTemplates = (url: string): boolean => {
    return url.includes(routeConstants.CONSENT_MANAGEMENT_TEMPLATES)
}

export const isConsentForms = (url: string): boolean => {
    return url.includes(routeConstants.CONSENT_MANAGEMENT_FORMS)
}

export const isConsentRecords = (url: string): boolean => {
    return url.includes(routeConstants.CONSENT_MANAGEMENT_RECORDS)
}

//temp data
export const tempPurposeData = [{
    purposeRid: 1,
    purposeName: "Security Audit",
    pdElements: "Access Log",
    assignedTo: "Alice Johnson",
    expiredIn: "2025-08-01",
    lastUpdate: "2025-07-01",
    status: 1,
},
{
    purposeRid: 2,
    purposeName: "Data Backup",
    pdElements: "User Files",
    assignedTo: "Bob Smith",
    expiredIn: "2025-09-15",
    lastUpdate: "2025-06-30",
    status: 5
},
{
    purposeRid: 3,
    purposeName: "Policy Review",
    pdElements: "Compliance Docs",
    assignedTo: "Cathy Lee",
    expiredIn: "2025-07-31",
    lastUpdate: "2025-07-08",
    status: 5
},
{
    purposeRid: 4,
    purposeName: "Infrastructure Update",
    pdElements: "Server Inventory",
    assignedTo: "Dan Miller",
    expiredIn: "2025-08-20",
    lastUpdate: "2025-07-05",
    status: 3
},
{
    purposeRid: 5,
    purposeName: "User Training",
    pdElements: "Training Material",
    assignedTo: "Eva Carter",
    expiredIn: "2025-08-10",
    lastUpdate: "2025-07-03",
    status: 5
},
{
    purposeRid: 6,
    purposeName: "Incident Response",
    pdElements: "Threat Report",
    assignedTo: "Frank Zhang",
    expiredIn: "2025-07-30",
    lastUpdate: "2025-07-07",
    status: 3
},
{
    purposeRid: 7,
    purposeName: "Compliance Audit",
    pdElements: "Vendor Logs",
    assignedTo: "Grace Kim",
    expiredIn: "2025-09-01",
    lastUpdate: "2025-07-06",
    status: 4
},
{
    purposeRid: 8,
    purposeName: "System Upgrade",
    pdElements: "Patch Notes",
    assignedTo: "Henry Blake",
    expiredIn: "2025-08-25",
    lastUpdate: "2025-07-04",
    status: 1
},
{
    purposeRid: 9,
    purposeName: "License Renewal",
    pdElements: "Software Keys",
    assignedTo: "Irene Lopez",
    expiredIn: "2025-08-05",
    lastUpdate: "2025-07-02",
    status: 2
},
{
    purposeRid: 10,
    purposeName: "New Hire Setup",
    pdElements: "Employee Checklist",
    assignedTo: "Jake Wilson",
    expiredIn: "2025-07-20",
    lastUpdate: "2025-07-09",
    status: 1
},
{
    purposeRid: 11,
    purposeName: "Data Migration",
    pdElements: "DB Records",
    assignedTo: "Karen Price",
    expiredIn: "2025-08-18",
    lastUpdate: "2025-07-05",
    status: 2
},
{
    purposeRid: 12,
    purposeName: "Cloud Integration",
    pdElements: "API Configs",
    assignedTo: "Liam Brown",
    expiredIn: "2025-08-30",
    lastUpdate: "2025-07-08",
    status: 3
},
{
    purposeRid: 13,
    purposeName: "Performance Testing",
    pdElements: "Test Results",
    assignedTo: "Mona Green",
    expiredIn: "2025-08-12",
    lastUpdate: "2025-07-06",
    status: 1
},
{
    purposeRid: 14,
    purposeName: "Vendor Onboarding",
    pdElements: "Contract Docs",
    assignedTo: "Nate Rivera",
    expiredIn: "2025-09-10",
    lastUpdate: "2025-07-03",
    status: 3
},
{
    purposeRid: 15,
    purposeName: "Privacy Assessment",
    pdElements: "PII Inventory",
    assignedTo: "Olivia Adams",
    expiredIn: "2025-08-22",
    lastUpdate: "2025-07-07",
    status: 5
}];

export const tempTemplatesData = [{
    templateRid: 1,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 2,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 3,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 3,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 4,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 4,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 5,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 5,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 6,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 6,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 7,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 3,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 8,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 4,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 9,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 5,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 10,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 11,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
}];

export const tempFormData = [{
    formRid: 1,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
},
{
    formRid: 2,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
},
{
    formRid: 3,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
},
{
    formRid: 4,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
},
{
    formRid: 5,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
},
{
    formRid: 6,
    formName: "Security Audit",
    description: "Access Log",
    createdDate: "2025-08-01",
}];

export const tempRecordsData = [{
    templateRid: 1,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 2,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 3,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 3,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 4,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 4,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 5,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 5,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 6,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 6,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 7,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 3,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 8,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 4,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 9,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 5,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 10,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 1,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
},
{
    templateRid: 11,
    templateName: "Security Audit",
    upstreamSources: "Access Log",
    status: 2,
    purpose: "2025-08-01",
    dataSubject: "2025-07-01",
    method: "",
    requestedOn: "",
    performedBy: ""
}];