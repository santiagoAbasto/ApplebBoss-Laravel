import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Dashboard({ auth }) {
  const handleLogout = () => {
    router.post(route('logout'));
  };

  const resumen = auth?.resumen || {};
  const ultimasVentas = auth?.ultimasVentas || [];
  const ultimasCotizaciones = auth?.ultimasCotizaciones || [];
  const ultimosServicios = auth?.ultimosServicios || [];

  const porcentajeMeta = Math.min((resumen.total_mes || 0) / (resumen.meta_mensual || 1) * 100, 100).toFixed(1);

  return (
    <VendedorLayout>
      <Head title="Panel del Vendedor" />

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700 mb-1">👨‍💼 Bienvenido, {auth?.user?.name}</h1>
          <p className="text-gray-600">Este es tu panel de trabajo como vendedor</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
        </button>
      </div>

      {/* Tarjetas de acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="transform hover:scale-105 transition duration-300 ease-in-out">
          <Link href={route('vendedor.productos.index')} className="block">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 flex items-center justify-between h-full">
              <div>
                <div className="text-sm font-bold text-green-600 uppercase mb-1">Ver Productos</div>
                <div className="text-lg font-semibold text-gray-800">Inventario disponible</div>
              </div>
              <i className="fas fa-box-open fa-2x text-green-500"></i>
            </div>
          </Link>
        </div>

        <div className="transform hover:scale-105 transition duration-300 ease-in-out">
          <Link href={route('vendedor.ventas.create')} className="block">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 flex items-center justify-between h-full">
              <div>
                <div className="text-sm font-bold text-blue-600 uppercase mb-1">Registrar Venta</div>
                <div className="text-lg font-semibold text-gray-800">Inicia una nueva venta</div>
              </div>
              <i className="fas fa-receipt fa-2x text-blue-500"></i>
            </div>
          </Link>
        </div>

        <div className="transform hover:scale-105 transition duration-300 ease-in-out">
          <Link href={route('vendedor.servicios.create')} className="block">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 flex items-center justify-between h-full">
              <div>
                <div className="text-sm font-bold text-yellow-600 uppercase mb-1">Servicio Técnico</div>
                <div className="text-lg font-semibold text-gray-800">Registrar nuevo servicio</div>
              </div>
              <i className="fas fa-tools fa-2x text-yellow-500"></i>
            </div>
          </Link>
        </div>

        <div className="transform hover:scale-105 transition duration-300 ease-in-out">
          <Link href={route('vendedor.cotizaciones.create')} className="block">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 flex items-center justify-between h-full">
              <div>
                <div className="text-sm font-bold text-purple-600 uppercase mb-1">Cotización</div>
                <div className="text-lg font-semibold text-gray-800">Generar cotización rápida</div>
              </div>
              <i className="fas fa-file-alt fa-2x text-purple-500"></i>
            </div>
          </Link>
        </div>
      </div>

      {/* Resumen diario y meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen del día</h3>
          <ul className="divide-y divide-gray-200">
            <li className="flex justify-between py-2 text-gray-700">
              <span>Ventas del día:</span>
              <strong className="font-semibold">Bs {resumen?.ventas_dia?.toLocaleString() || 0}</strong>
            </li>
            <li className="flex justify-between py-2 text-gray-700">
              <span>Ganancia estimada:</span>
              <strong className="font-semibold">Bs {resumen?.ganancia_dia?.toLocaleString() || 0}</strong>
            </li>
            <li className="flex justify-between py-2 text-gray-700">
              <span>Cotizaciones generadas:</span>
              <strong className="font-semibold">{resumen?.cotizaciones_dia || 0}</strong>
            </li>
            <li className="flex justify-between py-2 text-gray-700">
              <span>Servicios técnicos:</span>
              <strong className="font-semibold">{resumen?.servicios_dia || 0}</strong>
            </li>
          </ul>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-600">
          <h3 className="text-xl font-bold text-green-700 mb-4">🎯 Meta Mensual</h3>
          <div className="w-full bg-gray-200 h-5 rounded-full relative overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full flex items-center justify-end pr-2 text-white text-sm font-semibold"
              style={{ width: `${porcentajeMeta}%` }}
            >
              {porcentajeMeta}%
            </div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-2">
            Bs {resumen?.total_mes?.toLocaleString() || 0} / Bs {resumen?.meta_mensual?.toLocaleString() || 10000}
          </p>
          <p className="text-sm text-gray-600 text-right mt-2">
            Bs {resumen?.total_mes?.toLocaleString() || 0} de Bs {resumen?.meta_mensual?.toLocaleString() || 10000}
          </p>
        </div>
      </div>

      {/* Últimas actividades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-green-600 text-white p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">🛒 Últimas Ventas</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimasVentas.length > 0 ? (
              ultimasVentas.map((v, i) => (
                <li key={i} className="flex justify-between py-2 text-gray-700 text-sm">
                  <span>{v.nombre_cliente}</span>
                  <span className="font-medium">Bs {v.total}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500 text-sm">Sin registros</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">📄 Cotizaciones</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimasCotizaciones.length > 0 ? (
              ultimasCotizaciones.map((c, i) => (
                <li key={i} className="flex justify-between py-2 text-gray-700 text-sm">
                  <span>{c.cliente}</span>
                  <span className="font-medium">Bs {c.total}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500 text-sm">Sin registros</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-yellow-500 text-gray-900 p-4 rounded-t-lg">
            <h4 className="font-semibold text-lg">🔧 Servicios Técnicos</h4>
          </div>
          <ul className="divide-y divide-gray-200 p-4">
            {ultimosServicios.length > 0 ? (
              ultimosServicios.map((s, i) => (
                <li key={i} className="flex justify-between py-2 text-gray-700 text-sm">
                  <span>{s.equipo}</span>
                  <span className="font-medium">Bs {s.precio_venta}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500 text-sm">Sin registros</li>
            )}
          </ul>
        </div>
      </div>
    </VendedorLayout>
  );
}