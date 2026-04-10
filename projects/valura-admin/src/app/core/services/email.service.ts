import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor() { }

  private ids: number[] = [];
  private currentIndex = -1;

  setList(ids: number[], currentId: number) {
    this.ids = ids;
    this.currentIndex = ids.indexOf(currentId);
  }

  getPrev() {
    return this.currentIndex > 0 ? this.ids[this.currentIndex - 1] : null;
  }

  getNext() {
    return this.currentIndex < this.ids.length - 1
      ? this.ids[this.currentIndex + 1]
      : null;
  }

  moveTo(id: number) {
    this.currentIndex = this.ids.indexOf(id);
  }
}
