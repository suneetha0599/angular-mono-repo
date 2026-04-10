import { Country, DataSubjectUserType, Frequency } from "../DsrConfiguration";
import { Department } from "../user-management/users.model";

export class BpaFilterConfiguration {
    // Master lists
    statusList: bpaStatus[];
    countryList: Country[];
    frequencies: Frequency[] = [];
    dataSubjectList: DataSubjectUserType[];
    departmentNameList: Department[];

    // Selected values
    selectedStatus: any[];
    selectedFrequency: any[];
    selectedCountries: any[];
    selectedDataSubject: any[];
    selectedDepartment: any[];

    // Temp selections
    tempSelectedStatus: any[];
    tempSelectedFrequencies: any;
    tempSelectedCountry: any;
    tempSelectedDataSubject: any;
    tempselectedDepartment: any;

    // Search
    searchText: string;
    tempSearchText: string;

    constructor({
        statusList = [],
        selectedStatus = [],

        countryList = [],
        tempSelectedCountry = null,
        selectedCountries = [],

        tempSelectedStatus = [],
        selectedFrequency = [],

        dataSubjectList = [],
        tempSelectedDataSubject = [],
        selectedDataSubject = [],

        searchText = '',
        tempSearchText = '',

        departmentNameList = [],
        selectedDepartment = [],
        tempselectedDepartment = [],

    }: Partial<BpaFilterConfiguration> = {}) {

        // Assigning master lists
        this.statusList = statusList;
        this.countryList = countryList;
        this.dataSubjectList = dataSubjectList;
        this.departmentNameList = departmentNameList;

        // Assigning selected values
        this.selectedStatus = selectedStatus;
        this.selectedFrequency = selectedFrequency;
        this.selectedCountries = selectedCountries;
        this.selectedDataSubject = selectedDataSubject;
        this.selectedDepartment = selectedDepartment;

        // Temp selections
        this.tempSelectedStatus = tempSelectedStatus;
        this.tempSelectedFrequencies = this.tempSelectedFrequencies;
        this.tempSelectedCountry = tempSelectedCountry;
        this.tempSelectedDataSubject = tempSelectedDataSubject;
        this.tempselectedDepartment = tempselectedDepartment;

        // Search
        this.searchText = searchText;
        this.tempSearchText = tempSearchText;
    }
}


export class bpaStatus {
    label: string | undefined;
    key: string | undefined;
    selected?: boolean = false;
}