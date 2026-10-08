import { useState } from 'react';
import type { Venta, MedioPago, CarritoItem } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatPYG, formatPYGPlain, calcularTotalesVenta, genId, playBeep, playSuccessSound, genNumeroTicket } from '@/utils';
import { useApp } from '@/context/AppContext';
import { Banknote, CreditCard, ArrowLeftRight, Combine, Check, Printer } from 'lucide-react';
import { Ticket } from '@/components/Ticket';
import { NEGOCIO } from '@/data/seed';
import { emitirFacturaElectronica, estaHabilitado } from '@/modules/factura-electronica';
import { imprimirTicket58mm } from '@/utils/printer';
import { registrarAccion } from '@/modules/seguridad';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  carrito: CarritoItem[];
  descuento: number;
  clienteId: string;
  onComplete: () => void;
}

export function CheckoutModal({ open, onClose, carrito, descuento, clienteId, onComplete }: CheckoutModalProps) {
  const { clientes, usuarioActual, addVenta } = useApp();
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoOtros, setMontoOtros] = useState('');
  const [esCredito, setEsCredito] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<Venta | null>(null);
  const [numeroTicket, setNumeroTicket] = useState('');

  const cliente = clientes.find((c) => c.id === clienteId);
  const items = carrito.map((ci) => ({
    productoId: ci.producto.id,
    codigo: ci.producto.codigo,
    nombre: ci.producto.nombre,
    cantidad: ci.cantidad,
    precioUnitario: ci.producto.precioVenta,
    tasaIVA: ci.producto.tasaIVA,
    subtotal: ci.producto.precioVenta * ci.cantidad,
  }));
  const totales = calcularTotalesVenta(items, descuento);

  const montoRecibidoNum = parseInt(montoRecibido) || 0;
  const cambio = montoRecibidoNum - totales.total;

  const montoEfectivoNum = parseInt(montoEfectivo) || 0;
  const montoOtrosNum = parseInt(montoOtros) || 0;
  const totalMixto = montoEfectivoNum + montoOtrosNum;
  const mixtoCompleto = totalMixto >= totales.total;

  const puedeConfirmar = () => {
    if (esCredito) return true;
    if (medioPago === 'efectivo') return montoRecibidoNum >= totales.total;
    if (medioPago === 'mixto') return mixtoCompleto;
    return true;
  };

  const handleConfirmar = () => {
    if (!puedeConfirmar() || !usuarioActual) return;

    const venta: Venta = {
      id: genId('v'),
      fecha: new Date().toISOString(),
      items,
      subtotal: totales.subtotal,
      iva5: totales.iva5,
      iva10: totales.iva10,
      total: totales.total,
      descuento,
      medioPago,
      clienteId: clienteId || undefined,
      clienteNombre: cliente?.nombre,
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre,
      estado: esCredito ? 'credito' : 'completada',
      montoRecibido: medioPago === 'efectivo' ? montoRecibidoNum : medioPago === 'mixto' ? montoEfectivoNum : undefined,
      cambio: medioPago === 'efectivo' ? Math.max(0, cambio) : undefined,
      saldoPendiente: esCredito ? totales.total : undefined,
    };

    addVenta(venta);
    playSuccessSound();
    setVentaCompletada(venta);
    setNumeroTicket(genNumeroTicket());

    try {
      registrarAccion({
        usuarioId: usuarioActual.id,
        usuarioNombre: usuarioActual.nombre,
        rol: usuarioActual.rol as 'admin' | 'supervisor' | 'cajero',
        accion: 'VENTA_REALIZADA',
        recurso: 'ventas',
        recursoId: venta.id,
        detalle: { total: venta.total, medioPago: venta.medioPago, items: venta.items.length },
        criticidad: 'baja',
      });
    } catch (err) {
      console.error('[Auditoria] Error registrando venta:', err);
    }

    if (estaHabilitado()) {
      emitirFacturaElectronica(venta).catch(err => console.error('Error FE:', err));
    }
  };

  const handleImprimir = () => {
    playBeep(700, 80);
    const ticketHTML = document.getElementById('ticket-print-area')?.innerHTML || '';
    imprimirTicket58mm(ticketHTML, `Ticket ${numeroTicket}`);
  };

  const handleClose = () => {
    if (ventaCompletada) {
      onComplete();
      resetState();
    }
    onClose();
  };

  const resetState = () => {
    setMedioPago('efectivo');
    setMontoRecibido('');
    setMontoEfectivo('');
    setMontoOtros('');
    setEsCredito(false);
    setVentaCompletada(null);
    setNumeroTicket('');
  };

  if (ventaCompletada) {
    return (
      <Modal open={open} onClose={handleClose} title="Venta completada" size="sm">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">¡Venta realizada!</h3>
          <p className="text-2xl font-bold text-emerald-600 mb-4">{formatPYG(ventaCompletada.total)}</p>
          {ventaCompletada.cambio !== undefined && ventaCompletada.cambio > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-700">Cambio a devolver</p>
              <p className="text-2xl font-bold text-amber-900">{formatPYG(ventaCompletada.cambio)}</p>
            </div>
          )}
          {ventaCompletada.estado === 'credito' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-700">Venta a crédito registrada</p>
              <p className="text-xl font-bold text-orange-900">{formatPYG(ventaCompletada.saldoPendiente || 0)}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleImprimir}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 active:scale-95 transition-all min-h-[48px]"
            >
              <Printer size={22} />
              Imprimir ticket
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 active:scale-95 transition-all min-h-[48px]"
            >
              <Check size={22} />
              Nueva venta
            </button>
          </div>
        </div>
        <div className="hidden">
          <div id="ticket-print-area">
            <Ticket venta={ventaCompletada} numeroTicket={numeroTicket} />
          </div>
        </div>
      </Modal>
    );
  }

  const mediosPago: { key: MedioPago; label: string; icon: typeof Banknote }[] = [
    { key: 'efectivo', label: 'Efectivo', icon: Banknote },
    { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { key: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
    { key: 'mixto', label: 'Mixto', icon: Combine },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Cobro" size="md">
      <div className="space-y-5">
        {/* Resumen */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatPYG(totales.subtotal)}</span>
          </div>
          {totales.iva5 > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA 5%</span>
              <span>{formatPYG(totales.iva5)}</span>
            </div>
          )}
          {totales.iva10 > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA 10%</span>
              <span>{formatPYG(totales.iva10)}</span>
            </div>
          )}
          {descuento > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Descuento</span>
              <span>- {formatPYG(descuento)}</span>
            </div>
          )}
          <div className="border-t border-gray-300 my-1" />
          <div className="flex justify-between text-xl font-bold text-gray-800">
            <span>TOTAL</span>
            <span className="text-emerald-600">{formatPYG(totales.total)}</span>
          </div>
        </div>

        {/* Medio de pago */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Medio de pago</p>
          <div className="grid grid-cols-4 gap-2">
            {mediosPago.map((mp) => {
              const Icon = mp.icon;
              return (
                <button
                  key={mp.key}
                  onClick={() => {
                    playBeep(800, 50);
                    setMedioPago(mp.key);
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-h-[64px] ${
                    medioPago === mp.key
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-semibold">{mp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monto recibido - Efectivo */}
        {medioPago === 'efectivo' && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Monto recibido</label>
            <input
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              autoFocus
              placeholder="0"
              className="w-full text-3xl font-bold text-right p-4 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[10000, 50000, 100000, 200000].map((v) => (
                <button
                  key={v}
                  onClick={() => setMontoRecibido(String(v))}
                  className="py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                >
                  {formatPYGPlain(v)}
                </button>
              ))}
            </div>
            {montoRecibidoNum > 0 && (
              <div className={`mt-3 p-3 rounded-lg ${cambio >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${cambio >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {cambio >= 0 ? 'Cambio' : 'Faltante'}
                  </span>
                  <span className={`text-2xl font-bold ${cambio >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatPYG(Math.abs(cambio))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mixto */}
        {medioPago === 'mixto' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Efectivo</label>
              <input
                type="number"
                value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
                autoFocus
                placeholder="0"
                className="w-full text-xl font-bold text-right p-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tarjeta/Transferencia</label>
              <input
                type="number"
                value={montoOtros}
                onChange={(e) => setMontoOtros(e.target.value)}
                placeholder="0"
                className="w-full text-xl font-bold text-right p-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className={`p-3 rounded-lg ${mixtoCompleto ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <div className="flex justify-between">
                <span className={`text-sm ${mixtoCompleto ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Total ingresado: {formatPYG(totalMixto)}
                </span>
                <span className={`text-sm font-bold ${mixtoCompleto ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {mixtoCompleto ? 'OK' : `Falta: ${formatPYG(totales.total - totalMixto)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Crédito */}
        {cliente && cliente.id !== 'c0' && (
          <label className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200 cursor-pointer">
            <input
              type="checkbox"
              checked={esCredito}
              onChange={(e) => setEsCredito(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <span className="text-sm font-semibold text-orange-800">
              Venta a crédito - {cliente.nombre} (Saldo: {formatPYG(cliente.saldo)})
            </span>
          </label>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 active:scale-95 transition-all min-h-[56px]"
          >
            Cancelar (Esc)
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!puedeConfirmar()}
            className="flex-[2] py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 active:scale-95 transition-all min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar cobro
          </button>
        </div>
      </div>
    </Modal>
  );
}
