import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDrawerComponent } from './bpa-drawer.component';

describe('BpaDrawerComponent', () => {
  let component: BpaDrawerComponent;
  let fixture: ComponentFixture<BpaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
