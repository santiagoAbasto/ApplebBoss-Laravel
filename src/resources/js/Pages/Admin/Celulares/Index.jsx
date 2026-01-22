import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Smartphone, Plus } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudBackLink,
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

export default function CelularesIndex({ celulares }) {
  const [busqueda, setBusqueda] = useState('');

  /* ===============================
     ACTIONS
  =============================== */
  const eliminar = (id) => {
    if (confirm('¿Deseas eliminar este celular?')) {
      router.delete(route('admin.celulares.destroy', id), {
        onSuccess: () => showSuccess('Celular eliminado exitosamente'),
        onError: () => showError('Hubo un error al eliminar el celular'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar este celular para la venta?')) {
      router.patch(route('admin.celulares.habilitar', id), {
        onSuccess: () => showSuccess('Celular habilitado correctamente'),
        onError: () => showError('Error al habilitar el celular'),
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

  const celularesFiltrados = celulares.filter((c) =>
    c.imei_1.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Celulares" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Smartphone size={22} />
              Celulares
            </CrudTitle>
            <CrudSubtitle>
              Gestión de inventario de celulares registrados
            </CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route('admin.celulares.create')}>
            <Plus size={18} />
            Registrar celular
          </CrudButtonPrimary>
        </CrudHeader>

        <CrudInput
          placeholder="Ej: 358240051234567"
          value={busqueda}
          maxLength={15}
          inputMode="numeric"
          onChange={(e) => {
            const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 15);
            setBusqueda(onlyNumbers);
          }}
        />


        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Listado de celulares</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={th}>Modelo</th>
                  <th style={th}>IMEI 1</th>
                  <th style={th}>Batería</th>
                  <th style={th}>Estado IMEI</th>
                  <th style={th}>Precio Venta (Bs)</th>
                  <th style={th}>Estado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {celularesFiltrados.length > 0 ? (
                  celularesFiltrados.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={td}>{c.modelo}</td>
                      <td style={td}>{c.imei_1}</td>
                      <td style={td}>{c.bateria || 'N/A'}</td>
                      <td style={td}>
                        {c.estado_imei.replace(/_/g, ' ')}
                      </td>
                      <td style={td}>
                        Bs {parseFloat(c.precio_venta).toFixed(2)}
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            ...badge,
                            ...getBadgeStyle(c.estado),
                          }}
                        >
                          {c.estado}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {c.estado === 'permuta' ? (
                            <CrudButtonPrimary
                              type="button"
                              onClick={() => habilitar(c.id)}
                            >
                              Habilitar
                            </CrudButtonPrimary>
                          ) : (
                            <CrudButtonSecondary
                              as={Link}
                              href={route('admin.celulares.edit', c.id)}
                            >
                              Editar
                            </CrudButtonSecondary>
                          )}

                          <CrudButtonDanger
                            type="button"
                            onClick={() => eliminar(c.id)}
                          >
                            Eliminar
                          </CrudButtonDanger>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                      No se encontraron celulares con ese IMEI.
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
