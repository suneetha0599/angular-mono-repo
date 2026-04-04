import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValuraLibService {

  projectName: string = '';

  constructor() { }

  setProjectName(_projectName: string) {
    this.projectName = _projectName;
  }

  getProjectName() {
    return this.projectName;
  }
}
