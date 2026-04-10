import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationNavigationService } from './notification-navigation.service';
import { ENTITY_TYPES } from '../constants/entity-types.constant';

describe('NotificationNavigationService', () => {
  let service: NotificationNavigationService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        NotificationNavigationService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(NotificationNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('navigateToEntity', () => {
    it('should navigate to task management details', async () => {
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      const result = await service.navigateToEntity(ENTITY_TYPES.TASK_MANAGEMENT, '12');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/user/task-management/details/12']);
      expect(result).toBe(true);
    });

    it('should navigate to request management details', async () => {
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      const result = await service.navigateToEntity(ENTITY_TYPES.REQUEST_MANAGEMENT, 42);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/user/dsrr/request/details/42']);
      expect(result).toBe(true);
    });

    it('should navigate to user management details (admin)', async () => {
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      const result = await service.navigateToEntity(ENTITY_TYPES.USER_MANAGEMENT, '5');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/users/details/5']);
      expect(result).toBe(true);
    });

    it('should return false for unknown entity type', async () => {
      const result = await service.navigateToEntity('UNKNOWN_TYPE', '1');

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle navigation error gracefully', async () => {
      mockRouter.navigate.and.returnValue(Promise.reject(new Error('Navigation failed')));
      spyOn(console, 'error');

      const result = await service.navigateToEntity(ENTITY_TYPES.TASK_MANAGEMENT, '1');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getEntityTypeName', () => {
    it('should return correct display name for task management', () => {
      const name = service.getEntityTypeName(ENTITY_TYPES.TASK_MANAGEMENT);
      expect(name).toBe('Task');
    });

    it('should return entity type as fallback for unknown type', () => {
      const name = service.getEntityTypeName('UNKNOWN_TYPE');
      expect(name).toBe('UNKNOWN_TYPE');
    });
  });

  describe('hasRouteMapping', () => {
    it('should return true for valid entity types', () => {
      expect(service.hasRouteMapping(ENTITY_TYPES.TASK_MANAGEMENT)).toBe(true);
      expect(service.hasRouteMapping(ENTITY_TYPES.REQUEST_MANAGEMENT)).toBe(true);
      expect(service.hasRouteMapping(ENTITY_TYPES.USER_MANAGEMENT)).toBe(true);
    });

    it('should return false for invalid entity types', () => {
      expect(service.hasRouteMapping('INVALID_TYPE')).toBe(false);
    });
  });
});
