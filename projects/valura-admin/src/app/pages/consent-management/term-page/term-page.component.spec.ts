import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermPageComponent } from './term-page.component';

describe('TermPageComponent', () => {
  let component: TermPageComponent;
  let fixture: ComponentFixture<TermPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
