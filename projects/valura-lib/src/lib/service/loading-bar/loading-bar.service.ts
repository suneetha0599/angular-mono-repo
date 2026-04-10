import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingBarService {

  private totalRequests: number = 0;
  private completedRequests: number = 0;
  progressEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  onRequestStart(): void {
    this.totalRequests++;
    this.emitProgress();
  }

  onRequestComplete(): void {
    this.completedRequests++;

    this.emitProgress();
    if (this.completedRequests === this.totalRequests) {
      this.onRequestsComplete();
    }
  }

  onRequestsComplete(): void {
    this.totalRequests = 0;
    this.completedRequests = 0;
  }

  private emitProgress(): void {
    this.progressEmitter.emit(this.totalRequests > this.completedRequests);
  }
}
