import { AssetTypeList, CategoryList } from "../request-management/Assets";
import { Department } from "../user-management/users.model";

export class AssetFilterConfiguration {

    // Search
    searchText: string;
    tempSearchText: string;

    // Master lists
    assetCategoryList: CategoryList[];
    assetTypeList: AssetTypeList[];
    departmentNameList: Department[];

    // Selected values
    selectedAssetCategory: any[];
    selectedAssetType: any[];
    selectedDepartment: any[];

    // Temporary selections
    tempselectedAssetCategory: any[];
    tempselectedAssetType: any[];
    tempselectedDepartment: any;

    constructor({
        searchText = '',
        tempSearchText = '',

        assetCategoryList = [],
        assetTypeList = [],
        departmentNameList = [],

        selectedAssetCategory = [],
        selectedAssetType = [],
        selectedDepartment = [],

        tempselectedAssetCategory = [],
        tempselectedAssetType = [],
        tempselectedDepartment = [],
    }: Partial<AssetFilterConfiguration> = {}) {

        // Search
        this.searchText = searchText;
        this.tempSearchText = tempSearchText;

        // Master lists
        this.assetCategoryList = assetCategoryList;
        this.assetTypeList = assetTypeList;
        this.departmentNameList = departmentNameList;

        // Selected
        this.selectedAssetCategory = selectedAssetCategory;
        this.selectedAssetType = selectedAssetType;
        this.selectedDepartment = selectedDepartment;

        // Temporary selections
        this.tempselectedAssetCategory = tempselectedAssetCategory;
        this.tempselectedAssetType = tempselectedAssetType;
        this.tempselectedDepartment = tempselectedDepartment;
    }
}