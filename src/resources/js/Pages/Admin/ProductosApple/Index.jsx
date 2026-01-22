import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Apple, Plus } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudCard,
  CrudSectionTitle,
  CrudGrid,
  CrudLabel,
  CrudInput,
  CrudActions,
  CrudButtonPrimary,
  CrudButtonSecondary,
  CrudButtonDanger,
} from '@/Components/CrudUI';

export default function ProductosAppleIndex({ productos }) {
  const [busqueda, setBusqueda] = useState('');
  const flash = usePage().props.flash || {};

  /* ===============================
     ACTIONS
  =============================== */
  const eliminar = (id) => {
    if (confirm('¿Deseas eliminar este producto Apple?')) {
      router.delete(route('admin.productos-apple.destroy', id), {
        onSuccess: () => showSuccess('Producto eliminado correctamente'),
        onError: () => showError('Error al eliminar el producto'),
      });
    }
  };

  /* ===============================
     HELPERS
  =============================== */
  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'disponible':
        return { background: '#dcfce7', color: '#166534' };
      case 'vendido':
        return { background: '#fee2e2', color: '#991b1b' };
      case 'permuta':
        return { background: '#dbeafe', color: '#1e40af' };
      default:
        return { background: '#e5e7eb', color: '#374151' };
    }
  };

  const productosFiltrados = productos.filter((p) =>
    p.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.imei_1?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.numero_serie?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Productos Apple" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Apple size={22} />
              Productos Apple
            </CrudTitle>
            <CrudSubtitle>
              Gestión de inventario de productos Apple
            </CrudSubtitle>
          </div>

          <CrudButtonPrimary
            as={Link}
            href={route('admin.productos-apple.create')}
          >
            <Plus size={18} />
            Registrar producto
          </CrudButtonPrimary>
        </CrudHeader>

        {/* ================= FILTRO ================= */}
        <CrudCard style={{ marginBottom: 22 }}>
          <CrudSectionTitle>Búsqueda</CrudSectionTitle>

          <CrudGrid>
            <div>
              <CrudLabel>Buscar por modelo, IMEI o serie</CrudLabel>
              <CrudInput
                placeholder="Ej: iPhone 14 / IMEI / Serie"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </CrudGrid>
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Listado de productos Apple</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={th}>Modelo</th>
                  <th style={th}>Capacidad</th>
                  <th style={th}>Color</th>
                  <th style={th}>IMEI 1</th>
                  <th style={th}>IMEI 2</th>
                  <th style={th}>Serie</th>
                  <th style={th}>Estado IMEI</th>
                  <th style={th}>Precio Venta (Bs)</th>
                  <th style={th}>Estado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={td}>{p.modelo}</td>
                      <td style={td}>{p.capacidad}</td>
                      <td style={td}>{p.color}</td>
                      <td style={td}>{p.imei_1 || '—'}</td>
                      <td style={td}>{p.imei_2 || '—'}</td>
                      <td style={td}>{p.numero_serie || '—'}</td>
                      <td style={td}>{p.estado_imei || '—'}</td>
                      <td style={td}>
                        Bs {parseFloat(p.precio_venta).toFixed(2)}
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            ...badge,
                            ...getBadgeStyle(p.estado),
                          }}
                        >
                          {p.estado}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'center',
                          }}
                        >
                          <CrudButtonSecondary
                            as={Link}
                            href={route('admin.productos-apple.edit', p.id)}
                          >
                            Editar
                          </CrudButtonSecondary>

                          <CrudButtonDanger
                            type="button"
                            onClick={() => eliminar(p.id)}
                          >
                            Eliminar
                          </CrudButtonDanger>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        textAlign: 'center',
                        padding: 30,
                        color: '#64748b',
                      }}
                    >
                      No se encontraron productos Apple con ese dato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      </CrudWrapper>

      <ToastContainer />
    </AdminLayout>
  );
}

/* ===============================
   TABLE STYLES
=============================== */
const th = {
  padding: '12px 14px',
  fontSize: 13,
  fontWeight: 800,
  color: '#0f172a',
};

const td = {
  padding: '12px 14px',
  fontSize: 14,
  color: '#334155',
};

const badge = {
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'capitalize',
};
