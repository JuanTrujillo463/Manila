import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comida } from '../entidades/comida';

@Injectable({ providedIn: 'root' })
export class ServicioApiComida {
  private readonly urlBase = 'https://www.themealdb.com/api/json/v1/1/';

  constructor(private http: HttpClient) {}

  recibirDatosComida(nombre: string): Observable<{ meals: Comida[] }> {
    return this.http.get<{ meals: Comida[] }>(`${this.urlBase}search.php?s=${nombre}`);
  }

  comidaPorIngrediente(ingrediente: string): Observable<{ meals: Comida[] }> {
    return this.http.get<{ meals: Comida[] }>(`${this.urlBase}filter.php?i=${ingrediente}`);
  }

  comidaPorCategoria(categoria: string): Observable<{ meals: Comida[] }> {
    return this.http.get<{ meals: Comida[] }>(`${this.urlBase}filter.php?c=${categoria}`);
  }

  comidaPorId(id: string): Observable<{ meals: Comida[] }> {
    return this.http.get<{ meals: Comida[] }>(`${this.urlBase}lookup.php?i=${id}`);
  }

  comidaAleatoria(): Observable<{ meals: Comida[] }> {
    return this.http.get<{ meals: Comida[] }>(`${this.urlBase}random.php`);
  }

  asignarPrecioAleatorio(): number {
    const min = 8000;
    const max = 45000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  armarIngredientes(comida: any): string[] {
    const lista: string[] = [];

    for (let i = 1; i <= 20; i++) {
      const ingrediente = comida[`strIngredient${i}`];
      const medida = comida[`strMeasure${i}`];

      if (ingrediente && ingrediente.trim()) {
        lista.push(medida && medida.trim() ? `${ingrediente} - ${medida}` : ingrediente);
      }
    }

    return lista;
  }
}
