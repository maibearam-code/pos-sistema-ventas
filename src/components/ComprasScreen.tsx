import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Proveedor, Compra } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatPYG, formatPYGPlain, formatFecha, genId, playBeep, playErrorSound } from '@/utils';
import { Plus, Edit2, Trash2, Search, Truck, ArrowLeft, X, Check } from 'lucide-react';

export function ComprasScreen() {
  const { proveedores, productos, compras, addProveedor, updateProveedor, deleteProveedor, addCompra, usuarioActual, setPage } = useApp();
  const [tab, setTab] = useState<'compras' | 'proveedores'>('compras');
  const [busqueda, setBusqueda] = useState('');
  const [showProvForm, setShowProvForm] = useState(false);
  const [editingProv, setEditingProv] = useState<Proveedor | null>(null);
  const [showNuevaCompra, setShowNuevaCompra] = useState(false);
  const [filtroProv, setFiltroProv] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');

  const comprasFiltradas = compras.filter(c => {
    if (filtroProv !== 'todos' && c.proveedorId !== filtroProv) return false;
    if (filtroFecha && !c.fecha.startsWith(filtroFecha)) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return c.proveedorNombre.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <button onClick={() => setPage('pos')} className="p-2 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Truck size={22} /> Compras
        </h1>
        <div className="ml-auto flex gap-2">
          {tab === 'compras' ? (
            <button onClick={() => setShowNuevaCompra(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">
              <Plus size={16} /> Nueva compra
            </button>
          ) : (
            <button onClick={() => { setEditingProv(null); setShowProvForm(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">
              <Plus size={16} /> Nuevo proveedor
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        <button onClick={() => setTab('compras')} className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${tab === 'compras' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
          Historial de compras
        </button>
        <button onClick={() => setTab('proveedores')} className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${tab === 'proveedores' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
          Proveedores
        </button>
      </div>

      {tab === 'compras' ? (
        <>
          <div className="px-4 py-3 flex gap-3 shrink-0 bg-white border-b border-gray-200">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por proveedor..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm" />
            </div>
            <select value={filtroProv} onChange={e => setFiltroProv(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm">
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm" />
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comprasFiltradas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{formatFecha(c.fecha)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.proveedorNombre}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{c.items.length}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatPYG(c.total)}</td>
                      <td className="px-4 py-3 text-gray-500">{c.usuarioNombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comprasFiltradas.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Truck size={40} />
                  <p className="mt-2">No hay compras registradas</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">RUC</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proveedores.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.ruc}</td>
                    <td className="px-4 py-3 text-gray-500">{p.telefono}</td>
                    <td className="px-4 py-3 text-gray-500">{p.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingProv(p); setShowProvForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) deleteProveedor(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {proveedores.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Truck size={40} />
                <p className="mt-2">No hay proveedores</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proveedor Form */}
      {showProvForm && (
        <ProveedorForm
          proveedor={editingProv}
          onClose={() => { setShowProvForm(false); setEditingProv(null); }}
          onSave={(data) => {
            if (editingProv) updateProveedor(editingProv.id, data);
            else addProveedor(data);
            setShowProvForm(false);
            setEditingProv(null);
            playBeep(900, 80);
          }}
        />
      )}

      {/* Nueva Compra */}
      {showNuevaCompra && (
        <NuevaCompraModal
          onClose={() => setShowNuevaCompra(false)}
          onComplete={(compra) => {
            addCompra(compra);
            setShowNuevaCompra(false);
            playBeep(1000, 100);
          }}
        />
      )}
    </div>
  );
}

function ProveedorForm({ proveedor, onClose, onSave }: {
  proveedor: Proveedor | null;
  onClose: () => void;
  onSave: (data: Omit<Proveedor, 'id'>) => void;
}) {
  const [nombre, setNombre] = useState(proveedor?.nombre || '');
  const [ruc, setRuc] = useState(proveedor?.ruc || '');
  const [telefono, setTelefono] = useState(proveedor?.telefono || '');
  const [email, setEmail] = useState(proveedor?.email || '');
  const [direccion, setDireccion] = useState(proveedor?.direccion || '');

  return (
    <Modal open={true} onClose={onClose} title={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">RUC</label>
            <input value={ruc} onChange={e => setRuc(e.target.value)} placeholder="80012345-6" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Teléfono</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Dirección</label>
          <input value={direccion} onChange={e => setDireccion(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 min-h-[48px]">Cancelar</button>
          <button onClick={() => { if (nombre) onSave({ nombre, ruc, telefono, email, direccion }); }} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 min-h-[48px]">Guardar</button>
        </div>
      </div>
    </Modal>
  );
}

function NuevaCompraModal({ onClose, onComplete }: {
  onClose: () => void;
  onComplete: (compra: Compra) => void;
}) {
  const { proveedores, productos, usuarioActual } = useApp();
  const [proveedorId, setProveedorId] = useState(proveedores[0]?.id || '');
  const [items, setItems] = useState<{ productoId: string; nombre: string; cantidad: number; costoUnitario: number; subtotal: number }[]>([]);
  const [productoSel, setProductoSel] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [costo, setCosto] = useState('');

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const agregarItem = () => {
    const prod = productos.find(p => p.id === productoSel);
    if (!prod || !cantidad) return;
    const cant = parseInt(cantidad) || 0;
    const costoVal = parseInt(costo) || prod.precioCompra;
    if (cant <= 0) return;
    setItems(prev => {
      const existing = prev.find(i => i.productoId === productoSel);
      if (existing) {
        return prev.map(i => i.productoId === productoSel ? { ...i, cantidad: i.cantidad + cant, subtotal: (i.cantidad + cant) * costoVal } : i);
      }
      return [...prev, { productoId: prod.id, nombre: prod.nombre, cantidad: cant, costoUnitario: costoVal, subtotal: cant * costoVal }];
    });
    setProductoSel('');
    setCantidad('1');
    setCosto('');
    playBeep(800, 60);
  };

  const quitarItem = (productoId: string) => {
    setItems(prev => prev.filter(i => i.productoId !== productoId));
  };

  const handleConfirm = () => {
    if (items.length === 0 || !usuarioActual) {
      playErrorSound();
      return;
    }
    const prov = proveedores.find(p => p.id === proveedorId);
    const compra: Compra = {
      id: genId('comp'),
      fecha: new Date().toISOString(),
      proveedorId,
      proveedorNombre: prov?.nombre || '',
      items,
      total,
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre,
    };
    onComplete(compra);
  };

  return (
    <Modal open={true} onClose={onClose} title="Registrar compra" size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Proveedor</label>
          <select value={proveedorId} onChange={e => setProveedorId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none">
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} - {p.ruc}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Agregar producto</p>
          <div className="grid grid-cols-12 gap-2">
            <select value={productoSel} onChange={e => setProductoSel(e.target.value)} className="col-span-5 px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm">
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
            </select>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cant." className="col-span-2 px-2 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm text-center" />
            <input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="Costo unit." className="col-span-3 px-2 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm text-right" />
            <button onClick={agregarItem} disabled={!productoSel} className="col-span-2 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center gap-1">
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">Costo unit.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(i => (
                  <tr key={i.productoId}>
                    <td className="px-3 py-2 font-medium text-gray-800">{i.nombre}</td>
                    <td className="px-3 py-2 text-right">{i.cantidad}</td>
                    <td className="px-3 py-2 text-right">{formatPYGPlain(i.costoUnitario)}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatPYGPlain(i.subtotal)}</td>
                    <td className="px-3 py-2"><button onClick={() => quitarItem(i.productoId)} className="text-red-400 hover:text-red-600"><X size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-lg font-bold text-gray-800">Total compra</span>
          <span className="text-2xl font-bold text-emerald-600">{formatPYG(total)}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 min-h-[48px]">Cancelar</button>
          <button onClick={handleConfirm} disabled={items.length === 0} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 min-h-[48px] disabled:opacity-40 flex items-center justify-center gap-2">
            <Check size={20} /> Confirmar compra
          </button>
        </div>
      </div>
    </Modal>
  );
}
