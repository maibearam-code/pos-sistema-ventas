import type { Permiso, Rol } from './types';

export const MATRIZ_PERMISOS: Permiso[] = [
  // Ventas
  { recurso: 'ventas', accion: 'crear', rolesPermitidos: ['admin', 'supervisor', 'cajero'] },
  { recurso: 'ventas', accion: 'anular', rolesPermitidos: ['admin', 'supervisor'] },
  { recurso: 'ventas', accion: 'descuento_hasta_10', rolesPermitidos: ['admin', 'supervisor', 'cajero'] },
  { recurso: 'ventas', accion: 'descuento_mayor_10', rolesPermitidos: ['admin', 'supervisor'] },
  // Inventario
  { recurso: 'inventario', accion: 'ver', rolesPermitidos: ['admin', 'supervisor'] },
  { recurso: 'inventario', accion: 'editar', rolesPermitidos: ['admin'] },
  { recurso: 'inventario', accion: 'eliminar', rolesPermitidos: ['admin'] },
  // Reportes
  { recurso: 'reportes', accion: 'ver', rolesPermitidos: ['admin', 'supervisor'] },
  // Caja
  { recurso: 'caja', accion: 'abrir', rolesPermitidos: ['admin', 'supervisor', 'cajero'] },
  { recurso: 'caja', accion: 'cerrar', rolesPermitidos: ['admin', 'supervisor'] },
  { recurso: 'caja', accion: 'ver_arqueo', rolesPermitidos: ['admin', 'supervisor'] },
  // Configuracion
  { recurso: 'configuracion', accion: 'ver', rolesPermitidos: ['admin'] },
  { recurso: 'configuracion', accion: 'editar', rolesPermitidos: ['admin'] },
  // Auditoria
  { recurso: 'auditoria', accion: 'ver', rolesPermitidos: ['admin'] },
  // Clientes
  { recurso: 'clientes', accion: 'ver', rolesPermitidos: ['admin', 'supervisor', 'cajero'] },
  { recurso: 'clientes', accion: 'editar', rolesPermitidos: ['admin', 'supervisor'] },
  // Compras
  { recurso: 'compras', accion: 'ver', rolesPermitidos: ['admin', 'supervisor'] },
  { recurso: 'compras', accion: 'editar', rolesPermitidos: ['admin'] },
];

export function tienePermiso(rol: Rol, recurso: string, accion: string): boolean {
  const permiso = MATRIZ_PERMISOS.find(
    (p) => p.recurso === recurso && p.accion === accion
  );
  if (!permiso) return false;
  return permiso.rolesPermitidos.includes(rol);
}
