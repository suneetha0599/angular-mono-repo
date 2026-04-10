import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionAndResponseComponent } from './question-and-response.component';

describe('QuestionAndResponseComponent', () => {
  let component: QuestionAndResponseComponent;
  let fixture: ComponentFixture<QuestionAndResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionAndResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionAndResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
