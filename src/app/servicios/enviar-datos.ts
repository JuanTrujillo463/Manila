import { Injectable, signal } from '@angular/core';
import { ItemPedido } from '../entidades/item-pedido';
import { DatosCliente } from '../entidades/datos-cliente';

@Injectable({ providedIn: 'root' })
export class EnviarDatos {
  pedido = signal<ItemPedido[]>([]);

  datosCliente: DatosCliente = {
    nombreCompleto: '',
    celular: '',
    direccion: '',
  };

  agregarItem(item: ItemPedido) {
    const listaActual = this.pedido();
    const existente = listaActual.find((p) => p.id === item.id && p.tipo === item.tipo);

    if (existente) {
      existente.cantidad += item.cantidad;
      this.pedido.set([...listaActual]);
    } else {
      this.pedido.set([...listaActual, item]);
    }
  }

  quitarItem(id: string, tipo: string) {
    this.pedido.set(this.pedido().filter((p) => !(p.id === id && p.tipo === tipo)));
  }

  cambiarCantidad(id: string, tipo: string, cantidad: number) {
    const listaActual = this.pedido();
    const item = listaActual.find((p) => p.id === id && p.tipo === tipo);
    if (item && cantidad > 0) {
      item.cantidad = cantidad;
      this.pedido.set([...listaActual]);
    }
  }

  calcularTotal(): number {
    return this.pedido().reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  totalItems(): number {
    return this.pedido().reduce((total, item) => total + item.cantidad, 0);
  }

  guardarDatosCliente(datos: DatosCliente) {
    this.datosCliente = datos;
  }

  vaciarPedido() {
    this.pedido.set([]);
    this.datosCliente = { nombreCompleto: '', celular: '', direccion: '' };
  }
}
