import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ ventas }) {
  return (
    <VendedorLayout>
      <Head title="Mis Ventas" />
      <div className="d-flex justify-content-between mb-4">
        <h1 className="h3">📋 Mis Ventas</h1>
        <Link href={route('vendedor.ventas.create')} className="btn btn-primary">+ Nueva Venta</Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Total Venta</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <td>{v.nombre_cliente}</td>
                  <td>
                    {v.celular?.modelo || v.computadora?.modelo || v.producto_general?.nombre || '—'}
                  </td>
                  <td>{parseFloat(v.precio_venta).toFixed(2)} Bs</td>
                  <td>{new Date(v.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr><td colSpan="4" className="text-center text-muted">No hay ventas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </VendedorLayout>
  );
}
