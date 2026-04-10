import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CreateTaskPayload {
  assessmentId: number;
  sections: any[];
  questionId?: number;
}

@Injectable({ providedIn: 'root' })
export class CreateTaskDrawerService {
  private openSubject = new Subject<CreateTaskPayload>();

  readonly open$ = this.openSubject.asObservable();

  open(payload: CreateTaskPayload): void {
    this.openSubject.next(payload);
  }
}
