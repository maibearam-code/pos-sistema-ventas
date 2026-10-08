import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useSession } from '@/modules/seguridad';
import { tienePermiso as verificarPermiso, registrarAccion } from '@/modules/seguridad';
import type { CarritoItem } from '@/types';
import { formatPYG, formatPYGPlain, playBeep, playErrorSound, calcularTotalesVenta } from '@/utils';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Modal } from '@/components/ui/Modal';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, X,
  Store, Package, Users, BarChart3, LogOut, Tag, Percent,
  AlertTriangle, ScanLine, HelpCircle, Banknote, Shield
} from 'lucide-react';

interface POSScreenProps {
  onSessionLogout?: () => void;
}

export function POSScreen({ onSessionLogout }: POSScreenProps) {
  const { productos, clientes, usuarioActual, setUsuarioActual, setPage } = useApp();
  const { tienePermiso } = useSession();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [clienteId, setClienteId] = useState('c0');
  const [showCobro, setShowCobro] = useState(false);
  const [showDescuento, setShowDescuento] = useState(false);
  const [descuentoInput, setDescuentoInput] = useState('');
  const [showAyuda, setShowAyuda] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busquedaRef = useRef<HTMLInputElement>(null);

  const categorias = ['todas', ...Array.from(new Set(productos.filter(p => p.activo).map(p => p.categoria)))];
  const productosFiltrados = productos.filter(p => {
    if (!p.activo) return false;
    if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.codigo.includes(busqueda);
    }
    return true;
  });

  const items = carrito.map(ci => ({
    productoId: ci.producto.id,
    codigo: ci.producto.codigo,
    nombre: ci.producto.nombre,
    cantidad: ci.cantidad,
    precioUnitario: ci.producto.precioVenta,
    tasaIVA: ci.producto.tasaIVA,
    subtotal: ci.producto.precioVenta * ci.cantidad,
  }));
  const totales = calcularTotalesVenta(items, descuento);

  const mostrarFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  };

  const agregarAlCarrito = useCallback((productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    if (producto.stock <= 0) {
      playErrorSound();
      mostrarFeedback('Sin stock disponible');
      return;
    }
    playBeep(1000, 60);
    setCarrito(prev => {
      const existing = prev.find(ci => ci.producto.id === productoId);
      if (existing) {
        if (existing.cantidad >= producto.stock) {
          playErrorSound();
          mostrarFeedback('Stock insuficiente');
          return prev;
        }
        return prev.map(ci =>
          ci.producto.id === productoId ? { ...ci, cantidad: ci.cantidad + 1 } : ci
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }, [productos]);

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCarrito(prev => {
      const item = prev.find(ci => ci.producto.id === productoId);
      if (!item) return prev;
      const nuevaCantidad = item.cantidad + delta;
      if (nuevaCantidad <= 0) return prev.filter(ci => ci.producto.id !== productoId);
      if (nuevaCantidad > item.producto.stock) {
        playErrorSound();
        mostrarFeedback('Stock insuficiente');
        return prev;
      }
      playBeep(900, 40);
      return prev.map(ci =>
        ci.producto.id === productoId ? { ...ci, cantidad: nuevaCantidad } : ci
      );
    });
  };

  const quitarDelCarrito = (productoId: string) => {
    playBeep(400, 60);
    setCarrito(prev => prev.filter(ci => ci.producto.id !== productoId));
  };

  const cancelarVenta = () => {
    if (carrito.length === 0) return;
    if (confirm('¿Cancelar la venta actual?')) {
      setCarrito([]);
      setDescuento(0);
      playBeep(300, 100);
    }
  };

  const handleBuscarPorCodigo = () => {
    if (!busqueda) return;
    const producto = productos.find(p => p.codigo === busqueda.trim() && p.activo);
    if (producto) {
      agregarAlCarrito(producto.id);
      setBusqueda('');
      mostrarFeedback(`${producto.nombre} agregado`);
    } else {
      // Try exact name match
      const porNombre = productos.find(p => p.nombre.toLowerCase() === busqueda.trim().toLowerCase() && p.activo);
      if (porNombre) {
        agregarAlCarrito(porNombre.id);
        setBusqueda('');
        mostrarFeedback(`${porNombre.nombre} agregado`);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't interfere if typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F12') {
        e.preventDefault();
        if (carrito.length > 0 && !showCobro) setShowCobro(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        busquedaRef.current?.focus();
        busquedaRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (carrito.length > 0) {
          setShowDescuento(true);
          setDescuentoInput('');
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowAyuda(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setPage('reportes');
      } else if (e.key === 'Escape' && !showCobro && !showDescuento && !showAyuda && !isTyping) {
        cancelarVenta();
      } else if (e.key === 'Enter' && target === busquedaRef.current) {
        handleBuscarPorCodigo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [carrito, showCobro, showDescuento, showAyuda, busqueda, productos]);

  const completarVenta = () => {
    setCarrito([]);
    setDescuento(0);
    setClienteId('c0');
  };

  const aplicarDescuento = () => {
    const val = parseInt(descuentoInput) || 0;
    const totalBruto = items.reduce((s, i) => s + i.subtotal, 0);
    if (val > totalBruto) {
      playErrorSound();
      return;
    }
    const porcentaje = totalBruto > 0 ? (val / totalBruto) * 100 : 0;
    const necesitaAuth = porcentaje > 10;
    if (necesitaAuth && !tienePermiso('ventas', 'descuento_mayor_10')) {
      playErrorSound();
      mostrarFeedback('Descuento mayor a 10% requiere supervisor/admin');
      return;
    }
    setDescuento(val);
    setShowDescuento(false);
    playBeep(800, 60);
    try {
      if (usuarioActual) {
        registrarAccion({
          usuarioId: usuarioActual.id,
          usuarioNombre: usuarioActual.nombre,
          rol: usuarioActual.rol as 'admin' | 'supervisor' | 'cajero',
          accion: 'DESCUENTO_APLICADO',
          recurso: 'ventas',
          detalle: { monto: val, porcentaje: porcentaje.toFixed(1) },
          criticidad: 'alta',
        });
      }
    } catch (err) {
      console.error('[Auditoria] Error registrando descuento:', err);
    }
  };

  const rol = usuarioActual?.rol as 'admin' | 'supervisor' | 'cajero' | undefined;
  const navItems = [
    { key: 'pos' as const, label: 'Venta', icon: Store },
    { key: 'inventario' as const, label: 'Inventario', icon: Package, permiso: verificarPermiso(rol || 'cajero', 'inventario', 'ver') },
    { key: 'compras' as const, label: 'Compras', icon: Tag, permiso: verificarPermiso(rol || 'cajero', 'compras', 'ver') },
    { key: 'clientes' as const, label: 'Clientes', icon: Users, permiso: verificarPermiso(rol || 'cajero', 'clientes', 'ver') },
    { key: 'reportes' as const, label: 'Reportes', icon: BarChart3, permiso: verificarPermiso(rol || 'cajero', 'reportes', 'ver') },
    { key: 'auditoria' as const, label: 'Auditoria', icon: Shield, permiso: verificarPermiso(rol || 'cajero', 'auditoria', 'ver') },
  ].filter(item => item.permiso !== false);

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-slate-800 text-white px-4 py-2 flex items-center gap-4 shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <StoreIcon />
          <span className="hidden sm:inline">COMERCIAL ESTRELLA</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <Icon size={18} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
              {usuarioActual?.nombre.charAt(0)}
            </div>
            <span className="hidden sm:inline">{usuarioActual?.nombre}</span>
          </div>
          <button
            onClick={() => {
              if (onSessionLogout) onSessionLogout();
              setUsuarioActual(null);
            }}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            title="Cerrar sesion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Catalog (70%) */}
        <div className="flex-[7] flex flex-col overflow-hidden p-3 gap-3">
          {/* Search + Client */}
          <div className="flex gap-3 shrink-0">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={busquedaRef}
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleBuscarPorCodigo(); }}
                placeholder="Buscar por código de barras o nombre... (F2)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-base bg-white shadow-sm"
              />
            </div>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm bg-white shadow-sm min-w-[140px]"
            >
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.saldo > 0 ? ` (Saldo: ${formatPYGPlain(c.saldo)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto shrink-0 pb-1">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  categoriaFiltro === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                }`}
              >
                {cat === 'todas' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package size={48} />
                <p className="mt-2">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-3">
                {productosFiltrados.map(producto => {
                  const sinStock = producto.stock <= 0;
                  const stockBajo = producto.stock > 0 && producto.stock <= producto.stockMinimo;
                  return (
                    <button
                      key={producto.id}
                      onClick={() => agregarAlCarrito(producto.id)}
                      disabled={sinStock}
                      className={`relative flex flex-col p-3 rounded-xl border-2 text-left transition-all min-h-[120px] ${
                        sinStock
                          ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                          : stockBajo
                          ? 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md active:scale-95'
                          : 'border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md active:scale-95'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight">
                          {producto.nombre}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          producto.tasaIVA === 5 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {producto.tasaIVA}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5">{producto.codigo}</span>
                      <div className="mt-auto pt-2">
                        <p className="text-lg font-bold text-emerald-600">{formatPYG(producto.precioVenta)}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {sinStock ? (
                            <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                              <AlertTriangle size={12} /> Sin stock
                            </span>
                          ) : (
                            <span className={`text-xs font-medium ${stockBajo ? 'text-amber-600' : 'text-gray-400'}`}>
                              Stock: {producto.stock}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart (30%) */}
        <div className="flex-[3] flex flex-col bg-white border-l-2 border-gray-200 shadow-lg overflow-hidden">
          {/* Cart Header */}
          <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-bold">Carrito</span>
              <span className="text-sm text-slate-300">({carrito.length})</span>
            </div>
            {carrito.length > 0 && (
              <button onClick={cancelarVenta} className="text-xs text-slate-300 hover:text-white flex items-center gap-1">
                <Trash2 size={14} /> Vaciar
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <ScanLine size={48} />
                <p className="mt-3 text-sm text-gray-400 text-center px-4">
                  Escanee productos o haga clic en el catálogo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {carrito.map(item => (
                  <div key={item.producto.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-400">{formatPYG(item.producto.precioVenta)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-800">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="font-bold text-sm text-emerald-600">{formatPYGPlain(item.producto.precioVenta * item.cantidad)}</p>
                    </div>
                    <button
                      onClick={() => quitarDelCarrito(item.producto.id)}
                      className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals + Actions */}
          <div className="border-t-2 border-gray-200 p-3 space-y-2 shrink-0 bg-gray-50">
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Descuento</span>
                <span>- {formatPYG(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal (s/IVA)</span>
              <span>{formatPYG(totales.subtotal)}</span>
            </div>
            {totales.iva5 > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>IVA 5%</span>
                <span>{formatPYG(totales.iva5)}</span>
              </div>
            )}
            {totales.iva10 > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>IVA 10%</span>
                <span>{formatPYG(totales.iva10)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-gray-300">
              <span className="text-lg font-bold text-gray-800">TOTAL</span>
              <span className="text-2xl font-bold text-emerald-600">{formatPYG(totales.total)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => { if (carrito.length > 0) { setShowDescuento(true); setDescuentoInput(''); } }}
                disabled={carrito.length === 0}
                className="py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-40 min-h-[48px] flex flex-col items-center gap-0.5"
              >
                <Percent size={18} />
                <span className="text-[10px]">Descuento (F4)</span>
              </button>
              <button
                onClick={cancelarVenta}
                disabled={carrito.length === 0}
                className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 active:scale-95 transition-all disabled:opacity-40 min-h-[48px] flex flex-col items-center gap-0.5"
              >
                <X size={18} />
                <span className="text-[10px]">Cancelar (Esc)</span>
              </button>
              <button
                onClick={() => setShowCobro(true)}
                disabled={carrito.length === 0}
                className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-40 min-h-[48px] flex flex-col items-center gap-0.5"
              >
                <Banknote size={18} />
                <span className="text-[10px]">Cobrar (F12)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold animate-fade-in">
          {feedback}
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCobro}
        onClose={() => setShowCobro(false)}
        carrito={carrito}
        descuento={descuento}
        clienteId={clienteId}
        onComplete={completarVenta}
      />

      {/* Discount Modal */}
      <Modal open={showDescuento} onClose={() => setShowDescuento(false)} title="Aplicar descuento" size="sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total actual: {formatPYG(items.reduce((s, i) => s + i.subtotal, 0))}</p>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Monto de descuento (Gs.)</label>
            <input
              type="number"
              value={descuentoInput}
              onChange={e => setDescuentoInput(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') aplicarDescuento(); }}
              placeholder="0"
              className="w-full text-2xl font-bold text-right p-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none"
            />
          </div>
          {descuento > 0 && (
            <button
              onClick={() => { setDescuento(0); setShowDescuento(false); }}
              className="w-full py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200"
            >
              Quitar descuento actual ({formatPYG(descuento)})
            </button>
          )}
          <button
            onClick={aplicarDescuento}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-400 active:scale-95 transition-all min-h-[48px]"
          >
            Aplicar descuento
          </button>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal open={showAyuda} onClose={() => setShowAyuda(false)} title="Atajos de teclado" size="sm">
        <div className="space-y-2">
          {[
            { key: 'F1', desc: 'Ayuda' },
            { key: 'F2', desc: 'Buscar producto' },
            { key: 'F4', desc: 'Aplicar descuento' },
            { key: 'F9', desc: 'Cierre de caja / Reportes' },
            { key: 'F12', desc: 'Cobrar' },
            { key: 'Esc', desc: 'Cancelar venta / cerrar modal' },
          ].map(a => (
            <div key={a.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-gray-700">{a.desc}</span>
              <kbd className="px-3 py-1 rounded-lg bg-slate-700 text-white text-sm font-mono font-bold">{a.key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function StoreIcon() {
  return <Store size={24} className="text-emerald-400" />;
}
