import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentManagementPreviewComponent } from './consent-management-preview.component';

describe('ConsentManagementPreviewComponent', () => {
  let component: ConsentManagementPreviewComponent;
  let fixture: ComponentFixture<ConsentManagementPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentManagementPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentManagementPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
