import { vendorStatus } from "../DataDiscovery/Vendor";


export class VendorFilterConfiguration {
    
    searchText: string;
    tempSearchText: string;
    vendorstatusList: vendorStatus[];
    vendorselectedStatus: any[];
    vendortempSelectedStatus: any[];


    constructor({
        searchText = '',
        tempSearchText = '',

     
        vendorstatusList = [],
        vendorselectedStatus = [],
        vendortempSelectedStatus = [],
    }: Partial<VendorFilterConfiguration> = {}) {
        
        this.searchText = searchText;
        this.tempSearchText = tempSearchText;
     
        this.vendorstatusList = vendorstatusList
        this.vendortempSelectedStatus = vendortempSelectedStatus
        this.vendorselectedStatus = vendorselectedStatus
    }
}


export interface Status {
    disabled?: boolean;
    id: number
    name: string;
    value: string;
    selected?: boolean;
}

export interface Channel {
    id: number
    name: string;
    value: string;
    selected: boolean;
}