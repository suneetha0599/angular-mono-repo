import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerDrawerComponent } from './trigger-drawer.component';

describe('TriggerDrawerComponent', () => {
  let component: TriggerDrawerComponent;
  let fixture: ComponentFixture<TriggerDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriggerDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
