import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioApiComida } from '../servicios/servicio-api-comida';
import { EnviarDatos } from '../servicios/enviar-datos';
import { Comida as ComidaEntidad } from '../entidades/comida';

const categorias = ['Seafood', 'Chicken', 'Dessert', 'Vegetarian', 'Pasta'];

@Component({
  selector: 'app-comida',
  imports: [CommonModule, FormsModule],
  templateUrl: './comida.html',
  styleUrl: './comida.css',
})
export class Comida implements OnInit {
  private api = inject(ServicioApiComida);
  private carrito = inject(EnviarDatos);

  tipoBusqueda = 'nombre';
  textoBusqueda = '';

  comidas = signal<ComidaEntidad[]>([]);
  precios = signal<{ [id: string]: number }>({});
  error = signal('');
  detalle = signal<ComidaEntidad | null>(null);

  ngOnInit() {
    this.cargarPorCategoria('Seafood');
  }

  cargarPorCategoria(categoria: string) {
    this.error.set('');

    this.api.comidaPorCategoria(categoria).subscribe({
      next: (respuesta) => {
        this.comidas.set(respuesta.meals ?? []);
        this.asignarPrecios();
      },
    });
  }

  cargarTodas() {
    this.error.set('');
    this.comidas.set([]);

    for (const categoria of categorias) {
      this.api.comidaPorCategoria(categoria).subscribe({
        next: (respuesta) => {
          const nuevas: ComidaEntidad[] = respuesta.meals ?? [];
          this.comidas.set([...this.comidas(), ...nuevas]);
          this.asignarPrecios();
        },
      });
    }
  }

  buscar() {
    if (!this.textoBusqueda.trim()) {
      return;
    }

    this.error.set('');

    const peticion =
      this.tipoBusqueda === 'nombre'
        ? this.api.recibirDatosComida(this.textoBusqueda)
        : this.api.comidaPorIngrediente(this.textoBusqueda);

    peticion.subscribe({
      next: (respuesta) => {
        const lista = respuesta.meals ?? [];
        this.comidas.set(lista);
        this.asignarPrecios();
        if (lista.length === 0) {
          this.error.set('No se encontraron resultados.');
        }
      },
    });
  }

  agregarAlPedido(comida: ComidaEntidad) {
    this.carrito.agregarItem({
      id: comida.idMeal,
      tipo: 'comida',
      nombre: comida.strMeal,
      imagen: comida.strMealThumb,
      precio: this.precios()[comida.idMeal],
      cantidad: 1,
    });
  }

  verDetalle(comida: ComidaEntidad) {
    this.api.comidaPorId(comida.idMeal).subscribe({
      next: (respuesta) => {
        const detalleCompleto = respuesta.meals?.[0] ?? comida;
        detalleCompleto.ingredientes = this.api.armarIngredientes(detalleCompleto);
        this.detalle.set(detalleCompleto);
      },
    });
  }

  cerrarDetalle() {
    this.detalle.set(null);
  }

  private asignarPrecios() {
    const preciosActuales = { ...this.precios() };

    for (const comida of this.comidas()) {
      const id = comida.idMeal;
      if (!preciosActuales[id]) {
        preciosActuales[id] = this.api.asignarPrecioAleatorio();
      }
    }

    this.precios.set(preciosActuales);
  }
}
