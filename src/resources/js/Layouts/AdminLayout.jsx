import { Link, Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import ConfirmLogoutModal from '@/Components/ConfirmLogoutModal';

export default function AdminLayout({ children }) {
  const { post } = useForm();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

        {/* ================= SIDEBAR ================= */}
        <ul
          className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
          id="accordionSidebar"
        >
          {/* BRAND */}
          <Link
            className="sidebar-brand d-flex align-items-center justify-content-center"
            href={route('admin.dashboard')}
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
                setShowLogoutModal(true);
              }}
            >
              <i className="fas fa-fw fa-sign-out-alt"></i>
              <span>Cerrar sesión</span>
            </a>
          </li>
        </ul>

        {/* ================= CONTENT ================= */}
        <div id="content-wrapper" className="d-flex flex-column">
          <div id="content">

            {/* TOPBAR */}
            <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
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
      <Link className="nav-link" href={route(r)}>
        <i className={`fas fa-fw ${icon}`}></i>
        <span>{label}</span>
      </Link>
    </li>
  );
}
