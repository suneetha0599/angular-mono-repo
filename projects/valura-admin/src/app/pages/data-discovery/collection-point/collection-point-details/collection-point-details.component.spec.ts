import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionPointDetailsComponent } from './collection-point-details.component';

describe('CollectionPointDetailsComponent', () => {
  let component: CollectionPointDetailsComponent;
  let fixture: ComponentFixture<CollectionPointDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionPointDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionPointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
