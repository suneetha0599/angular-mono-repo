import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ENTITY_TYPES, EntityType } from '../constants/entity-types.constant';
import { routes as routeConstants } from '../constants/routes';
import { BehaviorSubject } from 'rxjs';
import { NavigationMeta } from '../models/notification.model';

const {
  USER,
  ADMIN,
  TASK_MANAGEMENT,
  TASK_MANAGEMENT_DETAILS,
  REQUEST_MANAGEMENT,
  REQUEST_MANAGEMENT_DETAILS,
  DATA_DISCOVERY,
  ASSESSMENTS,
  ASSESSMENT,
  ASSESSMENT_DETAILS,
  ASSESSMENT_TASKS_LIST,
  ASSESSMENT_TASK,
  BPA,
  BPA_DETAILS,
  CONSENT_ASSETS,
  ASSETS_DETAILS,
  VENDORS,
  VENDORS_DETAILS,
  CONSENT_MANAGEMENT_DETAILS,
  USER_MANAGEMENT,
  USER_MANAGEMENT_DETAILS,
  ROLE_MANAGEMENT,
  ROLE_MANAGEMENT_DETAILS,
  DEPARTMENT_MANAGEMENT,
  DEPARTMENT_MANAGEMENT_DETAILS,
  COUNTRY_MANAGEMENT,
  COUNTRY_MANAGEMENT_DETAILS,
  CONFIGURATION,
  DSRR
} = routeConstants;

@Injectable({
  providedIn: 'root'
})
export class NotificationNavigationService {
  private router = inject(Router);
  public notificationCountIsUpdated$: BehaviorSubject<any> = new BehaviorSubject(null);

  async navigateToEntity(entityType: string, entityId: string | number, navigationMeta?: NavigationMeta): Promise<boolean> {
    const { route, queryParams } = this.resolveNavigation(entityType, entityId, navigationMeta);

    if (!route) {
      console.warn(`No route mapping found for entityType: ${entityType}`);
      return false;
    }

    try {
      const currentUrl = this.router.url.split('?')[0];
      const isAlreadyOnRoute = currentUrl === route || currentUrl === `/${route}`;

      if (isAlreadyOnRoute) {
        await this.router.navigateByUrl('/', { skipLocationChange: true });
      }

      return this.router.navigate([route], { queryParams });
    } catch (error) {
      console.error(`Navigation failed for ${entityType} with ID ${entityId}:`, error);
      return false;
    }
  }

  private resolveNavigation(entityType: string, entityId: string | number, navigationMeta?: NavigationMeta): { route: string | null; queryParams: any } {
    switch (entityType) {
      case ENTITY_TYPES.ASSESSMENT_TASK:
      case ENTITY_TYPES.VENDOR_ASSESSMENT_TASK: {
        const isVendor = entityType === ENTITY_TYPES.VENDOR_ASSESSMENT_TASK;
        const basePath = isVendor
          ? `/${USER}/${VENDORS}/${ASSESSMENT_TASKS_LIST}/${ASSESSMENT_TASK}`
          : `/${USER}/${ASSESSMENTS}/${ASSESSMENT_TASKS_LIST}/${ASSESSMENT_TASK}`;

        const taskId = navigationMeta?.taskId || entityId;
        const queryParams: any = { taskId };

        if (navigationMeta?.conversationId) {
          queryParams.conversationId = navigationMeta.conversationId;
        }

        return { route: basePath, queryParams };
      }

      case ENTITY_TYPES.QUESTION_AND_RESPONSE:
      case ENTITY_TYPES.VENDOR_QUESTION_AND_RESPONSE: {
        const isVendor = entityType === ENTITY_TYPES.VENDOR_QUESTION_AND_RESPONSE;
        const assessmentId = navigationMeta?.assessmentId;

        if (!assessmentId) {
          return { route: null, queryParams: {} };
        }

        const basePath = isVendor
          ? `/${USER}/${VENDORS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${assessmentId}`
          : `/${USER}/${ASSESSMENTS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${assessmentId}`;

        const queryParams: any = {
          tab: 'QR',
          sectionId: navigationMeta?.sectionId,
          questionId: navigationMeta?.questionId,
        };

        if (navigationMeta?.conversationId) {
          queryParams.conversationId = navigationMeta.conversationId;
        }

        return { route: basePath, queryParams };
      }

      default:
        return {
          route: this.buildRoute(entityType, entityId),
          queryParams: {}
        };
    }
  }

  private buildRoute(entityType: string, entityId: string | number): string | null {
    const id = typeof entityId === 'string' ? entityId : String(entityId);
    switch (entityType) {
      case ENTITY_TYPES.TASK_MANAGEMENT:
        return `/${USER}/${DSRR}/${TASK_MANAGEMENT}/${TASK_MANAGEMENT_DETAILS}/${id}`;
      case ENTITY_TYPES.TASK:
        return `/${USER}/${DSRR}/${TASK_MANAGEMENT}/${TASK_MANAGEMENT_DETAILS}/${id}`;
      case ENTITY_TYPES.DSRR:
        return `/${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.REQUEST_MANAGEMENT:
        return `/${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.BPA:
        return `/${USER}/${DATA_DISCOVERY}/${BPA}/${BPA_DETAILS}/${id}`;

      case ENTITY_TYPES.ASSET:
        return `/${USER}/${DATA_DISCOVERY}/${CONSENT_ASSETS}/${ASSETS_DETAILS}/${id}`;

      case ENTITY_TYPES.VENDOR:
        return `/${USER}/${DATA_DISCOVERY}/${VENDORS}/${VENDORS_DETAILS}/${id}`;

      case ENTITY_TYPES.ASSESSMENT:
        return `/${USER}/${ASSESSMENTS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.CONSENT_MANAGEMENT:
        return `/${USER}/${CONSENT_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.VENDORS_ASSESSMENTS:
        return  `/${USER}/${VENDORS}/${ASSESSMENT}/${ASSESSMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.USER_MANAGEMENT:
        return `/${ADMIN}/${USER_MANAGEMENT}/${USER_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.ROLE_MANAGEMENT:
        return `/${ADMIN}/${ROLE_MANAGEMENT}/${ROLE_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.DEPARTMENT_MANAGEMENT:
        return `/${ADMIN}/${DEPARTMENT_MANAGEMENT}/${DEPARTMENT_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.COUNTRY_MANAGEMENT:
        return `/${ADMIN}/${COUNTRY_MANAGEMENT}/${COUNTRY_MANAGEMENT_DETAILS}/${id}`;

      case ENTITY_TYPES.CONFIGURATION:
        return `/${ADMIN}/${CONFIGURATION}`;

      default:
        return null;
    }
  }

  getEntityTypeName(entityType: string): string {
    const nameMap: Record<string, string> = {
      [ENTITY_TYPES.TASK_MANAGEMENT]: 'Task',
      [ENTITY_TYPES.REQUEST_MANAGEMENT]: 'Request',
      [ENTITY_TYPES.DSRR]: 'dsrr',
      [ENTITY_TYPES.DATA_DISCOVERY]: 'Data Discovery',
      [ENTITY_TYPES.ASSESSMENT]: 'Assessment',
      [ENTITY_TYPES.ASSESSMENT_TASK]: 'Assessment Task',
      [ENTITY_TYPES.VENDOR_ASSESSMENT_TASK]: 'Vendor Assessment Task',
      [ENTITY_TYPES.QUESTION_AND_RESPONSE]: 'Question & Response',
      [ENTITY_TYPES.VENDOR_QUESTION_AND_RESPONSE]: 'Vendor Question & Response',
      [ENTITY_TYPES.CONSENT_MANAGEMENT]: 'Consent',
      [ENTITY_TYPES.BPA]: 'BPA',
      [ENTITY_TYPES.ASSET]: 'Asset',
      [ENTITY_TYPES.VENDOR]: 'Vendor',
      [ENTITY_TYPES.USER_MANAGEMENT]: 'User',
      [ENTITY_TYPES.ROLE_MANAGEMENT]: 'Role',
      [ENTITY_TYPES.DEPARTMENT_MANAGEMENT]: 'Department',
      [ENTITY_TYPES.COUNTRY_MANAGEMENT]: 'Country',
      [ENTITY_TYPES.CONFIGURATION]: 'Configuration',
    };

    return nameMap[entityType] || entityType;
  }

  hasRouteMapping(entityType: string): boolean {
    return Object.values(ENTITY_TYPES).includes(entityType as EntityType);
  }
}
