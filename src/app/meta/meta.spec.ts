import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Meta } from './meta';

describe('Meta', () => {
  let component: Meta;
  let fixture: ComponentFixture<Meta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Meta],
    }).compileComponents();

    fixture = TestBed.createComponent(Meta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
