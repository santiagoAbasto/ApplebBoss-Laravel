import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import SalesChart from '@/Components/SalesChart';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';

export default function Dashboard({
  user,
  resumen = {},
  resumen_grafico = [],
  resumen_total = {},
  vendedores = [],
  filtros = {},
}) {
  const hoyStr = dayjs().format('YYYY-MM-DD');
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || hoyStr);
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || hoyStr);
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  useEffect(() => {
    if (!filtros.fecha_inicio && !filtros.fecha_fin) {
      router.get(route('admin.dashboard'), {
        fecha_inicio: hoyStr,
        fecha_fin: hoyStr,
      }, { preserveState: true, preserveScroll: true });
    }
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.dashboard'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const ultimasVentas = Array.isArray(resumen.ultimas_ventas) ? resumen.ultimas_ventas : [];

  return (
    <AdminLayout>
      <Head title="Panel de Administración" />

      <div className="mb-10 px-4">
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 text-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold">Bienvenido, {user?.name || 'Administrador'}</h1>
          <p className="text-sm mt-1 opacity-90">
            Desde este panel puedes gestionar productos, ventas, reportes y más.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 px-4 mb-10">
        <div className="flex gap-3">
          <QuickButton routeName="admin.ventas.create" color="sky" text="➕ Venta" />
          <QuickButton routeName="admin.servicios.create" color="green" text="⚙️ Servicio" />
          <ProductoSelectorButton />
          <QuickButton routeName="admin.reportes.index" color="rose" text="📄 Reportes" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-10">
        <Card titulo="Ventas Hoy" valor={`Bs ${resumen.ventas_hoy?.toLocaleString() || 0}`} color="sky" />
        <Card
          titulo="Ganancia Neta"
          valor={
            resumen_total.ganancia_neta < 0
              ? `Se invirtió Bs ${Math.abs(resumen_total.ganancia_neta).toLocaleString()}`
              : `Bs ${resumen_total.ganancia_neta?.toLocaleString() || 0}`
          }
          color={resumen_total.ganancia_neta < 0 ? 'rose' : 'green'}
        />
        <Card titulo="Servicios Técnicos" valor={resumen.servicios || 0} color="indigo" />
        <Card titulo="Cotizaciones Enviadas" valor={resumen.cotizaciones || 0} color="rose" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-12">
        <Card titulo="Total Ventas" valor={`Bs ${resumen_total.total_ventas?.toLocaleString() || 0}`} color="sky" />
        <Card titulo="Inversión Total" valor={`Bs ${resumen_total.total_costo?.toLocaleString() || 0}`} color="indigo" />
        <Card titulo="Total Descuento" valor={`Bs ${resumen_total.total_descuento?.toLocaleString() || 0}`} color="rose" />
        <Card
          titulo="Ganancia Neta Real"
          valor={
            resumen_total.ganancia_neta < 0
              ? `Se invirtió Bs ${Math.abs(resumen_total.ganancia_neta).toLocaleString()}`
              : `Bs ${resumen_total.ganancia_neta?.toLocaleString() || 0}`
          }
          color={resumen_total.ganancia_neta < 0 ? 'rose' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 mb-10">
        <Card
          titulo="Productos Generales Disponibles"
          valor={resumen.stock_detalle?.productos_generales || 0}
          color="indigo"
        />
        <Card
          titulo="% del Stock Total"
          valor={`${resumen.stock_detalle?.porcentaje_productos_generales || 0}%`}
          color="sky"
        />
      </div>

      <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-4 px-4 mb-12 bg-white rounded-xl shadow p-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">📅 Fecha inicio</label>
          <input
            type="date"
            className="form-input mt-1"
            value={fechaInicio}
            max={fechaFin || hoyStr}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">📅 Fecha fin</label>
          <input
            type="date"
            className="form-input mt-1"
            value={fechaFin}
            min={fechaInicio || hoyStr}
            max={hoyStr}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">👤 Vendedor</label>
          <select
            className="form-select mt-1"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-lg shadow">
          🔎 Filtrar
        </button>
      </form>

      <div className="bg-white p-6 rounded-xl shadow-md mb-12 px-4">
        <h2 className="text-lg font-bold text-sky-800 mb-4">📊 Distribución Económica</h2>
        <SalesChart resumen_total={resumen_total} />
      </div>

      <div className="px-4 mb-12">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🛒 Últimas 5 ventas</h2>
        <div className="overflow-auto rounded-lg shadow border">
          <table className="min-w-full text-sm text-gray-800 bg-white">
            <thead className="bg-sky-100 text-sky-800 text-left font-semibold">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map((venta, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-t">
                  <td className="px-4 py-2">{venta.cliente}</td>
                  <td className="px-4 py-2 capitalize">{venta.tipo_venta}</td>
                  <td className="px-4 py-2 text-green-600 font-semibold">Bs {venta.total}</td>
                  <td className="px-4 py-2">{dayjs(venta.fecha).format('DD/MM/YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function Card({ titulo, valor, color }) {
  const colors = {
    sky: 'text-sky-700',
    green: 'text-green-600',
    indigo: 'text-indigo-600',
    rose: 'text-rose-600',
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-5 text-center border border-gray-200 hover:shadow-lg transition">
      <p className="text-sm text-gray-500 font-medium mb-1">{titulo}</p>
      <h2 className={`text-xl font-bold ${colors[color]}`}>{valor}</h2>
    </div>
  );
}

function QuickButton({ routeName, color, text }) {
  const bg = {
    sky: 'bg-sky-600 hover:bg-sky-700',
    green: 'bg-green-600 hover:bg-green-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    rose: 'bg-rose-600 hover:bg-rose-700',
  };

  return (
    <Link
      href={route(routeName)}
      className={`${bg[color]} transition text-white rounded-lg px-4 py-3 font-semibold shadow`}
    >
      {text}
    </Link>
  );
}

function ProductoSelectorButton() {
  const [showOptions, setShowOptions] = useState(false);

  const irACreate = (tipo) => {
    const rutas = {
      celular: 'admin.celulares.create',
      computadora: 'admin.computadoras.create',
      producto_general: 'admin.productos-generales.create',
    };
    router.visit(route(rutas[tipo]));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg px-4 py-3 font-semibold shadow"
      >
        📦 Producto
      </button>
      {showOptions && (
        <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-xl p-3 w-56">
          <p className="text-gray-600 text-sm mb-2">¿Qué producto deseas registrar?</p>
          <button
            onClick={() => irACreate('celular')}
            className="w-full text-left py-2 px-3 rounded hover:bg-indigo-50"
          >📱 Celular</button>
          <button
            onClick={() => irACreate('computadora')}
            className="w-full text-left py-2 px-3 rounded hover:bg-indigo-50"
          >💻 Computadora</button>
          <button
            onClick={() => irACreate('producto_general')}
            className="w-full text-left py-2 px-3 rounded hover:bg-indigo-50"
          >📦 Producto General</button>
        </div>
      )}
    </div>
  );
}
