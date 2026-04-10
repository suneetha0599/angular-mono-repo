import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewTemplateComponent } from './preview-template.component';

describe('PreviewTemplateComponent', () => {
  let component: PreviewTemplateComponent;
  let fixture: ComponentFixture<PreviewTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
