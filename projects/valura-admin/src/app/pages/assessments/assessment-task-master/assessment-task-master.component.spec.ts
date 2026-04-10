import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentTaskMasterComponent } from './assessment-task-master.component';

describe('AssessmentTaskMasterComponent', () => {
  let component: AssessmentTaskMasterComponent;
  let fixture: ComponentFixture<AssessmentTaskMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentTaskMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentTaskMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
