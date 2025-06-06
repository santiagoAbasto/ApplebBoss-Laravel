import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
  return (
    <VendedorLayout>
      <Head title="Panel del Vendedor" />

      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">👨‍💼 Bienvenido al Panel del Vendedor</h1>
      </div>

      <div className="row">
        <div className="col-xl-6 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Ver Productos
                  </div>
                  <div className="h6 mb-0 font-weight-bold text-gray-800">
                    Accede al inventario completo
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-box-open fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Registrar Venta
                  </div>
                  <div className="h6 mb-0 font-weight-bold text-gray-800">
                    Inicia el proceso de venta aquí
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-receipt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
}
