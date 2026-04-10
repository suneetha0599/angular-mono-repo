import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentDrawerContentComponent } from './consent-drawer-content.component';

describe('ConsentDrawerContentComponent', () => {
  let component: ConsentDrawerContentComponent;
  let fixture: ComponentFixture<ConsentDrawerContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentDrawerContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentDrawerContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
