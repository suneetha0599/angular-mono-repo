import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskActivityLogComponent } from './task-activity-log.component';

describe('TaskActivityLogComponent', () => {
  let component: TaskActivityLogComponent;
  let fixture: ComponentFixture<TaskActivityLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskActivityLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskActivityLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
