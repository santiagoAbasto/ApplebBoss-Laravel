import { Link, Head, useForm } from '@inertiajs/react';

export default function AdminLayout({ children }) {
  const { post } = useForm();
  const pathname = window.location.pathname;

  const handleLogout = (e) => {
    e.preventDefault();
    post(route('logout'));
  };

  return (
    <>
      <Head title="Panel Admin" />
      <link rel="stylesheet" href="/sbadmin/vendor/fontawesome-free/css/all.min.css" />
      <link rel="stylesheet" href="/sbadmin/css/sb-admin-2.min.css" />
      <script src="/sbadmin/vendor/jquery/jquery.min.js" defer></script>
      <script src="/sbadmin/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
      <script src="/sbadmin/js/sb-admin-2.min.js" defer></script>

      <div id="wrapper" className="bg-gray-100 min-h-screen">
        {/* Sidebar */}
        <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
          {/* Logo */}
          <li className="nav-item">
            <Link className="sidebar-brand d-flex align-items-center justify-content-center" href="/admin/dashboard">
              <div className="sidebar-brand-icon rotate-n-15">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <div className="sidebar-brand-text mx-3">AppleBoss Admin</div>
            </Link>
          </li>

          <hr className="sidebar-divider my-0" />

          {/* Dashboard */}
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.dashboard')}>
              <i className="fas fa-fw fa-tachometer-alt me-2"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Inventario</div>

          {[
            { route: 'admin.celulares.index', icon: 'fas fa-mobile', label: 'Celulares' },
            { route: 'admin.computadoras.index', icon: 'fas fa-laptop', label: 'Computadoras' },
            { route: 'admin.productos-apple.index', icon: 'fas fa-apple-alt', label: 'Productos Apple' },
            { route: 'admin.productos-generales.index', icon: 'fas fa-box', label: 'Productos Generales' },
          ].map(({ route: r, icon, label }) => (
            <li className="nav-item" key={label}>
              <Link className="nav-link" href={route(r)}>
                <i className={`${icon} me-2`}></i>
                <span>{label}</span>
              </Link>
            </li>
          ))}

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Operaciones</div>

          {[
            { route: 'admin.ventas.index', icon: 'fas fa-shopping-cart', label: 'Ventas' },
            { route: 'admin.servicios.index', icon: 'fas fa-tools', label: 'Servicio Técnico' },
            { route: 'admin.reportes.index', icon: 'fas fa-chart-line', label: 'Reportes' },
            { route: 'admin.cotizaciones.index', icon: 'fas fa-file-invoice-dollar', label: 'Cotizaciones' },
          ].map(({ route: r, icon, label }) => (
            <li className="nav-item" key={label}>
              <Link className="nav-link" href={route(r)}>
                <i className={`${icon} me-2`}></i>
                <span>{label}</span>
              </Link>
            </li>
          ))}

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Exportaciones</div>

          <li className="nav-item">
            <Link className="nav-link" href={route('admin.exportaciones.index')}>
              <i className="fas fa-file-export me-2"></i>
              <span>Exportaciones</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${pathname.startsWith('/admin/clientes') ? 'active bg-white text-dark fw-bold' : ''}`}
              href="/admin/clientes"
            >
              <i className="fas fa-users me-2"></i>
              <span>Mis Clientes</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />

          {/* Cerrar sesión */}
          <li className="nav-item mt-3">
            <a href="#" className="nav-link text-white" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2"></i>
              <span>Cerrar sesión</span>
            </a>
          </li>
        </ul>

        {/* Contenido */}
        <div id="content-wrapper" className="d-flex flex-column w-full">
          <div id="content" className="container-fluid py-4 px-4">
            <div className="bg-white shadow rounded p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
