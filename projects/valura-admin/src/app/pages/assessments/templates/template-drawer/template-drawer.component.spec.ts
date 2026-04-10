import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateDrawerComponent } from './template-drawer.component';

describe('TemplateDrawerComponent', () => {
  let component: TemplateDrawerComponent;
  let fixture: ComponentFixture<TemplateDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
