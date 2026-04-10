import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplaySettingComponent } from './display-setting.component';

describe('DisplaySettingComponent', () => {
  let component: DisplaySettingComponent;
  let fixture: ComponentFixture<DisplaySettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplaySettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplaySettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
