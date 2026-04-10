import { Injectable } from '@angular/core';
import { FEATURE_FULL_ACCESS, UserPrimitives } from '@admin-core/constants/permission-constants';
import { Feature } from '@admin-core/models/Feature';
import { LSK_USER_PERMISSION } from '@admin-core/constants/local-storage-constants';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {

  userPermissionList: string[] = [];
  private userPermissionSet = new Set<string>();

  constructor() { }

  setUserPermisson(data: string[],) {
    setItem(LSK_USER_PERMISSION, data);
  }

  getUserPermisson(): string[] | [] {
    return getItem(LSK_USER_PERMISSION)
  }

  permissionMasterList(forceLoad: boolean = false) {
    if (forceLoad || !this.userPermissionList?.length) {
      const permissions = this.getUserPermisson();
      let userPermissionList = (permissions ?? [])
      this.userPermissionList = [...userPermissionList];
      this.userPermissionSet = new Set(this.userPermissionList);
    }
    return this.userPermissionList ?? []
  }

  clearData() {
    this.userPermissionList = [];
    this.userPermissionSet.clear();
  }

  checkPermission(primitive: string) {
    const permissionMasterList = this.permissionMasterList();
    if (permissionMasterList.find(permission => permission == primitive)) {
      return true
    }
    return false
  }

  hasFeatureAccess(featureList: Feature[], feature: Feature): boolean {
    if (feature.parentFmRid > 0) {
      let parentFeature = featureList.find(parentFeature => parentFeature.fmRid == feature.parentFmRid)
      if (!parentFeature) return false;
      return this.hasSubFeatureAccess(parentFeature.permissionCode, feature.permissionCode)
    }
    const _subFeatureList = featureList.filter(({ parentFmRid, featureType, permissionCode }) => parentFmRid === feature.fmRid && feature.featureType === featureType) as Feature[];
    const _allowedSubFeatureList = _subFeatureList.filter(({ permissionCode }) => this.hasSubFeatureAccess(feature.permissionCode, permissionCode)) as Feature[];
    const _allowMainFeature = _subFeatureList?.length ? (_allowedSubFeatureList?.length ?? 0) > 0 : true;
    return this.hasMainFeatureAccess(feature.permissionCode) && (_allowMainFeature);
  }

  hasMainFeatureAccess(featureCode: string): boolean {
    return [...this.userPermissionSet].some(p => {
      const parts = p.split('::');
      return parts.includes(featureCode);
    });
  }

  hasSubFeatureAccess(parentFeatureCode: string, subFeatureCode: string): boolean {
    return [...this.userPermissionSet]
      .some(p => (p.includes(`${parentFeatureCode}`) && (p.includes(`${FEATURE_FULL_ACCESS}`)) || this.hasMainFeatureAccess(subFeatureCode)));
  }

  // --- DSR ---
  get createDsrRequest() {
    return this.checkPermission(UserPrimitives.CREATE_DSR_REQUEST);
  }

  get editDsrRequest() {
    return this.checkPermission(UserPrimitives.EDIT_DSR_REQUEST);
  }

  get viewAllDsrRequest() {
    return this.checkPermission(UserPrimitives.VIEW_ALL_DSR_REQUEST);
  }

  get autoAssignDsrRequest() {
    return this.checkPermission(UserPrimitives.AUTO_ASSIGN_DSR_REQUEST);
  }

  get fullAccessDsrRequest() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_DSR_REQUEST);
  }

  get viewDsrFeature() {
    return this.checkPermission(UserPrimitives.VIEW_DSR_FEATURE);
  }

  get createTaskRequest() {
    return this.checkPermission(UserPrimitives.CREATE_TASK_REQUEST);
  }

  get dsrExport() {
    return this.checkPermission(UserPrimitives.DSR_EXPORT);
  }

  get viewDsrTask() {
    return this.checkPermission(UserPrimitives.DSR_TASK);
  }

  // --- BPA ---
  get createBpa() {
    return this.checkPermission(UserPrimitives.CREATE_BPA);
  }

  get editBpa() {
    return this.checkPermission(UserPrimitives.EDIT_BPA);
  }

  get viewBpa() {
    return this.checkPermission(UserPrimitives.VIEW_BPA);
  }

  get fullAccessBpa() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_BPA);
  }

  // --- Asset ---
  get viewAsset() {
    return this.checkPermission(UserPrimitives.VIEW_ASSET);
  }

  get createAsset() {
    return this.checkPermission(UserPrimitives.CREATE_ASSET);
  }

  get editAsset() {
    return this.checkPermission(UserPrimitives.EDIT_ASSET);
  }

  get fullAccessAsset() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_ASSET);
  }

  // --- Inventory ---
  get viewInventory() {
    return this.checkPermission(UserPrimitives.VIEW_INVENTORY);
  }

  get importInventory() {
    return this.checkPermission(UserPrimitives.IMPORT_INVENTORY);
  }

  get viewCp() {
    return this.checkPermission(UserPrimitives.VIEW_CP);
  }

  // --- Auth User ---
  get viewAuthUser() {
    return this.checkPermission(UserPrimitives.VIEW_AUTH_USER);
  }

  get createAuthUser() {
    return this.checkPermission(UserPrimitives.CREATE_AUTH_USER);
  }

  get editAuthUser() {
    return this.checkPermission(UserPrimitives.EDIT_AUTH_USER);
  }

  get fullAccessAuthUser() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_AUTH_USER);
  }

  get fullAccessAuth() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_AUTH);
  }

  // --- Auth Role ---
  get viewAuthRole() {
    return this.checkPermission(UserPrimitives.VIEW_AUTH_ROLE);
  }

  get createAuthRole() {
    return this.checkPermission(UserPrimitives.CREATE_AUTH_ROLE);
  }

  get editAuthRole() {
    return this.checkPermission(UserPrimitives.EDIT_AUTH_ROLE);
  }

  get fullAccessAuthRole() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_AUTH_ROLE);
  }

  // --- Configuration ---
  get fullAccessConfiguration() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_CONFIGURATION);
  }

  // --- Vendor ---
  get viewVendor() {
    return this.checkPermission(UserPrimitives.VIEW_VENDOR);
  }

  get createVendor() {
    return this.checkPermission(UserPrimitives.CREATE_VENDOR);
  }

  get editVendor() {
    return this.checkPermission(UserPrimitives.EDIT_VENDOR);
  }

  get viewVendorTemplate() {
    return this.checkPermission(UserPrimitives.VIEW_VENDOR_TEMPLATE);
  }

  get editVendorTemplate() {
    return this.checkPermission(UserPrimitives.EDIT_VENDOR_TEMPLATE);
  }

  get fullAccessVendorTemplate() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_VENDOR_TEMPLATE);
  }


  // --- Assessment Template ---
  get createAssessmentTemplate() {
    return this.checkPermission(UserPrimitives.CREATE_ASSESSMENT_TEMPLATE);
  }

  get editAssessmentTemplate() {
    return this.checkPermission(UserPrimitives.EDIT_ASSESSMENT_TEMPLATE);
  }

  get viewAssessmentTemplate() {
    return this.checkPermission(UserPrimitives.VIEW_ASSESSMENT_TEMPLATE);
  }

  get fullAccessAssessmentTemplate() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_ASSESSMENT_TEMPLATE);
  }

  // --- Assessment ---
  get createAssessmentInstance() {
    return this.checkPermission(UserPrimitives.CREATE_ASSESSMENT_INSTANCE);
  }

  get editAssessmentInstance() {
    return this.checkPermission(UserPrimitives.EDIT_ASSESSMENT_INSTANCE);
  }

  get approveAssessmentInstance() {
    return this.checkPermission(UserPrimitives.APPROVE_ASSESSMENT_INSTANCE);
  }

  get viewAllAssessmentInstance() {
    return this.checkPermission(UserPrimitives.VIEW_ALL_ASSESSMENT_INSTANCE);
  }

  get viewAssessmentInstance() {
    return this.checkPermission(UserPrimitives.VIEW_ASSESSMENT_INSTANCE);
  }

  get fullAccessAssessmentInstance() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_ASSESSMENT_INSTANCE);
  }

  get fullAccessAssessment() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_ASSESSMENT);
  }

  get assessmentTaskView() {
    return this.checkPermission(UserPrimitives.ASSESSMENT_TASK_VIEW);
  }

  // --- Vendor Assessment ---
  get viewVendorAssessment() {
    return this.checkPermission(UserPrimitives.VIEW_VENDOR_ASSESSMENT);
  }

  get createVendorAssessment() {
    return this.checkPermission(UserPrimitives.CREATE_VENDOR_ASSESSMENT);
  }

  get editVendorAssessment() {
    return this.checkPermission(UserPrimitives.EDIT_VENDOR_ASSESSMENT);
  }

  get viewAllVendorAssessment() {
    return this.checkPermission(UserPrimitives.VIEW_ALL_VENDOR_ASSESSMENT);
  }

  get approveVendorAssessment() {
    return this.checkPermission(UserPrimitives.APPROVE_VENDOR_ASSESSMENT);
  }

  get fullAccessVendorAssessment() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_VENDOR_ASSESSMENT);
  }

  get fullAccessVendor() {
    return this.checkPermission(UserPrimitives.FULL_ACCESS_VENDOR);
  }

  get vendorAssessmentTaskView() {
    return this.checkPermission(UserPrimitives.VENDOR_ASSESSMENT_TASK_VIEW);
  }
}
