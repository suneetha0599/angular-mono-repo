import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LSK_PAGE_FM_RID, LSK_PAGE_TITLE, LSK_NAV_OPEN, } from '@admin-core/constants/local-storage-constants';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {

  public sideNavState$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public pageTitle: BehaviorSubject<string> = new BehaviorSubject('');
  public pageFmRid: BehaviorSubject<string> = new BehaviorSubject('');


  constructor() {
    this.setPageTittle(this.getPageTitle())
    this.setPageFmRid(this.getPageFmRid())

    let isNavOpen = getItem(LSK_NAV_OPEN)
    this.sideNavState$.next(isNavOpen)
  }

  setPageTittle(pageTitle: string = '') {
    if (pageTitle)
      setItem(LSK_PAGE_FM_RID, pageTitle)
    this.pageTitle.next(pageTitle)
  }

  setPageFmRid(fmRid: string) {
    if (fmRid)
      setItem(LSK_PAGE_TITLE, fmRid)
    this.pageFmRid.next(fmRid)
  }


  getPageTitle(): string {
    return getItem(LSK_PAGE_TITLE)
  }

  getPageFmRid(): string {
    return getItem(LSK_PAGE_FM_RID)
  }
}
