import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Rol, UsuarioSeguridad } from './types';
import { tienePermiso as verificarPermiso } from './permisos';
import { registrarAccion } from './auditoria';
import type { Usuario } from '@/types';

interface SessionContextType {
  usuario: UsuarioSeguridad | null;
  rol: Rol | null;
  login: (usuario: Usuario) => void;
  logout: () => void;
  tienePermiso: (recurso: string, accion: string) => boolean;
  inactividadSegundos: number;
  mostrarAvisoLogout: boolean;
  renovarSesion: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000;
const AVISO_PREVIO_MS = 30 * 1000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSeguridad | null>(null);
  const [mostrarAvisoLogout, setMostrarAvisoLogout] = useState(false);
  const [inactividadSegundos, setInactividadSegundos] = useState(TIEMPO_INACTIVIDAD_MS / 1000);
  const ultimaActividadRef = useRef<number>(Date.now());

  const renovarSesion = useCallback(() => {
    ultimaActividadRef.current = Date.now();
    setMostrarAvisoLogout(false);
    setInactividadSegundos(TIEMPO_INACTIVIDAD_MS / 1000);
  }, []);

  const login = useCallback((user: Usuario) => {
    const userSeg: UsuarioSeguridad = {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol as Rol,
      pin: user.pin,
      activo: true,
      fechaCreacion: new Date().toISOString(),
    };
    setUsuario(userSeg);
    ultimaActividadRef.current = Date.now();
    try {
      registrarAccion({
        usuarioId: userSeg.id,
        usuarioNombre: userSeg.nombre,
        rol: userSeg.rol,
        accion: 'LOGIN',
        recurso: 'sesion',
        criticidad: 'media',
      });
    } catch (err) {
      console.error('[Session] Error registrando login:', err);
    }
  }, []);

  const logout = useCallback(() => {
    if (usuario) {
      try {
        registrarAccion({
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre,
          rol: usuario.rol,
          accion: 'LOGOUT',
          recurso: 'sesion',
          criticidad: 'baja',
        });
      } catch (err) {
        console.error('[Session] Error registrando logout:', err);
      }
    }
    setUsuario(null);
    setMostrarAvisoLogout(false);
  }, [usuario]);

  const tienePermiso = useCallback(
    (recurso: string, accion: string): boolean => {
      if (!usuario) return false;
      return verificarPermiso(usuario.rol, recurso, accion);
    },
    [usuario]
  );

  useEffect(() => {
    if (!usuario) return;

    const eventos = ['mousedown', 'keydown', 'touchstart', 'mousemove'];

    const onActividad = () => {
      ultimaActividadRef.current = Date.now();
      setMostrarAvisoLogout(false);
    };

    eventos.forEach((e) => window.addEventListener(e, onActividad, { passive: true }));

    const intervalo = setInterval(() => {
      const transcurrido = Date.now() - ultimaActividadRef.current;
      const restante = TIEMPO_INACTIVIDAD_MS - transcurrido;

      if (restante <= 0) {
        logout();
      } else if (restante <= AVISO_PREVIO_MS) {
        setMostrarAvisoLogout(true);
        setInactividadSegundos(Math.ceil(restante / 1000));
      } else {
        setMostrarAvisoLogout(false);
      }
    }, 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, onActividad));
      clearInterval(intervalo);
    };
  }, [usuario, logout]);

  const value: SessionContextType = {
    usuario,
    rol: usuario?.rol ?? null,
    login,
    logout,
    tienePermiso,
    inactividadSegundos,
    mostrarAvisoLogout,
    renovarSesion,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
