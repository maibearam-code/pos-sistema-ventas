import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { formatPYG, formatPYGPlain, formatFecha, formatFechaCorta, exportCSV, playBeep } from '@/utils';
import { imprimirTicket58mm } from '@/utils/printer';
import { registrarAccion } from '@/modules/seguridad';
import { NEGOCIO } from '@/data/seed';
import type { MedioPago } from '@/types';
import { BarChart3, ArrowLeft, Calendar, TrendingUp, Package, DollarSign, Printer, Wallet } from 'lucide-react';

type ReporteTab = 'dia' | 'productos' | 'cierre' | 'inventario';

export function ReportesScreen() {
  const { ventas, productos, caja, usuarioActual, addCajaMovimiento, setPage } = useApp();
  const [tab, setTab] = useState<ReporteTab>('dia');
  const [fechaSel, setFechaSel] = useState(new Date().toISOString().slice(0, 10));
  const [conteoEfectivo, setConteoEfectivo] = useState('');
  const [cierreResult, setCierreResult] = useState<{ diferencia: number; esperado: number; contado: number } | null>(null);

  const ventasDia = useMemo(() => {
    return ventas.filter(v => v.fecha.startsWith(fechaSel) && v.estado !== 'anulada');
  }, [ventas, fechaSel]);

  const totalesDia = useMemo(() => {
    const total = ventasDia.reduce((s, v) => s + v.total, 0);
    const iva5 = ventasDia.reduce((s, v) => s + v.iva5, 0);
    const iva10 = ventasDia.reduce((s, v) => s + v.iva10, 0);
    const subtotal = ventasDia.reduce((s, v) => s + v.subtotal, 0);
    const porMedio: Record<MedioPago, number> = { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 };
    ventasDia.forEach(v => { porMedio[v.medioPago] += v.total; });
    const credito = ventasDia.filter(v => v.estado === 'credito').reduce((s, v) => s + (v.saldoPendiente || 0), 0);
    return { total, iva5, iva10, subtotal, porMedio, cantidad: ventasDia.length, credito };
  }, [ventasDia]);

  const topProductos = useMemo(() => {
    const conteo: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    ventasDia.forEach(v => {
      v.items.forEach(item => {
        if (!conteo[item.productoId]) {
          conteo[item.productoId] = { nombre: item.nombre, cantidad: 0, total: 0 };
        }
        conteo[item.productoId].cantidad += item.cantidad;
        conteo[item.productoId].total += item.subtotal;
      });
    });
    return Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad).slice(0, 15);
  }, [ventasDia]);

  const inventarioValorizado = useMemo(() => {
    const total = productos.reduce((s, p) => s + p.stock * p.precioCompra, 0);
    const totalVenta = productos.reduce((s, p) => s + p.stock * p.precioVenta, 0);
    const bajoStock = productos.filter(p => p.stock <= p.stockMinimo);
    const sinStock = productos.filter(p => p.stock <= 0);
    return { total, totalVenta, bajoStock, sinStock };
  }, [productos]);

  const cajaHoy = useMemo(() => {
    return caja.filter(c => c.fecha.startsWith(fechaSel));
  }, [caja, fechaSel]);

  const efectivoEsperado = useMemo(() => {
    const apertura = cajaHoy.filter(c => c.tipo === 'apertura').reduce((s, c) => s + c.monto, 0);
    const ingresos = cajaHoy.filter(c => c.tipo === 'ingreso').reduce((s, c) => s + c.monto, 0);
    const egresos = cajaHoy.filter(c => c.tipo === 'egreso').reduce((s, c) => s + c.monto, 0);
    const ventasEfectivo = ventasDia.filter(v => v.medioPago === 'efectivo').reduce((s, v) => s + v.total, 0);
    return apertura + ingresos + ventasEfectivo - egresos;
  }, [cajaHoy, ventasDia]);

  const handleCierre = () => {
    const contado = parseInt(conteoEfectivo) || 0;
    const diferencia = contado - efectivoEsperado;
    setCierreResult({ diferencia, esperado: efectivoEsperado, contado });
    if (usuarioActual) {
      addCajaMovimiento({
        fecha: new Date().toISOString(),
        tipo: 'cierre',
        monto: contado,
        concepto: `Cierre de caja. Esperado: ${formatPYGPlain(efectivoEsperado)}`,
        usuarioId: usuarioActual.id,
      });
      try {
        registrarAccion({
          usuarioId: usuarioActual.id,
          usuarioNombre: usuarioActual.nombre,
          rol: usuarioActual.rol as 'admin' | 'supervisor' | 'cajero',
          accion: 'CAJA_CERRADA',
          recurso: 'caja',
          detalle: { esperado: efectivoEsperado, contado, diferencia },
          criticidad: 'media',
        });
      } catch (err) {
        console.error('[Auditoria] Error registrando cierre:', err);
      }
    }
    playBeep(1000, 100);
  };

  const imprimirResumen = () => {
    const body = `
      <div class="ticket-print" style="width:58mm;font-family:'Courier New',monospace;font-size:11px;color:#000;padding:2mm">
        <div style="text-align:center"><p style="font-weight:bold;font-size:13px">${NEGOCIO.nombre}</p><p>RUC: ${NEGOCIO.ruc}</p></div>
        <div style="border-top:1px dashed #000;margin:2px 0"></div>
        <p style="text-align:center;font-weight:bold">RESUMEN DEL DIA</p>
        <p>Fecha: ${formatFechaCorta(fechaSel)}</p>
        <p>Cajero: ${usuarioActual?.nombre}</p>
        <div style="border-top:1px dashed #000;margin:2px 0"></div>
        <div style="display:flex;justify-content:space-between"><span>Tickets:</span><span>${totalesDia.cantidad}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>Gs. ${formatPYGPlain(totalesDia.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>IVA 5%:</span><span>Gs. ${formatPYGPlain(totalesDia.iva5)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>IVA 10%:</span><span>Gs. ${formatPYGPlain(totalesDia.iva10)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Credito:</span><span>Gs. ${formatPYGPlain(totalesDia.credito)}</span></div>
        <div style="border-top:1px dashed #000;margin:2px 0"></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:13px"><span>TOTAL:</span><span>Gs. ${formatPYGPlain(totalesDia.total)}</span></div>
        <div style="border-top:1px dashed #000;margin:2px 0"></div>
        <p style="font-weight:bold">Por medio de pago:</p>
        <div style="display:flex;justify-content:space-between"><span>Efectivo:</span><span>Gs. ${formatPYGPlain(totalesDia.porMedio.efectivo)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Tarjeta:</span><span>Gs. ${formatPYGPlain(totalesDia.porMedio.tarjeta)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Transf.:</span><span>Gs. ${formatPYGPlain(totalesDia.porMedio.transferencia)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Mixto:</span><span>Gs. ${formatPYGPlain(totalesDia.porMedio.mixto)}</span></div>
        ${cierreResult ? `<div style="border-top:1px dashed #000;margin:2px 0"></div><p style="font-weight:bold">Cierre de caja:</p>
        <div style="display:flex;justify-content:space-between"><span>Esperado:</span><span>Gs. ${formatPYGPlain(cierreResult.esperado)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Contado:</span><span>Gs. ${formatPYGPlain(cierreResult.contado)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold"><span>Diferencia:</span><span>Gs. ${formatPYGPlain(cierreResult.diferencia)}</span></div>` : ''}
        <div style="border-top:1px dashed #000;margin:2px 0"></div>
        <p style="text-align:center">Fin del reporte</p>
      </div>`;
    imprimirTicket58mm(body, 'Resumen del dia');
  };

  const tabs: { key: ReporteTab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'dia', label: 'Ventas del día', icon: DollarSign },
    { key: 'productos', label: 'Más vendidos', icon: TrendingUp },
    { key: 'cierre', label: 'Cierre de caja', icon: Wallet },
    { key: 'inventario', label: 'Inventario valorizado', icon: Package },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <button onClick={() => setPage('pos')} className="p-2 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 size={22} /> Reportes
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <input type="date" value={fechaSel} onChange={e => setFechaSel(e.target.value)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm focus:outline-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold ${tab === t.key ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'dia' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase">Tickets</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalesDia.cantidad}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl shadow-sm p-4 border border-emerald-200">
                <p className="text-xs text-emerald-600 uppercase">Total ventas</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatPYG(totalesDia.total)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase">IVA 5% + 10%</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{formatPYG(totalesDia.iva5 + totalesDia.iva10)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl shadow-sm p-4 border border-orange-200">
                <p className="text-xs text-orange-600 uppercase">A crédito</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{formatPYG(totalesDia.credito)}</p>
              </div>
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-bold text-gray-800 mb-3">Medios de pago</h3>
              <div className="space-y-2">
                {(['efectivo', 'tarjeta', 'transferencia', 'mixto'] as MedioPago[]).map(mp => (
                  <div key={mp} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{mp}</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalesDia.total > 0 ? (totalesDia.porMedio[mp] / totalesDia.total) * 100 : 0}%` }} />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm w-32 text-right">{formatPYG(totalesDia.porMedio[mp])}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Detalle de ventas</h3>
                <div className="flex gap-2">
                  <button onClick={imprimirResumen} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500">
                    <Printer size={14} /> Imprimir resumen
                  </button>
                  <button onClick={() => exportCSV(`ventas_${fechaSel}.csv`, ['Fecha', 'Cliente', 'Items', 'Total', 'Medio', 'Estado'], ventasDia.map(v => [formatFecha(v.fecha), v.clienteNombre || 'Consumidor Final', String(v.items.length), formatPYGPlain(v.total), v.medioPago, v.estado]))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300">
                    Exportar
                  </button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-center">Items</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-center">Pago</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasDia.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500">{formatFecha(v.fecha)}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{v.clienteNombre || 'Consumidor Final'}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{v.items.length}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-600">{formatPYGPlain(v.total)}</td>
                      <td className="px-4 py-2 text-center text-gray-500 capitalize">{v.medioPago}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${v.estado === 'credito' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{v.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ventasDia.length === 0 && <div className="text-center py-8 text-gray-400">Sin ventas en esta fecha</div>}
            </div>
          </div>
        )}

        {tab === 'productos' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="px-4 py-3 font-bold text-gray-800 border-b border-gray-100">Productos más vendidos - {formatFechaCorta(fechaSel)}</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2 text-right">Total vendido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProductos.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center font-bold text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-800">{p.cantidad}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-600">{formatPYG(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topProductos.length === 0 && <div className="text-center py-8 text-gray-400">Sin ventas en esta fecha</div>}
          </div>
        )}

        {tab === 'cierre' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">Cierre de caja - {formatFechaCorta(fechaSel)}</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-emerald-50">
                  <span className="text-gray-700">Ventas en efectivo</span>
                  <span className="font-bold text-emerald-700">{formatPYG(ventasDia.filter(v => v.medioPago === 'efectivo').reduce((s, v) => s + v.total, 0))}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700">Apertura + ingresos - egresos</span>
                  <span className="font-bold text-gray-700">{formatPYG(cajaHoy.filter(c => c.tipo !== 'cierre').reduce((s, c) => s + (c.tipo === 'egreso' ? -c.monto : c.monto), 0))}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-blue-800 font-semibold">Efectivo esperado en caja</span>
                  <span className="font-bold text-blue-900 text-lg">{formatPYG(efectivoEsperado)}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Conteo de efectivo (Gs.)</label>
                <input
                  type="number"
                  value={conteoEfectivo}
                  onChange={e => setConteoEfectivo(e.target.value)}
                  placeholder="0"
                  className="w-full text-2xl font-bold text-right p-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {cierreResult && (
                <div className={`mt-4 p-4 rounded-xl ${cierreResult.diferencia === 0 ? 'bg-emerald-50 border border-emerald-200' : cierreResult.diferencia > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Esperado</span>
                    <span className="font-bold">{formatPYG(cierreResult.esperado)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Contado</span>
                    <span className="font-bold">{formatPYG(cierreResult.contado)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold">Diferencia</span>
                    <span className={`font-bold text-lg ${cierreResult.diferencia === 0 ? 'text-emerald-700' : cierreResult.diferencia > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {cierreResult.diferencia > 0 ? '+' : ''}{formatPYG(cierreResult.diferencia)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={imprimirResumen} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 min-h-[48px] flex items-center justify-center gap-2">
                  <Printer size={18} /> Imprimir
                </button>
                <button onClick={handleCierre} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 min-h-[48px]">
                  Realizar cierre
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'inventario' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase">Productos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{productos.length}</p>
              </div>
              <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase">Valor costo</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{formatPYG(inventarioValorizado.total)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl shadow-sm p-4 border border-emerald-200">
                <p className="text-xs text-emerald-600 uppercase">Valor venta</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatPYG(inventarioValorizado.totalVenta)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl shadow-sm p-4 border border-amber-200">
                <p className="text-xs text-amber-600 uppercase">Stock bajo/sin stock</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{inventarioValorizado.bajoStock.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Inventario valorizado</h3>
                <button onClick={() => exportCSV('inventario_valorizado.csv', ['Código', 'Nombre', 'Stock', 'P. Compra', 'Valor costo', 'P. Venta', 'Valor venta'], productos.map(p => [p.codigo, p.nombre, String(p.stock), formatPYGPlain(p.precioCompra), formatPYGPlain(p.stock * p.precioCompra), formatPYGPlain(p.precioVenta), formatPYGPlain(p.stock * p.precioVenta)]))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300">
                  Exportar
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-center">Stock</th>
                    <th className="px-4 py-2 text-right">Costo unit.</th>
                    <th className="px-4 py-2 text-right">Valor costo</th>
                    <th className="px-4 py-2 text-right">Valor venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{p.codigo}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock <= p.stockMinimo ? 'bg-amber-100 text-amber-700' : 'text-gray-600'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatPYGPlain(p.precioCompra)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-blue-600">{formatPYGPlain(p.stock * p.precioCompra)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-emerald-600">{formatPYGPlain(p.stock * p.precioVenta)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">TOTAL</td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatPYG(inventarioValorizado.total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatPYG(inventarioValorizado.totalVenta)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
