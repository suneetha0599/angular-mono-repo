import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerDetailDrawerComponent } from './trigger-detail-drawer.component';

describe('TriggerDetailDrawerComponent', () => {
  let component: TriggerDetailDrawerComponent;
  let fixture: ComponentFixture<TriggerDetailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerDetailDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriggerDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
