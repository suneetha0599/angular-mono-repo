import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestClarificationComponent } from './request-clarification.component';

describe('RequestClarificationComponent', () => {
  let component: RequestClarificationComponent;
  let fixture: ComponentFixture<RequestClarificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestClarificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestClarificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
