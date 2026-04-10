import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessProcessingActivitiesComponent } from './business-processing-activities.component';

describe('BusinessProcessingActivitiesComponent', () => {
  let component: BusinessProcessingActivitiesComponent;
  let fixture: ComponentFixture<BusinessProcessingActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessProcessingActivitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessProcessingActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
