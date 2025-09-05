// resources/js/Pages/Vendedor/Dashboard.jsx
import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Dashboard({
  auth,
  resumen = {},
  ultimasVentas = [],
  ultimasCotizaciones = [],
  ultimosServicios = [],
}) {
  const handleLogout = () => {
    router.post(route('logout'));
  };

  const porcentajeMeta = Math.min(
    (Number(resumen?.total_mes) || 0) / (Number(resumen?.meta_mensual) || 1) * 100,
    100
  ).toFixed(1);

  // --- Helpers ---
  const fmt = (n) => Number(n || 0).toLocaleString('es-BO');

  const safeRoute = (name, params, fallback) => {
    try {
      return route(name, params, true); // URL absoluta
    } catch {
      return fallback;
    }
  };

  // Construye el href correcto según sea venta normal o servicio técnico
  const boletaHrefDeVenta = (v) => {
    if (v?.tipo_venta === 'servicio_tecnico') {
      const stId = v?.servicio_id ?? v?.id; // fallback por si acaso
      return safeRoute(
        'vendedor.servicios.boleta',
        { servicio: stId },
        `/vendedor/servicios/${stId}/boleta`
      );
    }
    // Venta normal
    return safeRoute(
      'vendedor.ventas.boleta',
      { venta: v?.id },
      `/vendedor/ventas/${v?.id}/boleta`
    );
  };

  const boletaHrefDeServicio = (s) =>
    safeRoute(
      'vendedor.servicios.boleta',
      { servicio: s?.id },
      `/vendedor/servicios/${s?.id}/boleta`
    );

  return (
    <VendedorLayout>
      <Head title="Panel del Vendedor" />

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700 mb-1">
            👨‍💼 Bienvenido, {auth?.user?.name}
          </h1>
          <p className="text-gray-600">Este es tu panel de trabajo como vendedor</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
        </button>
      </div>

      {/* Tarjetas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href={route('vendedor.productos.index')} className="transform hover:scale-105 transition">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 h-full flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-green-600 uppercase">Ver Productos</p>
              <p className="text-lg font-semibold text-gray-800">Inventario disponible</p>
            </div>
            <i className="fas fa-box-open fa-2x text-green-500"></i>
          </div>
        </Link>

        <Link href={route('vendedor.ventas.create')} className="transform hover:scale-105 transition">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 h-full flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase">Registrar Venta</p>
              <p className="text-lg font-semibold text-gray-800">Inicia una nueva venta</p>
            </div>
            <i className="fas fa-receipt fa-2x text-blue-500"></i>
          </div>
        </Link>

        <Link href={route('vendedor.servicios.create')} className="transform hover:scale-105 transition">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 h-full flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-yellow-600 uppercase">Servicio Técnico</p>
              <p className="text-lg font-semibold text-gray-800">Registrar nuevo servicio</p>
            </div>
            <i className="fas fa-tools fa-2x text-yellow-500"></i>
          </div>
        </Link>

        <Link href={route('vendedor.cotizaciones.create')} className="transform hover:scale-105 transition">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 h-full flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-purple-600 uppercase">Cotización</p>
              <p className="text-lg font-semibold text-gray-800">Generar cotización rápida</p>
            </div>
            <i className="fas fa-file-alt fa-2x text-purple-500"></i>
          </div>
        </Link>
      </div>

      {/* Resumen y Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen del día</h3>
          <ul className="divide-y divide-gray-200">
            <li className="flex justify-between py-2">
              <span>Ventas del día:</span>
              <strong>Bs {fmt(resumen?.ventas_dia)}</strong>
            </li>
            <li className="flex justify-between py-2">
              <span>Ganancia estimada:</span>
              <strong>Bs {fmt(resumen?.ganancia_dia)}</strong>
            </li>
            <li className="flex justify-between py-2">
              <span>Cotizaciones generadas:</span>
              <strong>{resumen?.cotizaciones_dia || 0}</strong>
            </li>
            <li className="flex justify-between py-2">
              <span>Servicios técnicos:</span>
              <strong>{resumen?.servicios_dia || 0}</strong>
            </li>
          </ul>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-600">
          <h3 className="text-xl font-bold text-green-700 mb-4">🎯 Meta Mensual</h3>
          <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden">
            <div
              className="bg-green-600 h-full text-white text-sm font-bold flex items-center justify-end pr-2 rounded-full"
              style={{ width: `${porcentajeMeta}%` }}
            >
              {porcentajeMeta}%
            </div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-2">
            Bs {fmt(resumen?.total_mes)} / Bs {fmt(resumen?.meta_mensual)}
          </p>
        </div>
      </div>

      {/* Últimas actividades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Últimas Ventas */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-green-600 text-white p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">🛒 Últimas Ventas</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimasVentas.length ? (
              ultimasVentas.map((v, i) => (
                <li key={i} className="flex justify-between items-center py-2 text-sm text-gray-700">
                  <span>{v.nombre_cliente}</span>
                  <div className="flex items-center gap-2">
                    <span>Bs {fmt(v.total)}</span>
                    <a
                      href={boletaHrefDeVenta(v)}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-xs btn-outline-primary"
                    >
                      Ver Boleta
                    </a>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-2 text-sm text-gray-500">Sin registros</li>
            )}
          </ul>
        </div>

        {/* Cotizaciones */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">📄 Cotizaciones</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimasCotizaciones.length ? (
              ultimasCotizaciones.map((c, i) => (
                <li key={i} className="flex justify-between py-2 text-sm text-gray-700">
                  <span>{c.cliente}</span>
                  <span>Bs {fmt(c.total)}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-sm text-gray-500">Sin registros</li>
            )}
          </ul>
        </div>

        {/* Servicios Técnicos */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-yellow-500 text-gray-900 p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">🔧 Servicios Técnicos</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimosServicios.length ? (
              ultimosServicios.map((s, i) => (
                <li key={i} className="flex justify-between items-center py-2 text-sm text-gray-700">
                  <span>{s.equipo}</span>
                  <div className="flex items-center gap-2">
                    <span>Bs {fmt(s.precio_venta)}</span>
                    <a
                      href={boletaHrefDeServicio(s)}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-xs btn-outline-primary"
                    >
                      Ver Boleta
                    </a>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-2 text-sm text-gray-500">Sin registros</li>
            )}
          </ul>
        </div>
      </div>
    </VendedorLayout>
  );
}
