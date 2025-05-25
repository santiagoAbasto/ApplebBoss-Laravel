import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ComputadorasIndex({ computadoras }) {
  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar esta computadora?')) {
      router.delete(route('admin.computadoras.destroy', id));
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar esta computadora para la venta?')) {
      router.patch(route('admin.computadoras.habilitar', id));
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'disponible': return 'success';
      case 'vendido': return 'danger';
      case 'permuta': return 'info';
      default: return 'secondary';
    }
  };

  const formatEstado = (estado) =>
    estado.charAt(0).toUpperCase() + estado.slice(1);

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
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>Procesador</th>
                <th>Serie</th>
                <th>RAM</th>
                <th>Almacenamiento</th>
                <th>Precio Venta (Bs)</th>
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {computadoras.map((pc) => (
                <tr key={pc.id}>
                  <td>{pc.nombre}</td>
                  <td>{pc.procesador || <span className="text-muted">—</span>}</td>
                  <td>{pc.numero_serie}</td>
                  <td>{pc.ram}</td>
                  <td>{pc.almacenamiento}</td>
                  <td>{parseFloat(pc.precio_venta).toFixed(2)} Bs</td>
                  <td>
                    <span className={`badge bg-${getBadgeClass(pc.estado)} px-3 py-2 text-uppercase fw-semibold`}>
                      {formatEstado(pc.estado)}
                    </span>
                  </td>
                  <td className="text-nowrap d-flex gap-2">
                    {pc.estado === 'permuta' ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => habilitar(pc.id)}
                      >
                        Habilitar
                      </button>
                    ) : (
                      <Link
                        href={route('admin.computadoras.edit', pc.id)}
                        className="btn btn-sm btn-warning"
                      >
                        Editar
                      </Link>
                    )}
                    <button
                      onClick={() => eliminar(pc.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {computadoras.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No hay computadoras registradas.
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
