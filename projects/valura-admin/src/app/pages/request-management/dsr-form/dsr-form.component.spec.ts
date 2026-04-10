import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsrFormComponent } from './dsr-form.component';

describe('DsrFormComponent', () => {
  let component: DsrFormComponent;
  let fixture: ComponentFixture<DsrFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsrFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsrFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
