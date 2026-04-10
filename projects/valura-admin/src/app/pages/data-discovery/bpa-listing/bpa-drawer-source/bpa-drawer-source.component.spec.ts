import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDrawerSourceComponent } from './bpa-drawer-source.component';

describe('BpaDrawerSourceComponent', () => {
  let component: BpaDrawerSourceComponent;
  let fixture: ComponentFixture<BpaDrawerSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDrawerSourceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDrawerSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
