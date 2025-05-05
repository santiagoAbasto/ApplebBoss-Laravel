import { Head } from '@inertiajs/react';
import VendedorLayout from '@/Layouts/VendedorLayout';

export default function ProductosGeneralesIndex({ productos }) {
  return (
    <VendedorLayout>
      <Head title="Productos Generales en Inventario" />
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-success">Productos Generales</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Procedencia</th>
                  <th>Precio Venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>{item.tipo}</td>
                    <td>{item.nombre || '—'}</td>
                    <td>{item.procedencia}</td>
                    <td>{item.precio_venta} Bs</td>
                    <td>
                      <span className={`badge bg-${getEstadoColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
}

function getEstadoColor(estado) {
  switch (estado) {
    case 'disponible':
      return 'success';
    case 'vendido':
      return 'secondary';
    case 'permuta':
      return 'warning';
    default:
      return 'light';
  }
}
