import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsrDrawerContentComponent } from './dsr-drawer-content.component';

describe('DsrDrawerContentComponent', () => {
  let component: DsrDrawerContentComponent;
  let fixture: ComponentFixture<DsrDrawerContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsrDrawerContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsrDrawerContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
