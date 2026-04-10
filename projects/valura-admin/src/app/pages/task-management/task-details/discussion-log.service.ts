import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';

export interface ConversationMessage {
  id: number;
  sender: string;
  senderType: string;
  senderUserId?: number;
  timestamp: string;
  text?: string;
  isHtml?: boolean;
  attachments?: MessageAttachment[];
  parentId?: number | null;
  replies?: ConversationMessage[];
  messageType: 'Remark' | 'Response';
  childMessagesCount?: number;
  isEdited?: boolean;
  canUpdateMessage?: boolean;
  isDeleted?: boolean;
}

export interface MessageAttachment {
  id: number;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedOn: string;
  fileKey?: string;
  taskConversationAttachmentId?: number;
  source?: string;
}

export interface PaginationInfo {
  totalMessages: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionLogService {
  private apiHelper = inject(ApiHelperService);


  private taskId: number = 0;

  private conversationMessagesSubject = new BehaviorSubject<ConversationMessage[]>([]);
  public conversationMessages$ = this.conversationMessagesSubject.asObservable();

  private paginationInfoSubject = new BehaviorSubject<PaginationInfo>({
    totalMessages: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  public paginationInfo$ = this.paginationInfoSubject.asObservable();


  setTaskId(taskId: number): void {
    this.taskId = taskId;
  }

  async loadMessages(page: number = 1, size: number = 10): Promise<void> {
    try {
      const response = await this.apiHelper.getDiscussionLogMessages(this.taskId, page, size);

      if (response && response.messages) {
        const mappedMessages = this.mapApiMessagesToConversation(response.messages.reverse());

        for (const message of mappedMessages) {
          if (message.childMessagesCount && message.childMessagesCount > 0) {
            try {
              const children = await this.loadChildMessages(message.id);
              message.replies = children;
            } catch (error) {
              console.error(`Error loading children for message ${message.id}:`, error);
            }
          }
        }

        const existing = this.conversationMessagesSubject.getValue();
        const currentPage = this.paginationInfoSubject.getValue().currentPage;

        if (existing.length === 0) {


          this.conversationMessagesSubject.next(mappedMessages);
        } else if (page > currentPage) {


          this.conversationMessagesSubject.next([...mappedMessages, ...existing]);
        } else if (page < currentPage) {


          this.conversationMessagesSubject.next([...existing, ...mappedMessages]);
        } else {


          this.conversationMessagesSubject.next(mappedMessages);
        }

        this.paginationInfoSubject.next({
          totalMessages: response.totalMessages,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
          hasNextPage: response.hasNextPage,
          hasPreviousPage: response.hasPreviousPage
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  }

  async getMessagePageInfo(messageId: number, size: number = 10): Promise<{
    pageNumber: number;
    parentId: number;
    totalPages: number;
    totalChildCount: number;
    totalElements: number;
  } | null> {
    try {
      const data = await this.apiHelper.getDiscussionLogMessageInfo(messageId, size);
      if (data) {
        return {
          pageNumber: data.pageNumber,
          parentId: data.parentId,
          totalPages: data.totalPages,
          totalChildCount: data.totalChildCount,
          totalElements: data.totalElements
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting message page info:', error);
      return null;
    }
  }

  async loadChildMessages(parentMessageId: number): Promise<ConversationMessage[]> {
    try {
      const response = await this.apiHelper.getDiscussionLogMessages(
        this.taskId,
        1,
        100,
        parentMessageId,
        10
      );

      if (response && response.messages) {

        const allMessages = this.mapApiMessagesToConversation(response.messages);


        const tree = this.buildMessageTree(allMessages);


        const parentInTree = tree.find(msg => msg.id === parentMessageId);

        if (parentInTree && parentInTree.replies) {
          return parentInTree.replies;
        }


        return allMessages.filter(msg => msg.parentId === parentMessageId);
      }
      return [];
    } catch (error) {
      console.error('Error loading child messages:', error);
      return [];
    }
  }

  private buildMessageTree(messages: ConversationMessage[]): ConversationMessage[] {

    const rootMessages: ConversationMessage[] = [];
    const repliesMap = new Map<number, ConversationMessage[]>();

    messages.forEach(msg => {
      if (msg.parentId === null || msg.parentId === 0 || msg.parentId === undefined) {

        rootMessages.push(msg);
      } else {

        const parentId = msg.parentId;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(msg);
      }
    });


    const attachReplies = (message: ConversationMessage): void => {
      const replies = repliesMap.get(message.id) || [];
      message.replies = replies;


      replies.forEach(reply => attachReplies(reply));
    };

    rootMessages.forEach(msg => attachReplies(msg));

    return rootMessages;
  }


  async createMessage(message: ConversationMessage): Promise<void> {
    try {

      const attachmentObjects = message.attachments?.map(att => ({
        fileName: att.name,
        fileKey: att.fileKey || ''
      })) || [];

      const body = {
        messageContent: message.text || '',
        attachments: attachmentObjects,
        parentId: message.parentId || 0
      };

      await this.apiHelper.postDiscussionLogMessage(this.taskId, body);
      await this.loadMessages(1, 10);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }


  async updateMessageAPI(messageId: number, updates: Partial<ConversationMessage>, originalAttachments: MessageAttachment[]): Promise<void> {
    try {
      const attachmentObjects: any[] = [];

      originalAttachments.forEach(originalAtt => {
        const stillExists = updates.attachments?.some(att =>
          att.taskConversationAttachmentId === originalAtt.taskConversationAttachmentId
        );


        attachmentObjects.push({
          taskConversationAttachmentId: originalAtt.taskConversationAttachmentId || 0,
          fileKey: originalAtt.fileKey || '',
          fileName: originalAtt.name || 'Unknown file',
          isDeleted: !stillExists
        });
      });


      updates.attachments?.forEach(att => {
        if (!att.taskConversationAttachmentId) {
          attachmentObjects.push({
            taskConversationAttachmentId: 0,
            fileKey: att.fileKey || '',
            fileName: att.name || 'Unknown file',
            isDeleted: false
          });
        }
      });

      const body = {
        messageContent: updates.text || '',
        attachments: attachmentObjects,
        parentId: 0
      };



      await this.apiHelper.updateDiscussionLogMessage(this.taskId, messageId, body);


      await this.loadMessages(1, 10);
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }


  async deleteMessageAPI(messageId: number): Promise<void> {
    try {
      await this.apiHelper.deleteDiscussionLogMessage(this.taskId, messageId);


      await this.loadMessages(1, 10);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  getAttachments(): Observable<MessageAttachment[]> {
    return new Observable(observer => {
      this.apiHelper.getDiscussionLogAttachments(this.taskId).then(attachments => {
        const allAttachments: MessageAttachment[] = [];

        attachments.forEach((att: any) => {
          allAttachments.push({
            id: att.taskConversationAttachmentId,
            name: att.fileName || 'Attachment',
            size: '',
            uploadedBy: att.senderName || 'Unknown',
            uploadedOn: this.formatTimestamp(att.uploadedAt || ''),
            fileKey: att.fileKey,
            source: att.source
          });
        });

        observer.next(allAttachments);
        observer.complete();
      }).catch(error => {
        console.error('Error in getAttachments:', error);
        observer.next([]);
        observer.complete();
      });
    });
  }





  getMessagesByType(type: 'Remark' | 'Response', page: number = 1, size: number = 10): Observable<ConversationMessage[]> {
    return new Observable(observer => {
      this.apiHelper.getDiscussionLogMessages(
        this.taskId,
        page,
        size,
        undefined,
        undefined,
        type.toUpperCase() as 'REMARK' | 'RESPONSE'
      ).then(response => {
        if (response && response.messages) {
          const mapped = this.mapApiMessagesToConversation(response.messages);
          observer.next(mapped);
        } else {
          observer.next([]);
        }
        observer.complete();
      }).catch(error => {
        console.error('Error in getMessagesByType:', error);
        observer.next([]);
        observer.complete();
      });
    });
  }

  private mapApiMessagesToConversation(apiMessages: any[]): ConversationMessage[] {
    return apiMessages.map(msg => ({
      id: msg.messageId,
      sender: msg.senderName,
      senderType: msg.senderType,
      senderUserId: msg.senderUserId,
      timestamp: this.formatTimestamp(msg.timestamp),
      text: msg.messageContent,
      isHtml: true,
      attachments: this.transformAttachments(
        msg.attachments || [],
        msg.senderName,
        msg.timestamp
      ),
      parentId: msg.parentId === 0 ? null : msg.parentId,
      replies: [],
      messageType: msg.discussionType === 'REMARK' ? 'Remark' : 'Response',
      childMessagesCount: msg.childMessagesCount,
      isEdited: msg.isEdited,
      canUpdateMessage: msg.canUpdateMessage,
      isDeleted: msg.isDeleted
    }));
  }

  private transformAttachments(apiAttachments: any[], senderName: string, timestamp: string): MessageAttachment[] {
    console.log('transformAttachments called with:', apiAttachments);

    if (!apiAttachments || apiAttachments.length === 0) {
      console.log('No attachments found');
      return [];
    }

    return apiAttachments.map((att, index) => {
      console.log(`Processing attachment ${index}:`, att);
      console.log(`fileName: ${att.fileName}, fileKey: ${att.fileKey}`);

      return {
        id: Date.now() + index,
        name: att.fileName || 'Unknown file',
        size: '',
        uploadedBy: senderName || 'Unknown',
        uploadedOn: this.formatTimestamp(timestamp),
        fileKey: att.fileKey,
        taskConversationAttachmentId: att.taskConversationAttachmentId
      };
    });
  }

  private extractDisplayName(fileName: string): string {
    if (!fileName) return 'Unknown file';
    const parts = fileName.split('/');
    return parts[parts.length - 1];
  }


  private extractFileNameFromString(str: string): string {
    try {
      const match = str.match(/"fileName":"([^"]+)"/);
      if (match && match[1]) {
        return this.extractDisplayName(match[1]);
      }
      return 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  }



  private formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  private updateMessageInTree(messages: ConversationMessage[], messageId: number, updates: Partial<ConversationMessage>): ConversationMessage[] {
    return messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, ...updates, timestamp: `(Edited) ${msg.timestamp}` };
      }
      if (msg.replies && msg.replies.length > 0) {
        return { ...msg, replies: this.updateMessageInTree(msg.replies, messageId, updates) };
      }
      return msg;
    });
  }

  private deleteMessageFromTree(messages: ConversationMessage[], messageId: number): ConversationMessage[] {
    return messages.filter(msg => {
      if (msg.id === messageId) return false;
      if (msg.replies && msg.replies.length > 0) {
        msg.replies = this.deleteMessageFromTree(msg.replies, messageId);
      }
      return true;
    });
  }

  getAllMessages(): ConversationMessage[] {
    return this.conversationMessagesSubject.getValue();
  }

  getPaginationInfo(): PaginationInfo {
    return this.paginationInfoSubject.getValue();
  }

  clearMessages(): void {
    this.conversationMessagesSubject.next([]);
    this.paginationInfoSubject.next({
      totalMessages: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  }
}