import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdElementsComponent } from './pd-elements.component';

describe('PdElementsComponent', () => {
  let component: PdElementsComponent;
  let fixture: ComponentFixture<PdElementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdElementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdElementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
