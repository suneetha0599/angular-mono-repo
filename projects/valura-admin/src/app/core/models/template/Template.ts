export interface template {
  templateId: string;
  templateName: string;
  status: string;
  createdOn: string;
  createdBy: string;
  actions: string[];
}

export interface TableHeader {
  columnDef: string;
  headerName: string;
  key: string;
  sortable: boolean;
}
