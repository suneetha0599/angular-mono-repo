import { inject, Injectable } from '@angular/core';
import { ClarificationStatus, TaskStatus, } from '../../../pages/task-management/constant';
import { LSK_TASK_CURRENT_RQRID, LSK_TASK_NEXT_REQ_SHIFTED, LSK_TASK_NEXT_RQRID, LSK_TASK_PREV_REQ_SHIFTED, LSK_TASK_PREV_RQRID, LSK_TASK_REQ_FILTER } from '@admin-core/constants/local-storage-constants';
import { TaskDetails, TaskId } from '@admin-core/models/task-management/RequestTask';
import { AuthService } from '../auth.service';
import { UserService } from '../user/user.service';
import { ApiHelperService } from '../network/api-helper.service';
import { User } from '@admin-core/models/user.model';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class TaskManagementService {

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private apiHelperService = inject(ApiHelperService);

  constructor() { }

  clarificationCompleted(state: string) {
    return (state == ClarificationStatus.COMPLETED)
  }

  getTaskFilters() {
    const reqFilters = getItem(LSK_TASK_REQ_FILTER)
    return reqFilters
  }

  clearTaskFilters() {
    removeItem(LSK_TASK_REQ_FILTER)
  }

  storeTaskFilter(filters: any) {
    const reqFilters = getItem(LSK_TASK_REQ_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_TASK_REQ_FILTER, filterData);
  }

  requestTaskOpen(state: string) {
    return state == TaskStatus.OPEN
  }

  requestTaskInProgress(state: string) {
    return state == TaskStatus.IN_PROGRESS
  }

  requestTaskOnHold(state: string) {
    return state == TaskStatus.ON_HOLD
  }

  requestTaskClosed(state: string) {
    return state == TaskStatus.CLOSED
  }

  requestTaskReopened(state: string) {
    return state == TaskStatus.REOPENED
  }

  requestTaskSendForReview(state: string) {
    return state == TaskStatus.SEND_FOR_REVIEW
  }

  async processTaskDetails(taskDetail: TaskDetails) {
    let createdByUserName = '';
    let assignToUserName = '';
    if (this.isInternalOrExternalUser) {
      createdByUserName = taskDetail.createdByUserName || '';
      assignToUserName = taskDetail.assignToUserName || '';
    }
    else {
      const createdUser = (await this.userService.getUserById(taskDetail.createdBy));
      const assignToUser = (await this.userService.getUserById(taskDetail.assignToUserId));
      createdByUserName = this.getUserName(createdUser);
      assignToUserName = this.getUserName(assignToUser);
    }
    const result = {
      ...taskDetail,
      dueDate: this.formatDate(taskDetail.dueDate) || '',
      documentAttached: taskDetail.documentAttached || [],
      createdDate: this.formatDate(taskDetail.createdDate) || '',
      createdByUserName: createdByUserName,
      assignToUserName: assignToUserName,
    };
    return result;
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  formatDate(dateString?: string): string {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString('en-GB');
  }

  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_TASK_REQ_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: TaskId[] = []
    const res = await this.apiHelperService.getTaskList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_TASK_REQ_FILTER);
        setItem(LSK_TASK_REQ_FILTER, {
          ...filters,
          tempTotal: +(res?.totalElements ?? 0),
        });
      }
      res.taskListings.map((item: TaskDetails) => {
        reqRidList.push({ 'id': item.taskId, })
      })
    }
    return res ? reqRidList : []
  }

  setNextRequestRid(data: any) {
    setItem(LSK_TASK_NEXT_RQRID, data);
  }

  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_TASK_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removeNextRequestRid() {
    removeItem(LSK_TASK_NEXT_RQRID);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_TASK_PREV_RQRID, data);
  }

  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_TASK_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_TASK_PREV_RQRID);
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_TASK_PREV_REQ_SHIFTED, value);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_TASK_PREV_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_TASK_NEXT_REQ_SHIFTED, value);
  }

  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_TASK_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setTaskRequestRid(data: any) {
    setItem(LSK_TASK_CURRENT_RQRID, data);
  }

  getTaskRid() {
    let result: any = localStorage.getItem(LSK_TASK_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_TASK_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_TASK_REQ_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_TASK_REQ_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_TASK_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_TASK_REQ_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_TASK_REQ_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getTaskRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_TASK_REQ_FILTER);
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
    const filters = getItem(LSK_TASK_REQ_FILTER);
    setItem(LSK_TASK_REQ_FILTER, {
      ...filters,
      page: pageNo,
    });
  }

  getUserName(user: User | undefined) {
    if (!user) {
      return ''
    }
    return `${user.displayName ? (user.displayName) : `${user.firstName ? `${user.firstName} ${user.lastName ?? ''}` : `${user.email ?? ''}`}`}`
  }
}
