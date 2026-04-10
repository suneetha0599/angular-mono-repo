import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDetailsComponent } from './bpa-details.component';

describe('BpaDetailsComponent', () => {
  let component: BpaDetailsComponent;
  let fixture: ComponentFixture<BpaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
