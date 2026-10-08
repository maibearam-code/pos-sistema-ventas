import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Cliente } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatPYG, formatPYGPlain, formatFecha, playBeep } from '@/utils';
import { Plus, Edit2, Trash2, Search, Users, ArrowLeft, History, Wallet } from 'lucide-react';

export function ClientesScreen() {
  const { clientes, ventas, addCliente, updateCliente, deleteCliente, setPage } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [historialCliente, setHistorialCliente] = useState<Cliente | null>(null);

  const filtrados = clientes.filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || (c.ruc || '').includes(busqueda) || c.telefono.includes(busqueda);
  });

  const ventasCliente = historialCliente
    ? ventas.filter(v => v.clienteId === historialCliente.id)
    : [];

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <button onClick={() => setPage('pos')} className="p-2 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Users size={22} /> Clientes
        </h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="px-4 py-3 shrink-0 bg-white border-b border-gray-200">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, RUC o teléfono..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">RUC</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.ruc || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.telefono || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.saldo > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs">
                        <Wallet size={12} /> {formatPYGPlain(c.saldo)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin deuda</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setHistorialCliente(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Historial">
                        <History size={16} />
                      </button>
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
                        <Edit2 size={16} />
                      </button>
                      {c.id !== 'c0' && (
                        <button onClick={() => { if (confirm(`¿Eliminar ${c.nombre}?`)) deleteCliente(c.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} />
              <p className="mt-2">No hay clientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <ClienteForm
          cliente={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateCliente(editing.id, data);
            else addCliente({ ...data, saldo: 0 });
            setShowForm(false);
            setEditing(null);
            playBeep(900, 80);
          }}
        />
      )}

      {/* Historial */}
      <Modal open={!!historialCliente} onClose={() => setHistorialCliente(null)} title={`Historial - ${historialCliente?.nombre || ''}`} size="lg">
        {historialCliente && (
          <div className="space-y-4">
            {historialCliente.saldo > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                <span className="text-orange-800 font-semibold flex items-center gap-2">
                  <Wallet size={20} /> Saldo pendiente
                </span>
                <span className="text-2xl font-bold text-orange-900">{formatPYG(historialCliente.saldo)}</span>
              </div>
            )}
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-center">Items</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-center">Pago</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasCliente.map(v => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatFecha(v.fecha)}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{v.items.length}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">{formatPYGPlain(v.total)}</td>
                      <td className="px-3 py-2 text-center text-gray-500 capitalize">{v.medioPago}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          v.estado === 'credito' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{v.estado}</span>
                      </td>
                    </tr>
                  ))}
                  {ventasCliente.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin compras registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ClienteForm({ cliente, onClose, onSave }: {
  cliente: Cliente | null;
  onClose: () => void;
  onSave: (data: Omit<Cliente, 'id' | 'saldo'>) => void;
}) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [ruc, setRuc] = useState(cliente?.ruc || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [email, setEmail] = useState(cliente?.email || '');

  return (
    <Modal open={true} onClose={onClose} title={cliente ? 'Editar cliente' : 'Nuevo cliente'} size="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre / Razón social</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">RUC <span className="text-xs text-gray-400">(opcional)</span></label>
            <input value={ruc} onChange={e => setRuc(e.target.value)} placeholder="1234567-8" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none font-mono" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Teléfono</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 min-h-[48px]">Cancelar</button>
          <button onClick={() => { if (nombre) onSave({ nombre, ruc, telefono, email }); }} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 min-h-[48px]">Guardar</button>
        </div>
      </div>
    </Modal>
  );
}
