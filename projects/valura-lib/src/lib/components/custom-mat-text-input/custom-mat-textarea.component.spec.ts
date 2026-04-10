import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMatTextareaComponent } from './custom-mat-textarea.component';

describe('CustomMatTextInputComponent', () => {
  let component: CustomMatTextareaComponent;
  let fixture: ComponentFixture<CustomMatTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomMatTextareaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomMatTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
