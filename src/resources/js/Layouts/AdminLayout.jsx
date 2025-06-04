import { Link, Head, useForm } from '@inertiajs/react';

export default function AdminLayout({ children }) {
  const { post } = useForm();

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
              <i className="fas fa-fw fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Inventario</div>

          <li className="nav-item">
            <Link className="nav-link" href={route('admin.celulares.index')}>
              <i className="fas fa-mobile"></i>
              <span>Celulares</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.computadoras.index')}>
              <i className="fas fa-laptop"></i>
              <span>Computadoras</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.productos-apple.index')}>
              <i className="fas fa-apple-alt"></i>
              <span>Productos Apple</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.productos-generales.index')}>
              <i className="fas fa-box"></i>
              <span>Productos Generales</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Operaciones</div>

          <li className="nav-item">
            <Link className="nav-link" href={route('admin.ventas.index')}>
              <i className="fas fa-shopping-cart"></i>
              <span>Ventas</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.servicios.index')}>
              <i className="fas fa-tools"></i>
              <span>Servicio Técnico</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.reportes.index')}>
              <i className="fas fa-chart-line"></i>
              <span>Reportes</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" href={route('admin.cotizaciones.index')}>
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Cotizaciones</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />
          <div className="sidebar-heading text-sm text-white px-3">Exportaciones</div>

          <li className="nav-item">
            <Link className="nav-link" href={route('admin.exportaciones.index')}>
              <i className="fas fa-file-export"></i>
              <span>Exportaciones</span>
            </Link>
          </li>

          <hr className="sidebar-divider" />

          {/* Cerrar sesión */}
          <li className="nav-item mt-3">
            <a href="#" className="nav-link text-white" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
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
