import type { Producto, Cliente, Proveedor, Usuario } from '@/types';

export const seedProductos: Producto[] = [
  { id: 'p1', codigo: '7790000000011', nombre: 'Yerba mate Kurupí 1kg', categoria: 'Almacén', precioCompra: 12000, precioVenta: 18000, stock: 25, stockMinimo: 5, tasaIVA: 5, activo: true },
  { id: 'p2', codigo: '7790000000028', nombre: 'Aceite Kikita 900ml', categoria: 'Almacén', precioCompra: 14000, precioVenta: 19000, stock: 18, stockMinimo: 5, tasaIVA: 5, activo: true },
  { id: 'p3', codigo: '7790000000035', nombre: 'Fideos Nutrion 500g', categoria: 'Almacén', precioCompra: 4000, precioVenta: 6500, stock: 40, stockMinimo: 10, tasaIVA: 5, activo: true },
  { id: 'p4', codigo: '7790000000042', nombre: 'Arroz Riceland 1kg', categoria: 'Almacén', precioCompra: 8000, precioVenta: 12000, stock: 30, stockMinimo: 8, tasaIVA: 5, activo: true },
  { id: 'p5', codigo: '7790000000059', nombre: 'Harina Trigo 1kg', categoria: 'Almacén', precioCompra: 5000, precioVenta: 8000, stock: 22, stockMinimo: 6, tasaIVA: 5, activo: true },
  { id: 'p6', codigo: '7790000000066', nombre: 'Leche Trébol 1L', categoria: 'Lácteos', precioCompra: 9000, precioVenta: 13000, stock: 15, stockMinimo: 5, tasaIVA: 5, activo: true },
  { id: 'p7', codigo: '7790000000073', nombre: 'Huevos docena', categoria: 'Frescos', precioCompra: 15000, precioVenta: 22000, stock: 12, stockMinimo: 4, tasaIVA: 5, activo: true },
  { id: 'p8', codigo: '7790000000080', nombre: 'Sal 500g', categoria: 'Almacén', precioCompra: 2000, precioVenta: 3500, stock: 50, stockMinimo: 10, tasaIVA: 5, activo: true },
  { id: 'p9', codigo: '7790000000097', nombre: 'Gaseosa Coca-Cola 2L', categoria: 'Bebidas', precioCompra: 10000, precioVenta: 15000, stock: 20, stockMinimo: 6, tasaIVA: 10, activo: true },
  { id: 'p10', codigo: '7790000000103', nombre: 'Cerveza Pilsen 1L', categoria: 'Bebidas', precioCompra: 12000, precioVenta: 18000, stock: 28, stockMinimo: 8, tasaIVA: 10, activo: true },
  { id: 'p11', codigo: '7790000000110', nombre: 'Detergente Ala 500ml', categoria: 'Limpieza', precioCompra: 8000, precioVenta: 12500, stock: 16, stockMinimo: 4, tasaIVA: 10, activo: true },
  { id: 'p12', codigo: '7790000000127', nombre: 'Jabón Dove 90g', categoria: 'Limpieza', precioCompra: 3500, precioVenta: 5500, stock: 35, stockMinimo: 10, tasaIVA: 10, activo: true },
  { id: 'p13', codigo: '7790000000134', nombre: 'Papel higiénico 4 rollos', categoria: 'Limpieza', precioCompra: 6000, precioVenta: 9500, stock: 14, stockMinimo: 5, tasaIVA: 10, activo: true },
  { id: 'p14', codigo: '7790000000141', nombre: 'Pan lactal', categoria: 'Panadería', precioCompra: 5000, precioVenta: 8000, stock: 8, stockMinimo: 3, tasaIVA: 5, activo: true },
  { id: 'p15', codigo: '7790000000158', nombre: 'Queso Paraguay 500g', categoria: 'Lácteos', precioCompra: 22000, precioVenta: 32000, stock: 10, stockMinimo: 3, tasaIVA: 5, activo: true },
  { id: 'p16', codigo: '7790000000165', nombre: 'Carne vacuna 1kg', categoria: 'Frescos', precioCompra: 45000, precioVenta: 65000, stock: 6, stockMinimo: 3, tasaIVA: 5, activo: true },
  { id: 'p17', codigo: '7790000000172', nombre: 'Pollo entero 1kg', categoria: 'Frescos', precioCompra: 25000, precioVenta: 38000, stock: 9, stockMinimo: 4, tasaIVA: 5, activo: true },
  { id: 'p18', codigo: '7790000000189', nombre: 'Mandioca 1kg', categoria: 'Frescos', precioCompra: 3000, precioVenta: 5000, stock: 20, stockMinimo: 5, tasaIVA: 5, activo: true },
  { id: 'p19', codigo: '7790000000196', nombre: 'Tomate 1kg', categoria: 'Frescos', precioCompra: 8000, precioVenta: 13000, stock: 0, stockMinimo: 5, tasaIVA: 5, activo: true },
  { id: 'p20', codigo: '7790000000202', nombre: 'Papas 1kg', categoria: 'Frescos', precioCompra: 6000, precioVenta: 10000, stock: 4, stockMinimo: 5, tasaIVA: 5, activo: true },
];

export const seedClientes: Cliente[] = [
  { id: 'c0', nombre: 'Consumidor Final', ruc: '', telefono: '', email: '', saldo: 0 },
  { id: 'c1', nombre: 'Ramón González', ruc: '1234567-8', telefono: '0981 123 456', email: 'ramon@gmail.com', saldo: 0 },
  { id: 'c2', nombre: 'Distribuidora San Lorenzo', ruc: '8765432-1', telefono: '021 555 222', email: 'ventas@sanlo.py', saldo: 45000 },
  { id: 'c3', nombre: 'Doña Carmen', ruc: '3456789-0', telefono: '0973 987 654', email: '', saldo: 15000 },
];

export const seedProveedores: Proveedor[] = [
  { id: 'pr1', nombre: 'Distribuidora Nacional S.A.', ruc: '80012345-6', telefono: '021 555 111', email: 'compras@dnac.py', direccion: 'Av. Mariscal López 1234, Asunción' },
  { id: 'pr2', nombre: 'Frutas y Verduras del Chaco', ruc: '80065432-1', telefono: '021 333 444', email: 'ventas@chaco.py', direccion: 'Ruta 9 Km 12, Mariano Roque Alonso' },
  { id: 'pr3', nombre: 'Carnicería El Nombré', ruc: '90011122-3', telefono: '0985 222 333', email: '', direccion: 'Mercado 4, Asunción' },
];

export const seedUsuarios: Usuario[] = [
  { id: 'u1', nombre: 'Admin', rol: 'admin', pin: '1234' },
  { id: 'u2', nombre: 'Cajero 1', rol: 'cajero', pin: '0000' },
  { id: 'u3', nombre: 'Supervisor', rol: 'supervisor', pin: '4321' },
];

export const NEGOCIO = {
  nombre: 'COMERCIAL ESTRELLA',
  ruc: '3811036-9',
  direccion: 'Calle Palma 1234, Asunción',
  telefono: '021 555 999',
};
