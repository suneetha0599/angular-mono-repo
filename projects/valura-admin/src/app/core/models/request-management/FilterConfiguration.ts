import { pointOfContactDesignationList, pointOfContactList, vendorStatus } from "../DataDiscovery/Vendor";
import { Country, DataSubjectUserType, RequestType, Frequency } from "../DsrConfiguration";
import { Department } from "../user-management/users.model";
import { User } from "../user.model";
import { AssetTypeList, CategoryList, CollectionPointList, departmentList } from "./Assets";

export class FilterConfiguration {
    statusList: Status[];
    loeList: LOE[];
    filteredCountryList:Country[];
    priorityList: Priority[];
    selectedStatus: any[];
    tempSelectedStatus: any[];
    countryList: Country[];
    frequencies: Frequency[] = [];
    tempSelectedFrequencies: any;
    tempSelectedCountry: any[];
    selectedCountry: Country[] = [];
    selectedPriority: any[];
    selectedLOE: any[];
    selectedCountries: any[];
    requestTypeList: RequestType[];
    selectedRequestType: any[];
    tempSelectedRequestType: any[];
    assignedToList: User[];
    selectedAssignedTo: any[];
    selectedFrequency: any[];
    selectedDepartments: any[];
    tempSelectedAssignedTo: any[];
    assignerList: User[];
    tempSelectedLevelofEfforts: any[];
    tempSelectedAssigner: any[];
    selectedAsssignee: any[];
    tempSelectedPriority: any[];
    priorityOptions: Priority[];
    effortlevels: LOE[];
    channelList: Channel[];
    tempSelectedChannel: any[];
    selectedChannel: any[];
    dataSubjectList: DataSubjectUserType[]
    tempSelectedDataSubject: any;
    selectedDataSubject: any[];
    tempselectedCollectionType: any[] = [];
    selectedCollectionType: any[] = [];
    collectionTypeList: CollectionPointList[];
    fromDate: string;
    toDate: string;
    tempFromDate: string;
    tempToDate: string;
    searchText: string;
    tempSearchText: string;
    through: any[];
    selectedThrough: any[];
    tempSelectedThrough: any[];

    templateTypeList: any[];
    selectedTemplateType: any[];
    tempSelectedTemplateType: any[];

    assetCategoryList: CategoryList[];
    assetTypeList: AssetTypeList[];
    departmentNameList: Department[];

    tempselectedAssetCategory: any[] = [];
    tempselectedAssetType: any[] = [];
    tempselectedDepartment: any;

    selectedDepartment: any[];
    selectedAssetCategory: any[];
    selectedAssetType: any[];

    pointOfContactList: pointOfContactList[];
    pointOfContactDesignationList: pointOfContactDesignationList[];

    vendorstatusList: vendorStatus[];
    vendorselectedStatus: any[];
    vendortempSelectedStatus: any[];

    temppointOfContact: any[];
    temppointOfContactDesignation: any[];

    selectedpointOfContact: any[];
    selectedpointOfContactDesignation: any[];

    cloneList: Status[];
    selectedClone: any[];
    tempSelectedClone: any[];

    constructor({
        statusList = [],
        loeList = [],
        priorityList = [],
        selectedStatus = [],
        countryList = [],
        tempSelectedCountry = [],
        selectedCountry = [],
        selectedPriority = [],
        selectedLOE = [],
        selectedCountries = [],
        tempSelectedStatus = [],
        requestTypeList = [],
        selectedRequestType = [],
        filteredCountryList=[],
        tempSelectedRequestType = [],
        assignedToList = [],
        assignerList = [],
        tempSelectedLevelofEfforts = [],
        priorityOptions = [],
        effortlevels = [],
        tempSelectedAssigner = [],
        tempSelectedPriority = [],
        selectedAsssignee = [],
        selectedAssignedTo = [],
        selectedFrequency = [],
        selectedDepartments = [],
        tempSelectedAssignedTo = [],
        channelList = [],
        tempSelectedChannel = [],
        selectedChannel = [],
        dataSubjectList = [],
        tempSelectedDataSubject = [],
        selectedDataSubject = [],
        fromDate = '',
        toDate = '',
        tempFromDate = '',
        tempToDate = '',
        searchText = '',
        tempSearchText = '',
        through = [],
        tempSelectedThrough = [],
        selectedThrough = [],

        templateTypeList = [],
        selectedTemplateType = [],
        tempSelectedTemplateType = [],

        assetCategoryList = [],
        assetTypeList = [],
        departmentNameList = [],

        selectedDepartment = [],
        selectedAssetCategory = [],
        selectedAssetType = [],

        tempselectedAssetCategory = [],
        tempselectedAssetType = [],
        tempselectedDepartment = [],

        pointOfContactList = [],
        pointOfContactDesignationList = [],

        temppointOfContact = [],
        temppointOfContactDesignation = [],

        selectedpointOfContact = [],
        selectedpointOfContactDesignation = [],
        vendorstatusList = [],
        vendorselectedStatus = [],
        vendortempSelectedStatus = [],

        collectionTypeList = [],
        cloneList = [],
        selectedClone = [],
        tempSelectedClone = [],
    }: Partial<FilterConfiguration> = {}) {
        this.statusList = statusList;
        this.loeList = loeList;
        this.priorityList = priorityList;
        this.selectedStatus = selectedStatus;
        this.countryList = countryList
        this.tempSelectedCountry = tempSelectedCountry
        this.selectedCountry = selectedCountry
        this.selectedPriority = selectedPriority
        this.selectedLOE = selectedLOE
        this.selectedCountries = selectedCountries
        this.tempSelectedStatus = tempSelectedStatus;
        this.requestTypeList = requestTypeList;
        this.selectedRequestType = selectedRequestType;
        this.tempSelectedRequestType = tempSelectedRequestType;
        this.assignedToList = assignedToList;
        this.filteredCountryList = filteredCountryList;
        this.assignerList = assignerList;
        this.tempSelectedLevelofEfforts = tempSelectedLevelofEfforts;
        this.priorityOptions = priorityOptions;
        this.effortlevels = effortlevels;
        this.tempSelectedAssigner = tempSelectedAssigner;
        this.tempSelectedPriority = tempSelectedPriority;
        this.selectedAssignedTo = selectedAssignedTo;
        this.selectedAsssignee = selectedAsssignee;
        this.selectedDepartments = selectedDepartments;
        this.tempSelectedAssignedTo = tempSelectedAssignedTo;
        this.selectedFrequency = selectedFrequency;
        this.channelList = channelList;
        this.tempSelectedChannel = tempSelectedChannel
        this.selectedChannel = selectedChannel;
        this.dataSubjectList = dataSubjectList;
        this.tempSelectedDataSubject = tempSelectedDataSubject
        this.selectedDataSubject = selectedDataSubject;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.tempFromDate = tempFromDate;
        this.tempToDate = tempToDate;
        this.searchText = searchText;
        this.tempSearchText = tempSearchText;
        this.through = through;
        this.tempSelectedThrough = tempSelectedThrough;
        this.selectedThrough = selectedThrough;

        this.templateTypeList = templateTypeList;
        this.selectedTemplateType = selectedTemplateType;
        this.tempSelectedTemplateType = tempSelectedTemplateType;

        this.assetCategoryList = assetCategoryList;
        this.assetTypeList = assetTypeList;
        this.departmentNameList = departmentNameList;

        this.selectedAssetCategory = selectedAssetCategory
        this.selectedAssetType = selectedAssetType
        this.selectedDepartment = selectedDepartment

        this.tempselectedAssetCategory = tempselectedAssetCategory;
        this.tempselectedAssetType = tempselectedAssetType;
        this.tempselectedDepartment = tempselectedDepartment;

        this.pointOfContactList = pointOfContactList
        this.pointOfContactDesignationList = pointOfContactDesignationList

        this.temppointOfContact = temppointOfContact
        this.temppointOfContactDesignation = temppointOfContactDesignation

        this.selectedpointOfContact = selectedpointOfContact
        this.selectedpointOfContactDesignation = selectedpointOfContactDesignation
        this.vendorstatusList = vendorstatusList
        this.vendortempSelectedStatus = vendortempSelectedStatus
        this.vendorselectedStatus = vendorselectedStatus

        this.collectionTypeList = collectionTypeList

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

export interface LOE {
    disabled?: boolean;
    id: number
    label: string;
    value: string;
    selected?: boolean;
}

export interface Priority {
    disabled?: boolean;
    id: number
    label: string;
    value: string;
    selected?: boolean;
}

export interface Channel {
    id: number
    name: string;
    value: string;
    selected: boolean;
}
