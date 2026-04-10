import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBpaComponent } from './create-bpa.component';

describe('CreateBpaComponent', () => {
  let component: CreateBpaComponent;
  let fixture: ComponentFixture<CreateBpaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBpaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBpaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
