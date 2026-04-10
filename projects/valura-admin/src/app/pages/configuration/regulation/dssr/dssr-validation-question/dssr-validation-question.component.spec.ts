import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssrValidationQuestionComponent } from './dssr-validation-question.component';

describe('DssrValidationQuestionComponent', () => {
  let component: DssrValidationQuestionComponent;
  let fixture: ComponentFixture<DssrValidationQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssrValidationQuestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DssrValidationQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
