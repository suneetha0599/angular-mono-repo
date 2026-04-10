import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface RiskDrawerPayload {
  assessmentId: number;
  questionId?: number;
  sections: any[];
  editData: any;
  isEditMode: boolean;
  source?: string;
  riskMatrix?: string;
  hideQuestionFields?: boolean;
  sectionContext?: { sectionId: number; sectionName: string; questionText: string };
}

export interface RiskSavedEvent {
  source?: string;
}

@Injectable({ providedIn: 'root' })
export class RiskDrawerService {
  private openSubject = new Subject<RiskDrawerPayload>();
  private closeSubject = new Subject<void>();
  private savedSubject = new Subject<RiskSavedEvent>();
  private currentSource: string | undefined;

  readonly open$ = this.openSubject.asObservable();
  readonly close$ = this.closeSubject.asObservable();
  readonly saved$ = this.savedSubject.asObservable();

  open(payload: RiskDrawerPayload): void {
    this.currentSource = payload.source;
    this.openSubject.next(payload);
  }

  close(): void {
    this.closeSubject.next();
  }

  notifySaved(): void {
    this.savedSubject.next({ source: this.currentSource });
    this.currentSource = undefined;
  }
}
