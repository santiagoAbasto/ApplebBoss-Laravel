import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ user, resumen }) {
  return (
    <AdminLayout>
      <Head title="Panel de Administración" />

      <div className="mb-5">
        <h1 className="h3 text-primary fw-bold">👋 Bienvenido, {user?.name || 'Administrador'}</h1>
        <p className="text-muted">Desde este panel puedes gestionar productos, ventas, reportes y más.</p>
      </div>

      {/* Tarjetas dinámicas */}
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card shadow border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-primary text-uppercase fw-bold mb-1">Ventas Hoy</h6>
                  <h4 className="mb-0">Bs {resumen?.ventas_hoy?.toLocaleString() || '0.00'}</h4>
                </div>
                <i className="bi bi-cash-coin fs-3 text-primary"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-success text-uppercase fw-bold mb-1">Productos en Stock</h6>
                  <h4 className="mb-0">{resumen?.stock_total || 0}</h4>
                </div>
                <i className="bi bi-box-seam fs-3 text-success"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-warning text-uppercase fw-bold mb-1">Permutas Registradas</h6>
                  <h4 className="mb-0">{resumen?.permutas || 0}</h4>
                </div>
                <i className="bi bi-arrow-left-right fs-3 text-warning"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-danger text-uppercase fw-bold mb-1">Servicios Técnicos</h6>
                  <h4 className="mb-0">{resumen?.servicios || 0}</h4>
                </div>
                <i className="bi bi-tools fs-3 text-danger"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
