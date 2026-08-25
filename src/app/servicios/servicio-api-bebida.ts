import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bebida } from '../entidades/bebida';

@Injectable({ providedIn: 'root' })
export class ServicioApiBebida {
  private readonly urlBase = 'https://www.thecocktaildb.com/api/json/v1/1/';

  constructor(private http: HttpClient) {}

  recibirDatosBebida(nombre: string): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}search.php?s=${nombre}`);
  }

  bebidaPorIngrediente(ingrediente: string): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}filter.php?i=${ingrediente}`);
  }

  bebidaPorTipo(tipo: string): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}filter.php?a=${tipo}`);
  }

  bebidaPorCategoria(categoria: string): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}filter.php?c=${categoria}`);
  }

  bebidaPorId(id: string): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}lookup.php?i=${id}`);
  }

  bebidaAleatoria(): Observable<{ drinks: Bebida[] }> {
    return this.http.get<{ drinks: Bebida[] }>(`${this.urlBase}random.php`);
  }

  asignarPrecioAleatorio(): number {
    const min = 8000;
    const max = 45000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
