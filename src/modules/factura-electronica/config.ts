import type { AmbienteSIFEN } from './types';

export const SIFEN_CONFIG = {
  ambiente: 'test' as AmbienteSIFEN,
  urlTest: 'https://sifen-test.set.gov.py/',
  urlProduccion: 'https://sifen.set.gov.py/',
  rutaCertificado: '',
  formatoVersion: 150,
  habilitado: false,
} as const;

export function getUrlSIFEN(): string {
  return SIFEN_CONFIG.ambiente === 'produccion'
    ? SIFEN_CONFIG.urlProduccion
    : SIFEN_CONFIG.urlTest;
}
