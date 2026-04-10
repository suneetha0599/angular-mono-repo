export interface EmailTemplate {
  id?: number;
  name: string;
  triggerId?: string;
  triggerEvent?: string;
  triggerDescription: string
  subject: string;
  status?: string;
  notificationType?: string;
  templateType: string;
  body: string;
  module: string;
}

export interface EmailTemplatePayload {
  name?: string;
  triggerEvent?: string;
  subject: string;
  triggerId: string;
  notificationType: string,
  templateType: string,
  body: string,
  htmlContent?: string;
  module: string,
  triggerDescription?: string
}