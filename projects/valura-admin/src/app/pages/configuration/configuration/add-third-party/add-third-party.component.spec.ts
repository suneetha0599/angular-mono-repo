import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddThirdPartyComponent } from './add-third-party.component';

describe('AddThirdPartyComponent', () => {
  let component: AddThirdPartyComponent;
  let fixture: ComponentFixture<AddThirdPartyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddThirdPartyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddThirdPartyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
