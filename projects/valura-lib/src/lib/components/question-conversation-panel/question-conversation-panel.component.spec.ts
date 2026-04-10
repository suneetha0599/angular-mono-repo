import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionConversationPanelComponent } from './question-conversation-panel.component';
describe('QuestionConversationPanelComponent', () => {
  let component: QuestionConversationPanelComponent;
  let fixture: ComponentFixture<QuestionConversationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionConversationPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionConversationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
