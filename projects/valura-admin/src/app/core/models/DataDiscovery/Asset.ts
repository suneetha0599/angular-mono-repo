import { Department } from "../user-management/users.model";

export interface PDElements {
    id: number
    categoryName: string
    departmentName: string
    type: string,
    purpose: string
}

export interface BusinessProcess {
    name: string;
    risk: string;
    owner: string;
    department: string;
    dsInvolved: string;
}

export interface ContractDetails {
  documents: string[];
  effectiveDate: string | null;
  startDate: string | null;
  tenurePeriod: string | null;
}

export interface ThirdPartyDetails {
  vendorName: string;
  contract: ContractDetails;
}

export interface HostingDetail {
  hostingType: string;
  provider: string;
  location: string;
}

export class CreateAssetRequest {
  constructor(
    public name: string,
    public description: string,
    public assetType: 'INTERNAL' | 'EXTERNAL',
    public assetUrl: string,
    public assetCategoryId: number,
    public departmentId: number,
    public systemOwner: string,
    public securityMeasures: any,
    public hostingDetails: HostingDetail[],
    public vendorId?: number,
    public status?: 'ACTIVE' | 'INACTIVE',
    public newDepartment? : any,
    public newVendor? : any,
    public newSecurityMeasures? : any[]

  ) {}
}


export interface QuickCreateAssetRequest {
  name: string;
  assetType: 'INTERNAL' | 'EXTERNAL';
  assetCategoryId: number;
  hostingLocation: string;
  hostingType: string;
}


export interface DataSubject {
    id: number;
    name: string;
    description: string;
}