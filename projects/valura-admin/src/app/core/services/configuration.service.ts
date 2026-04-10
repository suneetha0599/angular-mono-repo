import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  public onEntityTypeChange$: BehaviorSubject<string> = new BehaviorSubject('');
  constructor() { }
}
