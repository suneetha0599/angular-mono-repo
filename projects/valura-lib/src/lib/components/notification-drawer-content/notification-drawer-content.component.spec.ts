import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationDrawerContentComponent } from './notification-drawer-content.component';

describe('NotificationDrawerComponent', () => {
  let component: NotificationDrawerContentComponent;
  let fixture: ComponentFixture<NotificationDrawerContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationDrawerContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationDrawerContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
