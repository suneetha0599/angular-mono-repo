import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadNetworkComponent } from './bad-network.component';

describe('BadNetworkComponent', () => {
  let component: BadNetworkComponent;
  let fixture: ComponentFixture<BadNetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadNetworkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
