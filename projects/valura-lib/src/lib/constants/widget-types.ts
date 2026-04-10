export const WidgetType = {
    TEXT: "TEXT",
    SINGLE_SELECT: "SINGLE_SELECT",
     MULTI_SELECT: "MULTI_SELECT",
    CHECK_BOX: "CHECK_BOX",
    TEXT_AREA: "TEXTAREA",
    RADIO: "RADIO",
    DATE_ONLY: "DATE_ONLY",
    FILE_UPLOAD: "FILE_UPLOAD",
    NUMBER: "NUMBER"
}

export type WidgetTypeKeys = keyof typeof WidgetType;
export type WidgetTypeValues = typeof WidgetType[WidgetTypeKeys];

