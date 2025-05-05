import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function ReporteIndex({ ventas, resumen, filtros }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.reportes.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  return (
    <AdminLayout>
      <Head title="📊 Reportes de Ventas" />

      <div className="mb-4">
        <h1 className="h3 text-gray-800">📊 Reportes de Ventas</h1>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFiltrar} className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Fecha Inicio</label>
          <input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fecha Fin</label>
          <input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">ID del Vendedor</label>
          <input type="number" className="form-control" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-primary w-100">Filtrar</button>
        </div>
      </form>

      {/* Resumen */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h5>📋 Resumen</h5>
          <p><strong>Total Ventas:</strong> {resumen.total_ventas.toFixed(2)} Bs</p>
          <p><strong>Ganancia Total:</strong> {resumen.total_ganancia.toFixed(2)} Bs</p>
          <p><strong>Cantidad Vendida:</strong> {resumen.cantidad_total}</p>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Venta</th>
                <th>Ganancia</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length > 0 ? (
                ventas.map((v) => (
                  <tr key={v.id}>
                    <td>{v.fecha}</td>
                    <td>{v.producto_nombre || '-'}</td>
                    <td>{v.cantidad}</td>
                    <td>{parseFloat(v.precio_venta).toFixed(2)} Bs</td>
                    <td>{parseFloat(v.ganancia).toFixed(2)} Bs</td>
                    <td>{v.vendedor?.name || 'Sin asignar'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No hay resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
