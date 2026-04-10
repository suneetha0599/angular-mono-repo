import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewDpiaComponent } from './overview-dpia.component';

describe('OverviewDpiaComponent', () => {
  let component: OverviewDpiaComponent;
  let fixture: ComponentFixture<OverviewDpiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewDpiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewDpiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
