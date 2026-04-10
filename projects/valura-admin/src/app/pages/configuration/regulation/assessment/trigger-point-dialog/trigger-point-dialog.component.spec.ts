import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerPointDialogComponent } from './trigger-point-dialog.component';

describe('TriggerPointDialogComponent', () => {
  let component: TriggerPointDialogComponent;
  let fixture: ComponentFixture<TriggerPointDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerPointDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriggerPointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
