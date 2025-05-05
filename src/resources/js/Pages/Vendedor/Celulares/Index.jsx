import { Head } from '@inertiajs/react';
import VendedorLayout from '@/Layouts/VendedorLayout';

export default function CelularesIndex({ celulares }) {
  return (
    <VendedorLayout>
      <Head title="Celulares en Inventario" />
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Celulares en inventario</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Capacidad</th>
                  <th>Color</th>
                  <th>Imei 1</th>
                  <th>Imei 2</th>
                  <th>Estado IMEI</th>
                  <th>Procedencia</th>
                  <th>Precio Venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {celulares.map((celular) => (
                  <tr key={celular.id}>
                    <td>{celular.modelo}</td>
                    <td>{celular.capacidad}</td>
                    <td>{celular.color}</td>
                    <td>{celular.imei_1}</td>
                    <td>{celular.imei_2 || '—'}</td>
                    <td>{celular.estado_imei}</td>
                    <td>{celular.procedencia}</td>
                    <td>{celular.precio_venta} Bs</td>
                    <td>
                      <span className={`badge bg-${getEstadoColor(celular.estado)}`}>
                        {celular.estado}
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
