import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssrSlaComponent } from './dssr-sla.component';

describe('DssrSlaComponent', () => {
  let component: DssrSlaComponent;
  let fixture: ComponentFixture<DssrSlaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssrSlaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DssrSlaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
