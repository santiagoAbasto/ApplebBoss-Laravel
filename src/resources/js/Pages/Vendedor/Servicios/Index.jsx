import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';

export default function Index({ servicios = [], filtros = {} }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('vendedor.servicios.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  };

  const handleExportar = () => {
    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
    window.open(route('vendedor.servicios.exportarFiltrado') + `?${params.toString()}`, '_blank');
  };

  return (
    <VendedorLayout>
      <Head title="Mis Servicios Técnicos" />

      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-600">Servicios Técnicos Registrados</h1>
        <p className="text-sm text-gray-500">Consulta, filtra y exporta tus servicios realizados.</p>
      </div>

      {/* Filtros */}
      <form
        onSubmit={handleFiltrar}
        className="grid md:grid-cols-3 gap-4 items-end bg-white p-4 rounded-xl shadow mb-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 Desde</label>
          <input
            type="date"
            className="form-control w-full"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 Hasta</label>
          <input
            type="date"
            className="form-control w-full"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-success w-full flex items-center justify-center gap-2 shadow-sm"
          >
            🔍 <span>Filtrar</span>
          </button>
          <button
            type="button"
            onClick={handleExportar}
            className="btn btn-outline-primary w-full flex items-center justify-center gap-2 shadow-sm"
          >
            📤 <span>Exportar</span>
          </button>
        </div>
      </form>

      {/* Tabla estilizada */}
      <div className="overflow-x-auto rounded-xl shadow border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-600 text-white text-sm uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Detalle</th>
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-right">Precio Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {servicios.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-400 italic">
                  No se encontraron servicios en este rango de fechas.
                </td>
              </tr>
            ) : (
              servicios.map((s, index) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                >
                  <td className="px-4 py-2 text-center font-medium text-gray-600">{index + 1}</td>
                  <td className="px-4 py-2">{s.cliente}</td>
                  <td className="px-4 py-2">{s.telefono || '-'}</td>
                  <td className="px-4 py-2">{s.equipo}</td>
                  <td className="px-4 py-2">{s.detalle_servicio}</td>
                  <td className="px-4 py-2">{s.tecnico}</td>
                  <td className="px-4 py-2 text-center">{dayjs(s.fecha).format('DD MMM YYYY')}</td>
                  <td className="px-4 py-2 text-right font-semibold text-green-700">
                    Bs {parseFloat(s.precio_venta).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VendedorLayout>
  );
}

