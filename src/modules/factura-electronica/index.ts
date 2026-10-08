import type { Venta, RespuestaSIFEN } from './types';
import { EstadoDocumento } from './types';
import { SIFEN_CONFIG } from './config';

export { SIFEN_CONFIG } from './config';
export { getUrlSIFEN } from './config';
export * from './types';
export * from './sifen.client';
export * from './xml.generator';
export * from './kude.generator';
export * from './events.manager';

/**
 * Emite una factura electrónica a partir de una venta del POS.
 * Por ahora solo registra los datos en consola y retorna un estado PENDIENTE.
 * Cuando se implemente la integración real con el SIFEN, este método deberá:
 * 1. Obtener los datos del emisor desde la configuración.
 * 2. Construir los datos del receptor desde el cliente de la venta.
 * 3. Generar el XML del documento electrónico.
 * 4. Firmar digitalmente el XML con el certificado del emisor.
 * 5. Enviar el documento al SIFEN.
 * 6. Procesar la respuesta y devolver el CDC.
 * 7. Generar el KuDE con el código QR.
 */
export async function emitirFacturaElectronica(venta: Venta): Promise<RespuestaSIFEN> {
  console.log('[FE] Emitir factura electrónica - venta:', {
    id: venta.id,
    fecha: venta.fecha,
    total: venta.total,
    items: venta.items.length,
    cliente: venta.clienteNombre || 'Consumidor Final',
  });

  return {
    estado: EstadoDocumento.PENDIENTE,
    cdc: '',
    mensaje: 'Facturación electrónica no implementada. Documento en estado pendiente.',
  };
}

export function estaHabilitado(): boolean {
  return SIFEN_CONFIG.habilitado;
}
