import { useState, useMemo } from 'react';
import { useSession } from '../SessionContext';
import { obtenerRegistros, descargarCSVAuditoria } from '../auditoria';
import type { RegistroAuditoria, Criticidad } from '../types';
import { ArrowLeft, Download, Shield, Filter } from 'lucide-react';
import { formatFecha } from '@/utils';

interface RegistroAuditoriaScreenProps {
  onBack: () => void;
}

const coloresCriticidad: Record<Criticidad, string> = {
  baja: 'bg-green-100 text-green-700 border-green-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  critica: 'bg-red-100 text-red-700 border-red-200',
};

export function RegistroAuditoriaScreen({ onBack }: RegistroAuditoriaScreenProps) {
  const { usuario } = useSession();
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroCriticidad, setFiltroCriticidad] = useState('');
  const [limite, setLimite] = useState(200);

  const registros = useMemo<RegistroAuditoria[]>(() => {
    return obtenerRegistros({
      hasta: filtroFecha || undefined,
      accion: filtroAccion || undefined,
      criticidad: filtroCriticidad || undefined,
    }).slice(0, limite);
  }, [filtroFecha, filtroAccion, filtroCriticidad, limite]);

  const accionesUnicas = useMemo(() => {
    const todas = obtenerRegistros();
    return Array.from(new Set(todas.map((r) => r.accion))).sort();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Shield size={22} /> Auditoria
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => descargarCSVAuditoria(registros)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <Filter size={18} className="text-gray-400" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Fecha:</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Accion:</label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas</option>
            {accionesUnicas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Criticidad:</label>
          <select
            value={filtroCriticidad}
            onChange={(e) => setFiltroCriticidad(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Critica</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Mostrar:</label>
          <select
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
        <span className="text-sm text-gray-500 ml-auto">{registros.length} registros</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-left">Accion</th>
              <th className="px-4 py-2 text-left">Recurso</th>
              <th className="px-4 py-2 text-center">Criticidad</th>
              <th className="px-4 py-2 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registros.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No hay registros de auditoria
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{r.usuarioNombre}</td>
                  <td className="px-4 py-2 text-gray-500 capitalize">{r.rol}</td>
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-gray-700">{r.accion}</td>
                  <td className="px-4 py-2 text-gray-500">{r.recurso}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${coloresCriticidad[r.criticidad]}`}>
                      {r.criticidad}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-400 max-w-xs truncate">
                    {Object.keys(r.detalle).length > 0 ? JSON.stringify(r.detalle) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800 text-white text-xs px-4 py-2 shrink-0 text-center">
        Sesion: {usuario?.nombre} ({usuario?.rol})
      </div>
    </div>
  );
}
