import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionPointComponent } from './collection-point.component';

describe('CollectionPointComponent', () => {
  let component: CollectionPointComponent;
  let fixture: ComponentFixture<CollectionPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionPointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
