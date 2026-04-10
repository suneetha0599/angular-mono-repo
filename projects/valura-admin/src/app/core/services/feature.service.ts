import { inject, Injectable } from '@angular/core';
import { Feature } from '../models/Feature';
import { LSK_FLAT_FEATURE_LIST, } from '@admin-core/constants/local-storage-constants';
import { getList, setItem } from '@valura-lib/utils/local-storage-util';
import { routes as routeConstants } from '../constants/routes';
import { NAVIGATION_TYPE } from '../constants/constants';
import { RolePermissionService } from './permission/role-permission.service';

const { USER, REQUEST_MANAGEMENT, REQUEST_MANAGEMENT_DETAILS, TASK_MANAGEMENT, TASK_MANAGEMENT_DETAILS, DSRR, ASSESSMENTS, ASSESSMENT, ASSESSMENT_DETAILS, VENDORS } = routeConstants

enum featureCode {
  REQUEST_MANAGEMENT = 'REQUEST_MANAGEMENT',
  TASK_MANAGEMENT = 'TASK_MANAGEMENT',
  ASSESSMENTS = 'ASSESSMENTS',
  VENDORS_ASSESSMENTS = 'VENDORS_ASSESSMENTS'
}

@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  featureList: Feature[] = []
  entryFeatureList = []
  actionItems: string[] = [];

  private rolePermissionService = inject(RolePermissionService);

  async getFeatureList(forceLoad = false) {

    if (!forceLoad && this.featureList.length) {
      return this.featureList
    }

    const flatList = await this.getFlatFeatureFlatList(forceLoad)

    this.featureList = this.convertFlatToNestedList(flatList);
    return this.featureList

  }

  async getFlatFeatureFlatList(forceLoad = false) {
    let featureList = getList(LSK_FLAT_FEATURE_LIST)
    if (featureList.length) {
      return featureList;
    }
    const res = this.prepareAllocatedFeatures(this.featureMasterList);
    setItem(LSK_FLAT_FEATURE_LIST, res ?? [])
    return res ?? []
  }

  async getEntryPage(forceLoad: boolean = false, queryParams: any = null) {
    let featureList: Feature[] = [];
    if (!forceLoad && this.entryFeatureList.length) {
      featureList = [...this.entryFeatureList]
    }
    else {
      const featureNestedList: Feature[] = await this.getFeatureList();
      featureList = this.convertNestedToFlatList(featureNestedList);
    }
    if (featureList.length) {
      const nestedRoutes = this.prepareNestedRoute(featureList, queryParams);
      if (nestedRoutes) {
        return nestedRoutes
      }

      for (const feature of featureList) {
        if (feature.featureRoute && !feature.hasSubMenu) {
          return feature
        }
      }
    }
    return null
  }

  convertFlatToNestedList(flatList: Feature[]) {
    let featureList = (flatList as Feature[])
      .filter((feature: Feature) => feature.parentFmRid === 0)
      .map((feature: Feature) => {
        const _subFeatureList = flatList.filter(({ parentFmRid, featureType }) => parentFmRid === feature.fmRid && feature.featureType === featureType) as Feature[];
        const _feature = {
          ...feature,
          subFeatureList: _subFeatureList,
        } as Feature
        return _feature
      })
    return featureList
  }

  convertNestedToFlatList(nestedFeatureList: Feature[]) {
    let entryFeatureList: any[] = [];
    (nestedFeatureList as Feature[])
      .map((feature: Feature) => {
        const subFeatureList = feature.subFeatureList;
        entryFeatureList.push({ ...feature, subFeatureList: [], hasSubMenu: subFeatureList?.length ? true : false });
        entryFeatureList = entryFeatureList.concat(subFeatureList);
      })
    return entryFeatureList;
  }

  prepareNestedRoute(featureList: Feature[], queryParams: any) {
    if (queryParams?.featureCode) {
      let feature = featureList.find(feature => feature.featureCode == queryParams.featureCode);

      if (feature) {

        if (feature.featureCode === featureCode.REQUEST_MANAGEMENT && queryParams?.requestId) {
          const requestId = +(queryParams.requestId);
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_MANAGEMENT_DETAILS}/${requestId}`
          };
        }


        if (feature.featureCode === featureCode.TASK_MANAGEMENT && queryParams?.taskId) {
          const taskId = +(queryParams.taskId);
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/${USER}/${DSRR}/${TASK_MANAGEMENT}/${TASK_MANAGEMENT_DETAILS}/${taskId}`
          };
        }
        if (feature.featureCode === featureCode.ASSESSMENTS && queryParams?.assessmentId && queryParams?.section === 'QUESTION_AND_RESPONSE') {
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/user/assessments/assessment/details/${queryParams.assessmentId}`,
            extraParams: {
              section: queryParams.section,
              conversationParentEntityId: queryParams.conversationParentEntityId,
              conversationEntityId: queryParams.conversationEntityId,
              conversationId: queryParams.conversationId
            }
          };
        }

        if (feature.featureCode === featureCode.VENDORS_ASSESSMENTS && queryParams?.assessmentId && queryParams?.section === 'QUESTION_AND_RESPONSE') {
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/user/vendors/assessment/details/${queryParams.assessmentId}`,
            extraParams: {
              section: queryParams.section,
              conversationParentEntityId: queryParams.conversationParentEntityId,
              conversationEntityId: queryParams.conversationEntityId,
              conversationId: queryParams.conversationId
            }
          };
        }

        if (feature.featureCode === featureCode.ASSESSMENTS && queryParams?.assessmentId) {
          const assessmentId = +(queryParams.assessmentId);
          const extraParams: any = {};
          if (queryParams.section) extraParams.section = queryParams.section;
          if (queryParams.taskId) extraParams.taskId = queryParams.taskId;
          if (queryParams.conversationEntityId) extraParams.conversationEntityId = queryParams.conversationEntityId;
          if (queryParams.conversationId) extraParams.conversationId = queryParams.conversationId;
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/${USER}/${ASSESSMENTS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${assessmentId}`,
            queryParams: extraParams
          };
        }

        if (feature.featureCode === featureCode.VENDORS_ASSESSMENTS && queryParams?.assessmentId) {
          const assessmentId = +(queryParams.assessmentId);
          const extraParams: any = {};
          if (queryParams.section) extraParams.section = queryParams.section;
          if (queryParams.taskId) extraParams.taskId = queryParams.taskId;
          if (queryParams.conversationEntityId) extraParams.conversationEntityId = queryParams.conversationEntityId;
          if (queryParams.conversationId) extraParams.conversationId = queryParams.conversationId;
          return {
            ...feature,
            key: NAVIGATION_TYPE.EMAIL,
            featureRoute: `/${USER}/${VENDORS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${assessmentId}`,
            queryParams: extraParams
          };
        }

        return feature;
      }
    }
    return null;
  }

  updateActionToFeature() {
    for (let mainFeature of this.featureList) {
      for (let subFeature of mainFeature.subFeatureList) {
        subFeature.actionMessage = this.actionItems.includes(subFeature.featureCode) ? `Action needed` : ``
      }
    }
  }

  prepareAllocatedFeatures(featureFlatList: Feature[] = []) {
    this.rolePermissionService.permissionMasterList();

    let featureList = (featureFlatList as Feature[])
      .filter((feature: Feature) => this.rolePermissionService.hasFeatureAccess(featureFlatList, feature))
      .map((feature: Feature) => {
        const _feature = {
          ...feature,
        } as Feature
        return _feature
      })
    return featureList
  }

  externalUserFeatureList: any[] = [
    {
      "fmRid": 3,
      "featureCode": "TASK_MANAGEMENT",
      "featureName": "Task",
      "featureIcon": "fact_check",
      "featureRoute": '/user/dsrr/task',
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    }
  ]

  internalUserFeatureList: any[] = [
    {
      "fmRid": 3,
      "featureCode": "TASK_MANAGEMENT",
      "featureName": "Task",
      "featureIcon": "fact_check",
      "featureRoute": '/user/dsrr/task',
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    }
  ]

  featureMasterList: any[] = [
    {
      "fmRid": 1,
      "featureCode": "DASHBOARD",
      "permissionCode": "AUTH",
      "featureName": "Dashboard",
      "featureIcon": "dashboard",
      "featureRoute": "/user/dashboard",
      "parentFmRid": 0,
      "status": 1,
      "featureType": 2
    },
    {
      "fmRid": 24,
      "featureCode": "DSRR_MANAGEMENT",
      "permissionCode": "DSR",
      "featureName": "DSRR Management",
      "featureIcon": "assignment_add",
      "featureRoute": "/user/dsrr",
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 2,
      "featureCode": "REQUEST_MANAGEMENT",
      "permissionCode": "DATA_SUBJECT_REQUEST",
      "featureName": "Requests",
      "featureIcon": "assignment_add",
      "featureRoute": "/user/dsrr/request",
      "parentFmRid": 24,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 3,
      "featureCode": "TASK_MANAGEMENT",
      "permissionCode": "TASK",
      "featureName": "Task",
      "featureIcon": "fact_check",
      "featureRoute": "/user/dsrr/task",
      "parentFmRid": 24,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 4,
      "featureCode": "DATA_DISCOVERY",
      "permissionCode": "DATA_DISCOVERY",
      "featureName": "Data Discovery",
      "featureIcon": "donut_small",
      "featureRoute": "/user/data-discovery",
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 5,
      "featureCode": "ASSET",
      "permissionCode": "ASSET",
      "featureName": "Asset",
      "featureIcon": "",
      "featureRoute": "/user/data-discovery/assets",
      "parentFmRid": 4,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 6,
      "featureCode": "BPA",
      "permissionCode": "BPA",
      "featureName": "Processing Activity",
      "featureIcon": "",
      "featureRoute": "/user/data-discovery/bpa",
      "parentFmRid": 4,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 7,
      "featureCode": "DATA_INVENTORY",
      "permissionCode": "INVENTORY",
      "featureName": "Data inventory",
      "featureIcon": "",
      "featureRoute": "/user/data-discovery/data-inventory",
      "parentFmRid": 4,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 8,
      "featureCode": "COLLECTION_POINT",
      "permissionCode": "BPA",
      "featureName": "Collection point",
      "featureIcon": "",
      "featureRoute": "/user/data-discovery/collection-point",
      "parentFmRid": 4,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 10,
      "featureCode": "AUTH",
      "permissionCode": "AUTH",
      "featureName": "Auth",
      "featureIcon": "security",
      "featureRoute": null,
      "parentFmRid": 0,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 11,
      "featureCode": "USER",
      "permissionCode": "USER",
      "featureName": "Users",
      "featureIcon": "people",
      "featureRoute": "/admin/users",
      "parentFmRid": 10,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 12,
      "featureCode": "ROLE",
      "permissionCode": "ROLE",
      "featureName": "Roles",
      "featureIcon": "person_add",
      "featureRoute": "/admin/roles",
      "parentFmRid": 10,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 14,
      "featureCode": "COUNTRY_MANAGEMENT",
      "permissionCode": "AUTH",
      "featureName": "Countries",
      "featureIcon": "public",
      "featureRoute": "/admin/countries",
      "parentFmRid": 10,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 16,
      "featureCode": "ASSESSMENTS",
      "permissionCode": "ASSESSMENT",
      "featureName": "Assessments",
      "featureIcon": "assignment",
      "featureRoute": "/user/assessments",
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 17,
      "featureCode": "ASSESSMENTS",
      "permissionCode": "INSTANCE",
      "featureName": "Assessments",
      "featureIcon": "",
      "featureRoute": "/user/assessments/assessment",
      "parentFmRid": 16,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 19,
      "featureCode": "CONFIGURATION",
      "permissionCode": "CONFIGURATION",
      "featureName": "Configuration",
      "featureIcon": "settings",
      "featureRoute": "/admin/configuration",
      "parentFmRid": 0,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 20,
      "featureCode": "REGULATION",
      "permissionCode": "CONFIGURATION",
      "featureName": "Regulation",
      "featureIcon": "",
      "featureRoute": "/admin/configuration/regulation",
      "parentFmRid": 19,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 21,
      "featureCode": "EMAIL_CONFIGURATION",
      "permissionCode": "CONFIGURATION",
      "featureName": "Email",
      "featureIcon": "",
      "featureRoute": "/admin/configuration/email-configuration",
      "parentFmRid": 19,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 22,
      "featureCode": "GENERAL_CONFIGURATION",
      "permissionCode": "CONFIGURATION",
      "featureName": "General",
      "featureIcon": "",
      "featureRoute": "/admin/configuration/general",
      "parentFmRid": 19,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 23,
      "featureCode": "FORM_CONFIGURATION",
      "permissionCode": "CONFIGURATION",
      "featureName": "Form",
      "featureIcon": "settings",
      "featureRoute": "/admin/configuration/form-configuration/detail",
      "parentFmRid": 19,
      "status": 1,
      "featureType": 1
    },
    {
      "fmRid": 25,
      "featureCode": "REPORT",
      "permissionCode": "DATA_SUBJECT_REQUEST",
      "featureName": "Report",
      "featureIcon": "export",
      "featureRoute": "/user/dsrr/download",
      "parentFmRid": 24,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 26,
      "featureCode": "ASSESSMENTS_TASK",
      "permissionCode": "TASK",
      "featureName": "Tasks",
      "featureIcon": "",
      "featureRoute": "/user/assessments/tasks",
      "parentFmRid": 16,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 27,
      "featureCode": "ASSESSMENTS_RISKS",
      "permissionCode": "INSTANCE",
      "featureName": "Risk & Measures",
      "featureIcon": "",
      "featureRoute": "/user/assessments/risks",
      "parentFmRid": 16,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 28,
      "featureCode": "TEMPLATES",
      "permissionCode": "TEMPLATE",
      "featureName": "Templates",
      "featureIcon": "",
      "featureRoute": "/user/assessments/templates",
      "parentFmRid": 16,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 39,
      "featureCode": "ASSESSMENT_REPORT",
      "featureName": "Report",
      "featureIcon": "",
      "featureRoute": "/user/assessments/download",
      "parentFmRid": 16,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 29,
      "featureCode": "VENDOR_MANAGEMENT",
      "permissionCode": "VENDOR",
      "featureName": "TPR Management",
      "featureIcon": "donut_small",
      "featureRoute": "/user/vendors",
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 30,
      "featureCode": "VENDORS_RECORD",
      "permissionCode": "VENDOR_RECORD",
      "featureName": "Vendor Record",
      "featureIcon": "",
      "featureRoute": "/user/vendors/vendor",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 31,
      "featureCode": "VENDORS_ASSESSMENTS",
      "permissionCode": "ASSESSMENT",
      "featureName": "Assesments",
      "featureIcon": "",
      "featureRoute": "/user/vendors/assessment",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 32,
      "featureCode": "VENDOR_ASSESSMENTS_TASK",
      "permissionCode": "ASSESSMENT_TASK",
      "featureName": "Tasks",
      "featureIcon": "",
      "featureRoute": "/user/vendors/tasks",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 33,
      "featureCode": "VENDOR_ASSESSMENTS_RISKS",
      "permissionCode": "ASSESSMENT",
      "featureName": "Risk & Measures",
      "featureIcon": "",
      "featureRoute": "/user/vendors/risks",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 34,
      "featureCode": "VENDORS_TEMPLATES",
      "permissionCode": "TEMPLATE",
      "featureName": "Templates",
      "featureIcon": "",
      "featureRoute": "/user/vendors/templates",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 40,
      "featureCode": "VENDOR_REPORT",
      "featureName": "Report",
      "featureIcon": "",
      "featureRoute": "/user/vendors/download",
      "parentFmRid": 29,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 35,
      "featureCode": "CONSENT_MANAGEMENT",
      "permissionCode": "AUTH",
      "featureName": "Consent Management",
      "featureIcon": "donut_small",
      "featureRoute": "/user/consents",
      "parentFmRid": 0,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 36,
      "featureCode": "CONSENT",
      "permissionCode": "AUTH",
      "featureName": "Consent",
      "featureIcon": "",
      "featureRoute": "/user/consents/consent",
      "parentFmRid": 35,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 37,
      "featureCode": "REGULATORY_INTELLIGENCE",
      "permissionCode": "AUTH",
      "featureName": "Regulatory Intelligence",
      "featureIcon": "",
      "featureRoute": "/user/consents/regulatory-intelligence",
      "parentFmRid": 35,
      "status": 0,
      "featureType": 4
    },
    {
      "fmRid": 38,
      "featureCode": "ARTIFICIAL_INTELLIGENCE",
      "permissionCode": "AUTH",
      "featureName": "Artificial Intelligence",
      "featureIcon": "",
      "featureRoute": "/user/consents/artificial-intelligence",
      "parentFmRid": 35,
      "status": 0,
      "featureType": 4
    }
  ]
}
