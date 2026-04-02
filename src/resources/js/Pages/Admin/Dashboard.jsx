import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';

import EconomicCharts from '@/Components/EconomicCharts';
import SalesChart from '@/Components/SalesChart';
import DashboardActions from '@/Components/DashboardActions';
import IosNotification from "@/Components/IosNotification";


import axios from 'axios';

/* =======================
   HELPERS MONEDA SEGUROS
======================= */

const safeNum = (x) => {
  if (x === null || x === undefined) return 0;

  // Si ya es número válido
  if (typeof x === 'number') {
    return Number.isFinite(x) ? x : 0;
  }

  // Si es string
  if (typeof x === 'string') {
    let value = x.trim();

    // Si contiene "Bs" lo limpiamos
    if (value.includes('Bs')) {
      value = value.replace(/Bs/gi, '').trim();
    }

    // Si viene en formato boliviano 1.100,00
    if (value.includes(',') && value.includes('.')) {
      value = value.replace(/\./g, '').replace(',', '.');
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
};

const fmtBs = (n) =>
  `Bs ${safeNum(n).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;


export default function Dashboard({
  user,
  resumen = {},
  resumen_total = {},
  vendedores = [],
  filtros = {},
  distribucion_economica = [],
}) {
  const hoyStr = dayjs().format('YYYY-MM-DD');

  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || hoyStr);
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || hoyStr);
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  const ultimasVentas = Array.isArray(resumen?.ultimas_ventas)
    ? resumen.ultimas_ventas
    : [];

  /* =======================
   NOTIFICACIONES
======================= */

  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    axios.get('/admin/notifications')
      .then(res => setNotifications(res.data.notifications))
      .catch(() => { })
  }, [])


  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(
      route('admin.dashboard'),
      {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        vendedor_id: vendedorId,
      },
      { preserveState: true, preserveScroll: true }
    );
  };
  /* =======================
     AUTOMATION ALERT (SEMANAL)
  ======================= */

  const [automationReport, setAutomationReport] = useState(null);

  useEffect(() => {
    axios
      .get(route('admin.automation.latestWeekly'))
      .then((res) => {
        if (res.data?.show && res.data?.report) {

          const periodKey = `automation_seen_${res.data.report.period}`;
          const alreadySeen = localStorage.getItem(periodKey);

          if (!alreadySeen) {
            setAutomationReport(res.data.report);
            localStorage.setItem(periodKey, '1');
          }
        }
      })
      .catch(() => { });
  }, []);

  /* =======================
     PARSE IA CONTENT (SEGURO)
  ======================= */
  const parsedAutomation = useMemo(() => {
    if (!automationReport?.content) return null;

    try {
      return JSON.parse(automationReport.content);
    } catch {
      return null;
    }
  }, [automationReport]);

  /* =======================
     METRICAS INTELIGENTES
  ======================= */

  const utilidadSemana =
    parsedAutomation?.metricas?.utilidad_semana ?? 0;

  const variacion = safeNum(
    parsedAutomation?.metricas?.variacion_porcentual
  );


  const performanceColor =
    variacion > 0
      ? 'green'
      : variacion < 0
        ? 'rose'
        : 'sky';

  const variacionIcon =
    variacion > 0 ? '📈'
      : variacion < 0 ? '📉'
        : '➖';



  return (
    <AdminLayout>
      <Head title="Panel de Administración | AppleBoss" />

      {/* ================= HEADER ================= */}
      <div className="px-4 mb-8">
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 text-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold">
            Bienvenido, {user?.name || 'Administrador'}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Resumen financiero y operativo del sistema
          </p>
        </div>
      </div>

      {/* ================= CENTRO NOTIFICACIONES ================= */}
      <div className="px-4 mb-10">
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              🔔 Centro de Notificaciones
            </h2>
            <span className="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full">
              {notifications.filter(n => !n.read).length} nuevas
            </span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hay notificaciones recientes.
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition ${n.read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-sky-50 border-sky-200'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {n.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">

                      {/* BOTÓN VER (SIEMPRE) */}
                      <button
                        onClick={() =>
                          router.visit(
                            route('admin.automation.show', n.report_id)
                          )
                        }
                        className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded-full transition"
                      >
                        Ver
                      </button>

                      {/* BOTÓN MARCAR COMO LEÍDO (solo si no está leído) */}
                      {!n.read && (
                        <button
                          onClick={() => {
                            axios.post(`/admin/notifications/${n.id}/read`);
                            setNotifications(prev =>
                              prev.map(x =>
                                x.id === n.id ? { ...x, read: true } : x
                              )
                            );
                          }}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          Marcar como leído
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-2">
                    {dayjs(n.created_at).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= IOS NOTIFICATION n8n ================= */}
      {automationReport && (
        <IosNotification
          color={performanceColor}
          title="AppleBoss IA"
          subtitle="Reporte semanal inteligente"
          message={
            parsedAutomation ? (
              <>
                {parsedAutomation.resumen_ejecutivo?.descripcion ?? ''}

                <br />
                <br />

                💰 Utilidad: {fmtBs(utilidadSemana)}
                <br />
                {variacionIcon} Variación: {variacion}%
              </>
            ) : 'Nuevo análisis inteligente disponible'
          }
          onView={async () => {
            try {
              await axios.post(
                route('admin.automation.markViewed', automationReport.id)
              );
            } catch { }

            router.visit(
              route('admin.automation.show', automationReport.id)
            );
          }}
          onClose={() => setAutomationReport(null)}
        />
      )}


      {/* ================= ACCIONES ================= */}
      <div className="px-4 mb-10">
        <DashboardActions />
      </div>

      {/* ================= BLOQUE 1 ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-10">
        <Card titulo="Ventas Hoy" valor={fmtBs(resumen?.ventas_hoy)} color="sky" />

        <Card
          titulo="Ganancia Neta (pre egresos)"
          valor={
            safeNum(resumen_total?.ganancia_neta) < 0
              ? `Se invirtió ${fmtBs(
                Math.abs(safeNum(resumen_total?.ganancia_neta))
              )}`
              : fmtBs(resumen_total?.ganancia_neta)
          }
          color={safeNum(resumen_total?.ganancia_neta) < 0 ? 'rose' : 'green'}
        />

        <Card
          titulo="Servicios Técnicos"
          valor={resumen?.servicios || 0}
          color="indigo"
        />

        <Card
          titulo="Cotizaciones Enviadas"
          valor={resumen?.cotizaciones || 0}
          color="rose"
        />
      </div>

      {/* ================= BLOQUE 2 ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-12">
        <Card
          titulo="Total Ventas (Precio final pagado)"
          valor={fmtBs(resumen_total?.total_ventas)}
          color="sky"
        />

        <Card
          titulo="Inversión Total (Costo + Permuta)"
          valor={fmtBs(
            safeNum(resumen_total?.total_costo) +
            safeNum(resumen_total?.total_permuta)
          )}
          color="indigo"
        />

        <Card
          titulo="Total Descuento"
          valor={fmtBs(resumen_total?.total_descuento)}
          color="rose"
        />

        <Card
          titulo="Utilidad Disponible (ganancia - egresos)"
          valor={
            safeNum(resumen_total?.utilidad_disponible) < 0
              ? `Se invirtió ${fmtBs(
                Math.abs(safeNum(resumen_total?.utilidad_disponible))
              )}`
              : fmtBs(resumen_total?.utilidad_disponible)
          }
          color={safeNum(resumen_total?.utilidad_disponible) < 0 ? 'rose' : 'green'}
        />
      </div>

      {/* ================= BLOQUE 3 ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mb-10">
        <Card
          titulo="Productos Generales Disponibles"
          valor={resumen?.stock_detalle?.productos_generales || 0}
          color="indigo"
        />

        <Card
          titulo="% del Stock Total"
          valor={`${resumen?.stock_detalle?.porcentaje_productos_generales || 0}%`}
          color="sky"
        />
      </div>

      {/* ================= FILTROS ================= */}
      <form
        onSubmit={handleFiltrar}
        className="px-4 mb-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* FECHA INICIO */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              max={fechaFin}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>

          {/* FECHA FIN */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio}
              max={hoyStr}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>

          {/* VENDEDOR */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Vendedor</label>
            <select
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* BOTÓN */}
          <div className="flex">
            <button
              type="submit"
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm transition"
            >
              <i className="fas fa-filter text-xs"></i>
              Filtrar
            </button>
          </div>
        </div>
      </form>
      {/* ================= GRÁFICOS ================= */}
      <div className="px-4 mb-14">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">

          {/* CARD IZQUIERDO */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <EconomicCharts
              resumen_total={resumen_total}
              distribucion_economica={distribucion_economica}
            />
          </div>

          {/* CARD DERECHO */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <SalesChart
              distribucion_economica={distribucion_economica}
              resumen_total={resumen_total}
            />
          </div>

        </div>
      </div>

      {/* ================= ÚLTIMAS VENTAS ================= */}
      <div className="px-4 mb-12">
        <h2 className="text-lg font-semibold mb-3">Últimas 5 ventas</h2>

        <div className="overflow-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-100 text-sky-800">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>

            <tbody>
              {ultimasVentas.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                    No hay ventas registradas en este rango.
                  </td>
                </tr>
              ) : (
                ultimasVentas.map((v, i) => (
                  <tr key={`${v?.fecha ?? 'x'}-${i}`} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{v?.producto || '—'}</td>
                    <td className="px-4 py-2 capitalize">{v?.tipo || '—'}</td>
                    <td className="px-4 py-2 font-semibold text-green-600">
                      {fmtBs(v?.total)}
                    </td>
                    <td className="px-4 py-2">
                      {v?.fecha ? dayjs(v.fecha).format('DD/MM/YYYY') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

/* =======================
   CARD AUX
======================= */
function Card({ titulo, valor, color }) {
  const colors = {
    sky: 'text-sky-700',
    green: 'text-green-600',
    indigo: 'text-indigo-600',
    rose: 'text-rose-600',
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-5 text-center hover:shadow-lg transition">
      <p className="text-sm text-gray-500 mb-1">{titulo}</p>
      <h2 className={`text-xl font-bold ${colors[color]}`}>{valor}</h2>
    </div>
  );
}
