import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentAssetsComponent } from './consent-assets.component';

describe('ConsentAssetsComponent', () => {
  let component: ConsentAssetsComponent;
  let fixture: ComponentFixture<ConsentAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentAssetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
