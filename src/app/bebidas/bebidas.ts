import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { EnviarDatos } from '../servicios/enviar-datos';
import { Bebida } from '../entidades/bebida';

@Component({
  selector: 'app-bebidas',
  imports: [CommonModule, FormsModule],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class Bebidas implements OnInit {
  private api = inject(ServicioApiBebida);
  private carrito = inject(EnviarDatos);

  tipoBusqueda = 'nombreCoctel';
  textoBusqueda = '';
  filtroTipo = '';
  filtroCategoria = '';

  bebidas = signal<Bebida[]>([]);
  precios = signal<{ [id: string]: number }>({});
  error = signal('');
  detalle = signal<Bebida | null>(null);

  ngOnInit() {
    this.cargarTodas();
  }

  cargarTodas() {
    this.error.set('');
    this.bebidas.set([]);
    this.filtroTipo = '';
    this.filtroCategoria = '';

    this.api.bebidaPorTipo('Alcoholic').subscribe({
      next: (respuesta) => this.agregarResultados(respuesta.drinks ?? []),
    });

    this.api.bebidaPorTipo('Non_Alcoholic').subscribe({
      next: (respuesta) => this.agregarResultados(respuesta.drinks ?? []),
    });
  }

  buscar() {
    this.error.set('');

    let peticion;
    if (this.filtroTipo) {
      peticion = this.api.bebidaPorTipo(this.filtroTipo);
    } else if (this.filtroCategoria) {
      peticion = this.api.bebidaPorCategoria(this.filtroCategoria);
    } else if (this.tipoBusqueda === 'nombreCoctel') {
      peticion = this.api.recibirDatosBebida(this.textoBusqueda);
    } else {
      peticion = this.api.bebidaPorIngrediente(this.textoBusqueda);
    }

    peticion.subscribe({
      next: (respuesta) => {
        const lista = respuesta.drinks ?? [];
        this.bebidas.set(lista);
        this.asignarPrecios();
        if (lista.length === 0) {
          this.error.set('No se encontraron resultados.');
        }
      },
    });
  }

  agregarAlPedido(bebida: Bebida) {
    this.carrito.agregarItem({
      id: bebida.idDrink,
      tipo: 'bebida',
      nombre: bebida.strDrink,
      imagen: bebida.strDrinkThumb,
      precio: this.precios()[bebida.idDrink],
      cantidad: 1,
    });
  }

  verDetalle(bebida: Bebida) {
    this.api.bebidaPorId(bebida.idDrink).subscribe({
      next: (respuesta) => {
        const detalleCompleto = respuesta.drinks?.[0] ?? bebida;
        detalleCompleto.ingredientes = this.api.armarIngredientes(detalleCompleto);
        this.detalle.set(detalleCompleto);
      },
    });
  }

  cerrarDetalle() {
    this.detalle.set(null);
  }

  private agregarResultados(nuevas: Bebida[]) {
    this.bebidas.set([...this.bebidas(), ...nuevas]);
    this.asignarPrecios();
  }

  private asignarPrecios() {
    const preciosActuales = { ...this.precios() };

    for (const bebida of this.bebidas()) {
      const id = bebida.idDrink;
      if (!preciosActuales[id]) {
        preciosActuales[id] = this.api.asignarPrecioAleatorio();
      }
    }

    this.precios.set(preciosActuales);
  }
}
