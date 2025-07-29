import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';
import axios from 'axios';

export default function Index({ servicios = [], filtros = {} }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [buscar, setBuscar] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

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

  const handleExportarResumen = () => {
    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
    window.open(route('vendedor.servicios.exportarResumen') + `?${params.toString()}`, '_blank');
  };

  const buscarServicio = async (e) => {
    e.preventDefault();
    if (!buscar.trim()) return;

    try {
      const response = await axios.get(route('vendedor.servicios.buscar'), {
        params: { buscar: buscar.trim() },
      });
      setResultadosBusqueda(response.data.servicios);
    } catch (error) {
      console.error('Error al buscar servicio técnico:', error);
      setResultadosBusqueda([]);
    }
  };

  const serviciosMostrados = resultadosBusqueda.length > 0 ? resultadosBusqueda : servicios;

  return (
    <VendedorLayout>
      <Head title="Mis Servicios Técnicos" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-600">Servicios Técnicos Registrados</h1>
        <p className="text-sm text-gray-500">Consulta, filtra y exporta tus servicios realizados.</p>
      </div>

      {/* 🔍 Buscador */}
      <div className="relative mb-6">
        <form onSubmit={buscarServicio} className="flex items-center gap-2">
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por código o nombre del cliente"
            className="border px-3 py-2 rounded w-80"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Buscar
          </button>
        </form>

        {resultadosBusqueda.length > 0 && (
          <div className="absolute z-50 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🔍 Resultados encontrados:
            </h3>
            <ul className="space-y-3">
              {resultadosBusqueda.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{s.cliente}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      Código: <span className="text-blue-600">{s.codigo_nota || '—'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      window.open(route('vendedor.servicios.boleta', { servicio: s.id }), '_blank');
                      setBuscar('');
                      setResultadosBusqueda([]);
                    }}
                    className="px-3 py-1 text-sm rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
                  >
                    Ver Boleta
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 📅 Filtros por fecha */}
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
            📤 <span>Boletas</span>
          </button>
          <button
            type="button"
            onClick={handleExportarResumen}
            className="btn btn-outline-success w-full flex items-center justify-center gap-2 shadow-sm"
          >
            📄 <span>Resumen</span>
          </button>
        </div>
      </form>

      {/* 📋 Tabla de servicios */}
      <div className="overflow-x-auto rounded-xl shadow border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-600 text-white text-sm uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Código Nota</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Detalle</th>
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-right">Precio Venta</th>
              <th className="px-4 py-3 text-center">Boleta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {serviciosMostrados.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-6 text-gray-400 italic">
                  No se encontraron servicios.
                </td>
              </tr>
            ) : (
              serviciosMostrados.map((s, index) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  <td className="px-4 py-2 text-center font-medium text-gray-600">{index + 1}</td>
                  <td className="px-4 py-2">{s.cliente}</td>
                  <td className="px-4 py-2">{s.telefono || '-'}</td>
                  <td className="px-4 py-2 text-blue-700 font-mono">{s.codigo_nota || '—'}</td>
                  <td className="px-4 py-2">{s.equipo}</td>
                  <td className="px-4 py-2">{s.detalle_servicio}</td>
                  <td className="px-4 py-2">{s.tecnico}</td>
                  <td className="px-4 py-2 text-center">{dayjs(s.fecha).format('DD MMM YYYY')}</td>
                  <td className="px-4 py-2 text-right font-semibold text-green-700">
                    Bs {parseFloat(s.precio_venta).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <a
                      href={route('vendedor.servicios.boleta', { servicio: s.id })}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver Boleta
                    </a>
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
