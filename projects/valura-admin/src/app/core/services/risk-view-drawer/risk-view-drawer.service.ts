import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface RiskViewPayload {
  riskData: any;
  assessmentId: number;
  sections: any[];
  isApprover?: boolean;
  isRespondent?: boolean;
  assessmentRiskMaster?: boolean;
}

export interface RiskTaskPayload {
  riskData: any;
  assessmentId: number;
  sections: any[];
  risks?: any[];
  isEditMode?: boolean;
  taskData?: any;
  questionId?: number;
  source?: string;
  hideParameterFields?: boolean;
  reopenDetailOnSave?: boolean;
}

export interface TaskSavedEvent {
  source?: string;
}

export interface ReopenTaskDetailPayload {
  taskId: number;
  assessmentId?: number;
}

@Injectable({ providedIn: 'root' })
export class RiskViewDrawerService {
  private openSubject = new Subject<RiskViewPayload>();
  private closeSubject = new Subject<void>();
  private editSubject = new Subject<any>();
  private deleteSubject = new Subject<any>();
  private createTaskSubject = new Subject<RiskTaskPayload>();
  private taskSavedSubject = new Subject<TaskSavedEvent>();
  private reopenTaskDetailSubject = new Subject<ReopenTaskDetailPayload>();
  private currentSource: string | undefined;

  readonly open$ = this.openSubject.asObservable();
  readonly close$ = this.closeSubject.asObservable();
  readonly edit$ = this.editSubject.asObservable();
  readonly delete$ = this.deleteSubject.asObservable();
  readonly createTask$ = this.createTaskSubject.asObservable();
  readonly taskSaved$ = this.taskSavedSubject.asObservable();
  readonly reopenTaskDetail$ = this.reopenTaskDetailSubject.asObservable();

  open(payload: RiskViewPayload): void {
    this.openSubject.next(payload);
  }

  close(): void {
    this.closeSubject.next();
  }

  triggerEdit(riskData: any): void {
    this.editSubject.next(riskData);
  }

  triggerDelete(riskData: any): void {
    this.deleteSubject.next(riskData);
  }

  triggerCreateTask(payload: RiskTaskPayload): void {
    this.currentSource = payload.source;
    this.createTaskSubject.next(payload);
  }

  notifyTaskSaved(): void {
    this.taskSavedSubject.next({ source: this.currentSource });
    this.currentSource = undefined;
  }

  triggerReopenTaskDetail(payload: ReopenTaskDetailPayload): void {
    this.reopenTaskDetailSubject.next(payload);
  }
}
