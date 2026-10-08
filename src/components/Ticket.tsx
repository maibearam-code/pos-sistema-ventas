import type { Venta } from '@/types';
import { formatPYGPlain, formatFecha } from '@/utils';
import { NEGOCIO } from '@/data/seed';

interface TicketProps {
  venta: Venta;
  numeroTicket: string;
}

export function Ticket({ venta, numeroTicket }: TicketProps) {
  return (
    <div className="ticket-print" style={{ width: '58mm' }}>
      {/* Encabezado del negocio */}
      <div className="text-center">
        <p className="font-bold text-sm">{NEGOCIO.nombre}</p>
        <p>RUC: {NEGOCIO.ruc}</p>
        <p>{NEGOCIO.direccion}</p>
        <p>Tel: {NEGOCIO.telefono}</p>
      </div>

      <div className="border-dashed" />

      {/* Datos del ticket */}
      <div>
        <p>Ticket: {numeroTicket}</p>
        <p>Fecha: {formatFecha(venta.fecha)}</p>
        <p>Cajero: {venta.usuarioNombre}</p>
        {venta.clienteNombre && venta.clienteNombre !== 'Consumidor Final' && (
          <p>Cliente: {venta.clienteNombre}</p>
        )}
      </div>

      <div className="border-dashed" />

      {/* Encabezado de items */}
      <div className="flex justify-between font-bold">
        <span>Cant.</span>
        <span>Descripcion</span>
        <span>Importe</span>
      </div>

      <div className="border-dashed" />

      {/* Items — nombre completo en su propia linea para 58mm */}
      {venta.items.map((item, i) => (
        <div key={i} className="mb-1">
          <div className="flex justify-between">
            <span>{item.cantidad}x</span>
            <span className="flex-1 px-1 truncate">{item.nombre}</span>
            <span>{formatPYGPlain(item.subtotal)}</span>
          </div>
          <p className="pl-1" style={{ fontSize: '9px', color: '#555' }}>
            {formatPYGPlain(item.precioUnitario)} c/u
          </p>
        </div>
      ))}

      <div className="border-dashed" />

      {/* Totales */}
      {venta.descuento > 0 && (
        <div className="flex justify-between">
          <span>Descuento:</span>
          <span>- {formatPYGPlain(venta.descuento)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>{formatPYGPlain(venta.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>IVA 5%:</span>
        <span>{formatPYGPlain(venta.iva5)}</span>
      </div>
      <div className="flex justify-between">
        <span>IVA 10%:</span>
        <span>{formatPYGPlain(venta.iva10)}</span>
      </div>

      <div className="border-dashed" />

      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL:</span>
        <span>Gs. {formatPYGPlain(venta.total)}</span>
      </div>

      <div className="border-dashed" />

      {/* Datos de pago */}
      <div>
        <p>Medio de pago: {venta.medioPago.toUpperCase()}</p>
        {venta.montoRecibido !== undefined && (
          <p>Recibido: Gs. {formatPYGPlain(venta.montoRecibido)}</p>
        )}
        {venta.cambio !== undefined && venta.cambio > 0 && (
          <p>Cambio: Gs. {formatPYGPlain(venta.cambio)}</p>
        )}
        {venta.estado === 'credito' && venta.saldoPendiente && (
          <p className="font-bold">A CREDITO: Gs. {formatPYGPlain(venta.saldoPendiente)}</p>
        )}
      </div>

      <div className="border-dashed" />

      {/* Pie */}
      <div className="text-center mt-2">
        <p className="font-bold">Gracias por su compra!</p>
        <p className="text-[10px] mt-1">Conserve este comprobante</p>
      </div>
    </div>
  );
}
