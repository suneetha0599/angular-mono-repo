import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRequesterInfoComponent } from './add-requester-info.component';

describe('AddRequesterInfoComponent', () => {
  let component: AddRequesterInfoComponent;
  let fixture: ComponentFixture<AddRequesterInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRequesterInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRequesterInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
