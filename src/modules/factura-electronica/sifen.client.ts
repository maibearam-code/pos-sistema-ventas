import type { RespuestaSIFEN, EventoSIFEN } from './types';
import { getUrlSIFEN } from './config';

/**
 * Cliente HTTP para comunicación con el SIFEN (DNIT Paraguay).
 * Todos los métodos están sin implementar — lanzan un Error.
 * Cuando se implemente la integración real, cada método deberá:
 * 1. Firmar digitalmente el XML con el certificado del emisor.
 * 2. Enviar la petición SOAP al endpoint correspondiente del SIFEN.
 * 3. Parsear la respuesta y devolver un objeto RespuestaSIFEN.
 */

export async function enviarDocumento(xmlFirmado: string): Promise<RespuestaSIFEN> {
  // TODO: Enviar el XML firmado al SIFEN vía SOAP.
  // Endpoint: {urlSIFEN}/recepcion
  // Debe incluir el certificado digital en la firma.
  throw new Error('No implementado: enviarDocumento');
}

export async function consultarDocumento(cdc: string): Promise<RespuestaSIFEN> {
  // TODO: Consultar el estado de un documento por su CDC (44 dígitos).
  // Endpoint: {urlSIFEN}/consulta
  // Retorna el estado actual del documento en el SIFEN.
  throw new Error('No implementado: consultarDocumento');
}

export async function enviarEvento(evento: EventoSIFEN): Promise<RespuestaSIFEN> {
  // TODO: Enviar un evento (cancelación, inutilización) al SIFEN.
  // Endpoint: {urlSIFEN}/eventos
  // El evento debe estar firmado digitalmente.
  throw new Error('No implementado: enviarEvento');
}

export async function consultarRUC(ruc: string): Promise<unknown> {
  // TODO: Consultar los datos de un contribuyente por su RUC.
  // Endpoint: {urlSIFEN}/ruc/{ruc}
  // Útil para autocompletar los datos del receptor.
  throw new Error('No implementado: consultarRUC');
}

export { getUrlSIFEN };
