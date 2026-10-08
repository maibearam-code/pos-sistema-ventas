import type { Producto, Cliente, Proveedor, Usuario, Venta, Movimiento, Compra, CajaMovimiento } from '@/types';
import { seedProductos, seedClientes, seedProveedores, seedUsuarios } from '@/data/seed';

const KEYS = {
  productos: 'pos_productos',
  clientes: 'pos_clientes',
  proveedores: 'pos_proveedores',
  usuarios: 'pos_usuarios',
  ventas: 'pos_ventas',
  movimientos: 'pos_movimientos',
  compras: 'pos_compras',
  caja: 'pos_caja',
  initialized: 'pos_initialized',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }
}

export function initDB(): void {
  if (!localStorage.getItem(KEYS.initialized)) {
    save(KEYS.productos, seedProductos);
    save(KEYS.clientes, seedClientes);
    save(KEYS.proveedores, seedProveedores);
    save(KEYS.usuarios, seedUsuarios);
    save(KEYS.ventas, []);
    save(KEYS.movimientos, []);
    save(KEYS.compras, []);
    save(KEYS.caja, []);
    localStorage.setItem(KEYS.initialized, '1');
  }
}

export const db = {
  // Productos
  getProductos: (): Producto[] => load(KEYS.productos, seedProductos),
  saveProductos: (data: Producto[]) => save(KEYS.productos, data),

  // Clientes
  getClientes: (): Cliente[] => load(KEYS.clientes, seedClientes),
  saveClientes: (data: Cliente[]) => save(KEYS.clientes, data),

  // Proveedores
  getProveedores: (): Proveedor[] => load(KEYS.proveedores, seedProveedores),
  saveProveedores: (data: Proveedor[]) => save(KEYS.proveedores, data),

  // Usuarios
  getUsuarios: (): Usuario[] => load(KEYS.usuarios, seedUsuarios),
  saveUsuarios: (data: Usuario[]) => save(KEYS.usuarios, data),

  // Ventas
  getVentas: (): Venta[] => load(KEYS.ventas, []),
  saveVentas: (data: Venta[]) => save(KEYS.ventas, data),

  // Movimientos
  getMovimientos: (): Movimiento[] => load(KEYS.movimientos, []),
  saveMovimientos: (data: Movimiento[]) => save(KEYS.movimientos, data),

  // Compras
  getCompras: (): Compra[] => load(KEYS.compras, []),
  saveCompras: (data: Compra[]) => save(KEYS.compras, data),

  // Caja
  getCaja: (): CajaMovimiento[] => load(KEYS.caja, []),
  saveCaja: (data: CajaMovimiento[]) => save(KEYS.caja, data),
};
