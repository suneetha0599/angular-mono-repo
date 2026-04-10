import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ACCEPT_RESPONSE, CREATE_ASSESSMENT, CREATE_VENDOR_ASSESSMENT, REQUEST_JUSTIFICATION } from '@admin-core/constants/api-constants';
import { ConversationCommand } from '@admin-core/models/assessment/conversation.model';
import { HttpService } from '@valura-lib/service/network/http.service';

@Injectable({
  providedIn: 'root'
})


export class ApiHelperService {

  private httpService = inject(HttpService);

  constructor() { }

  saveManualDraft(data: any, requestId: string) {
    return requestId ?
      this.httpService.httpPut({
        queryUrl: `drafts/manual/${requestId}`,
        body: data,
        showSnackBar: true,
      })
      :
      this.httpService.httpPost({
        queryUrl: `drafts/manual`,
        body: data,
        showSnackBar: true,
      })
        .pipe(map(res => {
          if (!res.isSuccess) {
            throw new Error(res.message)
          }
          return res.data
        }))
  }

  async getManualDraftDetails(draftId: string, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/manual/${draftId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAssessmentRelatedInfo(assessmentId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(
        `assessment/${assessmentId}/related-components`
      )
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching related components:', e);
        return null;
      });
  }

  async getTemplateList(params: any = null, url: string) {
    return await firstValueFrom(
      this.httpService.httpGet(`${url}`, params))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getTemplateDetails(templateId: number, params: any = null, url: string) {
    return await firstValueFrom(
      this.httpService.httpGet(`${url}/${templateId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAssessmentDetail(assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/detail`)
    )
      .then(res => res.data || null)
      .catch(e => {
        console.error('Error fetching assessment detail:', e);
        return null;
      });
  }

  async getAssessmentMeasureDetail(assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/measures`)
    )
      .then(res => res.data || null)
      .catch(e => {
        console.error('Error fetching assessment detail:', e);
        return null;
      });
  }

  updateTemplateDetails(templateId: number, templateData: any, url: string, showSnackBar: boolean = true) {
    return this.httpService
      .httpPut({
        queryUrl: `${url}/${templateId}`,
        body: templateData,
        showSnackBar: showSnackBar,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async updateAssessmentDetails(assessmentId: number, assessmentDetails: any, showSnackBar: boolean = true) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CREATE_ASSESSMENT}/${assessmentId}`,
        body: assessmentDetails,
        showSnackBar: showSnackBar,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async deleteManualDraftRequest(draftId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`drafts/manual/${draftId}`, null, null, false, false))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteAssessment(assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`assessment/${assessmentId}`, null, null, true))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async createAssessmentTask(assessmentId: number, taskData: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/task`,
        body: taskData,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to create task');
        }
        return res;
      })
      .catch(e => {
        console.error('Error creating assessment task:', e);
        throw e;
      });
  }
  async getAssessmentTaskDetail(assessmentId: number, taskId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/task/${taskId}/detail`)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch task detail');
        }
        return res.data ?? null;
      })
      .catch(e => {
        console.error('Error fetching task detail:', e);
        throw e;
      });
  }

  async getAssessmentTasks(params: any, url: string): Promise<any> {

    return await firstValueFrom(
      this.httpService.httpGet(`${url}`, params)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch tasks');
        }
        return res;
      })
      .catch(e => {
        console.error('Error fetching assessment tasks:', e);
        throw e;
      });
  }

  async getMeasures(assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/measures`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error fetching measures:', e);
        throw e;
      });
  }

  async createAssessment(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: CREATE_ASSESSMENT,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async createVendorAssessment(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: CREATE_VENDOR_ASSESSMENT,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async updateVendorAssessmentDetails(assessmentId: number, assessmentDetails: any, showSnackBar: boolean = true) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CREATE_VENDOR_ASSESSMENT}/${assessmentId}`,
        body: assessmentDetails,
        showSnackBar: showSnackBar,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async getVendorAssessments(params: any = {}) {
    return await firstValueFrom(
      this.httpService.httpGet(CREATE_VENDOR_ASSESSMENT, params)
    )
      .then(res => res?.data ?? null)
      .catch(e => {
        console.error('Error fetching vendor assessments:', e);
        return null;
      });
  }

  async createTemplate(data: any, url: string) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${url}`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async duplicateTemplate(data: any, url: string) {
    return await firstValueFrom(
      this.httpService.httpGet(`${url}/duplicate-name-check`, data)
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async acceptResponse(questionId: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ACCEPT_RESPONSE(questionId),
        body: null,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async requestJustification(questionId: any, comment: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: REQUEST_JUSTIFICATION(questionId),
        body: { comment },
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async raiseQuestionRisk(assessmentId: number, questionId: number, data: any, isVendorContext: boolean = false): Promise<any> {
    const riskSegment = isVendorContext ? 'vendor-question-risk' : 'question-risk';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${questionId}/${riskSegment}/commands`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to raise risk');
        }
        return res;
      })
      .catch(e => {
        console.error('Error raising question risk:', e);
        throw e;
      });
  }

  async updateQuestionRisk(assessmentId: number, questionId: number, riskId: number, data: any, isVendorContext: boolean = false): Promise<any> {
    const riskSegment = isVendorContext ? 'vendor-question-risk' : 'question-risk';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${questionId}/${riskSegment}/${riskId}/commands`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to update risk');
        }
        return res;
      })
      .catch(e => {
        console.error('Error updating risk:', e);
        throw e;
      });
  }

  async updateAssessmentRiskCommands(
    assessmentId: number,
    riskId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const riskSegment = isVendorContext ? 'vendor-assessment-risk' : 'assessment-risk';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${riskSegment}/${riskId}/commands`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to update risk');
        }
        return res;
      })
      .catch(e => {
        console.error('Error updating assessment risk:', e);
        throw e;
      });
  }

  async createAssessmentRiskCommands(
    assessmentId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const riskSegment = isVendorContext ? 'vendor-assessment-risk' : 'assessment-risk';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${riskSegment}/commands`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to create risk');
        }
        return res;
      })
      .catch(e => {
        console.error('Error creating assessment risk:', e);
        throw e;
      });
  }

  async getAssessmentRiskDetail(assessmentId: number, riskId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/risk/${riskId}/detail`)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch risk detail');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching risk detail:', e);
        throw e;
      });
  }

  async getAssessmentRisks(assessmentId: number | null, params: any = {}, url: string): Promise<any> {
    const queryParams = assessmentId ? { assessmentId, ...params } : { ...params };
    return await firstValueFrom(
      this.httpService.httpGet(`${url}`, queryParams)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch risks');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching assessment risks:', e);
        throw e;
      });
  }

  async createAssessmentQuestionTaskCommands(
    assessmentId: number,
    questionId: number,
    payload: { commandId: string; commands: any[] },
    riskId?: number,
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-question-task' : 'question-task';
    const baseUrl = `assessment/${assessmentId}/${questionId}/${taskSegment}/commands`;
    const queryUrl = riskId ? `${baseUrl}?riskId=${riskId}` : baseUrl;
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error creating assessment question task:', e);
        throw e;
      });
  }

  async createAssessmentRiskTaskCommands(
    assessmentId: number,
    riskId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-risk-task' : 'risk-task';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${riskId}/${taskSegment}/commands`,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error creating assessment risk task:', e);
        throw e;
      });
  }

  async createAssessmentTaskCommands(
    assessmentId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-assessment-task' : 'task';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${taskSegment}/commands`,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error creating assessment task commands:', e);
        throw e;
      });
  }

  async createAssessmentMainTaskCommands(
    assessmentId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-assessment-task' : 'assessment-task';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${taskSegment}/commands`,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error creating assessment main task:', e);
        throw e;
      });
  }

  async updateAssessmentMainTaskCommands(
    assessmentId: number,
    taskId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-assessment-task' : 'assessment-task';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${taskSegment}/${taskId}/commands`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to update assessment task');
        }
        return res;
      })
      .catch(e => {
        console.error('Error updating assessment task:', e);
        throw e;
      });
  }

  async updateAssessmentRiskTaskCommands(
    assessmentId: number,
    riskId: number,
    taskId: number,
    payload: { commandId: string; commands: any[] },
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-risk-task' : 'risk-task';
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/${riskId}/${taskSegment}/${taskId}/commands`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to update risk task');
        }
        return res;
      })
      .catch(e => {
        console.error('Error updating risk task:', e);
        throw e;
      });
  }

  async updateAssessmentTask(
    assessmentId: number,
    questionId: number,
    taskId: number,
    payload: { commandId: string; commands: any[] },
    riskId?: number,
    isVendorContext: boolean = false
  ): Promise<any> {
    const taskSegment = isVendorContext ? 'vendor-question-task' : 'question-task';
    const baseUrl = `assessment/${assessmentId}/${questionId}/${taskSegment}/${taskId}/commands`;
    const queryUrl = riskId ? `${baseUrl}?riskId=${riskId}` : baseUrl;
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to delete task');
        }
        return res;
      })
      .catch(e => {
        console.error('Error deleting assessment task:', e);
        throw e;
      });
  }

  async getAssessmentBpaDetails(bpaId: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`bpa/${bpaId}/overview`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAssessmentSectionDetail(assessmentId: number, params: any = {}): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/section-detail`, {
        sectionPage: 0,
        sectionLimit: 10,
        questionPage: 0,
        questionLimit: 10,
        messagePage: 0,
        messageLimit: 10,
        ...params
      })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching section detail:', e);
        return null;
      });
  }

  async getAssessmentSectionDetailDirect(
    assessmentId: number,
    params: any = {}
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(
        `assessment/${assessmentId}/section-detail`,
        params
      )
    )
      .then(res => res?.data ?? null)
      .catch(e => {
        console.error('Error fetching section detail direct:', e);
        return null;
      });
  }


  async createQuestionConversation(
    assessmentId: number,
    questionId: number,
    commands: ConversationCommand[],
    notifyUser: boolean = true
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/QUESTION/conversation/${questionId}`,
        body: { commandId: crypto.randomUUID(), notifyUser: notifyUser, command: commands },
        showSnackBar: false
      })
    )
      .then(res => res?.data ?? res)
      .catch(e => { console.error('Error creating conversation:', e); throw e; });
  }

  async createTaskConversation(
    assessmentId: number,
    taskId: number,
    commands: ConversationCommand[]
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/TASK/conversation/${taskId}`,
        body: { commandId: crypto.randomUUID(), command: commands, notifyUser: true },
        showSnackBar: false
      })
    )
      .then(res => res?.data ?? res)
      .catch(e => { console.error('Error creating conversation:', e); throw e; });
  }


  async updateQuestionConversation(
    assessmentId: number,
    questionId: number,
    conversationId: number,
    commands: ConversationCommand[],
    notifyUser: boolean = true
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/QUESTION/conversation/${questionId}/${conversationId}`,
        body: { commandId: crypto.randomUUID(), notifyUser, command: commands },
        showSnackBar: false
      })
    )
      .then(res => res?.data ?? res)
      .catch(e => { console.error('Error updating conversation:', e); throw e; });
  }

  async updateTaskConversation(
    assessmentId: number,
    taskId: number,
    conversationId: number,
    commands: ConversationCommand[]
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/TASK/conversation/${taskId}/${conversationId}`,
        body: { commandId: crypto.randomUUID(), command: commands, notifyUser: true },
        showSnackBar: false
      })
    )
      .then(res => res?.data ?? res)
      .catch(e => { console.error('Error updating task conversation:', e); throw e; });
  }

  async getAssessmentDiscussionLogs(
    assessmentId: number,
    page: number = 1,
    size: number = 10,
    discussionType?: 'REMARK' | 'RESPONSE'
  ): Promise<any> {
    const params: any = { page, size };
    if (discussionType) params['discussionType'] = discussionType;


    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/discussion-logs`, params)
    )
      .then(res => res?.data ?? null)
      .catch(e => {
        console.error('Error fetching discussion logs:', e);
        return null;
      });
  }

  async getConversationPageInfo(
    assessmentId: number,
    conversationEntityType: 'QUESTION' | 'TASK',
    conversationEntityId: number,
    conversationId: number,
    conversationSize: number = 10
  ): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(
        `assessment/${assessmentId}/${conversationEntityType}/conversation/get-page-info`,
        { conversationEntityId, conversationId, conversationSize }
      )
    )
      .then(res => res?.data ?? null)
      .catch(e => {
        console.error('Error fetching conversation page info:', e);
        return null;
      });
  }

  async getAllAssessmentTaskLabels(): Promise<Array<{ id: number; name: string; isDeleted: boolean }>> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CREATE_ASSESSMENT}/task-label`)
    )
      .then(res => res?.data?.labels || [])
      .catch(e => {
        console.error('Error fetching labels:', e);
        return [];
      });
  }

  async getAssessmentDownloadResponse(params: any = null, body: any = null) {
    return await firstValueFrom(
      this.httpService.httpPost({ queryUrl: `assessment/export`, params, body })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getVendorAssessmentDownloadResponse(params: any = null, body: any = null) {
    return await firstValueFrom(
      this.httpService.httpPost({ queryUrl: `assessment/vendor/export`, params, body })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getExportStatus(requestId: string) {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/exports/${requestId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getExportLogs(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/exports/logs`, params)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async addLabels(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CREATE_ASSESSMENT}/task-label`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

}


