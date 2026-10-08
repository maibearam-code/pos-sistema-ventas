import type { RegistroAuditoria, Criticidad, Rol } from './types';

const CLAVE_STORAGE = 'pos_auditoria';
const MAX_REGISTROS = 5000;

function generarId(): string {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function leerRegistros(): RegistroAuditoria[] {
  try {
    const data = localStorage.getItem(CLAVE_STORAGE);
    if (!data) return [];
    return JSON.parse(data) as RegistroAuditoria[];
  } catch {
    return [];
  }
}

function guardarRegistros(registros: RegistroAuditoria[]): void {
  try {
    const recortados = registros.slice(0, MAX_REGISTROS);
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(recortados));
  } catch (err) {
    console.error('[Auditoria] Error guardando registros:', err);
  }
}

export function registrarAccion(params: {
  usuarioId: string;
  usuarioNombre: string;
  rol: Rol;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalle?: Record<string, unknown>;
  criticidad?: Criticidad;
}): void {
  try {
    const registro: RegistroAuditoria = {
      id: generarId(),
      fecha: new Date().toISOString(),
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      rol: params.rol,
      accion: params.accion,
      recurso: params.recurso,
      recursoId: params.recursoId,
      detalle: params.detalle || {},
      criticidad: params.criticidad || 'baja',
    };

    const registros = leerRegistros();
    registros.unshift(registro);
    guardarRegistros(registros);

    console.log(`[Auditoria] ${registro.accion} - ${registro.usuarioNombre} (${registro.rol}) - ${registro.criticidad}`);
  } catch (err) {
    console.error('[Auditoria] Error registrando accion:', err);
  }
}

export function obtenerRegistros(filtros?: {
  desde?: string;
  hasta?: string;
  usuarioId?: string;
  accion?: string;
  criticidad?: string;
}): RegistroAuditoria[] {
  try {
    let registros = leerRegistros();

    if (filtros?.desde) {
      registros = registros.filter((r) => r.fecha >= filtros.desde!);
    }
    if (filtros?.hasta) {
      registros = registros.filter((r) => r.fecha <= filtros.hasta! + 'T23:59:59.999Z');
    }
    if (filtros?.usuarioId) {
      registros = registros.filter((r) => r.usuarioId === filtros.usuarioId);
    }
    if (filtros?.accion) {
      registros = registros.filter((r) => r.accion === filtros.accion);
    }
    if (filtros?.criticidad) {
      registros = registros.filter((r) => r.criticidad === filtros.criticidad);
    }

    return registros;
  } catch {
    return [];
  }
}

export function exportarCSVAuditoria(registros: RegistroAuditoria[]): string {
  const headers = ['Fecha', 'Usuario', 'Rol', 'Accion', 'Recurso', 'Recurso ID', 'Criticidad', 'Detalle'];
  const filas = registros.map((r) => [
    r.fecha,
    r.usuarioNombre,
    r.rol,
    r.accion,
    r.recurso,
    r.recursoId || '',
    r.criticidad,
    JSON.stringify(r.detalle),
  ]);
  const csv = [headers, ...filas]
    .map((fila) => fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return csv;
}

export function descargarCSVAuditoria(registros: RegistroAuditoria[]): void {
  const csv = exportarCSVAuditoria(registros);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
