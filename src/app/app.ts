import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navegacion } from './navegacion/navegacion';
import { Footer } from './footer/footer';
import { Informacion } from './informacion/informacion';
import { Carrusel } from './carrusel/carrusel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navegacion, Footer, Informacion, Carrusel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('actividad2');
  private router = inject(Router);

  esRutaInicio = true;

  constructor() {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.esRutaInicio = event.urlAfterRedirects === '/';
      }
    });
  }
}
