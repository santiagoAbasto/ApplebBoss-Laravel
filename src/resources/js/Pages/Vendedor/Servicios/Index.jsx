import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link, router } from '@inertiajs/react';
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

      <div className="mb-4">
        <h1 className="text-xl font-bold text-success">🛠️ Servicios Técnicos Registrados</h1>
        <p className="text-muted">Consulta, filtra y exporta tus servicios técnicos.</p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFiltrar} className="row g-3 align-items-end mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Desde</label>
          <input
            type="date"
            className="form-control"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Hasta</label>
          <input
            type="date"
            className="form-control"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div className="col-md-4 d-flex gap-2">
          <button className="btn btn-success w-50" type="submit">
            🔍 Filtrar
          </button>
          <button className="btn btn-outline-primary w-50" type="button" onClick={handleExportar}>
            📤 Exportar PDF
          </button>
        </div>
      </form>

      {/* Tabla */}
      <div className="table-responsive shadow-sm">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-success">
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Equipo</th>
              <th>Detalle</th>
              <th>Técnico</th>
              <th>Fecha</th>
              <th>Precio Venta</th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-3">No se encontraron servicios.</td>
              </tr>
            ) : (
              servicios.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td>{s.cliente}</td>
                  <td>{s.telefono || '-'}</td>
                  <td>{s.equipo}</td>
                  <td>{s.detalle_servicio}</td>
                  <td>{s.tecnico}</td>
                  <td>{dayjs(s.fecha).format('DD/MM/YYYY')}</td>
                  <td>Bs {parseFloat(s.precio_venta).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VendedorLayout>
  );
}
