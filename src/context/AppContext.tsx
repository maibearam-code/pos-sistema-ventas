import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Producto, Cliente, Proveedor, Usuario, Venta, Movimiento, Compra, CajaMovimiento } from '@/types';
import { db, initDB } from '@/data/db';
import { genId } from '@/utils';

type Page = 'pos' | 'inventario' | 'compras' | 'clientes' | 'reportes' | 'auditoria';

interface AppState {
  // Auth
  usuarioActual: Usuario | null;
  setUsuarioActual: (u: Usuario | null) => void;

  // Navigation
  page: Page;
  setPage: (p: Page) => void;

  // Data
  productos: Producto[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  usuarios: Usuario[];
  ventas: Venta[];
  movimientos: Movimiento[];
  compras: Compra[];
  caja: CajaMovimiento[];

  // CRUD productos
  addProducto: (p: Omit<Producto, 'id'>) => void;
  updateProducto: (id: string, p: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;

  // CRUD clientes
  addCliente: (c: Omit<Cliente, 'id'>) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // CRUD proveedores
  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, p: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;

  // Ventas
  addVenta: (v: Venta) => void;

  // Movimientos
  addMovimiento: (m: Omit<Movimiento, 'id'>) => void;

  // Compras
  addCompra: (c: Compra) => void;

  // Caja
  addCajaMovimiento: (m: Omit<CajaMovimiento, 'id'>) => void;

  // Stock adjustment
  ajustarStock: (productoId: string, delta: number, motivo: string, referencia: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [page, setPage] = useState<Page>('pos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [caja, setCaja] = useState<CajaMovimiento[]>([]);

  useEffect(() => {
    initDB();
    setProductos(db.getProductos());
    setClientes(db.getClientes());
    setProveedores(db.getProveedores());
    setUsuarios(db.getUsuarios());
    setVentas(db.getVentas());
    setMovimientos(db.getMovimientos());
    setCompras(db.getCompras());
    setCaja(db.getCaja());
  }, []);

  const addProducto = useCallback((p: Omit<Producto, 'id'>) => {
    const nuevo = { ...p, id: genId('p') };
    setProductos((prev) => {
      const next = [...prev, nuevo];
      db.saveProductos(next);
      return next;
    });
  }, []);

  const updateProducto = useCallback((id: string, patch: Partial<Producto>) => {
    setProductos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      db.saveProductos(next);
      return next;
    });
  }, []);

  const deleteProducto = useCallback((id: string) => {
    setProductos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      db.saveProductos(next);
      return next;
    });
  }, []);

  const addCliente = useCallback((c: Omit<Cliente, 'id'>) => {
    const nuevo = { ...c, id: genId('c') };
    setClientes((prev) => {
      const next = [...prev, nuevo];
      db.saveClientes(next);
      return next;
    });
  }, []);

  const updateCliente = useCallback((id: string, patch: Partial<Cliente>) => {
    setClientes((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      db.saveClientes(next);
      return next;
    });
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setClientes((prev) => {
      const next = prev.filter((c) => c.id !== id);
      db.saveClientes(next);
      return next;
    });
  }, []);

  const addProveedor = useCallback((p: Omit<Proveedor, 'id'>) => {
    const nuevo = { ...p, id: genId('pr') };
    setProveedores((prev) => {
      const next = [...prev, nuevo];
      db.saveProveedores(next);
      return next;
    });
  }, []);

  const updateProveedor = useCallback((id: string, patch: Partial<Proveedor>) => {
    setProveedores((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      db.saveProveedores(next);
      return next;
    });
  }, []);

  const deleteProveedor = useCallback((id: string) => {
    setProveedores((prev) => {
      const next = prev.filter((p) => p.id !== id);
      db.saveProveedores(next);
      return next;
    });
  }, []);

  const addMovimiento = useCallback((m: Omit<Movimiento, 'id'>) => {
    const nuevo = { ...m, id: genId('m') };
    setMovimientos((prev) => {
      const next = [nuevo, ...prev];
      db.saveMovimientos(next);
      return next;
    });
  }, []);

  const ajustarStock = useCallback((productoId: string, delta: number, motivo: string, referencia: string) => {
    setProductos((prev) => {
      const next = prev.map((p) => {
        if (p.id === productoId) {
          const producto = { ...p, stock: p.stock + delta };
          return producto;
        }
        return p;
      });
      db.saveProductos(next);

      const prod = next.find((p) => p.id === productoId);
      if (prod) {
        const mov: Omit<Movimiento, 'id'> = {
          productoId,
          productoNombre: prod.nombre,
          tipo: delta > 0 ? 'entrada' : delta < 0 ? 'salida' : 'ajuste',
          cantidad: Math.abs(delta),
          motivo,
          fecha: new Date().toISOString(),
          referencia,
        };
        setMovimientos((prevM) => {
          const nextM = [{ ...mov, id: genId('m') }, ...prevM];
          db.saveMovimientos(nextM);
          return nextM;
        });
      }

      return next;
    });
  }, []);

  const addVenta = useCallback((v: Venta) => {
    setVentas((prev) => {
      const next = [v, ...prev];
      db.saveVentas(next);
      return next;
    });
    // Descontar stock
    for (const item of v.items) {
      setProductos((prev) => {
        const next = prev.map((p) =>
          p.id === item.productoId ? { ...p, stock: p.stock - item.cantidad } : p
        );
        db.saveProductos(next);
        return next;
      });
      const mov: Omit<Movimiento, 'id'> = {
        productoId: item.productoId,
        productoNombre: item.nombre,
        tipo: 'salida',
        cantidad: item.cantidad,
        motivo: 'Venta',
        fecha: v.fecha,
        referencia: v.id,
      };
      setMovimientos((prevM) => {
        const nextM = [{ ...mov, id: genId('m') }, ...prevM];
        db.saveMovimientos(nextM);
        return nextM;
      });
    }
    // Si es venta a crédito, actualizar saldo del cliente
    if (v.estado === 'credito' && v.clienteId && v.saldoPendiente) {
      setClientes((prev) => {
        const next = prev.map((c) =>
          c.id === v.clienteId ? { ...c, saldo: c.saldo + (v.saldoPendiente || 0) } : c
        );
        db.saveClientes(next);
        return next;
      });
    }
  }, []);

  const addCompra = useCallback((c: Compra) => {
    setCompras((prev) => {
      const next = [c, ...prev];
      db.saveCompras(next);
      return next;
    });
    // Actualizar stock y precio de compra
    for (const item of c.items) {
      setProductos((prev) => {
        const next = prev.map((p) =>
          p.id === item.productoId
            ? { ...p, stock: p.stock + item.cantidad, precioCompra: item.costoUnitario }
            : p
        );
        db.saveProductos(next);
        return next;
      });
      const mov: Omit<Movimiento, 'id'> = {
        productoId: item.productoId,
        productoNombre: item.nombre,
        tipo: 'entrada',
        cantidad: item.cantidad,
        motivo: 'Compra',
        fecha: c.fecha,
        referencia: c.id,
      };
      setMovimientos((prevM) => {
        const nextM = [{ ...mov, id: genId('m') }, ...prevM];
        db.saveMovimientos(nextM);
        return nextM;
      });
    }
  }, []);

  const addCajaMovimiento = useCallback((m: Omit<CajaMovimiento, 'id'>) => {
    const nuevo = { ...m, id: genId('cx') };
    setCaja((prev) => {
      const next = [...prev, nuevo];
      db.saveCaja(next);
      return next;
    });
  }, []);

  const value: AppState = {
    usuarioActual,
    setUsuarioActual,
    page,
    setPage,
    productos,
    clientes,
    proveedores,
    usuarios,
    ventas,
    movimientos,
    compras,
    caja,
    addProducto,
    updateProducto,
    deleteProducto,
    addCliente,
    updateCliente,
    deleteCliente,
    addProveedor,
    updateProveedor,
    deleteProveedor,
    addVenta,
    addMovimiento,
    addCompra,
    addCajaMovimiento,
    ajustarStock,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
