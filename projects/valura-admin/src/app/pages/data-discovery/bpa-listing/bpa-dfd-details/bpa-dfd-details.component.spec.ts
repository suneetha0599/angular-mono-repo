import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDFDDetailsComponent } from './bpa-dfd-details.component';

describe('BpaDFDDetailsComponent', () => {
  let component: BpaDFDDetailsComponent;
  let fixture: ComponentFixture<BpaDFDDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDFDDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDFDDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
