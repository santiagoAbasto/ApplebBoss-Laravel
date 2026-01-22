import { Head, Link, usePage, router } from '@inertiajs/react';

export default function VendedorLayout({ children }) {
  const { auth } = usePage().props;
  const pathname = window.location.pathname;

  const handleLogout = () => {
    router.post(route('logout'));
  };

  // 🔥 FUNCIÓN ACTIVA CORRECTA (NO MÁS DOBLE MARCADO)
  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <Head title="Panel Vendedor | Apple Boss" />

      {/* SB ADMIN ASSETS */}
      <link rel="stylesheet" href="/sbadmin/vendor/fontawesome-free/css/all.min.css" />
      <link rel="stylesheet" href="/sbadmin/css/sb-admin-2.min.css" />

      <script src="/sbadmin/vendor/jquery/jquery.min.js" defer></script>
      <script src="/sbadmin/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
      <script src="/sbadmin/js/sb-admin-2.min.js" defer></script>

      {/* WRAPPER */}
      <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

        {/* SIDEBAR */}
        <aside
          className="position-fixed d-flex flex-column"
          style={{
            width: 260,
            height: '100vh',
            backgroundColor: '#0f3d2e',
            color: '#fff',
          }}
        >
          {/* BRAND */}
          <div
            className="d-flex align-items-center gap-3 px-4"
            style={{ height: 72, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <i className="fas fa-store fa-lg"></i>
            <span className="fw-bold fs-5">Apple Boss</span>
          </div>

          {/* NAV */}
          <nav className="flex-grow-1 px-3 py-4">
            <ul className="nav flex-column gap-2">

              {/* ===== PRINCIPAL ===== */}
              <li className="px-2">
                <hr className="my-3 opacity-25" />
                <div className="text-uppercase small fw-semibold text-white-50">
                  Principal
                </div>
              </li>

              {[
                { href: '/vendedor/dashboard', icon: 'fa-chart-line', label: 'Panel Principal', exact: true },
              ].map(({ href, icon, label, exact }) => {
                const active = isActive(href, exact);
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className="d-flex align-items-center gap-3 px-3 py-3 rounded text-decoration-none"
                      style={{
                        color: active ? '#0f3d2e' : 'rgba(255,255,255,0.85)',
                        backgroundColor: active ? '#ffffff' : 'transparent',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <i className={`fas ${icon}`} style={{ width: 18 }} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}

              {/* ===== OPERACIONES ===== */}
              <li className="px-2">
                <hr className="my-3 opacity-25" />
                <div className="text-uppercase small fw-semibold text-white-50">
                  Operaciones
                </div>
              </li>

              {[
                { href: '/vendedor/productos', icon: 'fa-box-open', label: 'Ver Productos' },
                { href: '/vendedor/ventas', icon: 'fa-file-invoice-dollar', label: 'Mis Ventas', exact: true },
                { href: '/vendedor/ventas/create', icon: 'fa-receipt', label: 'Registrar Venta', exact: true },
                { href: '/vendedor/cotizaciones', icon: 'fa-file-alt', label: 'Mis Cotizaciones' },
              ].map(({ href, icon, label, exact }) => {
                const active = isActive(href, exact);
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className="d-flex align-items-center gap-3 px-3 py-3 rounded text-decoration-none"
                      style={{
                        color: active ? '#0f3d2e' : 'rgba(255,255,255,0.85)',
                        backgroundColor: active ? '#ffffff' : 'transparent',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <i className={`fas ${icon}`} style={{ width: 18 }} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}

              {/* ===== GESTIÓN ===== */}
              <li className="px-2">
                <hr className="my-3 opacity-25" />
                <div className="text-uppercase small fw-semibold text-white-50">
                  Gestión
                </div>
              </li>

              {[
                { href: '/vendedor/servicios', icon: 'fa-tools', label: 'Servicio Técnico' },
                { href: '/vendedor/clientes', icon: 'fa-users', label: 'Mis Clientes' },
              ].map(({ href, icon, label }) => {
                const active = isActive(href);
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className="d-flex align-items-center gap-3 px-3 py-3 rounded text-decoration-none"
                      style={{
                        color: active ? '#0f3d2e' : 'rgba(255,255,255,0.85)',
                        backgroundColor: active ? '#ffffff' : 'transparent',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <i className={`fas ${icon}`} style={{ width: 18 }} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}

            </ul>
          </nav>

          {/* FOOTER SIDEBAR */}
          <div
            className="text-center small py-3"
            style={{ color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            Apple Boss © 2026
          </div>
        </aside>

        {/* CONTENT */}
        <main
          className="flex-grow-1 d-flex flex-column"
          style={{ marginLeft: 260 }}
        >
          {/* TOPBAR */}
          <header
            className="d-flex align-items-center justify-content-between px-4"
            style={{
              height: 72,
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div>
              <div className="fw-semibold text-success">Panel del Vendedor</div>
              <div className="text-muted small">Gestión de ventas y clientes</div>
            </div>

            <div className="text-end">
              <div className="fw-semibold small">{auth?.user?.name}</div>
              <div className="text-muted small">Vendedor</div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <section className="flex-grow-1" style={{ overflowY: 'auto' }}>
            <div className="mx-auto" style={{ padding: '1.75rem', maxWidth: 1600 }}>
              {children}
            </div>
          </section>

          {/* FOOTER */}
          <footer
            className="text-center small text-muted py-3"
            style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}
          >
            © Apple Technology 2026 · Todos los derechos reservados
          </footer>
        </main>
      </div>
    </>
  );
}
