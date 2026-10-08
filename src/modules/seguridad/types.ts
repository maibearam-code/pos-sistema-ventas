export type Rol = 'admin' | 'supervisor' | 'cajero';

export interface UsuarioSeguridad {
  id: string;
  nombre: string;
  rol: Rol;
  pin: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface Permiso {
  recurso: string;
  accion: string;
  rolesPermitidos: Rol[];
}

export type Criticidad = 'baja' | 'media' | 'alta' | 'critica';

export interface RegistroAuditoria {
  id: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: Rol;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalle: Record<string, unknown>;
  ip?: string;
  criticidad: Criticidad;
}
