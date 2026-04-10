import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentTaskListComponent } from './assessment-task-list.component';

describe('AssessmentTaskListComponent', () => {
  let component: AssessmentTaskListComponent;
  let fixture: ComponentFixture<AssessmentTaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentTaskListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
