export type TasaIVA = 5 | 10;

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  tasaIVA: TasaIVA;
  activo: boolean;
}

export interface VentaItem {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  tasaIVA: TasaIVA;
  subtotal: number;
}

export type MedioPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
export type EstadoVenta = 'completada' | 'anulada' | 'credito';

export interface Venta {
  id: string;
  fecha: string;
  items: VentaItem[];
  subtotal: number;
  iva5: number;
  iva10: number;
  total: number;
  descuento: number;
  medioPago: MedioPago;
  clienteId?: string;
  clienteNombre?: string;
  usuarioId: string;
  usuarioNombre: string;
  estado: EstadoVenta;
  montoRecibido?: number;
  cambio?: number;
  saldoPendiente?: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  ruc?: string;
  telefono: string;
  email: string;
  saldo: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  telefono: string;
  email: string;
  direccion: string;
}

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface Movimiento {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  referencia: string;
}

export type RolUsuario = 'admin' | 'cajero' | 'supervisor';

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  pin: string;
}

export interface Compra {
  id: string;
  fecha: string;
  proveedorId: string;
  proveedorNombre: string;
  items: { productoId: string; nombre: string; cantidad: number; costoUnitario: number; subtotal: number }[];
  total: number;
  usuarioId: string;
  usuarioNombre: string;
}

export interface CajaMovimiento {
  id: string;
  fecha: string;
  tipo: 'apertura' | 'ingreso' | 'egreso' | 'cierre';
  monto: number;
  concepto: string;
  usuarioId: string;
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}
