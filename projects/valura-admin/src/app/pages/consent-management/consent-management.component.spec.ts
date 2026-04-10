import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentManagementComponent } from './consent-management.component';

describe('ConsentManagementComponent', () => {
  let component: ConsentManagementComponent;
  let fixture: ComponentFixture<ConsentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
