
import { RequestTask } from "@admin-core/models/request-management/DsrRequest";
import { RequestManagementService } from "@admin-core/services/request-management/request-management.service";
import { DsrRequestDetails } from "@admin-core/models/request-management/DsrRequest";
export interface DialogData {
  requestRid: number;
  task?: RequestTask;
  parentTask?: RequestTask;
  dialogTitle: string;
  dialogType: string;
  componentStage?: string;
  requestService?: RequestManagementService;
  parentTaskId?: number;
  isEditMode?: boolean;
  dsrRequestDetails?: DsrRequestDetails;
  documentsList?: any[];

}
export interface DialogResult {
  taskUpdated: boolean;
}

export interface PriorityOption {
  label: string;
  value: string;
}

export interface DocumentOption {
  id: string;
  name: string;
  fullPath: string;
  url?: string;
}
