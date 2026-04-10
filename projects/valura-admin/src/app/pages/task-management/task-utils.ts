import { RequestTask } from "@admin-core/models/request-management/DsrRequest"
import { TaskPriority, TaskStatus } from "./constant"

export const convertTaskFlatToNestedList = (flatList: RequestTask[]) => {
    let nestedList = (flatList as RequestTask[])
        .filter((task: RequestTask) => task.parentTaskId === 0)
        .map((_task: RequestTask) => {
            return {
                ..._task,
                subTasks: flatList
                    .filter(({ parentTaskId }) => parentTaskId === _task.taskId) as RequestTask[]
            } as RequestTask
        })
    return nestedList
}
export const formatStatus = (status: string): string => {
    return status?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

export const displayStatusText = (status: string): string => {
    if (!status) return '';
    const formatted = status?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    const parts = formatted.split(' ');
    return parts[parts.length - 1];
}

export const statusColors = (status: string): string => {
    switch (status) {
        case TaskStatus.OPEN:
        case TaskStatus.REOPENED:
        case TaskStatus.IN_PROGRESS:
        case TaskStatus.SEND_FOR_REVIEW:
            return `#FFF4E5`;
        case TaskStatus.ON_HOLD:
            return `#D8E7FF`
        case TaskStatus.CLOSED:
            return `#EDF7ED`;
        default:
            return `#FFF4E5`;
    }
}
export const statusTextColors = (status: string): string => {
    switch (status) {
        case TaskStatus.OPEN:
        case TaskStatus.REOPENED:
        case TaskStatus.IN_PROGRESS:
        case TaskStatus.SEND_FOR_REVIEW:
            return `#663C00`;
        case TaskStatus.ON_HOLD:
            return `#0E1962`
        case TaskStatus.CLOSED:
            return `#1E4620`;
        default:
            return `#EDF7ED`;
    }
}

export const formatPriority = (priority: string): string => {
    return priority?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

export const priorityTextColor = (priority: string): string => {
    switch (priority) {
        case TaskPriority.MEDIUM:
            return `#AA6E31`;
        case TaskPriority.HIGH:
            return `#B41214`;
        case TaskPriority.LOW:
            return `#15974B`;
        default:
            return `#15974B`;

    }
}
export const getPriorityIcon = (priority: string): string => {
    switch (priority) {
        case TaskPriority.HIGH:
            return "arrow_upward";
        case TaskPriority.MEDIUM:
            return "remove";
        case TaskPriority.LOW:
            return "arrow_downward";
        default:
            return "arrow_downward";
    }
};

export const getPriorityText = (priority: string): string => {
    return formatPriority(priority);
};

export const formatEffortLevel = (effortLevel: string): string => {
    if (!effortLevel) return '';
    return effortLevel?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
};

export const getEffortLevelLabel = (effortLevel: string): string => {
    return formatEffortLevel(effortLevel);
};

export const getFileName = (fileKey: string): string => {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
}

export const TASK_DETAIL_TAB_HEADERS = [
    { position: 0, name: "Details", key: "DETAILS" },
    { position: 1, name: "Discussion Log", key: "TASK_CONVERSATION" },
    { position: 2, name: "Attachment", key: "ATTACHMENT" },
    { position: 3, name: "Activity", key: "ACTIVITY" },
    { position: 4, name: "All Remarks", key: "ALL_REMARKS" },
    { position: 5, name: "All Responses", key: "ALL_RESPONSES" }
];
export enum TaskDetailsKey {
    DETAILS = "DETAILS",
    DISCUSSION_LOG = "TASK_CONVERSATION",
    ATTACHMENT = "ATTACHMENT",
    ACTIVITY = "ACTIVITY",
    ALL_REMARKS = "ALL_REMARKS",
    ALL_RESPONSES = "ALL_RESPONSES"
}
