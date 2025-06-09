import { Head, Link, usePage, router } from '@inertiajs/react';

export default function VendedorLayout({ children }) {
  const url = window.location.pathname;
  const { auth } = usePage().props;

  const handleLogout = () => {
    router.post(route('logout'));
  };

  return (
    <>
      <Head title="Panel Vendedor" />
      <link rel="stylesheet" href="/sbadmin/vendor/fontawesome-free/css/all.min.css" />
      <link rel="stylesheet" href="/sbadmin/css/sb-admin-2.min.css" />
      <script src="/sbadmin/vendor/jquery/jquery.min.js" defer></script>
      <script src="/sbadmin/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
      <script src="/sbadmin/js/sb-admin-2.min.js" defer></script>

      <div id="wrapper">
        {/* Sidebar */}
        <ul className="navbar-nav bg-gradient-success sidebar sidebar-dark accordion" id="accordionSidebar">
          <Link className="sidebar-brand d-flex align-items-center justify-content-center" href="/vendedor/dashboard">
            <div className="sidebar-brand-icon">
              <i className="fas fa-store"></i>
            </div>
            <div className="sidebar-brand-text mx-3">AppleBoss Vendedor</div>
          </Link>

          <hr className="sidebar-divider my-0" />

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/dashboard') ? 'active' : ''}`} href="/vendedor/dashboard">
              <i className="fas fa-chart-line"></i>
              <span>Panel Principal</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/productos') ? 'active' : ''}`} href="/vendedor/productos">
              <i className="fas fa-box-open"></i>
              <span>Ver Productos</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/ventas') && !url.includes('/create') ? 'active' : ''}`} href="/vendedor/ventas">
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Mis Ventas</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/ventas/create') ? 'active' : ''}`} href="/vendedor/ventas/create">
              <i className="fas fa-receipt"></i>
              <span>Registrar Venta</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/cotizaciones') ? 'active' : ''}`} href="/vendedor/cotizaciones">
              <i className="fas fa-file-alt"></i>
              <span>Mis Cotizaciones</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className={`nav-link ${url.startsWith('/vendedor/servicios') ? 'active' : ''}`} href="/vendedor/servicios">
              <i className="fas fa-tools"></i>
              <span>Servicio Técnico</span>
            </Link>
          </li>
        </ul>

        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column">
          <div id="content">
            {/* Topbar */}
            <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow d-flex justify-content-between px-3">
              <h6 className="font-weight-bold text-success mt-2">Panel del Vendedor</h6>
              <div>
                <span className="me-3 text-dark small fw-bold">{auth?.user?.name}</span>
                <button className="btn btn-sm btn-danger shadow-sm" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-1"></i> Cerrar Sesión
                </button>
              </div>
            </nav>

            {/* Main Content */}
            <div className="container-fluid">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="sticky-footer bg-white">
            <div className="container my-auto">
              <div className="text-center my-auto small">
                <span>© AppleBoss 2025 - Todos los derechos reservados</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
