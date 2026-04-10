export interface NavigationMeta {
  taskId?: number;
  assessmentId?: number;
  attachedToId?: number | string;
  attachedTo?: string;
  conversationId?: number;
  sectionId?: number;
  questionId?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  channel: string;
  createdAt: string;
  entityId: string;
  entityType: string;
  module?: string;
  read: boolean;
  navigationMeta?: NavigationMeta;
}

export interface NotificationListResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  entries: Notification[];
}

export interface UnreadNotificationCountResponse {
  count: number;
}
