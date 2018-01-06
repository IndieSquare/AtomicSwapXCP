import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapItemComponent } from './swap-item.component';

describe('SwapItemComponent', () => {
  let component: SwapItemComponent;
  let fixture: ComponentFixture<SwapItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
