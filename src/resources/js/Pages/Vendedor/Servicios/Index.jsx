import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';
import axios from 'axios';
import VendedorLayout from '@/Layouts/VendedorLayout';
import FancyButton from '@/Components/FancyButton';

export default function ServiciosIndex({ servicios = [], filtros = {}, vendedores = [] }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');
  const [buscar, setBuscar] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);

  /* ===============================
     FILTROS
  =============================== */
  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('vendedor.servicios.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  const handleExportarFiltrado = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();

    window.open(
      route('vendedor.servicios.exportarFiltrado') + '?' + queryParams,
      '_blank'
    );
  };

  /* ===============================
     BUSCADOR
  =============================== */
  const buscarServicio = async (e) => {
    e.preventDefault();
    if (!buscar.trim()) return;

    try {
      const res = await axios.get(route('vendedor.servicios.index'), {
        params: { buscar: buscar.trim() },
      });
      setResultadosBusqueda(res.data.servicios || []);
    } catch {
      setResultadosBusqueda([]);
    }
  };

  const listaFinal = resultadosBusqueda !== null ? resultadosBusqueda : servicios;

  return (
    <VendedorLayout>
      <Head title="Servicios Técnicos" />

      {/* ===============================
         HEADER
      =============================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Servicios Técnicos</h1>
          <p className="text-sm text-gray-500">
            Gestión y control de servicios registrados
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Link href={route('vendedor.servicios.create')} className="no-underline">
            <FancyButton variant="success">
              Registrar servicio
            </FancyButton>
          </Link>

          <FancyButton
            variant="danger"
            type="button"
            onClick={handleExportarFiltrado}
          >
            Exportar PDF
          </FancyButton>
        </div>
      </div>

      {/* ===============================
         BUSCADOR
      =============================== */}
      <form
        onSubmit={buscarServicio}
        className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6"
      >
        <input
          type="text"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por código de nota o cliente"
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
        />

        <FancyButton size="sm" variant="success" type="submit">
          Buscar
        </FancyButton>
      </form>

      {/* ===============================
         FILTROS AVANZADOS
      =============================== */}
      <form
        onSubmit={handleFiltrar}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow mb-6"
      >
        <div>
          <label className="text-xs font-semibold text-gray-600">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Vendedor</label>
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-300"
          >
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <FancyButton variant="primary" size="sm" type="submit" className="w-full">
            Filtrar
          </FancyButton>
        </div>
      </form>

      {/* ===============================
         TABLA
      =============================== */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">Venta</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {listaFinal.length > 0 ? (
              listaFinal.map((s) => {
                const costo = Number(s.precio_costo || 0);
                const venta = Number(s.precio_venta || 0);
                const ganancia = venta - costo;

                return (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.cliente}</td>
                    <td className="px-4 py-3 font-mono text-blue-600">{s.codigo_nota || '—'}</td>
                    <td className="px-4 py-3">{s.equipo}</td>
                    <td className="px-4 py-3">{s.tecnico}</td>
                    <td className="px-4 py-3 text-right">{costo.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right">{venta.toFixed(2)} Bs</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        ganancia > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {ganancia.toFixed(2)} Bs
                    </td>
                    <td className="px-4 py-3">{dayjs(s.fecha).format('DD/MM/YYYY')}</td>
                    <td className="px-4 py-3">{s.vendedor?.name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={route('vendedor.servicios.boleta', s.id)}
                          target="_blank"
                          className="no-underline"
                        >
                          <FancyButton size="sm" variant="primary">
                            Ver
                          </FancyButton>
                        </a>

                        <FancyButton
                          size="sm"
                          variant="dark"
                          type="button"
                          onClick={() =>
                            window.open(
                              route('vendedor.servicios.recibo80mm', s.id),
                              '_blank'
                            )
                          }
                        >
                          Imprimir
                        </FancyButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="text-center py-8 text-gray-500">
                  No hay servicios técnicos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </VendedorLayout>
  );
}
