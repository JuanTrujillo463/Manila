import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Videojuegos } from './videojuegos';

describe('Videojuegos', () => {
  let component: Videojuegos;
  let fixture: ComponentFixture<Videojuegos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Videojuegos],
    }).compileComponents();

    fixture = TestBed.createComponent(Videojuegos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
