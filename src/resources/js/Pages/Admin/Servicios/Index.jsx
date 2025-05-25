import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function ServiciosIndex({ servicios, filtros, vendedores }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.servicios.index'), {
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
    window.open(route('admin.servicios.exportarFiltrado') + '?' + queryParams, '_blank');
  };

  return (
    <AdminLayout>
      <Head title="Servicio Técnico" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">🧰 Servicios Técnicos</h1>
        <div className="d-flex gap-2">
          <Link href={route('admin.servicios.create')} className="btn btn-primary">
            + Registrar Servicio
          </Link>
          <button onClick={handleExportarFiltrado} className="btn btn-outline-danger">
            🧾 Exportar PDF Filtrado
          </button>
        </div>
      </div>

      <form onSubmit={handleFiltrar} className="row g-3 mb-4 bg-light p-3 rounded shadow-sm">
        <div className="col-md-3">
          <label className="form-label">Fecha Inicio</label>
          <input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fecha Fin</label>
          <input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Vendedor</label>
          <select className="form-select" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            <option value="">— Todos —</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-primary w-100">Filtrar</button>
        </div>
      </form>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Precio Costo</th>
                <th>Precio Venta</th>
                <th>Ganancia</th>
                <th>Fecha</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length > 0 ? (
                servicios.map((s) => {
                  const costo = parseFloat(s.precio_costo || 0);
                  const venta = parseFloat(s.precio_venta || 0);
                  const ganancia = venta - costo;

                  return (
                    <tr key={s.id}>
                      <td>{s.cliente}</td>
                      <td>{s.equipo}</td>
                      <td>{s.tecnico}</td>
                      <td className="text-end">{costo.toFixed(2)} Bs</td>
                      <td className="text-end">{venta.toFixed(2)} Bs</td>
                      <td className="text-end text-success">{ganancia.toFixed(2)} Bs</td>
                      <td>{dayjs(s.fecha).format('DD/MM/YYYY')}</td>
                      <td>{s.vendedor?.name || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No hay servicios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}