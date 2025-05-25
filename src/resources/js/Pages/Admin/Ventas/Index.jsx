import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ ventas }) {
  // 🧮 Calcular total de ganancias positivas
  const gananciaTotal = ventas.reduce((total, v) => {
    const g = parseFloat(v.ganancia_neta || 0);
    return g > 0 ? total + g : total;
  }, 0);

  return (
    <AdminLayout>
      <Head title="Listado de Ventas" />
      <div className="d-flex justify-content-between mb-4">
        <h1 className="h3">📋 Ventas Registradas</h1>
        <Link href={route('admin.ventas.create')} className="btn btn-primary">+ Nueva Venta</Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-primary text-center">
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Precio Venta</th>
                <th>Descuento</th>
                <th>Permuta</th>
                <th>Precio Final</th>
                <th>Ganancia Líquida</th>
                <th>Vendedor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length > 0 ? (
                ventas.map(v => {
                  const precioVenta = parseFloat(v.precio_venta || 0);
                  const descuento = parseFloat(v.descuento || 0);
                  const permuta =
                    parseFloat(v.entregado_celular?.precio_costo || 0) ||
                    parseFloat(v.entregado_computadora?.precio_costo || 0) ||
                    parseFloat(v.entregado_producto_general?.precio_costo || 0);
                  const subtotal = parseFloat(v.subtotal || 0);
                  const ganancia = parseFloat(v.ganancia_neta || 0);

                  const productoVendido = v.tipo_venta === 'servicio_tecnico'
                    ? 'Servicio Técnico'
                    : (
                        v.celular?.modelo ||
                        v.computadora?.nombre ||
                        v.producto_general?.nombre ||
                        '—'
                      );

                  return (
                    <tr key={v.id}>
                      <td>{v.nombre_cliente}</td>
                      <td>{productoVendido}</td>
                      <td className="text-end">{precioVenta.toFixed(2)} Bs</td>
                      <td className="text-end text-danger">-{descuento.toFixed(2)} Bs</td>
                      <td className="text-end text-warning">-{permuta.toFixed(2)} Bs</td>
                      <td className="text-end fw-bold">{subtotal.toFixed(2)} Bs</td>
                      <td className={`text-end ${ganancia < 0 ? 'text-danger' : 'text-success'}`}>
                        {ganancia < 0
                          ? `Se invirtió ${Math.abs(ganancia).toFixed(2)} Bs`
                          : `${ganancia.toFixed(2)} Bs`}
                      </td>
                      <td>{v.vendedor?.name || '—'}</td>
                      <td>{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted">No hay ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 🧮 Total de ganancias positivas */}
          <div className="text-end mt-3">
            <strong className={gananciaTotal > 0 ? 'text-success' : 'text-muted'}>
              Ganancia Total (positiva):
            </strong>{' '}
            {gananciaTotal.toFixed(2)} Bs
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
