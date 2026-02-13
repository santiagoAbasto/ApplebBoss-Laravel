import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Package, Plus } from 'lucide-react';

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
  CrudButtonPrimary,
  CrudButtonSecondary,
  CrudButtonDanger,
} from '@/Components/CrudUI';

export default function ProductosGeneralesIndex({ productos = [] }) {
  const [busqueda, setBusqueda] = useState('');

  /* ===============================
     ACTIONS
  =============================== */
  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      router.delete(route('admin.productos-generales.destroy', id), {
        onSuccess: () => showSuccess('Producto eliminado correctamente'),
        onError: () => showError('Error al eliminar el producto'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar este producto para la venta?')) {
      router.patch(route('admin.productos-generales.habilitar', id), {
        onSuccess: () => showSuccess('Producto habilitado con éxito'),
        onError: () => showError('Error al habilitar el producto'),
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

  /* ===============================
     FILTRADO ESTRICTO + RECIENTES
  =============================== */
  const norm = (v) => String(v ?? '').trim().toLowerCase();
  const q = norm(busqueda);

  const filtrados = [...productos]
    // 1️⃣ ordenar por más recientes
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // 2️⃣ filtrado ESTRICTO
    .filter((p) => {
      // sin búsqueda → últimos 10
      if (!q) return true;

      // comparación EXACTA contra codigo
      return norm(p.codigo) === q;
    })

    // 3️⃣ máximo 10
    .slice(0, 10);

  return (
    <AdminLayout>
      <Head title="Productos Generales" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Package size={22} />
              Productos Generales
            </CrudTitle>
            <CrudSubtitle>
              Accesorios, repuestos y productos sin IMEI
            </CrudSubtitle>
          </div>

          <CrudButtonPrimary
            as={Link}
            href={route('admin.productos-generales.create')}
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
              <CrudLabel>Buscar por código (exacto)</CrudLabel>
              <CrudInput
                placeholder="Ej: vidrio_camara:119"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                • Sin escribir nada se muestran los últimos 10 productos<br />
                • Formato obligatorio <strong>tipo:número</strong>
              </p>
            </div>
          </CrudGrid>
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Listado de productos</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={th}>Código</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Procedencia</th>
                  <th style={th}>Precio Venta (Bs)</th>
                  <th style={th}>Estado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={td}>{p.codigo}</td>
                      <td style={td}>{(p.tipo || '').replace(/_/g, ' ')}</td>
                      <td style={td}>{p.nombre || '—'}</td>
                      <td style={td}>{p.procedencia || '—'}</td>
                      <td style={td}>
                        Bs {parseFloat(p.precio_venta || 0).toFixed(2)}
                      </td>
                      <td style={td}>
                        <span style={{ ...badge, ...getBadgeStyle(p.estado) }}>
                          {p.estado}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {p.estado === 'permuta' ? (
                            <CrudButtonSecondary onClick={() => habilitar(p.id)}>
                              Habilitar
                            </CrudButtonSecondary>
                          ) : (
                            <CrudButtonSecondary
                              as={Link}
                              href={route('admin.productos-generales.edit', p.id)}
                            >
                              Editar
                            </CrudButtonSecondary>
                          )}

                          <CrudButtonDanger onClick={() => eliminar(p.id)}>
                            Eliminar
                          </CrudButtonDanger>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                      No se encontraron productos con ese código exacto.
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
