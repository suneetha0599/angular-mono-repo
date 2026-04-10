import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CutsomMatInputComponent } from './cutsom-mat-input.component';

describe('CutsomMatInputComponent', () => {
  let component: CutsomMatInputComponent;
  let fixture: ComponentFixture<CutsomMatInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CutsomMatInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CutsomMatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
