import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentActivityComponent } from './assessment-activity.component';

describe('AssessmentActivityComponent', () => {
  let component: AssessmentActivityComponent;
  let fixture: ComponentFixture<AssessmentActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
