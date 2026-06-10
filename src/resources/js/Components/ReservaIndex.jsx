import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck, FileText, PlusCircle, Receipt } from 'lucide-react';
import { route } from 'ziggy-js';
import { useAutoRefresh } from '@/Hooks/useAutoRefresh';

const estadoStyles = {
  activa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  vendida: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  vencida: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ReservaIndex({ reservas, role, Layout }) {
  useAutoRefresh(['reservas', 'ventas']);
  const routePrefix = role === 'admin' ? 'admin' : 'vendedor';

  const cambiarEstado = (reserva, estado) => {
    router.patch(route(`${routePrefix}.reservas.estado`, reserva.id), { estado }, {
      preserveScroll: true,
    });
  };

  const formatoBs = (valor) => Number(valor || 0).toFixed(2);
  const activas = reservas.filter((r) => r.estado === 'activa').length;
  const abonado = reservas.reduce((acc, r) => acc + Number(r.monto_reserva || 0), 0);

  return (
    <Layout>
      <Head title="Reservas" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck size={28} />
            Reservas
          </h1>
          <p className="text-slate-500">Control de productos separados, abonos y conversiones a venta.</p>
        </div>

        <Link
          href={route(`${routePrefix}.reservas.create`)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow transition"
        >
          <PlusCircle size={18} />
          Nueva Reserva
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Reservas</div>
          <div className="text-xl font-bold text-slate-800">{reservas.length}</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Activas</div>
          <div className="text-xl font-bold text-emerald-600">{activas}</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Total abonado</div>
          <div className="text-xl font-bold text-blue-700">Bs {formatoBs(abonado)}</div>
        </div>
      </div>

      <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1120px]">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2.5 text-left">Cliente</th>
              <th className="px-3 py-2.5">Codigo</th>
              <th className="px-3 py-2.5 text-right">Total</th>
              <th className="px-3 py-2.5 text-right">Abono</th>
              <th className="px-3 py-2.5 text-right">Saldo</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Vendedor</th>
              <th className="px-3 py-2.5">Venta</th>
              <th className="px-3 py-2.5 text-center">Documentos</th>
              <th className="px-3 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservas.map((reserva) => (
              <tr key={reserva.id} className="hover:bg-emerald-50/40 transition">
                <td className="px-3 py-2.5">
                  <div className="font-semibold">{reserva.nombre_cliente}</div>
                  <div className="text-xs text-slate-500">{reserva.telefono_cliente || 'Sin telefono'}</div>
                </td>
                <td className="px-3 py-2.5 font-mono text-emerald-700">{reserva.codigo_nota}</td>
                <td className="px-3 py-2.5 text-right">Bs {formatoBs(reserva.subtotal)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-700">Bs {formatoBs(reserva.monto_reserva)}</td>
                <td className="px-3 py-2.5 text-right">Bs {formatoBs(Number(reserva.subtotal) - Number(reserva.monto_reserva))}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoStyles[reserva.estado] || estadoStyles.activa}`}>
                    {reserva.estado}
                  </span>
                </td>
                <td className="px-3 py-2.5">{reserva.vendedor?.name || '-'}</td>
                <td className="px-3 py-2.5">
                  {reserva.venta ? reserva.venta.codigo_nota : '-'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-3">
                    <a href={route(`${routePrefix}.reservas.boleta`, reserva.id)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 inline-flex items-center gap-1">
                      <Receipt size={14} /> Normal
                    </a>
                    <a href={route(`${routePrefix}.reservas.boleta80`, reserva.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 inline-flex items-center gap-1">
                      <FileText size={14} /> Termica
                    </a>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {reserva.estado === 'activa' ? (
                    <div className="flex items-center justify-center gap-2">
                      <Link href={route(`${routePrefix}.ventas.create`, { reserva_id: reserva.id })} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                        Vender
                      </Link>
                      <button onClick={() => cambiarEstado(reserva, 'cancelada')} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-rose-700">
                        Cancelar
                      </button>
                      <button onClick={() => cambiarEstado(reserva, 'vencida')} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-amber-700">
                        Vencer
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Sin acciones</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-semibold">{reserva.nombre_cliente}</div>
                <div className="font-mono text-sm text-emerald-700">{reserva.codigo_nota}</div>
              </div>
              <span className={`h-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoStyles[reserva.estado] || estadoStyles.activa}`}>
                {reserva.estado}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div><div className="text-xs text-slate-500">Total</div>Bs {formatoBs(reserva.subtotal)}</div>
              <div><div className="text-xs text-slate-500">Abono</div>Bs {formatoBs(reserva.monto_reserva)}</div>
              <div><div className="text-xs text-slate-500">Saldo</div>Bs {formatoBs(Number(reserva.subtotal) - Number(reserva.monto_reserva))}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <a href={route(`${routePrefix}.reservas.boleta`, reserva.id)} target="_blank" rel="noopener noreferrer" className="text-emerald-600">Normal</a>
              <a href={route(`${routePrefix}.reservas.boleta80`, reserva.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600">Termica</a>
              {reserva.estado === 'activa' && <Link href={route(`${routePrefix}.ventas.create`, { reserva_id: reserva.id })} className="font-semibold text-blue-700">Vender</Link>}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
