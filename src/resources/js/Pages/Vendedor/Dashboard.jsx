import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Dashboard({ auth }) {
  const handleLogout = () => {
    router.post(route('logout'));
  };

  return (
    <VendedorLayout>
      <Head title="Panel del Vendedor" />

      {/* Encabezado con botón de cierre de sesión */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-primary fw-bold">👨‍💼 Bienvenido, {auth?.user?.name}</h1>
          <p className="text-muted mb-0">Este es tu panel de trabajo como vendedor</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-danger btn-sm shadow-sm"
        >
          <i className="fas fa-sign-out-alt me-1"></i> Cerrar Sesión
        </button>
      </div>

      {/* Tarjetas de acción */}
      <div className="row g-4">
        {/* Ver Productos */}
        <div className="col-xl-3 col-md-6">
          <Link href={route('vendedor.productos.index')} className="text-decoration-none">
            <div className="card border-left-success shadow h-100 py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-success fw-bold small mb-1">Ver Productos</div>
                  <div className="h6 fw-bold text-dark">Inventario disponible</div>
                </div>
                <i className="fas fa-box-open fa-2x text-success"></i>
              </div>
            </div>
          </Link>
        </div>

        {/* Registrar Venta */}
        <div className="col-xl-3 col-md-6">
          <Link href={route('vendedor.ventas.create')} className="text-decoration-none">
            <div className="card border-left-info shadow h-100 py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-info fw-bold small mb-1">Registrar Venta</div>
                  <div className="h6 fw-bold text-dark">Inicia una nueva venta</div>
                </div>
                <i className="fas fa-receipt fa-2x text-info"></i>
              </div>
            </div>
          </Link>
        </div>

        {/* Registrar Servicio Técnico */}
        <div className="col-xl-3 col-md-6">
          <Link href={route('vendedor.servicios.create')} className="text-decoration-none">
            <div className="card border-left-warning shadow h-100 py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-warning fw-bold small mb-1">Servicio Técnico</div>
                  <div className="h6 fw-bold text-dark">Registrar nuevo servicio</div>
                </div>
                <i className="fas fa-tools fa-2x text-warning"></i>
              </div>
            </div>
          </Link>
        </div>

        {/* Crear Cotización */}
        <div className="col-xl-3 col-md-6">
          <Link href={route('vendedor.cotizaciones.create')} className="text-decoration-none">
            <div className="card border-left-primary shadow h-100 py-3 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-primary fw-bold small mb-1">Cotización</div>
                  <div className="h6 fw-bold text-dark">Generar cotización rápida</div>
                </div>
                <i className="fas fa-file-alt fa-2x text-primary"></i>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </VendedorLayout>
  );
}
