export { SessionProvider, useSession } from './SessionContext';
export { ProtectedRoute } from './components/ProtectedRoute';
export { RegistroAuditoriaScreen } from './components/RegistroAuditoria';
export { MATRIZ_PERMISOS, tienePermiso } from './permisos';
export { registrarAccion, obtenerRegistros, exportarCSVAuditoria, descargarCSVAuditoria } from './auditoria';
export type { Rol, UsuarioSeguridad, Permiso, RegistroAuditoria, Criticidad } from './types';
