import type { RespuestaSIFEN, EventoSIFEN } from './types';
import { enviarEvento } from './sifen.client';

/**
 * Manejador de eventos del ciclo de vida del documento electrónico.
 * Registra y procesa eventos como cancelaciones e inutilizaciones.
 */

const eventosRegistrados: EventoSIFEN[] = [];

export function registrarEvento(
  documentoId: string,
  evento: string,
  datos?: Record<string, unknown>
): void {
  // TODO: Persistir el evento en la base de datos (tabla de eventos FE).
  // Por ahora solo se guarda en memoria para fines de desarrollo.
  const registro: EventoSIFEN = {
    tipo: 'envio',
    documentoId,
    datos: datos || {},
    fecha: new Date().toISOString(),
  } as EventoSIFEN;
  void evento;
  eventosRegistrados.push(registro);
}

export async function cancelarDocumento(
  cdc: string,
  motivo: string
): Promise<RespuestaSIFEN> {
  // TODO: Enviar evento de cancelación al SIFEN.
  // Se debe generar el XML del evento de cancelación, firmarlo,
  // y enviarlo mediante enviarEvento().
  // El motivo debe estar codificado según el catálogo del SIFEN.
  void cdc; void motivo;
  return enviarEvento({
    tipo: 'cancelacion',
    documentoId: cdc,
    cdc,
    motivo,
    fecha: new Date().toISOString(),
  });
}

export async function inutilizarNumero(
  rango: number[],
  motivo: string
): Promise<RespuestaSIFEN> {
  // TODO: Enviar evento de inutilización de rango de números al SIFEN.
  // Se utiliza cuando una factura electrónica no se pudo emitir
  // y se necesita inutilizar el rango de números reservados.
  void rango; void motivo;
  return enviarEvento({
    tipo: 'inutilizacion',
    documentoId: rango.join('-'),
    motivo,
    fecha: new Date().toISOString(),
  });
}

export function obtenerEventos(documentoId?: string): EventoSIFEN[] {
  if (!documentoId) return [...eventosRegistrados];
  return eventosRegistrados.filter(e => e.documentoId === documentoId);
}
