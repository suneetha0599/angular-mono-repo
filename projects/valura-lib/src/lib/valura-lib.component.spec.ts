import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuraLibComponent } from './valura-lib.component';

describe('ValuraLibComponent', () => {
  let component: ValuraLibComponent;
  let fixture: ComponentFixture<ValuraLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValuraLibComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuraLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
