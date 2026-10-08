import type { TasaIVA, VentaItem, Producto } from '@/types';

export function formatPYG(monto: number): string {
  return 'Gs. ' + Math.round(monto).toLocaleString('es-PY').replace(/,/g, '.');
}

export function formatPYGPlain(monto: number): string {
  return Math.round(monto).toLocaleString('es-PY').replace(/,/g, '.');
}

export function formatFecha(fechaISO: string): string {
  const d = new Date(fechaISO);
  return d.toLocaleDateString('es-PY') + ' ' + d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
}

export function formatFechaCorta(fechaISO: string): string {
  const d = new Date(fechaISO);
  return d.toLocaleDateString('es-PY');
}

export function calcularIVADesdePrecioConIVA(precioConIVA: number, tasa: TasaIVA): { base: number; iva: number } {
  const base = precioConIVA / (1 + tasa / 100);
  const iva = precioConIVA - base;
  return { base, iva };
}

export function calcularTotalesVenta(
  items: VentaItem[],
  descuento: number
): { subtotal: number; iva5: number; iva10: number; total: number; baseImponible5: number; baseImponible10: number } {
  let iva5 = 0;
  let iva10 = 0;
  let base5 = 0;
  let base10 = 0;

  for (const item of items) {
    const { base, iva } = calcularIVADesdePrecioConIVA(item.subtotal, item.tasaIVA);
    if (item.tasaIVA === 5) {
      iva5 += iva;
      base5 += base;
    } else {
      iva10 += iva;
      base10 += base;
    }
  }

  const totalBruto = items.reduce((s, i) => s + i.subtotal, 0);
  const total = totalBruto - descuento;
  const subtotal = total - iva5 - iva10;

  // Recalcular IVA after discount proportionally
  if (descuento > 0 && totalBruto > 0) {
    const factor = total / totalBruto;
    iva5 = iva5 * factor;
    iva10 = iva10 * factor;
    base5 = base5 * factor;
    base10 = base10 * factor;
  }

  return {
    subtotal: subtotal,
    iva5,
    iva10,
    total,
    baseImponible5: base5,
    baseImponible10: base10,
  };
}

export function genId(prefix: string = 'id'): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export function genNumeroTicket(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${y}${m}${d}-${rand}`;
}

export function productoToVentaItem(producto: Producto, cantidad: number): VentaItem {
  return {
    productoId: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    cantidad,
    precioUnitario: producto.precioVenta,
    tasaIVA: producto.tasaIVA,
    subtotal: producto.precioVenta * cantidad,
  };
}

export function playBeep(freq: number = 800, duration: number = 80): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Audio not available
  }
}

export function playSuccessSound(): void {
  playBeep(880, 100);
  setTimeout(() => playBeep(1100, 100), 90);
  setTimeout(() => playBeep(1320, 150), 180);
}

export function playErrorSound(): void {
  playBeep(300, 200);
  setTimeout(() => playBeep(200, 250), 210);
}

export function exportCSV(filename: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  });
}
