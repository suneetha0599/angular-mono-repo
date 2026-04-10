import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestTaskDetailComponent } from './request-task-detail.component';

describe('RequestTaskDetailComponent', () => {
  let component: RequestTaskDetailComponent;
  let fixture: ComponentFixture<RequestTaskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTaskDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestTaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
