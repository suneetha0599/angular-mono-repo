import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentDiscussionLogComponent } from './assessment-discussion-log.component';

describe('AssessmentDiscussionLogComponent', () => {
  let component: AssessmentDiscussionLogComponent;
  let fixture: ComponentFixture<AssessmentDiscussionLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentDiscussionLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentDiscussionLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
