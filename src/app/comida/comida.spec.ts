import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comida } from './comida';

describe('Comida', () => {
  let component: Comida;
  let fixture: ComponentFixture<Comida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comida],
    }).compileComponents();

    fixture = TestBed.createComponent(Comida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
