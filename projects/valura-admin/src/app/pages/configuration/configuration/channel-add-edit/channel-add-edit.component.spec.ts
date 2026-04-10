import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelAddEditComponent } from './channel-add-edit.component';

describe('ChannelAddEditComponent', () => {
  let component: ChannelAddEditComponent;
  let fixture: ComponentFixture<ChannelAddEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelAddEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
