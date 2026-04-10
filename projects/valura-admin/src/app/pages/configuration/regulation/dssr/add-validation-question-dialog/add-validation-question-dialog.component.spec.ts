import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddValidationQuestionDialogComponent } from './add-validation-question-dialog.component';

describe('AddValidationQuestionDialogComponent', () => {
  let component: AddValidationQuestionDialogComponent;
  let fixture: ComponentFixture<AddValidationQuestionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddValidationQuestionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddValidationQuestionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
