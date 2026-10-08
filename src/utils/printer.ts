/**
 * Configuración de impresión para impresora térmica de 58mm.
 * Ancho útil: ~48mm (58mm - 5mm de margen por lado).
 * Resolución típica: 384 dots (203 DPI).
 * Tamaño de fuente: 11-12px para texto normal, 9px para detalles.
 */

export const TICKET_CONFIG = {
  anchoMm: 58,
  margenMm: 2,
  fuente: 'Courier New',
  fuenteSize: 11,
  fuenteSizePequena: 9,
  fuenteSizeGrande: 13,
} as const;

export const TICKET_PRINT_CSS = `
  @media print {
    @page {
      margin: 0;
      size: 58mm auto;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 58mm;
    }
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 58mm;
    background: #fff;
  }
  .ticket-print {
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
    width: 58mm;
    padding: 2mm;
    margin: 0;
    background: #fff;
    box-sizing: border-box;
  }
  .ticket-print * {
    box-sizing: border-box;
  }
  .ticket-print .text-center { text-align: center; }
  .ticket-print .font-bold { font-weight: bold; }
  .ticket-print .text-sm { font-size: 13px; }
  .ticket-print .text-\[10px\] { font-size: 9px; }
  .ticket-print .flex { display: flex; }
  .ticket-print .justify-between { justify-content: space-between; }
  .ticket-print .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ticket-print .flex-1 { flex: 1; }
  .ticket-print .px-1 { padding: 0 4px; }
  .ticket-print .mt-1 { margin-top: 4px; }
  .ticket-print .mt-2 { margin-top: 8px; }
  .ticket-print .mb-1 { margin-bottom: 4px; }
  .ticket-print .border-dashed,
  .ticket-print .border-t {
    border-top: 1px dashed #000;
    margin: 2px 0;
    height: 0;
  }
`;

/**
 * Imprime contenido HTML en una impresora térmica de 58mm usando un iframe oculto.
 * Este método evita los problemas de ventanas emergentes (popups bloqueados,
 * about:blank, eventos onload que no disparan).
 */
export function imprimirTicket58mm(htmlContenido: string, titulo: string = 'Ticket'): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('No se pudo acceder al documento del iframe de impresión.');
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${titulo}</title>
    <style>${TICKET_PRINT_CSS}</style>
  </head>
  <body>${htmlContenido}</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error al imprimir:', err);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  // Fallback: si onload no dispara (algunos navegadores), imprimir tras un breve delay
  setTimeout(() => {
    if (iframe.parentNode) {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // ya se manejó en onload
      }
    }
  }, 350);
}
