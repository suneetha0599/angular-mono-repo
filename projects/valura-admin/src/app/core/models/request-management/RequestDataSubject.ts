
export interface RequestDataSubject {
    dsrForms: RequestDataSubjectForm[];
    totalRequestCount: number;
    openRequestCount: number;
    expiryRequestCount: number;
    inProgressRequestCount: number;

}export interface RequestDataSubjectForm {
    formId: number;
    requestedOn: string;
    status: string;
    firstName: string;
    lastName: string;
    requestedBy: string;
    assignedTo: number;
    timeLeft: number;
    recordsModified: any[];
    requestType: string;
    channel: string;
    assigneeName: string;
}

