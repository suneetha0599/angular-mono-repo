import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssrRightsComponent } from './dssr-rights.component';

describe('DssrRightsComponent', () => {
  let component: DssrRightsComponent;
  let fixture: ComponentFixture<DssrRightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssrRightsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DssrRightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
