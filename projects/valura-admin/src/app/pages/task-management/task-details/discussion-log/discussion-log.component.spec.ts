import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionLogComponent } from './discussion-log.component';

describe('DiscussionLogComponent', () => {
  let component: DiscussionLogComponent;
  let fixture: ComponentFixture<DiscussionLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscussionLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscussionLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
