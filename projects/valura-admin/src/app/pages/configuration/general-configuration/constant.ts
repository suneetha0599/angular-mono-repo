import { AUDIT_LOG_MODULE } from "@admin-core/constants/constants";

export enum GeneralTabKey {
    PD_ELEMENTS = 'PD_ELEMENTS',
    DATA_SUBJECTS = 'DATA_SUBJECTS',
    DEPARTMENTS = 'DEPARTMENTS'
}

export const GENERAL_CONFIG_STAGES = [
    { position: 0, name: "Personal Data Elements", key: GeneralTabKey.PD_ELEMENTS, addButtonLabel: 'Add data elements' },
    { position: 1, name: "Data Subjects", key: GeneralTabKey.DATA_SUBJECTS, addButtonLabel: 'Add Data Subject' },
    { position: 2, name: "Departments", key: GeneralTabKey.DEPARTMENTS, addButtonLabel: 'Add Department' },
];

export const PD_ELEMENTS_MENU = [
    { name: 'DATA_ELEMENT' },
    { name: 'CATEGORY' },
    { name: 'CLASSIFICATION' }
];

export const templateType = [
    { value: "SMS", label: "SMS" },
    { value: "EMAIL", label: "EMAIL" },
]

export const module = [
    { value: AUDIT_LOG_MODULE.DSR, label: "DSR" },
    { value: AUDIT_LOG_MODULE.DATA_DISCOVERY, label: "Data Inventory" },
    { value: AUDIT_LOG_MODULE.ASSESSMENT, label: "Assessment" },
    { value: AUDIT_LOG_MODULE.TASK_MANAGEMENT, label: "Task" },
    { value: AUDIT_LOG_MODULE.AUTH, label: "Auth" }
]
