export class templateFilterConFiguration {
    statusList: Status[];
    selectedStatus: any[];
    tempSelectedStatus: any[];
    
    searchText: string;
    tempSearchText: string;

    templateTypeList: any[];
    selectedTemplateType: any[];
    tempSelectedTemplateType: any[];

  
    cloneList: Status[];
    selectedClone: any[];
    tempSelectedClone: any[];

    constructor({
        statusList = [],
        selectedStatus = [],
       
        tempSelectedStatus = [],
       
        searchText = '',
        tempSearchText = '',

        templateTypeList = [],
        selectedTemplateType = [],
        tempSelectedTemplateType = [],
        cloneList = [],
        selectedClone = [],
        tempSelectedClone = [],
    }: Partial<templateFilterConFiguration> = {}) {
        this.statusList = statusList;
        this.selectedStatus = selectedStatus;
        this.tempSelectedStatus = tempSelectedStatus;
        
        this.searchText = searchText;
        this.tempSearchText = tempSearchText;

        this.templateTypeList = templateTypeList;
        this.selectedTemplateType = selectedTemplateType;
        this.tempSelectedTemplateType = tempSelectedTemplateType;

        this.cloneList = cloneList;
        this.selectedClone = selectedClone;
        this.tempSelectedClone = tempSelectedClone;
    }
}


export interface Status {
    disabled?: boolean;
    id: number
    name: string;
    value: string;
    selected?: boolean;
}

