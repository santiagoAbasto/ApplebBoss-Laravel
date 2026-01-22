import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Laptop, Plus } from 'lucide-react';

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

export default function ComputadorasIndex({ computadoras }) {
  const [busqueda, setBusqueda] = useState('');

  /* ===============================
     ACTIONS
  =============================== */
  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar esta computadora?')) {
      router.delete(route('admin.computadoras.destroy', id), {
        onSuccess: () => showSuccess('Computadora eliminada correctamente'),
        onError: () => showError('Error al eliminar la computadora'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar esta computadora para la venta?')) {
      router.patch(route('admin.computadoras.habilitar', id), {
        onSuccess: () => showSuccess('Computadora habilitada con éxito'),
        onError: () => showError('Error al habilitar la computadora'),
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

  const pcsFiltradas = computadoras.filter((pc) =>
    pc.numero_serie.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Computadoras" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Laptop size={22} />
              Computadoras
            </CrudTitle>
            <CrudSubtitle>
              Gestión de inventario de computadoras
            </CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route('admin.computadoras.create')}>
            <Plus size={18} />
            Registrar computadora
          </CrudButtonPrimary>
        </CrudHeader>

        {/* ================= FILTRO ================= */}
        <CrudCard style={{ marginBottom: 22 }}>
          <CrudSectionTitle>Búsqueda</CrudSectionTitle>

          <CrudGrid>
            <div>
              <CrudLabel>Buscar por número de serie</CrudLabel>
              <CrudInput
                placeholder="Ej: C02Q123ABC"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </CrudGrid>
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Listado de computadoras</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={th}>Nombre</th>
                  <th style={th}>Procesador</th>
                  <th style={th}>Serie</th>
                  <th style={th}>RAM</th>
                  <th style={th}>Batería</th>
                  <th style={th}>Almacenamiento</th>
                  <th style={th}>Precio Venta (Bs)</th>
                  <th style={th}>Estado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pcsFiltradas.length > 0 ? (
                  pcsFiltradas.map((pc) => (
                    <tr key={pc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={td}>{pc.nombre}</td>
                      <td style={td}>{pc.procesador || '—'}</td>
                      <td style={td}>{pc.numero_serie}</td>
                      <td style={td}>{pc.ram}</td>
                      <td style={td}>{pc.bateria || '—'}</td>
                      <td style={td}>{pc.almacenamiento || '—'}</td>
                      <td style={td}>
                        Bs {parseFloat(pc.precio_venta).toFixed(2)}
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            ...badge,
                            ...getBadgeStyle(pc.estado),
                          }}
                        >
                          {pc.estado}
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
                          {pc.estado === 'permuta' ? (
                            <CrudButtonPrimary
                              type="button"
                              onClick={() => habilitar(pc.id)}
                            >
                              Habilitar
                            </CrudButtonPrimary>
                          ) : (
                            <CrudButtonSecondary
                              as={Link}
                              href={route('admin.computadoras.edit', pc.id)}
                            >
                              Editar
                            </CrudButtonSecondary>
                          )}

                          <CrudButtonDanger
                            type="button"
                            onClick={() => eliminar(pc.id)}
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
                      colSpan="9"
                      style={{
                        textAlign: 'center',
                        padding: 30,
                        color: '#64748b',
                      }}
                    >
                      No se encontraron computadoras con esa serie.
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
