import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import type { Producto, TasaIVA } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatPYG, formatPYGPlain, formatFecha, exportCSV, parseCSV, playBeep } from '@/utils';
import { Plus, Edit2, Trash2, Download, Upload, Search, Package, History, AlertTriangle, ArrowLeft } from 'lucide-react';

export function InventarioScreen() {
  const { productos, addProducto, updateProducto, deleteProducto, movimientos, setPage } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [editing, setEditing] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [kardexProducto, setKardexProducto] = useState<Producto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorias = ['todas', ...Array.from(new Set(productos.map(p => p.categoria)))];
  const filtrados = productos.filter(p => {
    if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.codigo.includes(busqueda);
    }
    return true;
  });

  const handleExport = () => {
    exportCSV('inventario.csv', 
      ['Código', 'Nombre', 'Categoría', 'Precio Compra', 'Precio Venta', 'Stock', 'Stock Mínimo', 'IVA'],
      productos.map(p => [p.codigo, p.nombre, p.categoria, String(p.precioCompra), String(p.precioVenta), String(p.stock), String(p.stockMinimo), String(p.tasaIVA)])
    );
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(reader.result as string);
      if (rows.length < 2) return;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 8) continue;
        const codigo = r[0].trim();
        const existing = productos.find(p => p.codigo === codigo);
        if (existing) {
          updateProducto(existing.id, {
            nombre: r[1].trim(),
            categoria: r[2].trim(),
            precioCompra: parseInt(r[3]) || 0,
            precioVenta: parseInt(r[4]) || 0,
            stock: parseInt(r[5]) || 0,
            stockMinimo: parseInt(r[6]) || 0,
            tasaIVA: (parseInt(r[7]) === 5 ? 5 : 10) as TasaIVA,
          });
        } else {
          addProducto({
            codigo,
            nombre: r[1].trim(),
            categoria: r[2].trim(),
            precioCompra: parseInt(r[3]) || 0,
            precioVenta: parseInt(r[4]) || 0,
            stock: parseInt(r[5]) || 0,
            stockMinimo: parseInt(r[6]) || 0,
            tasaIVA: (parseInt(r[7]) === 5 ? 5 : 10) as TasaIVA,
            activo: true,
          });
        }
      }
      playBeep(900, 80);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const kardexMovimientos = kardexProducto
    ? movimientos.filter(m => m.productoId === kardexProducto.id)
    : [];

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <button onClick={() => setPage('pos')} className="p-2 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Package size={22} /> Inventario
        </h1>
        <div className="ml-auto flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
            <Download size={16} /> Exportar
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
            <Upload size={16} /> Importar
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
          >
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-3 shrink-0 bg-white border-b border-gray-200">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-sm"
        >
          {categorias.map(c => <option key={c} value={c}>{c === 'todas' ? 'Todas las categorías' : c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-center">IVA</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(p => {
                const sinStock = p.stock <= 0;
                const stockBajo = p.stock > 0 && p.stock <= p.stockMinimo;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{p.categoria}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatPYGPlain(p.precioCompra)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatPYGPlain(p.precioVenta)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.tasaIVA === 5 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {p.tasaIVA}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs ${
                        sinStock ? 'bg-red-100 text-red-700' : stockBajo ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sinStock && <AlertTriangle size={12} />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setKardexProducto(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Kardex">
                          <History size={16} />
                        </button>
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) deleteProducto(p.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package size={40} />
              <p className="mt-2">No hay productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ProductoForm
          producto={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateProducto(editing.id, data);
            else addProducto({ ...data, activo: true });
            setShowForm(false);
            setEditing(null);
            playBeep(900, 80);
          }}
        />
      )}

      {/* Kardex Modal */}
      <Modal open={!!kardexProducto} onClose={() => setKardexProducto(null)} title={`Kardex - ${kardexProducto?.nombre || ''}`} size="lg">
        {kardexProducto && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Stock actual</p>
                <p className="text-xl font-bold text-gray-800">{kardexProducto.stock}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Stock mínimo</p>
                <p className="text-xl font-bold text-gray-800">{kardexProducto.stockMinimo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Valor stock</p>
                <p className="text-xl font-bold text-emerald-600">{formatPYGPlain(kardexProducto.stock * kardexProducto.precioCompra)}</p>
              </div>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                    <th className="px-3 py-2 text-left">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kardexMovimientos.map(m => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatFecha(m.fecha)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' :
                          m.tipo === 'salida' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{m.tipo}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-bold ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.motivo}</td>
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">{m.referencia}</td>
                    </tr>
                  ))}
                  {kardexMovimientos.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin movimientos</td></tr>
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

function ProductoForm({ producto, onClose, onSave }: {
  producto: Producto | null;
  onClose: () => void;
  onSave: (data: Omit<Producto, 'id' | 'activo'>) => void;
}) {
  const [codigo, setCodigo] = useState(producto?.codigo || '');
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [categoria, setCategoria] = useState(producto?.categoria || 'Almacén');
  const [precioCompra, setPrecioCompra] = useState(String(producto?.precioCompra || ''));
  const [precioVenta, setPrecioVenta] = useState(String(producto?.precioVenta || ''));
  const [stock, setStock] = useState(String(producto?.stock || '0'));
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stockMinimo || '5'));
  const [tasaIVA, setTasaIVA] = useState<TasaIVA>(producto?.tasaIVA || 10);

  const handleSave = () => {
    if (!codigo || !nombre) return;
    onSave({
      codigo,
      nombre,
      categoria,
      precioCompra: parseInt(precioCompra) || 0,
      precioVenta: parseInt(precioVenta) || 0,
      stock: parseInt(stock) || 0,
      stockMinimo: parseInt(stockMinimo) || 0,
      tasaIVA,
    });
  };

  return (
    <Modal open={true} onClose={onClose} title={producto ? 'Editar producto' : 'Nuevo producto'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Código de barras</label>
            <input value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" placeholder="7790000000000" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Categoría</label>
            <input value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none" placeholder="Nombre del producto" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Precio compra (Gs.)</label>
            <input type="number" value={precioCompra} onChange={e => setPrecioCompra(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-right" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Precio venta (Gs.) <span className="text-xs text-gray-400">(con IVA)</span></label>
            <input type="number" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-right" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Stock</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-right" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Stock mín.</label>
            <input type="number" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none text-right" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Tasa IVA</label>
            <select value={tasaIVA} onChange={e => setTasaIVA(Number(e.target.value) as TasaIVA)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:outline-none">
              <option value={5}>5% (Canasta)</option>
              <option value={10}>10% (General)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 min-h-[48px]">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 min-h-[48px]">Guardar</button>
        </div>
      </div>
    </Modal>
  );
}
