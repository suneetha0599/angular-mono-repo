import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsrFormPreviewComponent } from './dsr-form-preview.component';

describe('DsrFormPreviewComponent', () => {
  let component: DsrFormPreviewComponent;
  let fixture: ComponentFixture<DsrFormPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsrFormPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsrFormPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
