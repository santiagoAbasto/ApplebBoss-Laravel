import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

export default function ServiciosIndex({ servicios }) {
  return (
    <AdminLayout>
      <Head title="Servicio Técnico" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">🧰 Servicios Técnicos</h1>
        <Link href={route('admin.servicios.create')} className="btn btn-primary">
          + Registrar Servicio
        </Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Precio Venta</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length > 0 ? (
                servicios.map((s) => (
                  <tr key={s.id}>
                    <td>{s.cliente}</td>
                    <td>{s.equipo}</td>
                    <td>{s.tecnico}</td>
                    <td>{parseFloat(s.precio_venta).toFixed(2)} Bs</td>
                    <td>{new Date(s.fecha).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
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
