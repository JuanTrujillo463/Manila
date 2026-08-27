import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioApiComida } from '../servicios/servicio-api-comida';
import { EnviarDatos } from '../servicios/enviar-datos';
import { Comida as ComidaEntidad } from '../entidades/comida';

const categorias = [
  { valor: 'Seafood', nombre: 'Mariscos' },
  { valor: 'Chicken', nombre: 'Pollo' },
  { valor: 'Dessert', nombre: 'Postres' },
  { valor: 'Vegetarian', nombre: 'Vegetariana' },
  { valor: 'Pasta', nombre: 'Pasta' },
];

interface GrupoComidas {
  nombreCategoria: string;
  comidas: ComidaEntidad[];
}

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

  grupos = signal<GrupoComidas[]>([]);

  comidas = signal<ComidaEntidad[]>([]);

  precios = signal<{ [id: string]: number }>({});
  error = signal('');
  detalle = signal<ComidaEntidad | null>(null);

  mostrarConfirmacion = signal(false);
  private temporizadorConfirmacion?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.cargarTodas();
  }

  cargarTodas() {
    this.error.set('');
    this.comidas.set([]);
    this.grupos.set([]);

    for (const categoria of categorias) {
      this.api.comidaPorCategoria(categoria.valor).subscribe({
        next: (respuesta) => {

          let items: ComidaEntidad[] = [];
          if (respuesta.meals) {
            items = respuesta.meals;
          }

          const grupoNuevo: GrupoComidas = {
            nombreCategoria: categoria.nombre,
            comidas: items,
          };

          const gruposActuales = this.grupos();
          this.grupos.set(gruposActuales.concat([grupoNuevo]));

          this.asignarPrecios(items);
        },
      });
    }
  }

  buscar() {
    if (!this.textoBusqueda.trim()) {
      return;
    }

    this.error.set('');

    this.grupos.set([]);

    let peticion;
    if (this.tipoBusqueda === 'nombre') {
      peticion = this.api.recibirDatosComida(this.textoBusqueda);
    } else {
      peticion = this.api.comidaPorIngrediente(this.textoBusqueda);
    }

    peticion.subscribe({
      next: (respuesta) => {
        let lista: ComidaEntidad[] = [];
        if (respuesta.meals) {
          lista = respuesta.meals;
        }

        this.comidas.set(lista);
        this.asignarPrecios(lista);

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

    this.mostrarConfirmacion.set(true);
    clearTimeout(this.temporizadorConfirmacion);
    this.temporizadorConfirmacion = setTimeout(() => {this.mostrarConfirmacion.set(false); }, 2000);
  }

  verDetalle(comida: ComidaEntidad) {
    this.api.comidaPorId(comida.idMeal).subscribe({ next: (respuesta) => {

        let detalleCompleto = comida;
        if (respuesta.meals && respuesta.meals[0]) {
          detalleCompleto = respuesta.meals[0];
        }

        detalleCompleto.ingredientes = this.api.armarIngredientes(detalleCompleto);
        this.detalle.set(detalleCompleto);
      },
    });
  }

  cerrarDetalle() {
    this.detalle.set(null);
  }

  volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private asignarPrecios(lista: ComidaEntidad[]) {
    const preciosActuales = Object.assign({}, this.precios());

    for (const comida of lista) {
      const id = comida.idMeal;
      if (!preciosActuales[id]) {
        preciosActuales[id] = this.api.asignarPrecioAleatorio();
      }
    }

    this.precios.set(preciosActuales);
  }
}