import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggersDpiaComponent } from './triggers-dpia.component';

describe('TriggersDpiaComponent', () => {
  let component: TriggersDpiaComponent;
  let fixture: ComponentFixture<TriggersDpiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggersDpiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriggersDpiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
