export interface Vendor {
    id: number;
    vendorId: number;
    name: string;
    pointOfContact: string;
    pointOfContactDesignation: string;
    assetsLinked: string;
    status: string;
}


export class pointOfContactList {
    id: number;
    name: string;
    selected: boolean;

    constructor({
        id = 0,
        name = "",
        selected = false
    }) {
        this.id = id
        this.name = name
        this.selected = selected

    }
}

export class pointOfContactDesignationList {
    id: number;
    name: string;
    selected: boolean;

    constructor({
        id = 0,
        name = "",
        selected = false
    }) {
        this.id = id
        this.name = name
        this.selected = selected

    }
}
export class vendorStatus {
    label: string | undefined;
    key: string | undefined;
    selected?: boolean = false;
}

export interface VendorPageRequest {
    vendorId: number;
}