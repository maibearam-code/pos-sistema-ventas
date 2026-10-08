import type { ReactNode } from 'react';
import { useSession } from './SessionContext';

interface ProtectedRouteProps {
  recurso: string;
  accion: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ recurso, accion, children, fallback }: ProtectedRouteProps) {
  const { tienePermiso } = useSession();

  if (!tienePermiso(recurso, accion)) {
    return (
      <>
        {fallback ?? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
            <p className="text-lg font-semibold">No tiene permisos para acceder a esta seccion</p>
            <p className="text-sm mt-1">Contacte al administrador</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
