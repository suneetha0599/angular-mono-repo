import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveMitigationComponent } from './approve-mitigation.component';

describe('ApproveMitigationComponent', () => {
  let component: ApproveMitigationComponent;
  let fixture: ComponentFixture<ApproveMitigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveMitigationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveMitigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
