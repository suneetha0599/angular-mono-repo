export interface Assets {
  assetId: number;
  name: string;
  description: string;
  assetType: string;
  assetCategory: string;
  departmentName: string;
  systemOwnerName: string;
  hostingType: string;
  vendorName: string;
  status: string;
}



export class CategoryList {
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

export class departmentList {
  id: number;
  name: string;
  description: string;
  selected?: boolean;

  constructor({
    id = 0,
    name = "",
    description = '',
    selected = false
  }) {
    this.id = id
    this.name = name
    this.description = description
    this.selected = selected

  }
}


export class AssetnameList {
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

export class AssetTypeList {
  label: string | undefined;
  key: string | undefined;
  selected?: boolean = false;
}

export class CollectionPointList{
  label: string | undefined;
  key: string | undefined;
  selected?: boolean = false;
}
