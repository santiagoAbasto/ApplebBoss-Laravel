import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ProductosGeneralesIndex({ productos }) {
  const eliminarProducto = (id) => {
    if (confirm('¿Deseas eliminar este producto?')) {
      router.delete(route('admin.productos-generales.destroy', id), {
        onSuccess: () => {
          console.log('Producto eliminado correctamente.');
        },
        onError: () => {
          alert('Hubo un error al intentar eliminar el producto.');
        },
      });
    }
  };

  return (
    <AdminLayout>
      <Head title="Productos Generales" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-gray-800">📦 Productos Generales</h1>
        <Link href={route('admin.productos-generales.create')} className="btn btn-primary">
          + Registrar Producto
        </Link>
      </div>

      <div className="card shadow">
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-primary">
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Precio Venta (Bs)</th>
                <th>Estado</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.tipo}</td>
                  <td>{p.nombre}</td>
                  <td>{parseFloat(p.precio_venta).toFixed(2)}</td>
                  <td>
                    <span className={`badge bg-${p.estado === 'disponible' ? 'success' : p.estado === 'vendido' ? 'secondary' : 'warning'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="text-nowrap">
                    <Link
                      href={route('admin.productos-generales.edit', p.id)}
                      className="btn btn-sm btn-warning me-2"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No hay productos registrados.
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
