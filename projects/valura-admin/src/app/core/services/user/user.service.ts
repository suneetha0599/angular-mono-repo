import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { AuthService } from '../auth.service';
import { User } from '@admin-core/models/user.model';
import { ADMIN_USER, EXTERNAL_USER, INTERNAL_USER } from '@admin-core/constants/constants';
import { BehaviorSubject } from 'rxjs';
import { LSK_USER_CURRENT_RID, LSK_USER_FILTER, LSK_USER_NEXT_RID, LSK_USER_NEXT_SHIFTED, LSK_USER_PREV_RID, LSK_USER_PREV_SHIFTED } from '@admin-core/constants/local-storage-constants';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  userMasterList!: User[]
  adminUserMasterList!: User[]
  internalUserMasterList!: User[]
  externalUserMasterList!: User[];

  public profileUpdated$: BehaviorSubject<any> = new BehaviorSubject('');

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);
  private authService = inject(AuthService);

  async getAdminUserMasterList(forceLoad: boolean = false) {
    if ((this.authService.isExternalUser || this.authService.isInternalUser || this.authService.authUser) && !forceLoad) {
      return [];
    }
    let userMasterList = await this.dbService.getAllAdminUsers();
    if (forceLoad || !userMasterList?.length) {
      const res = await this.downloadConfigService.getAdminUserMasterList();
      let userList = await this.dbService.getAllAdminUsers();
      userMasterList = [...userList]
    }
    this.userMasterList = [...userMasterList]
    return userMasterList ?? []
  }


  async getInternalUserMasterList(forceLoad: boolean = false) {
    if (this.authService.isExternalUser || this.authService.isInternalUser || this.authService.authUser) {
      return [];
    }
    let userMasterList = await this.dbService.getAllInternalUsers();

    if (forceLoad || !userMasterList?.length) {
      const res = await this.downloadConfigService.getInternalUserMasterList();
      let userList = await this.dbService.getAllInternalUsers();
      userMasterList = [...userList]
    }

    this.internalUserMasterList = [...userMasterList]
    return userMasterList ?? []
  }


  async getExternalUserMasterList(forceLoad: boolean = false) {
    if (this.authService.isExternalUser || this.authService.isInternalUser || this.authService.authUser) {
      return [];
    }

    let userMasterList = await this.dbService.getAllExternalUsers();

    if (forceLoad || !userMasterList?.length) {
      const res = await this.downloadConfigService.getExternalUserMasterList();
      let userList = await this.dbService.getAllExternalUsers();
      userMasterList = [...userList]
    }

    this.externalUserMasterList = [...userMasterList]
    return userMasterList ?? []
  }

  async getAllUserMasterList(forceLoad: boolean = false, userType: String[] = []) {
    let adminUsers: any = [], internalUsers: any = [], externalUsers: any = [];
    let all = userType?.length ? false : true;

    if (userType.includes(ADMIN_USER) || all) {
      adminUsers = await this.getAdminUserMasterList(forceLoad);
    }
    if (userType.includes(INTERNAL_USER) || all) {
      internalUsers = await this.getInternalUserMasterList(forceLoad);
    }
    if (userType.includes(EXTERNAL_USER) || all) {
      externalUsers = await this.getExternalUserMasterList(forceLoad);
    }

    const allUsers = [...adminUsers, ...internalUsers, ...externalUsers];
    this.userMasterList = [...allUsers]
    return allUsers;
  }

  async getUserById(id: number) {
    let user = null;

    user = await this.dbService.getAdminUserById(id);
    if (user) {
      return user
    }

    user = await this.dbService.getInternalUserById(id);
    if (user) {
      return user
    }

    user = await this.dbService.getExternalUserById(id);
    if (user) {
      return user
    }

    return user
  }

  async addAdminUser(user: User) {
    await this.dbService.addAdminUser(user);
  }

  async addInternalUser(user: User) {
    await this.dbService.addInternalUser(user);
  }

  async addExternalUser(user: User) {
    await this.dbService.addExternalUser(user);
  }


  createNewUserObj(userId: number, email: string, fullName: string, userType: string) {
    const newUser: User = {
      applicationUserId: userId,
      firstName: fullName,
      lastName: '',
      displayName: `${fullName}`.trim(),
      email: email,
      active: true,
      createdAt: new Date().toISOString(),
      permissions: [],
      roles: [],
      departments: [],
      selected: false,
      profilePhoto: '',
      phoneNumber: '',
      invitationPending: false,
      userType: userType,
      entities: []
    };
    return newUser
  }

  async createAndAddInternalUser(userId: number, email: string, fullName: string) {
    const newUser = this.createNewUserObj(userId, email, fullName, INTERNAL_USER)
    await this.addInternalUser(newUser);
    return newUser
  }

  async createAndAddExternalUser(userId: number, email: string, fullName: string) {
    const newUser = this.createNewUserObj(userId, email, fullName, EXTERNAL_USER)
    await this.addExternalUser(newUser);
    return newUser
  }

  async updateUserDetailsToDb(userId: number, userDetail: any) {
    let tempUserDetail = null;
    const userType = userDetail?.userType
    tempUserDetail = await this.dbService.getAdminUserById(userId);
    if (tempUserDetail || userType == ADMIN_USER) {
      const _userDetail = { ...tempUserDetail, ...userDetail }
      const updated = await this.dbService.updateAdminUser(userId, _userDetail);
      return
    }

    tempUserDetail = await this.dbService.getInternalUserById(userId);
    if (tempUserDetail || userType == INTERNAL_USER) {
      const _userDetail = { ...tempUserDetail, ...userDetail }
      const updated = await this.dbService.updateInternalUser(userId, _userDetail);
      return
    }

    tempUserDetail = await this.dbService.getExternalUserById(userId);
    if (tempUserDetail || userType == EXTERNAL_USER) {
      const _userDetail = { ...tempUserDetail, ...userDetail }
      const updated = await this.dbService.updateExternalUser(userId, _userDetail);
      return
    }
  }

  async deleteAdminUser(userId: number) {
    await this.dbService.deletAdminUser(userId);
  }

  async deleteInternalUser(userId: number) {
    await this.dbService.deletInternalUser(userId);
  }


  getDisplayName(user: User | undefined) {
    if (!user) {
      return ''
    }
    return `${user.displayName ? (user.displayName) : `${user.firstName ? `${user.firstName} ${user.lastName ?? ``}` : `${user.email ?? ``}`}`}`
  }


  setDsrRequestRid(data: any) {
    setItem(LSK_USER_CURRENT_RID, data);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_USER_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_USER_CURRENT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_USER_PREV_RID);
  }


  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_USER_PREV_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getDsrRequestRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }


  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_USER_NEXT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }
  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_USER_NEXT_SHIFTED);
    return val == 'true' ? true : false
  }
  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_USER_FILTER);
    let totalItems = 0;
    totalItems = Math.ceil(filters.total / filters.size);
    let pageNo = filters.page == 0 ? 1 : filters.page;
    const prevPageNo = pageNo;

    if (isDecrement) {
      pageNo--;
    } else {
      pageNo++;
    }

    if (pageNo > totalItems && !isDecrement) {
      return { exceeded: true, pageNo: 0 }
    }
    if (isDecrement && (prevPageNo == 1 || prevPageNo == 0)) {
      return { exceeded: true, pageNo: 0 }
    }
    return { exceeded: false, pageNo: pageNo }
  }




  setNextRequestPageNo(pageNo: number) {
    const filters = getItem(LSK_USER_FILTER);
    setItem(LSK_USER_FILTER, {
      ...filters,
      page: pageNo,
    });
  }


  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_USER_FILTER) || {};

    if (isSetToPageNo) {
      const pageToSet = prevPageNo > 0 ? prevPageNo : (filters.prevPageNo || 1);

      setItem(LSK_USER_FILTER, {
        ...filters,
        page: pageToSet,
        total:
          pageToSet === 1 && filters.tempTotal > 0
            ? filters.tempTotal
            : filters.total,
      });
      return;
    }

    setItem(LSK_USER_FILTER, {
      ...filters,
      prevPageNo,
    });
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_USER_PREV_SHIFTED, value);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_USER_PREV_RID, data);
  }
  removeNextRequestRid() {
    removeItem(LSK_USER_NEXT_RID);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_USER_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_USER_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_USER_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_USER_NEXT_SHIFTED, value);
  }
  setNextRequestRid(data: any) {
    setItem(LSK_USER_NEXT_RID, data);
  }





  clearUserNavigationState() {
    removeItem(LSK_USER_PREV_RID);
    removeItem(LSK_USER_NEXT_RID);
    removeItem(LSK_USER_PREV_SHIFTED);
    removeItem(LSK_USER_NEXT_SHIFTED);
    removeItem(LSK_USER_FILTER);
  }

}
