import { vendorStatus } from "../DataDiscovery/Vendor";


export class CollectionPointFilterConfiguration {

    searchText: string;
    tempSearchText: string;
    collectionTypeList: any[];
    tempselectedCollectionType: any[] = [];
    selectedCollectionType: any[] = [];
    constructor({
        searchText = '',
        tempSearchText = '',
        collectionTypeList = []
    }: Partial<CollectionPointFilterConfiguration> = {}) {

        this.searchText = searchText;
        this.tempSearchText = tempSearchText;
        this.collectionTypeList = collectionTypeList
    }
}
