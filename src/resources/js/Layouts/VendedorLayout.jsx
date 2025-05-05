import { Head, Link } from '@inertiajs/react';

export default function VendedorLayout({ children }) {
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
            <div className="sidebar-brand-text mx-3">AppleBoss Vendedor</div>
          </Link>

          <hr className="sidebar-divider my-0" />

          <li className="nav-item">
            <Link className="nav-link" href="/vendedor/dashboard">
              <i className="fas fa-fw fa-cash-register"></i>
              <span>Panel Principal</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" href="#">
              <i className="fas fa-fw fa-box-open"></i>
              <span>Ver Productos</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" href="#">
              <i className="fas fa-fw fa-receipt"></i>
              <span>Registrar Venta</span>
            </Link>
          </li>
        </ul>

        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column">
          <div id="content" className="container-fluid pt-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
