import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ComputadorasIndex({ computadoras }) {
  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar esta computadora?')) {
      router.delete(route('admin.computadoras.destroy', id));
    }
  };

  return (
    <AdminLayout>
      <Head title="Computadoras" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-gray-800">💻 Computadoras</h1>
        <Link href={route('admin.computadoras.create')} className="btn btn-primary">
          + Registrar Computadora
        </Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Serie</th>
                <th>RAM</th>
                <th>Almacenamiento</th>
                <th>Precio Venta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {computadoras.map((pc) => (
                <tr key={pc.id}>
                  <td>{pc.nombre}</td>
                  <td>{pc.numero_serie}</td>
                  <td>{pc.ram}</td>
                  <td>{pc.almacenamiento}</td>
                  <td>{pc.precio_venta} Bs</td>
                  <td><span className="badge bg-success">{pc.estado}</span></td>
                  <td className="text-nowrap">
                    <Link href={route('admin.computadoras.edit', pc.id)} className="btn btn-sm btn-warning me-2">
                      Editar
                    </Link>
                    <button onClick={() => eliminar(pc.id)} className="btn btn-sm btn-danger">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {computadoras.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted">No hay computadoras registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
