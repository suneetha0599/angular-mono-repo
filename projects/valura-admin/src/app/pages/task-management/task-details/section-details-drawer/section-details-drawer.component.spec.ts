import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionDetailsDrawerComponent } from './section-details-drawer.component';

describe('SectionDetailsDrawerComponent', () => {
  let component: SectionDetailsDrawerComponent;
  let fixture: ComponentFixture<SectionDetailsDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionDetailsDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionDetailsDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
