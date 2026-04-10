import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentConfigurationComponent } from './assessment-configuration.component';

describe('AssessmentConfigurationComponent', () => {
  let component: AssessmentConfigurationComponent;
  let fixture: ComponentFixture<AssessmentConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
