import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateDuplicateProgressComponent } from './template-duplicate-progress.component';

describe('TemplateDuplicateProgressComponent', () => {
  let component: TemplateDuplicateProgressComponent;
  let fixture: ComponentFixture<TemplateDuplicateProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateDuplicateProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateDuplicateProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
