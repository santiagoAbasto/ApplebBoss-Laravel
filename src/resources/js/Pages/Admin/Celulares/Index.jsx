import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CelularesIndex({ celulares }) {
  const eliminar = (id) => {
    if (confirm('¿Deseas eliminar este celular?')) {
      router.delete(route('admin.celulares.destroy', id), {
        onSuccess: () => console.log('Celular eliminado.'),
        onError: () => alert('Hubo un error al intentar eliminar el celular.'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar este celular para la venta?')) {
      router.patch(route('admin.celulares.habilitar', id), {
        onSuccess: () => console.log('Celular habilitado.'),
        onError: () => alert('Hubo un error al intentar habilitar el celular.'),
      });
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
      <Head title="Celulares" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-gray-800">📱 Celulares</h1>
        <Link href={route('admin.celulares.create')} className="btn btn-primary">
          + Registrar Celular
        </Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-primary">
              <tr>
                <th>Modelo</th>
                <th>IMEI 1</th>
                <th>Precio Venta (Bs)</th>
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {celulares.map((c) => (
                <tr key={c.id}>
                  <td>{c.modelo}</td>
                  <td>{c.imei_1}</td>
                  <td>{parseFloat(c.precio_venta).toFixed(2)}</td>
                  <td>
                    <span className={`badge bg-${getBadgeClass(c.estado)} px-3 py-2 text-uppercase fw-semibold`}>
                      {formatEstado(c.estado)}
                    </span>
                  </td>
                  <td className="text-nowrap d-flex gap-2">
                    {c.estado === 'permuta' ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => habilitar(c.id)}
                      >
                        Habilitar
                      </button>
                    ) : (
                      <Link
                        href={route('admin.celulares.edit', c.id)}
                        className="btn btn-sm btn-warning"
                      >
                        Editar
                      </Link>
                    )}
                    <button
                      onClick={() => eliminar(c.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {celulares.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No hay celulares registrados.
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
