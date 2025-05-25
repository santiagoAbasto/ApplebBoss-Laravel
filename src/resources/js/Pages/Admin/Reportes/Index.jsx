import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import SalesChart from '@/Components/SalesChart';
import dayjs from 'dayjs';

export default function ReporteIndex({ ventas, resumen, resumen_grafico, filtros, vendedores }) {
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

  const handleExportarPDF = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();
    window.open(route('admin.reportes.exportar') + '?' + queryParams, '_blank');
  };

  const badgeEstado = (estado) => {
    switch (estado) {
      case 'vendido': return <span className="badge bg-danger">Vendido</span>;
      case 'permuta': return <span className="badge bg-warning text-dark">Permuta</span>;
      case 'disponible': return <span className="badge bg-success">Disponible</span>;
      default: return <span className="badge bg-secondary">—</span>;
    }
  };

  return (
    <AdminLayout>
      <Head title="Reportes de Ventas" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-primary">📈 Reportes de Ventas</h1>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-primary btn-sm" onClick={() => window.open(route('admin.reportes.exportar-dia'), '_blank')}>📅 Día</button>
          <button className="btn btn-outline-info btn-sm" onClick={() => window.open(route('admin.reportes.exportar-semana'), '_blank')}>📆 Semana</button>
          <button className="btn btn-outline-success btn-sm" onClick={() => window.open(route('admin.reportes.exportar-mes'), '_blank')}>📅 Mes</button>
          <button className="btn btn-outline-dark btn-sm" onClick={() => window.open(route('admin.reportes.exportar-anio'), '_blank')}>📊 Año</button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleExportarPDF}>🧾 Exportar por Filtros</button>
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

      {resumen_grafico?.length > 0 && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <h5 className="text-secondary mb-3">📊 Gráfico de Ventas</h5>
            <SalesChart datos={resumen_grafico} />
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-success shadow-sm">
            <div className="card-body text-success text-center">
              <h6>Total Ventas</h6>
              <h5>{resumen.total_ventas.toFixed(2)} Bs</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-primary shadow-sm">
            <div className="card-body text-primary text-center">
              <h6>Ganancia Líquida Productos</h6>
              <h5>{resumen.ganancia_liquida.toFixed(2)} Bs</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-info shadow-sm">
            <div className="card-body text-info text-center">
              <h6>Ganancia Servicios Técnicos</h6>
              <h5>{resumen.ganancia_servicio.toFixed(2)} Bs</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-danger shadow-sm">
            <div className="card-body text-danger text-center">
              <h6>Descuentos Aplicados</h6>
              <h5>{resumen.total_descuento.toFixed(2)} Bs</h5>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow mb-4">
        <div className="card-body">
          <h5 className="text-secondary mb-3">📄 Detalle de Ventas</h5>
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Producto Vendido</th>
                  <th>Tipo</th>
                  <th>Cant.</th>
                  <th>Descuento</th>
                  <th>A Pagar</th>
                  <th>Ganancia</th>
                  <th>Vendedor</th>
                  <th>Estado</th>
                  <th>Producto Entregado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length > 0 ? (
                  ventas.map((v) => {
                    const ganancia = parseFloat(v.ganancia_neta || 0);
                    return (
                      <tr key={v.id}>
                        <td>{dayjs(v.fecha ?? v.created_at).format('DD/MM/YYYY')}</td>
                        <td>{v.celular?.modelo || v.computadora?.nombre || v.producto_general?.nombre || 'Servicio Técnico'}</td>
                        <td>{v.tipo_venta?.replace('_', ' ') || '-'}</td>
                        <td>{v.cantidad}</td>
                        <td>{parseFloat(v.descuento || 0).toFixed(2)} Bs</td>
                        <td>
                          {parseFloat(v.subtotal).toFixed(2)} Bs
                          {v.es_permuta && <div className="text-muted small">(Permuta)</div>}
                        </td>
                        <td className={ganancia < 0 ? 'text-danger' : 'text-success'}>
                          {ganancia < 0
                            ? `Se invirtió ${Math.abs(ganancia).toFixed(2)} Bs`
                            : `${ganancia.toFixed(2)} Bs`}
                        </td>
                        <td>{v.vendedor?.name || '—'}</td>
                        <td>{badgeEstado(v.celular?.estado || v.computadora?.estado || v.producto_general?.estado)}</td>
                        <td>
                          {v.es_permuta ? (
                            <>
                              {v.tipo_permuta === 'celular' && v.permuta?.modelo && <span>{v.permuta.modelo} ({v.permuta.imei_1})</span>}
                              {v.tipo_permuta === 'computadora' && v.permuta?.nombre && <span>{v.permuta.nombre} (Serie: {v.permuta.numero_serie})</span>}
                              {v.tipo_permuta === 'producto_general' && v.permuta?.nombre && <span>{v.permuta.nombre} (Código: {v.permuta.codigo})</span>}
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">No hay resultados para los filtros seleccionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
