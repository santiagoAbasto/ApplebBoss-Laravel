import { Head } from '@inertiajs/react';
import VendedorLayout from '@/Layouts/VendedorLayout';

export default function ComputadorasIndex({ computadoras }) {
  return (
    <VendedorLayout>
      <Head title="Computadoras en Inventario" />
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-success">Computadoras en inventario</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Serie</th>
                  <th>RAM</th>
                  <th>Almacenamiento</th>
                  <th>Batería</th>
                  <th>Color</th>
                  <th>Procedencia</th>
                  <th>Precio Venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {computadoras.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.numero_serie}</td>
                    <td>{item.ram}</td>
                    <td>{item.almacenamiento}</td>
                    <td>{item.bateria}</td>
                    <td>{item.color}</td>
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
