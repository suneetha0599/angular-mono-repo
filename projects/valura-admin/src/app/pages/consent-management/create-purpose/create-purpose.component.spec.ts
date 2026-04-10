import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePurposeComponent } from './create-purpose.component';

describe('CreatePurposeComponent', () => {
  let component: CreatePurposeComponent;
  let fixture: ComponentFixture<CreatePurposeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePurposeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePurposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
