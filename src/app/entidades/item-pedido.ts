export interface ItemPedido {
  id: string;
  tipo: 'comida' | 'bebida';
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
}
