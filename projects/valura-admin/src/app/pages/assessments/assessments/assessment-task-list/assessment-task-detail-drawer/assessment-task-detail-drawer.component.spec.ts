import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentTaskDetailDrawerComponent } from './assessment-task-detail-drawer.component';

describe('AssessmentTaskDetailDrawerComponent', () => {
  let component: AssessmentTaskDetailDrawerComponent;
  let fixture: ComponentFixture<AssessmentTaskDetailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentTaskDetailDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentTaskDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
