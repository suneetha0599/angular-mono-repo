import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTriggerDrawerComponent } from './add-trigger-drawer.component';

describe('AddTriggerDrawerComponent', () => {
  let component: AddTriggerDrawerComponent;
  let fixture: ComponentFixture<AddTriggerDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTriggerDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTriggerDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
