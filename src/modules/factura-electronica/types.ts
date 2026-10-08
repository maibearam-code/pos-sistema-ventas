import type { Venta } from '@/types';

export type AmbienteSIFEN = 'test' | 'produccion';

export type TipoDocumento =
  | 'factura-electronica'
  | 'nota-de-credito'
  | 'nota-de-debito';

export type TipoPersona = 'fisica' | 'juridica';

export type TipoContribuyente = 'contribuyente' | 'no-contribuyente';

export type TasaIVASIFEN = 0 | 5 | 10;

export interface DatosEmisor {
  ruc: string;
  dv: string;
  razonSocial: string;
  nombreFantasia?: string;
  actividadEconomica: string;
  direccion: string;
  numeroCasa: string;
  ciudad: string;
  departamento: string;
  pais: string;
  telefono?: string;
  email?: string;
  timbrado: string;
  establecimiento: string;
  puntoExpedicion: string;
}

export interface DatosReceptor {
  ruc?: string;
  dv?: string;
  tipoPersona: TipoPersona;
  tipoContribuyente: TipoContribuyente;
  nombre: string;
  documentoIdentidad?: string;
  direccion?: string;
  numeroCasa?: string;
  ciudad?: string;
  departamento?: string;
  pais: string;
  telefono?: string;
  email?: string;
}

export interface ItemFactura {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  tasaIVA: TasaIVASIFEN;
  baseImponible: number;
  iva: number;
  total: number;
  descuento?: number;
}

export interface DatosFactura {
  tipoDocumento: TipoDocumento;
  establecimiento: string;
  puntoExpedicion: string;
  numeroDocumento: string;
  fecha: string;
  emisor: DatosEmisor;
  receptor: DatosReceptor;
  items: ItemFactura[];
  subtotal: number;
  iva5: number;
  iva10: number;
  total: number;
  totalEnLetras: string;
  moneda: string;
  condicionPago: 'contado' | 'credito';
}

export interface RespuestaSIFEN {
  estado: EstadoDocumentoValue;
  cdc: string;
  mensaje: string;
  xmlFirmado?: string;
  codigoRespuesta?: string;
  fechaProcesamiento?: string;
  protocolo?: string;
}

export interface EventoSIFEN {
  tipo: 'cancelacion' | 'inutilizacion' | 'consulta' | 'envio';
  documentoId: string;
  cdc?: string;
  motivo?: string;
  datos?: Record<string, unknown>;
  fecha: string;
}

export const EstadoDocumento = {
  BORRADOR: 'BORRADOR',
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  CANCELADO: 'CANCELADO',
  INUTILIZADO: 'INUTILIZADO',
} as const;

export type EstadoDocumentoValue = (typeof EstadoDocumento)[keyof typeof EstadoDocumento];

export type { Venta };
