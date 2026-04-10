import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalLoginComponent } from './internal-login.component';

describe('InternalLoginComponent', () => {
  let component: InternalLoginComponent;
  let fixture: ComponentFixture<InternalLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternalLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
