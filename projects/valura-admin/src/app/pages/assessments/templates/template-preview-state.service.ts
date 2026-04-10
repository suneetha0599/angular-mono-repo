import { Injectable } from '@angular/core';
import { LSK_TEMPLATE_PREVIEW_DATA, LSK_TEMPLATE_UPDATED } from '@admin-core/constants/local-storage-constants';
import { BehaviorSubject } from 'rxjs';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class TemplatePreviewStateService {
  private templateDetails: any = null;
  public formIsUpdated$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor() {
    const formIsUpdated = this.getFormState();
    this.updateFormState(formIsUpdated)
  }


  setSnapshot(data: any, templateId: string | number): void {
    this.templateDetails = data;
    setItem(LSK_TEMPLATE_PREVIEW_DATA, data)
  }

  getSnapshot(): any {
    if (this.templateDetails) {
      return this.templateDetails;
    }
    return (getItem(LSK_TEMPLATE_PREVIEW_DATA)) ?? null
  }

  clearSnapshot(): void {
    this.templateDetails = null;
    removeItem(LSK_TEMPLATE_PREVIEW_DATA)
  }

  hasSnapshot(): boolean {

    return this.getSnapshot() ? true : false
  }

  private returnTab: 'basic' | 'questions' | null = null;

  setReturnTab(tab: 'basic' | 'questions') {
    this.returnTab = tab;
  }

  getReturnTab(): 'basic' | 'questions' | null {
    return this.returnTab;
  }

  clearReturnTab() {
    this.returnTab = null;
  }

  setFormState(formState: boolean) {
    setItem(LSK_TEMPLATE_UPDATED, formState);
  }

  getFormState() {
    return !!getItem(LSK_TEMPLATE_UPDATED);
  }

  removeFormState() {
    removeItem(LSK_TEMPLATE_UPDATED);
  }

  updateFormState(formUpdated: boolean) {
    this.formIsUpdated$.next(formUpdated);
    if (formUpdated) {
      this.setFormState(formUpdated);
      return
    }
    this.removeFormState();
  }

  removeStorageData() {
    removeItem(LSK_TEMPLATE_PREVIEW_DATA)
    this.removeFormState()
  }
}