import { Link, Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import ConfirmLogoutModal from '@/Components/ConfirmLogoutModal';

export default function AdminLayout({ children }) {
  const { post } = useForm();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 992px)').matches : true
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 992px)');
    const onChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <>
      <Head title="Panel Admin | Apple Boss" />

      {/* ================= SB ADMIN CSS ================= */}
      <link
        rel="stylesheet"
        href="/sbadmin/vendor/fontawesome-free/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="/sbadmin/css/sb-admin-2.min.css"
      />

      <div id="wrapper">
        {!isDesktop && sidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={handleCloseSidebar}
            className="d-lg-none"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              border: 0,
              zIndex: 1035,
            }}
          />
        )}

        {/* ================= SIDEBAR ================= */}
        <ul
          className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
          id="accordionSidebar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 1040,
            width: 260,
            transform: isDesktop || sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          }}
        >
          {/* BRAND */}
          <Link
            className="sidebar-brand d-flex align-items-center justify-content-center"
            href={route('admin.dashboard')}
            prefetch="hover"
          >
            <div className="sidebar-brand-icon rotate-n-15">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <div className="sidebar-brand-text mx-3">
              Apple Boss
            </div>
          </Link>

          <hr className="sidebar-divider my-0" />

          <SidebarItem
            route="admin.dashboard"
            icon="fa-tachometer-alt"
            label="Dashboard"
          />

          <hr className="sidebar-divider" />
          <div className="sidebar-heading">Inventario</div>

          <SidebarItem route="admin.celulares.index" icon="fa-mobile" label="Celulares" />
          <SidebarItem route="admin.computadoras.index" icon="fa-laptop" label="Computadoras" />
          <SidebarItem route="admin.productos-apple.index" icon="fa-apple-alt" label="Productos Apple" />
          <SidebarItem route="admin.productos-generales.index" icon="fa-box" label="Productos Generales" />

          <hr className="sidebar-divider" />
          <div className="sidebar-heading">Operaciones</div>

          <SidebarItem route="admin.ventas.index" icon="fa-shopping-cart" label="Ventas" />
          <SidebarItem route="admin.servicios.index" icon="fa-tools" label="Servicio Técnico" />
          <SidebarItem route="admin.reportes.index" icon="fa-chart-line" label="Reportes" />
          <SidebarItem route="admin.cotizaciones.index" icon="fa-file-invoice-dollar" label="Cotizaciones" />
          <SidebarItem route="admin.egresos.index" icon="fa-hand-holding-usd" label="Egresos" />

          <hr className="sidebar-divider" />
          <div className="sidebar-heading">Exportaciones</div>

          <SidebarItem
            route="admin.exportaciones.index"
            icon="fa-file-export"
            label="Exportaciones"
          />

          <hr className="sidebar-divider" />
          <div className="sidebar-heading">Clientes</div>

          <SidebarItem
            route="admin.clientes.index"
            icon="fa-users"
            label="Mis Clientes"
          />

          <hr className="sidebar-divider" />

          {/* 🔴 LOGOUT — ICONO VISIBLE */}
          <li className="nav-item mb-3">
            <a
              href="#"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleCloseSidebar();
                setShowLogoutModal(true);
              }}
            >
              <i className="fas fa-fw fa-sign-out-alt"></i>
              <span>Cerrar sesión</span>
            </a>
          </li>
        </ul>

        {/* ================= CONTENT ================= */}
        <div
          id="content-wrapper"
          className="d-flex flex-column"
          style={{ width: '100%', minHeight: '100vh', marginLeft: isDesktop ? 260 : 0 }}
        >
          <div id="content">

            {/* TOPBAR */}
            <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
              <button
                type="button"
                className="btn btn-link d-lg-none text-decoration-none mr-2"
                onClick={handleOpenSidebar}
                aria-label="Abrir menú"
              >
                <i className="fas fa-bars"></i>
              </button>
              <span className="fw-bold ms-3">
                Panel de Administración
              </span>
            </nav>

            {/* MAIN CONTENT */}
            <div className="container-fluid pb-4">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ================= LOGOUT MODAL ================= */}
      <ConfirmLogoutModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => post(route('logout'))}
      />
    </>
  );
}

/* ================= SIDEBAR ITEM ================= */
function SidebarItem({ route: r, icon, label }) {
  return (
    <li className="nav-item">
      <Link className="nav-link" href={route(r)} prefetch="hover">
        <i className={`fas fa-fw ${icon}`}></i>
        <span>{label}</span>
      </Link>
    </li>
  );
}
