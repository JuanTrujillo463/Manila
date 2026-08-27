import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { EnviarDatos } from '../servicios/enviar-datos';
import { DatosCliente } from '../entidades/datos-cliente';

type ColorRGB = [number, number, number];

const COLOR_OSCURO: ColorRGB = [26, 26, 26];
const COLOR_NARANJA: ColorRGB = [210, 105, 30];
const COLOR_CLARO: ColorRGB = [245, 245, 245];
const COLOR_GRIS: ColorRGB = [160, 160, 160];
const URL_LOGO = 'logoManila.jpg';

const DATOS_CLIENTE_VACIOS: DatosCliente = {
  nombreCompleto: '',
  celular: '',
  direccion: '',
};

@Component({
  selector: 'app-pedido',
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido.html',
  styleUrl: './pedido.css',
})
export class Pedido {

  carrito = inject(EnviarDatos);

  datos: DatosCliente = Object.assign({}, DATOS_CLIENTE_VACIOS);
  mostrarFormulario = false;
  errorFormulario = '';

  quitar(id: string, tipo: string) {
    this.carrito.quitarItem(id, tipo);
  }

  cambiarCantidad(id: string, tipo: string, cantidad: number) {
    this.carrito.cambiarCantidad(id, tipo, cantidad);
  }

  obtenerTipoTexto(tipo: string): string {
    if (tipo === 'comida') {
      return 'Comida';
    }
    return 'Bebida';
  }

  irAlFormulario() {
    if (this.carrito.pedido().length === 0) {
      return;
    }
    this.mostrarFormulario = true;
  }

  async realizarPedido() {
    if (!this.datos.nombreCompleto.trim() || !this.datos.celular.trim() || !this.datos.direccion.trim()) {
      this.errorFormulario = 'Completa todos los datos antes de continuar.';
      return;
    }

    this.errorFormulario = '';
    this.carrito.guardarDatosCliente(this.datos);
    await this.generarPDF();
  }

  private cargarLogoComoBase64(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const lado = Math.min(img.width, img.height);
        const origenX = (img.width - lado) / 2;
        const origenY = (img.height - lado) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const contexto = canvas.getContext('2d');

        if (!contexto) {
          resolve(null);
          return;
        }

        contexto.save();
        contexto.beginPath();
        contexto.arc(lado / 2, lado / 2, lado / 2, 0, Math.PI * 2);
        contexto.closePath();
        contexto.clip();
        contexto.drawImage(img, origenX, origenY, lado, lado, 0, 0, lado, lado);
        contexto.restore();

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = url;
    });
  }

  private dibujarEncabezado(doc: jsPDF, anchoPagina: number, margenX: number, logoBase64: string | null, fecha: string) {
    const altoEncabezado = 36;

    doc.setFillColor(COLOR_OSCURO[0], COLOR_OSCURO[1], COLOR_OSCURO[2]);
    doc.rect(0, 0, anchoPagina, altoEncabezado, 'F');
    doc.setFillColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
    doc.rect(0, altoEncabezado, anchoPagina, 1.2, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margenX, 8, 20, 20);
    } else {
      doc.setDrawColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margenX, 8, 20, 20, 2, 2);
      doc.setFontSize(7);
      doc.setTextColor(COLOR_GRIS[0], COLOR_GRIS[1], COLOR_GRIS[2]);
      doc.text('LOGO', margenX + 10, 19, { align: 'center' });
    }

    doc.setTextColor(COLOR_CLARO[0], COLOR_CLARO[1], COLOR_CLARO[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('MANILA', margenX + 26, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_GRIS[0], COLOR_GRIS[1], COLOR_GRIS[2]);
    doc.text('Restaurante', margenX + 26, 26);

    doc.setTextColor(COLOR_CLARO[0], COLOR_CLARO[1], COLOR_CLARO[2]);
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, anchoPagina - margenX, 20, { align: 'right' });
  }

  private dibujarDatosCliente(doc: jsPDF, margenX: number, y: number): number {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
    doc.text('Datos del cliente', margenX, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(COLOR_OSCURO[0], COLOR_OSCURO[1], COLOR_OSCURO[2]);

    y += 8;
    doc.text(`Nombre: ${this.datos.nombreCompleto}`, margenX, y);
    y += 7;
    doc.text(`Celular: ${this.datos.celular}`, margenX, y);
    y += 7;
    doc.text(`Dirección: ${this.datos.direccion}`, margenX, y);

    return y;
  }

  private dibujarTablaPedido(doc: jsPDF, anchoPagina: number, margenX: number, y: number): number {
    const colProducto = margenX;
    const colTipo = 95;
    const colCant = 125;
    const colPrecio = 145;
    const colSubtotal = anchoPagina - margenX;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
    doc.text('Pedido', margenX, y);
    y += 8;

    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_OSCURO[0], COLOR_OSCURO[1], COLOR_OSCURO[2]);
    doc.text('Producto', colProducto, y);
    doc.text('Tipo', colTipo, y);
    doc.text('Cant.', colCant, y);
    doc.text('Precio', colPrecio, y);
    doc.text('Subtotal', colSubtotal, y, { align: 'right' });
    y += 3;

    doc.setDrawColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
    doc.setLineWidth(0.5);
    doc.line(margenX, y, anchoPagina - margenX, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);

    for (const item of this.carrito.pedido()) {

      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      const subtotal = item.precio * item.cantidad;
      const tipo = this.obtenerTipoTexto(item.tipo);

      doc.setTextColor(COLOR_OSCURO[0], COLOR_OSCURO[1], COLOR_OSCURO[2]);
      doc.text(item.nombre.substring(0, 32), colProducto, y);
      doc.text(tipo, colTipo, y);
      doc.text(String(item.cantidad), colCant, y);
      doc.text(`$${item.precio.toLocaleString('es-CO')}`, colPrecio, y);
      doc.setTextColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
      doc.text(`$${subtotal.toLocaleString('es-CO')}`, colSubtotal, y, { align: 'right' });
      y += 8;
    }

    return y;
  }

  private dibujarTotal(doc: jsPDF, anchoPagina: number, margenX: number, y: number) {
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margenX, y, anchoPagina - margenX, y);
    y += 12;

    if (y + 14 > 285) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(COLOR_OSCURO[0], COLOR_OSCURO[1], COLOR_OSCURO[2]);
    doc.roundedRect(margenX, y - 9, anchoPagina - margenX * 2, 14, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_CLARO[0], COLOR_CLARO[1], COLOR_CLARO[2]);
    doc.text('Total a pagar', margenX + 6, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(COLOR_NARANJA[0], COLOR_NARANJA[1], COLOR_NARANJA[2]);
    doc.text(`$${this.carrito.calcularTotal().toLocaleString('es-CO')}`, anchoPagina - margenX - 6, y, { align: 'right' });
  }

  private async generarPDF() {
    const doc = new jsPDF();
    const margenX = 14;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const fecha = new Date().toLocaleDateString('es-CO');
    const logoBase64 = await this.cargarLogoComoBase64(URL_LOGO);

    this.dibujarEncabezado(doc, anchoPagina, margenX, logoBase64, fecha);

    let y = this.dibujarDatosCliente(doc, margenX, 50);
    y = this.dibujarTablaPedido(doc, anchoPagina, margenX, y + 16);
    this.dibujarTotal(doc, anchoPagina, margenX, y);

    doc.save('pedido-manila.pdf');

    this.carrito.vaciarPedido();
    this.mostrarFormulario = false;
    this.datos = Object.assign({}, DATOS_CLIENTE_VACIOS);
  }
}