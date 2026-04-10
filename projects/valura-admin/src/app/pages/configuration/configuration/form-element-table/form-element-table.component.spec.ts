import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormElementTableComponent } from './form-element-table.component';

describe('FormElementTableComponent', () => {
  let component: FormElementTableComponent;
  let fixture: ComponentFixture<FormElementTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormElementTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormElementTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
