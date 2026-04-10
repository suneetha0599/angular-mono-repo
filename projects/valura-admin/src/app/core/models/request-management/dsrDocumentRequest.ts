export class DsrDocumentRequest {
  id: number;
  type: string;
  status: string;
  documentRequestList: DocumentRequest[]
  showUploadBtn: boolean //local variable
  cancelLoading: boolean

  constructor({
                id = 0,
                type = '',
                status = '',
                documentRequestList = [],
                showUploadBtn = false,
                cancelLoading = false,
              }) {
    this.id = id;
    this.type = type;
    this.status = status;
    this.documentRequestList = documentRequestList
    this.showUploadBtn = showUploadBtn
    this.cancelLoading = cancelLoading
  }
}


export class DocumentRequest {
  id: number
  name: any;
  description: string;
  type: string;
  attachment: any
  processed: any
  maxFileSize: any
  constructor({
                id = 0,
                name = null,
                description = '',
                type = '',
                attachment = null,
                processed = null,
                maxFileSize = null,
              }) {
    this.id = id
    this.name = name;
    this.description = description;
    this.type = type;
    this.attachment = attachment
    this.processed = processed
    this.maxFileSize = maxFileSize
  }
}
