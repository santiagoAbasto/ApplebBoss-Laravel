import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import SalesChart from '@/Components/SalesChart';

export default function ReporteIndex({ ventas, resumen, resumen_grafico, filtros }) {
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
    router.visit(route('admin.reportes.exportar'), {
      method: 'get',
      data: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        vendedor_id: vendedorId,
      },
    });
  };

  const badgeEstado = (estado) => {
    switch (estado) {
      case 'vendido': return <span className="badge bg-danger">Vendido</span>;
      case 'permuta': return <span className="badge bg-warning text-dark">Permuta</span>;
      case 'disponible': return <span className="badge bg-success">Disponible</span>;
      default: return <span className="badge bg-secondary">-</span>;
    }
  };

  return (
    <AdminLayout>
      <Head title="📊 Reportes de Ventas" />

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h1 className="h3 text-gray-800">📊 Reportes de Ventas</h1>
        <button className="btn btn-danger" onClick={handleExportarPDF}>
          📄 Exportar PDF
        </button>
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

      {/* Gráfico */}
      {resumen_grafico?.length > 0 && (
        <div className="mb-4">
          <SalesChart datos={resumen_grafico} />
        </div>
      )}

      {/* Resumen Numérico */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h5>📋 Resumen</h5>
          <p><strong>Total Ventas:</strong> {resumen.total_ventas.toFixed(2)} Bs</p>
          <p><strong>Ganancia Total:</strong> {resumen.total_ganancia.toFixed(2)} Bs</p>
          <p><strong>Ganancia por Servicios:</strong> {resumen.ganancia_servicio.toFixed(2)} Bs</p>
          <p><strong>Ganancia Líquida:</strong> {resumen.ganancia_liquida.toFixed(2)} Bs</p>
          <p><strong>Ventas por Servicio Técnico:</strong> {resumen.ventas_servicio.toFixed(2)} Bs</p>
          <p><strong>Total Descuentos:</strong> {resumen.total_descuento.toFixed(2)} Bs</p>
          <p><strong>Cantidad Vendida:</strong> {resumen.cantidad_total}</p>
          <p><strong>Totales por Tipo:</strong> {Object.entries(resumen.totales_por_tipo).map(([tipo, total]) => `${tipo}: ${total.toFixed(2)} Bs`).join(', ')}</p>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Producto Vendido</th>
                <th>Tipo de Venta</th>
                <th>Cantidad</th>
                <th>Descuento</th>
                <th>Diferencia a Pagar</th>
                <th>Ganancia</th>
                <th>Vendedor</th>
                <th>Estado Producto</th>
                <th>Producto Entregado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length > 0 ? (
                ventas.map((v) => (
                  <tr key={v.id}>
                    <td>{v.fecha}</td>
                    <td>{v.celular?.modelo || v.computadora?.nombre || v.producto_general?.nombre || 'Servicio Técnico'}</td>
                    <td>{v.tipo_venta?.replace('_', ' ') || '-'}</td>
                    <td>{v.cantidad}</td>
                    <td>{v.descuento ? parseFloat(v.descuento).toFixed(2) + ' Bs' : '0.00 Bs'}</td>
                    <td>
                      {parseFloat(v.subtotal).toFixed(2)} Bs
                      {v.descuento > 0 && <div className="text-danger small">(-{parseFloat(v.descuento).toFixed(2)} Bs)</div>}
                      {v.es_permuta && <span className="text-muted small d-block">(Permuta)</span>}
                    </td>
                    <td>{v.ganancia_neta !== null && !isNaN(v.ganancia_neta) ? parseFloat(v.ganancia_neta).toFixed(2) + ' Bs' : '0.00 Bs'}</td>
                    <td>{v.vendedor?.name || 'Sin asignar'}</td>
                    <td>{badgeEstado(v.celular?.estado || v.computadora?.estado || v.producto_general?.estado)}</td>
                    <td>
                      {v.es_permuta ? (
                        <>
                          {v.tipo_permuta === 'celular' && v.permuta?.modelo && (<span>{v.permuta.modelo} ({v.permuta.imei_1})</span>)}
                          {v.tipo_permuta === 'computadora' && v.permuta?.nombre && (<span>{v.permuta.nombre} (Serie: {v.permuta.numero_serie})</span>)}
                          {v.tipo_permuta === 'producto_general' && v.permuta?.nombre && (<span>{v.permuta.nombre} (Código: {v.permuta.codigo})</span>)}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center text-muted">No hay resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
