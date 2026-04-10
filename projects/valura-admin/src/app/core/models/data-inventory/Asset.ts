export interface Asset {
    name: string;
    description: string;
    assetType: string
    assetCategory: string;
    assetId: number;
    departmentName: string;
    systemOwnerName: string;
    hostingSite: string[];
    vendorName: string;
}

export interface Vendor {
    vendorId: number;
    name: string;
    pointOfContact: string;
    pointOfContactDesignation: string;
    email: string;
    phone: string;
    location: string;
}
export interface AssetCategory {
    id: number;
    name: string;
}