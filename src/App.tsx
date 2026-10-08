import { useApp } from '@/context/AppContext';
import { LoginScreen } from '@/components/LoginScreen';
import { POSScreen } from '@/components/POSScreen';
import { InventarioScreen } from '@/components/InventarioScreen';
import { ComprasScreen } from '@/components/ComprasScreen';
import { ClientesScreen } from '@/components/ClientesScreen';
import { ReportesScreen } from '@/components/ReportesScreen';
import { SessionProvider, useSession, RegistroAuditoriaScreen } from '@/modules/seguridad';
import { AlertTriangle } from 'lucide-react';

function AutoLogoutWarning() {
  const { mostrarAvisoLogout, inactividadSegundos, renovarSesion } = useSession();
  if (!mostrarAvisoLogout) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg animate-fade-in">
      <AlertTriangle size={24} />
      <span className="font-semibold">
        Sesion cerrando por inactividad en {inactividadSegundos}s...
      </span>
      <button
        onClick={renovarSesion}
        className="ml-2 px-4 py-1 rounded-lg bg-white text-red-600 font-bold text-sm hover:bg-red-50"
      >
        Continuar
      </button>
    </div>
  );
}

function AppContent() {
  const { usuarioActual, page, setPage } = useApp();
  const { login, logout, tienePermiso } = useSession();

  if (!usuarioActual) {
    return <LoginScreen onLogin={login} />;
  }

  if (page === 'auditoria') {
    if (!tienePermiso('auditoria', 'ver')) {
      setPage('pos');
      return <POSScreen />;
    }
    return <RegistroAuditoriaScreen onBack={() => setPage('pos')} />;
  }

  if (page === 'inventario' && !tienePermiso('inventario', 'ver')) {
    setPage('pos');
    return <POSScreen />;
  }
  if (page === 'compras' && !tienePermiso('compras', 'ver')) {
    setPage('pos');
    return <POSScreen />;
  }
  if (page === 'reportes' && !tienePermiso('reportes', 'ver')) {
    setPage('pos');
    return <POSScreen />;
  }

  switch (page) {
    case 'pos':
      return <POSScreen onSessionLogout={logout} />;
    case 'inventario':
      return <InventarioScreen />;
    case 'compras':
      return <ComprasScreen />;
    case 'clientes':
      return <ClientesScreen />;
    case 'reportes':
      return <ReportesScreen />;
    default:
      return <POSScreen onSessionLogout={logout} />;
  }
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
      <AutoLogoutWarning />
    </SessionProvider>
  );
}

export default App;
