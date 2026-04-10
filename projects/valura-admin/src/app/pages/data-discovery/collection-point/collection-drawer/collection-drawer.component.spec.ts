import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionDrawerComponent } from './collection-drawer.component';

describe('CollectionDrawerComponent', () => {
  let component: CollectionDrawerComponent;
  let fixture: ComponentFixture<CollectionDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
