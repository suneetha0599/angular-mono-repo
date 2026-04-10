export interface PostMessageCommand {
  type: 'postMessage';
  message: string;
  attachments?: { fileKey: string; fileName: string }[];
  messageParentId: number;
}

export interface DeleteMessageCommand {
  type: 'deleteMessage';
  messageId: number;
}

export interface PostAttachmentCommand {
  type: 'postAttachment';
  attachments: { fileKey: string; fileName: string }[];
}

export interface DeleteAttachmentCommand {
  type: 'deleteAttachment';
  attachmentMappingIds: number[];
}

export interface UpdateStatusCommand {
  type: 'updateStatus';
  status: string;
}

export interface UpdateMessageCommand {
  type: 'updateMessage';
  commands: (
    | { type: 'updateMessageContent'; message: string }
    | { type: 'addMessageAttachments'; attachments: { fileKey: string; fileName: string }[] }
    | { type: 'deleteMessageAttachments'; attachmentMappingIds: number[] }
  )[];
}

export interface UpdateReadStatusCommand {
  type: 'updateReadStatus';
  isRead: boolean;
}

export type ConversationCommand =
  | PostMessageCommand
  | DeleteMessageCommand
  | PostAttachmentCommand
  | DeleteAttachmentCommand
  | UpdateMessageCommand
  | UpdateReadStatusCommand;

export type ConversationEntityType = 'QUESTION' | 'TASK';

export const ConversationCommandType = {
  POST_MESSAGE: 'postMessage',
  DELETE_MESSAGE: 'deleteMessage',
  POST_ATTACHMENT: 'postAttachment',
  DELETE_ATTACHMENT: 'deleteAttachment',
  UPDATE_MESSAGE: 'updateMessage',
  UPDATE_READ_STATUS: 'updateReadStatus',
  UPDATE_MESSAGE_CONTENT: 'updateMessageContent',
  ADD_MESSAGE_ATTACHMENTS: 'addMessageAttachments',
  DELETE_MESSAGE_ATTACHMENTS: 'deleteMessageAttachments'
} as const;