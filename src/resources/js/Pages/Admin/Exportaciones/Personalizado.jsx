import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Boxes, FileDown, Search, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudCard,
  CrudSectionTitle,
} from '@/Components/CrudUI';

const INVENTARIOS = [
  { value: 'productos_generales', label: 'Productos Generales', helper: 'Nombre' },
  { value: 'celulares', label: 'Celulares', helper: 'Modelo' },
  { value: 'computadoras', label: 'Computadoras', helper: 'Nombre' },
  { value: 'productos_apple', label: 'Productos Apple', helper: 'Modelo' },
];

export default function ExportadorPersonalizado({ defaults = {} }) {
  const [inventario, setInventario] = useState(defaults.inventario || 'productos_generales');
  const [nombre, setNombre] = useState(defaults.nombre || '');
  const [soloDisponibles, setSoloDisponibles] = useState(defaults.solo_disponibles ?? true);

  const selectedInventory = useMemo(
    () => INVENTARIOS.find((item) => item.value === inventario) || INVENTARIOS[0],
    [inventario],
  );

  const exportUrl = useMemo(() => {
    if (!nombre.trim()) return '#';

    return route('admin.exportar.por-nombre', {
      inventario,
      nombre: nombre.trim(),
      solo_disponibles: soloDisponibles ? 1 : 0,
    });
  }, [inventario, nombre, soloDisponibles]);

  const exportFundasUrl = route('admin.exportar.fundas-magsafe-14-pro-max', {
    solo_disponibles: 1,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!nombre.trim()) return;

    window.open(exportUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AdminLayout>
      <Head title="Exportador por nombre" />

      <CrudWrapper>
        <CrudHeader>
          <div>
            <CrudTitle>
              <Search size={22} />
              Exportador por nombre
            </CrudTitle>
            <CrudSubtitle>
              Inventario filtrado por modelo o nombre
            </CrudSubtitle>
          </div>
        </CrudHeader>

        <CrudCard style={{ marginBottom: 24 }}>
          <CrudSectionTitle>Filtro personalizado</CrudSectionTitle>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <label style={fieldStyle}>
                <span style={labelStyle}>Inventario</span>
                <select
                  value={inventario}
                  onChange={(event) => setInventario(event.target.value)}
                  style={controlStyle}
                >
                  {INVENTARIOS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>{selectedInventory.helper}</span>
                <input
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="fundas magsafe de 14 pro max"
                  style={controlStyle}
                />
              </label>
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: '#334155',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={soloDisponibles}
                onChange={(event) => setSoloDisponibles(event.target.checked)}
              />
              Solo disponibles
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="submit"
                disabled={!nombre.trim()}
                style={{
                  ...buttonStyle,
                  opacity: nombre.trim() ? 1 : 0.55,
                  cursor: nombre.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <FileDown size={17} />
                Exportar PDF
              </button>

              <a href={exportFundasUrl} target="_blank" rel="noopener noreferrer" style={secondaryButtonStyle}>
                <Smartphone size={17} />
                Fundas MagSafe 14 Pro Max
              </a>
            </div>
          </form>
        </CrudCard>

        <CrudCard>
          <CrudSectionTitle>Acceso rápido</CrudSectionTitle>

          <a href={exportFundasUrl} target="_blank" rel="noopener noreferrer" style={quickCardStyle}>
            <span style={quickIconStyle}>
              <Boxes size={20} />
            </span>
            <span>
              <strong style={{ display: 'block', color: '#0f172a' }}>
                Fundas MagSafe IP 14 Pro Max
              </strong>
              <span style={{ color: '#64748b', fontSize: 14 }}>
                Productos generales disponibles por nombre
              </span>
            </span>
          </a>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}

const fieldStyle = {
  display: 'grid',
  gap: 8,
};

const labelStyle = {
  color: '#334155',
  fontSize: 13,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0,
};

const controlStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '11px 12px',
  color: '#0f172a',
  outline: 'none',
};

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 0,
  borderRadius: 10,
  padding: '11px 16px',
  background: '#2563eb',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: '#0f172a',
};

const quickCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  textDecoration: 'none',
};

const quickIconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 42,
  height: 42,
  borderRadius: 10,
  background: '#e0f2fe',
  color: '#0369a1',
  flex: '0 0 auto',
};
